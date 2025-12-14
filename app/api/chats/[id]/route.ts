import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

type Params = {
  params: Promise<{ id: string }>;
};

const UpdateChatSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

// GET /api/chats/[id] - get a specific chat with messages and tracks
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get chat
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("*")
    .eq("id", id)
    .single();

  if (chatError || !chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  // Get messages
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_id", id)
    .order("created_at", { ascending: true });

  // Get tracks
  const { data: tracks } = await supabase
    .from("tracks")
    .select("*")
    .eq("chat_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    chat,
    messages: messages ?? [],
    tracks: tracks ?? [],
  });
}

// PATCH /api/chats/[id] - update a chat
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = UpdateChatSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { title } = parseResult.data;

  const { data, error } = await supabase
    .from("chats")
    .update({ title })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update chat");
    return NextResponse.json(
      { error: "Failed to update chat" },
      { status: 500 }
    );
  }

  return NextResponse.json({ chat: data });
}

// DELETE /api/chats/[id] - delete a chat
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("chats").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete chat");
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
