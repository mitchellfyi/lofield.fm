import { generateMusic } from "@/lib/elevenlabs";
import { TrackDraftSchema, type TrackDraft } from "@/lib/schemas/track-draft";
import { getElevenLabsKeyForUser } from "@/lib/secrets";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logUsageEvent } from "@/lib/usage-tracking";
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { checkRateLimit, incrementRateLimit } from "@/lib/rate-limiting";
import { validateGenerationParams } from "@/lib/validation";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/chats/[id]/generate - DEPRECATED - Use /api/chats/[id]/tracks instead
 *
 * This endpoint maintains backward compatibility by implementing the same logic as /tracks.
 * New code should use /api/chats/[id]/tracks directly.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id: chatId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check rate limit for generate operations
  const rateLimit = await checkRateLimit(userId, "generate");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Daily generation limit exceeded. You have used ${rateLimit.current} of ${rateLimit.limit} generations today. Please try again tomorrow.`,
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
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  // Get ElevenLabs key
  const elevenLabsKey = await getElevenLabsKeyForUser(userId);
  if (!elevenLabsKey) {
    return NextResponse.json(
      {
        error:
          "Missing ElevenLabs API key. Please add your key in Settings before generating tracks.",
      },
      { status: 400 }
    );
  }

  // Check for in-progress generation for this chat
  const { data: generatingTracks } = await supabase
    .from("tracks")
    .select("id")
    .eq("chat_id", chatId)
    .eq("status", "generating")
    .limit(1);

  if (generatingTracks && generatingTracks.length > 0) {
    return NextResponse.json(
      {
        error:
          "A track is already being generated for this chat. Please wait for it to complete before starting a new generation.",
      },
      { status: 409 } // 409 Conflict
    );
  }

  // Find the latest message with a draft_spec
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, draft_spec")
    .eq("chat_id", chatId)
    .not("draft_spec", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!messages || messages.length === 0) {
    return NextResponse.json(
      {
        error: "No draft specification found. Please refine your prompt first.",
      },
      { status: 400 }
    );
  }

  const draftSpec = messages[0].draft_spec as Partial<TrackDraft> | null;

  if (!draftSpec) {
    return NextResponse.json(
      {
        error: "No draft specification found. Please refine your prompt first.",
      },
      { status: 400 }
    );
  }

  // Validate the draft_spec against the TrackDraft schema
  const validationResult = TrackDraftSchema.safeParse(draftSpec);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: "Invalid draft specification. Please refine your prompt again.",
        details: validationResult.error.flatten(),
      },
      { status: 400 }
    );
  }

  const validatedDraft = validationResult.data;

  // Use default settings for generation
  const lengthMs = validatedDraft.length_ms ?? 240000; // Default 4 minutes
  const instrumental = validatedDraft.instrumental ?? true; // Default instrumental

  // Validate generation parameters (length, bpm, mood)
  const paramValidation = validateGenerationParams({
    length_ms: lengthMs,
    bpm: validatedDraft.bpm,
    mood: validatedDraft.mood,
  });

  if (!paramValidation.valid) {
    return NextResponse.json(
      {
        error: "Invalid generation parameters",
        details: paramValidation.errors,
      },
      { status: 400 }
    );
  }

  // Create track record with status='generating'
  const { data: track, error: trackError } = await supabase
    .from("tracks")
    .insert({
      chat_id: chatId,
      user_id: userId,
      title: validatedDraft.title,
      description: validatedDraft.description,
      final_prompt: validatedDraft.prompt_final,
      metadata: {
        genre: validatedDraft.genre,
        bpm: validatedDraft.bpm,
        mood: validatedDraft.mood,
        instrumentation: validatedDraft.instrumentation,
        tags: validatedDraft.tags,
        key: validatedDraft.key,
        time_signature: validatedDraft.time_signature,
        negative: validatedDraft.negative,
      },
      length_ms: lengthMs,
      instrumental,
      status: "generating",
    })
    .select()
    .single();

  if (trackError || !track) {
    console.error("Failed to create track");
    return NextResponse.json(
      { error: "Failed to create track" },
      { status: 500 }
    );
  }

  const trackId = track.id;
  const actionGroupId = randomUUID(); // Correlate this generation with any related actions

  // Increment rate limit counter (do this before async generation to ensure it's counted)
  await incrementRateLimit(userId, "generate");

  // Generate music in background (don't await to avoid timeout)
  generateTrackAsync({
    trackId,
    userId,
    chatId,
    elevenLabsKey,
    prompt: validatedDraft.prompt_final,
    lengthMs,
    instrumental,
    actionGroupId,
  }).catch((error) => {
    console.error("Background generation failed", {
      trackId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  });

  // Update chat's updated_at
  await supabase
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatId);

  return NextResponse.json({
    ok: true,
    track,
    message: "Track generation started. This may take a few minutes.",
  });
}

/**
 * Generate track asynchronously
 * This runs in the background after the API response is sent
 */
async function generateTrackAsync(params: {
  trackId: string;
  userId: string;
  chatId: string;
  elevenLabsKey: string;
  prompt: string;
  lengthMs: number;
  instrumental: boolean;
  actionGroupId: string;
}) {
  const {
    trackId,
    userId,
    chatId,
    elevenLabsKey,
    prompt,
    lengthMs,
    instrumental,
    actionGroupId,
  } = params;

  const supabaseAdmin = getServiceRoleClient();
  const startTime = Date.now();
  const occurredAt = new Date();

  try {
    // Call ElevenLabs API
    const result = await generateMusic({
      apiKey: elevenLabsKey,
      prompt,
      lengthMs,
      instrumental,
    });

    const { audioBuffer, durationMs: generationLatencyMs } = result;
    const audioBytes = audioBuffer.length;
    const audioSeconds = lengthMs / 1000;

    // Upload to Supabase Storage
    // Path format: {user_id}/{chat_id}/{track_id}.mp3
    const storagePath = `${userId}/${chatId}/${trackId}.mp3`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("tracks")
      .upload(storagePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Update track with status='ready' and storage_path
    const { error: updateError } = await supabaseAdmin
      .from("tracks")
      .update({
        status: "ready",
        storage_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", trackId);

    if (updateError) {
      throw new Error(`Track update failed: ${updateError.message}`);
    }

    // Log usage event
    await logUsageEvent({
      userId,
      chatId,
      trackId,
      actionGroupId,
      actionType: "generate_track",
      provider: "elevenlabs",
      providerOperation: "music.compose",
      model: "music_v1",
      audioSeconds,
      audioBytes,
      latencyMs: generationLatencyMs,
      status: "ok",
      occurredAt,
    });

    console.log("Track generation completed", { trackId });
  } catch (error) {
    console.error("Track generation failed", {
      trackId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Sanitize error message to ensure no API keys or sensitive data leak
    const sanitizeError = (err: unknown): Record<string, unknown> => {
      if (err instanceof Error) {
        // Remove any potential API keys or tokens from error message
        let message = err.message;
        // Replace potential API keys (strings starting with sk-, xi-, etc.)
        message = message.replace(
          /\b(sk|xi|pk|Bearer)[-_][a-zA-Z0-9]{20,}\b/gi,
          "[REDACTED]"
        );
        // Replace authorization headers
        message = message.replace(
          /authorization[:\s]+.+/gi,
          "authorization: [REDACTED]"
        );
        return { message };
      }
      return { message: "Unknown error" };
    };

    // Extract error message and check for bad_prompt
    let errorPayload = sanitizeError(error);

    // Check if error suggests bad prompt
    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : "";
    const errorCode = errorMessage.includes("prompt") || 
                      errorMessage.includes("invalid") || 
                      errorMessage.includes("content")
      ? "bad_prompt"
      : "generation_failed";
    
    if (errorCode === "bad_prompt") {
      errorPayload = {
        ...errorPayload,
        type: "bad_prompt",
        suggestion:
          "Try refining your prompt to be more specific about the musical style and mood.",
      };
    }

    // Update track with status='failed' and error payload
    await supabaseAdmin
      .from("tracks")
      .update({
        status: "failed",
        error: errorPayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", trackId);

    // Log usage event with error
    await logUsageEvent({
      userId,
      chatId,
      trackId,
      actionGroupId,
      actionType: "generate_track",
      provider: "elevenlabs",
      providerOperation: "music.compose",
      model: "music_v1",
      latencyMs: Date.now() - startTime,
      status: "error",
      errorCode,
      errorMessage: errorPayload.message as string,
      raw: errorPayload,
      occurredAt,
    });
  }
}
