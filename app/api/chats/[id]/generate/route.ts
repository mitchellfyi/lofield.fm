import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

type DraftSpec = {
  title?: string;
  genre?: string;
  bpm?: number;
  mood?: {
    energy?: number;
    focus?: number;
    chill?: number;
  };
  instrumentation?: string[];
  length_ms?: number;
  instrumental?: boolean;
  refined_prompt?: string;
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

  const draftSpec = messages[0].draft_spec as DraftSpec | null;

  if (!draftSpec) {
    return NextResponse.json(
      {
        error: "No draft specification found. Please refine your prompt first.",
      },
      { status: 400 }
    );
  }

  // Build final prompt from draft_spec
  const finalPrompt = draftSpec.refined_prompt ?? buildFinalPrompt(draftSpec);
  const title =
    draftSpec.title ?? `Track ${new Date().toISOString().slice(0, 10)}`;

  // Create a track record in "generating" status
  // NOTE: In a future spec, this will trigger actual ElevenLabs generation
  const { data: track, error: trackError } = await supabase
    .from("tracks")
    .insert({
      chat_id: chatId,
      user_id: session.user.id,
      title,
      description: buildDescription(draftSpec),
      final_prompt: finalPrompt,
      metadata: {
        genre: draftSpec.genre,
        bpm: draftSpec.bpm,
        mood: draftSpec.mood,
        instrumentation: draftSpec.instrumentation,
      },
      length_ms: draftSpec.length_ms ?? 240000,
      instrumental: draftSpec.instrumental ?? true,
      status: "draft", // Will be "generating" when ElevenLabs integration is complete
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

function buildFinalPrompt(spec: DraftSpec): string {
  const parts: string[] = [];

  if (spec.genre) parts.push(spec.genre);
  if (spec.bpm) parts.push(`${spec.bpm} BPM`);
  if (spec.mood) {
    const moods: string[] = [];
    if (spec.mood.chill && spec.mood.chill > 0.5) moods.push("chill");
    if (spec.mood.energy && spec.mood.energy > 0.5) moods.push("energetic");
    if (spec.mood.focus && spec.mood.focus > 0.5) moods.push("focused");
    if (moods.length > 0) parts.push(moods.join(", "));
  }
  if (spec.instrumentation && spec.instrumentation.length > 0) {
    parts.push(`featuring ${spec.instrumentation.join(", ")}`);
  }
  if (spec.instrumental) {
    parts.push("instrumental");
  }

  return parts.join(", ") || "lo-fi chill beats";
}

function buildDescription(spec: DraftSpec): string {
  const parts: string[] = [];

  if (spec.genre) parts.push(`A ${spec.genre} track`);
  if (spec.bpm) parts.push(`at ${spec.bpm} BPM`);
  if (spec.instrumentation && spec.instrumentation.length > 0) {
    parts.push(`featuring ${spec.instrumentation.slice(0, 3).join(", ")}`);
  }

  return parts.join(" ") || "A lo-fi track";
}
