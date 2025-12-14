import { getOpenAIKeyForUser } from "@/lib/secrets";
import {
  RefineInputSchema,
  TrackDraftSchema,
  type TrackDraft,
  type RefineInput,
} from "@/lib/schemas/track-draft";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import type { NextRequest } from "next/server";
import { checkRateLimit, incrementRateLimit } from "@/lib/rate-limiting";
import { logUsageEvent } from "@/lib/usage-tracking";
import { randomUUID } from "crypto";
import { validateGenerationParams, checkPromptSafety } from "@/lib/validation";

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
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

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
    return Response.json(
      {
        error: "Invalid request body",
        details: parseResult.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { message, controls, latest_draft } = parseResult.data;

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
    return Response.json({ error: "Missing OpenAI API key" }, { status: 400 });
  }

  // Get user's artist name for context (optional)
  const { data: profile } = await supabase
    .from("profiles")
    .select("artist_name")
    .eq("id", session.user.id)
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

  try {
    const openai = createOpenAI({ apiKey });
    const actionGroupId = randomUUID(); // For correlating refine + generate sequences
    const startTime = Date.now();

    // Use streamText with structured output
    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      onFinish: async ({ text, usage }) => {
        const durationMs = Date.now() - startTime;

        // Parse the AI response to extract TrackDraft
        const trackDraft = parseTrackDraftFromResponse(
          text,
          controls,
          latest_draft
        );

        // Validate the TrackDraft
        const validationResult = TrackDraftSchema.safeParse(trackDraft);

        if (!validationResult.success) {
          console.error("TrackDraft validation failed", {
            errors: validationResult.error.flatten(),
            draft: trackDraft,
          });
          // Still save the message but without draft_spec
          await supabase.from("chat_messages").insert({
            chat_id: chatId,
            role: "assistant",
            content: text,
            draft_spec: null,
          });

          // Log usage event with error
          await logUsageEvent({
            userId,
            chatId,
            actionType: "refine",
            actionGroupId,
            provider: "openai",
            model: "gpt-4o-mini",
            inputTokens: usage?.inputTokens,
            outputTokens: usage?.outputTokens,
            totalTokens: usage?.totalTokens,
            durationMs,
            error: { message: "TrackDraft validation failed" },
          });
          return;
        }

        // Save assistant message with validated draft_spec
        await supabase.from("chat_messages").insert({
          chat_id: chatId,
          role: "assistant",
          content: text,
          draft_spec: validationResult.data,
        });

        // Update chat's updated_at
        await supabase
          .from("chats")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", chatId);

        // Increment rate limit counter
        await incrementRateLimit(userId, "refine");

        // Log usage event
        await logUsageEvent({
          userId,
          chatId,
          actionType: "refine",
          actionGroupId,
          provider: "openai",
          model: "gpt-4o-mini",
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
          totalTokens: usage?.totalTokens,
          durationMs,
        });
      },
    });

    return result.toTextStreamResponse();
  } catch {
    console.error("Failed to refine prompt");
    return Response.json({ error: "Failed to refine prompt" }, { status: 500 });
  }
}

/**
 * Build system prompt optimized for lo-fi music generation
 */
function buildSystemPrompt(artistName: string | null): string {
  const contextNote = artistName
    ? `The user's artist name is "${artistName}" - use this for context but avoid mentioning it unless relevant.`
    : "";

  return `You are an AI assistant specializing in lo-fi instrumental music production and prompt engineering for music generation.

Your goals:
1. Help users refine their music ideas into clear, generation-ready prompts
2. Optimize prompts specifically for lo-fi instrumental music (chill beats, study music, ambient)
3. Produce clean, evocative descriptions without unnecessary fluff
4. Avoid "in the style of [living artist]" phrasing for copyright safety
5. Focus on atmosphere, texture, mood, and production techniques

${contextNote}

When responding:
- Be conversational and helpful
- Acknowledge the user's input and explain your refinements
- Provide a final, single-paragraph prompt suitable for music generation
- Keep responses concise (2-4 sentences plus the final prompt)

Format your response as:
1. Brief acknowledgment/explanation (1-2 sentences)
2. "Final prompt: [your optimized prompt here]"`;
}

/**
 * Build user prompt from message, controls, and latest_draft
 */
function buildUserPrompt(
  message: string,
  controls?: RefineInput["controls"],
  latestDraft?: RefineInput["latest_draft"]
): string {
  const parts: string[] = [];

  parts.push(`User request: ${message}`);

  if (controls) {
    const controlParts: string[] = [];
    if (controls.genre) controlParts.push(`Genre: ${controls.genre}`);
    if (controls.bpm) controlParts.push(`BPM: ${controls.bpm}`);
    if (controls.mood) {
      const moodParts: string[] = [];
      if (controls.mood.energy !== undefined)
        moodParts.push(`Energy: ${controls.mood.energy}/100`);
      if (controls.mood.focus !== undefined)
        moodParts.push(`Focus: ${controls.mood.focus}/100`);
      if (controls.mood.chill !== undefined)
        moodParts.push(`Chill: ${controls.mood.chill}/100`);
      if (moodParts.length > 0)
        controlParts.push(`Mood: ${moodParts.join(", ")}`);
    }
    if (controls.instrumentation && controls.instrumentation.length > 0) {
      controlParts.push(`Instruments: ${controls.instrumentation.join(", ")}`);
    }
    if (controls.length_ms) {
      const seconds = Math.round(controls.length_ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes > 0) {
        controlParts.push(
          remainingSeconds > 0
            ? `Length: ${minutes}m ${remainingSeconds}s`
            : `Length: ${minutes}m`
        );
      } else {
        controlParts.push(`Length: ${seconds}s`);
      }
    }
    if (controls.instrumental !== undefined) {
      controlParts.push(controls.instrumental ? "Instrumental" : "With vocals");
    }

    if (controlParts.length > 0) {
      parts.push(`\nCurrent controls:\n${controlParts.join("\n")}`);
    }
  }

  if (latestDraft) {
    parts.push(
      `\nPrevious draft:\nTitle: ${latestDraft.title ?? "N/A"}\nPrompt: ${latestDraft.prompt_final ?? "N/A"}`
    );
  }

  parts.push(
    `\nPlease refine this into an optimized lo-fi music generation prompt. Provide your response and end with "Final prompt: [your prompt]".`
  );

  return parts.join("\n");
}

/**
 * Parse AI response to extract TrackDraft
 * This function extracts the "Final prompt" from the response and builds a TrackDraft
 */
function parseTrackDraftFromResponse(
  aiResponse: string,
  controls?: RefineInput["controls"],
  latestDraft?: RefineInput["latest_draft"]
): Partial<TrackDraft> {
  // Extract final prompt from response
  const finalPromptMatch = aiResponse.match(/Final prompt:\s*(.+?)(?:\n|$)/i);
  const promptFinal = finalPromptMatch
    ? finalPromptMatch[1].trim()
    : aiResponse.trim();

  // Generate title from prompt or use latest draft title
  const title =
    latestDraft?.title ??
    generateTitleFromPrompt(promptFinal) ??
    "Untitled Track";

  // Generate description from AI response (everything before "Final prompt:")
  const descriptionMatch = aiResponse.match(/^(.+?)(?:Final prompt:|$)/i);
  const description = descriptionMatch?.[1].trim() || "A refined lo-fi track";

  // Merge controls with latest_draft, preferring controls
  const genre = controls?.genre ?? latestDraft?.genre ?? "lo-fi";
  const bpm = controls?.bpm ?? latestDraft?.bpm ?? 80;
  const instrumentation = controls?.instrumentation ??
    latestDraft?.instrumentation ?? ["piano", "vinyl crackle"];
  const lengthMs = controls?.length_ms ?? latestDraft?.length_ms ?? 240000;
  const instrumental =
    controls?.instrumental ?? latestDraft?.instrumental ?? true;

  // Merge mood values
  const mood = {
    energy: controls?.mood?.energy ?? latestDraft?.mood?.energy ?? 40,
    focus: controls?.mood?.focus ?? latestDraft?.mood?.focus ?? 60,
    chill: controls?.mood?.chill ?? latestDraft?.mood?.chill ?? 80,
  };

  // Extract tags from prompt
  const tags = extractTagsFromPrompt(promptFinal);

  return {
    title,
    description,
    prompt_final: promptFinal,
    genre,
    bpm,
    instrumentation,
    mood,
    length_ms: lengthMs,
    instrumental,
    tags,
    key: latestDraft?.key ?? null,
    time_signature: latestDraft?.time_signature ?? null,
    negative: latestDraft?.negative ?? [],
    notes: latestDraft?.notes ?? "",
  };
}

/**
 * Generate a title from the prompt
 */
function generateTitleFromPrompt(prompt: string): string | null {
  // Extract first few meaningful words, up to 5 words
  const words = prompt.split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return null;

  const titleWords = words.slice(0, 5);
  // Capitalize first letter of each word while preserving the rest
  return titleWords
    .map((w) => {
      // Handle hyphenated words like "lo-fi"
      if (w.includes("-")) {
        return w
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("-");
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/**
 * Extract relevant tags from prompt
 */
function extractTagsFromPrompt(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const tagKeywords = [
    "chill",
    "lo-fi",
    "lofi",
    "beats",
    "study",
    "focus",
    "ambient",
    "jazz",
    "hip-hop",
    "piano",
    "vinyl",
    "tape",
    "warm",
    "nostalgic",
    "dreamy",
    "mellow",
    "relaxing",
  ];

  return tagKeywords.filter((tag) => lowerPrompt.includes(tag));
}
