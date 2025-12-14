import { TrackDraftSchema, type TrackDraft } from "@/lib/schemas/track-draft";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

// POST /api/chats/[id]/generate - generate a track from the latest draft_spec
// NOTE: This is a scaffolding endpoint. Full ElevenLabs integration will be added in a later spec.
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

  // Verify chat exists and belongs to user
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id, user_id")
    .eq("id", chatId)
    .single();

  if (chatError || !chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
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

  // Use the validated draft to create a track
  const { data: track, error: trackError } = await supabase
    .from("tracks")
    .insert({
      chat_id: chatId,
      user_id: session.user.id,
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
      length_ms: validatedDraft.length_ms,
      instrumental: validatedDraft.instrumental,
      status: "draft",
    })
    .select()
    .single();

  if (trackError) {
    console.error("Failed to create track");
    return NextResponse.json(
      { error: "Failed to create track" },
      { status: 500 }
    );
  }

  // Update chat's updated_at
  await supabase
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatId);

  return NextResponse.json({
    ok: true,
    track,
    message:
      "Track created. ElevenLabs generation will be added in a future update.",
  });
}
