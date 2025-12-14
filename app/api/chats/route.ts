import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const CreateChatSchema = z.object({
  title: z.string().max(200).optional(),
});

// GET /api/chats - list user's chats
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("chats")
    .select("id, title, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch chats");
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }

  return NextResponse.json({ chats: data });
}

// POST /api/chats - create a new chat
export async function POST(request: Request) {
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
    body = {};
  }

  const parseResult = CreateChatSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { title } = parseResult.data;

  const { data, error } = await supabase
    .from("chats")
    .insert({
      user_id: session.user.id,
      title: title ?? "New chat",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create chat");
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }

  return NextResponse.json({ chat: data }, { status: 201 });
}
