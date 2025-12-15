import { getOpenAIKeyForUser } from "@/lib/secrets";
import { RefineInputSchema, TrackDraftSchema } from "@/lib/schemas/track-draft";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { checkRateLimit, incrementRateLimit } from "@/lib/rate-limiting";
import { logUsageEvent, calculateOpenAICost } from "@/lib/usage-tracking";
import { randomUUID } from "crypto";
import { validateGenerationParams, checkPromptSafety } from "@/lib/validation";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt-helpers";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/chats/[id]/refine - refine a prompt with AI (streaming)
 *
 * Input:
 * - message: user's free text refinement request
 * - controls: current prompt controls (genre, bpm, mood, etc.)
 * - latest_draft: previous TrackDraft if exists
 *
 * Output:
 * 1. Streamed assistant chat reply (text)
 * 2. Structured TrackDraft JSON (via streamText onFinish callback)
 *
 * Persists both user and assistant messages to chat_messages table.
 * Updates chats.updated_at on completion.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id: chatId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  // Check rate limit for refine operations
  const rateLimit = await checkRateLimit(userId, "refine");
  if (!rateLimit.allowed) {
    return Response.json(
      {
        error: `Daily refine limit exceeded. You have used ${rateLimit.current} of ${rateLimit.limit} refines today. Please try again tomorrow.`,
      },
      { status: 429 }
    );
  }

  // Verify chat exists and belongs to user
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id, user_id")
    .eq("id", chatId)
    .single();

  if (chatError || !chat) {
    return Response.json({ error: "Chat not found" }, { status: 404 });
  }

  // Parse and validate input
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = RefineInputSchema.safeParse(body);
  if (!parseResult.success) {
    console.warn("[refine] Invalid body", {
      errors: parseResult.error.flatten(),
    });
    return Response.json(
      {
        error: "Invalid request body",
        details: parseResult.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { message, controls, latest_draft } = parseResult.data;
  if (!message || message.trim().length === 0) {
    console.warn("[refine] Empty message");
    return Response.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  // Validate generation parameters from controls
  if (controls) {
    const validation = validateGenerationParams({
      length_ms: controls.length_ms,
      bpm: controls.bpm,
      // Only validate mood if all values are present
      mood:
        controls.mood &&
        controls.mood.energy !== undefined &&
        controls.mood.focus !== undefined &&
        controls.mood.chill !== undefined
          ? (controls.mood as { energy: number; focus: number; chill: number })
          : undefined,
    });

    if (!validation.valid) {
      return Response.json(
        {
          error: "Invalid generation parameters",
          details: validation.errors,
        },
        { status: 400 }
      );
    }
  }

  // Check prompt safety
  const safetyCheck = checkPromptSafety(message);
  // We log warnings but don't block the request (as per spec: "Do not hard block unless you want to")
  if (!safetyCheck.safe) {
    console.log("Prompt safety warnings", {
      userId,
      chatId,
      warnings: safetyCheck.warnings,
    });
  }

  // Get OpenAI key
  const apiKey = await getOpenAIKeyForUser(userId);
  if (!apiKey) {
    console.warn("[refine] Missing OpenAI key", { userId });
    return Response.json({ error: "Missing OpenAI API key" }, { status: 400 });
  }

  // Get user's artist name for context (optional)
  const { data: profile } = await supabase
    .from("profiles")
    .select("artist_name")
    .eq("id", user.id)
    .maybeSingle();

  const artistName = profile?.artist_name ?? null;

  // Build system prompt for lo-fi optimization
  const systemPrompt = buildSystemPrompt(artistName);

  // Build user prompt from message, controls, and latest_draft
  const userPrompt = buildUserPrompt(message, controls, latest_draft);

  // Save user message first
  const { error: userMsgError } = await supabase.from("chat_messages").insert({
    chat_id: chatId,
    role: "user",
    content: message,
  });

  if (userMsgError) {
    console.error("Failed to save user message");
    return Response.json(
      { error: "Failed to save user message" },
      { status: 500 }
    );
  }

  // Generate action group ID and start time for usage tracking
  const actionGroupId = randomUUID(); // For correlating refine + generate sequences
  const startTime = Date.now();

  try {
    const openai = createOpenAI({ apiKey });

    // We need to modify the System Prompt to remove the "text format" instructions
    // because `generateObject` handles the formatting.
    const systemPromptForObject = systemPrompt.replace(
      /CRITICAL: You MUST format your response exactly as follows:[\s\S]*$/,
      "Return a JSON object with a 'reply' field (conversational explanation) and a 'draft' field (the track configuration)."
    );

    const {
      object: aiData,
      usage,
      response: providerResponse,
    } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        reply: z
          .string()
          .describe(
            "Conversational response to the user explaining the changes"
          ),
        draft: TrackDraftSchema.describe("The updated track configuration"),
      }),
      system: systemPromptForObject,
      prompt: userPrompt,
    });

    const durationMs = Date.now() - startTime;
    const trackDraft = aiData.draft;
    const textReply = aiData.reply;

    // Save assistant message
    const { data: savedMessage, error: saveMsgError } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        role: "assistant",
        content: textReply,
        draft_spec: trackDraft, // It is already validated by generateObject!
      })
      .select("id")
      .single();

    if (saveMsgError) {
      console.error("Failed to save assistant message", {
        chatId,
        error: saveMsgError.message,
      });
    }

    // Update chat's updated_at and title if available
    const updatePayload: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };
    if (trackDraft.title) {
      updatePayload.title = trackDraft.title;
    }

    await supabase.from("chats").update(updatePayload).eq("id", chatId);

    // Rate limits & Usage tracking
    await incrementRateLimit(userId, "refine");

    let costUsd: number | undefined;
    let costNotes: string | undefined;

    if (usage?.inputTokens && usage?.outputTokens) {
      const cost = await calculateOpenAICost({
        model: "gpt-4o-mini",
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      });
      if (cost) {
        costUsd = cost.costUsd;
        costNotes = cost.costNotes;
      }
    }

    await logUsageEvent({
      userId,
      chatId,
      chatMessageId: savedMessage?.id ?? undefined,
      actionGroupId,
      actionType: "refine_prompt",
      provider: "openai",
      providerOperation: "generateObject",
      providerRequestId: providerResponse?.id,
      model: "gpt-4o-mini",
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
      costUsd,
      costNotes,
      status: "ok",
      latencyMs: durationMs,
    });

    // Stream the text reply back to the client
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(textReply);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to refine prompt", {
      error: errorMessage,
    });

    // Log usage event for failed API call
    await logUsageEvent({
      userId,
      chatId,
      actionGroupId,
      actionType: "refine_prompt",
      provider: "openai",
      providerOperation: "generateObject",
      model: "gpt-4o-mini",
      status: "error",
      errorMessage,
      latencyMs: Date.now() - startTime,
    });

    return Response.json({ error: "Failed to refine prompt" }, { status: 500 });
  }
}
