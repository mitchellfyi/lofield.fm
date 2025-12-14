import { getOpenAIKeyForUser } from "@/lib/secrets";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

type Params = {
  params: Promise<{ id: string }>;
};

const RefineSchema = z.object({
  spec: z.object({
    title: z.string().optional(),
    genre: z.string().optional(),
    bpm: z.number().min(40).max(220).optional(),
    mood: z
      .object({
        energy: z.number().min(0).max(1).optional(),
        focus: z.number().min(0).max(1).optional(),
        chill: z.number().min(0).max(1).optional(),
      })
      .optional(),
    instrumentation: z.array(z.string()).optional(),
    length_ms: z.number().min(30000).max(600000).optional(),
    instrumental: z.boolean().optional(),
  }),
});

// POST /api/chats/[id]/refine - refine a prompt with AI
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = RefineSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { spec } = parseResult.data;

  // Get OpenAI key
  const apiKey = await getOpenAIKeyForUser(session.user.id);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OpenAI API key" },
      { status: 400 }
    );
  }

  // Build the refinement prompt
  const specDescription = buildSpecDescription(spec);
  const systemPrompt = `You are a lo-fi music production assistant. Your job is to help refine music generation prompts.
Based on the user's specifications, create a detailed, evocative description for generating a lo-fi track.
Focus on atmosphere, texture, and mood. Be specific about production techniques and sonic qualities.
Keep your response concise but descriptive (2-3 sentences).`;

  const userPrompt = `Please refine this track specification into a compelling music generation prompt:
${specDescription}

Generate a refined prompt that captures the essence of this track.`;

  try {
    const openai = createOpenAI({ apiKey });
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
    });

    const refinedPrompt = result.text;

    // Save the user's input as a message
    await supabase.from("chat_messages").insert({
      chat_id: chatId,
      role: "user",
      content: `Refine prompt with specs: ${specDescription}`,
    });

    // Save the AI's response with the draft_spec
    await supabase.from("chat_messages").insert({
      chat_id: chatId,
      role: "assistant",
      content: refinedPrompt,
      draft_spec: {
        ...spec,
        refined_prompt: refinedPrompt,
      },
    });

    // Update chat's updated_at
    await supabase
      .from("chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId);

    return NextResponse.json({
      ok: true,
      refinedPrompt,
      draftSpec: spec,
    });
  } catch {
    console.error("Failed to refine prompt");
    return NextResponse.json(
      { error: "Failed to refine prompt" },
      { status: 500 }
    );
  }
}

function buildSpecDescription(spec: z.infer<typeof RefineSchema>["spec"]) {
  const parts: string[] = [];

  if (spec.title) parts.push(`Title: ${spec.title}`);
  if (spec.genre) parts.push(`Genre: ${spec.genre}`);
  if (spec.bpm) parts.push(`Tempo: ${spec.bpm} BPM`);
  if (spec.mood) {
    const moodParts: string[] = [];
    if (spec.mood.energy !== undefined)
      moodParts.push(`Energy: ${Math.round(spec.mood.energy * 100)}%`);
    if (spec.mood.focus !== undefined)
      moodParts.push(`Focus: ${Math.round(spec.mood.focus * 100)}%`);
    if (spec.mood.chill !== undefined)
      moodParts.push(`Chill: ${Math.round(spec.mood.chill * 100)}%`);
    if (moodParts.length > 0) parts.push(`Mood: ${moodParts.join(", ")}`);
  }
  if (spec.instrumentation && spec.instrumentation.length > 0) {
    parts.push(`Instruments: ${spec.instrumentation.join(", ")}`);
  }
  if (spec.length_ms) {
    parts.push(`Length: ${Math.round(spec.length_ms / 60000)} minutes`);
  }
  if (spec.instrumental !== undefined) {
    parts.push(spec.instrumental ? "Instrumental" : "With vocals");
  }

  return parts.join("\n");
}
