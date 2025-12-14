import { getOpenAIKeyForUser } from "@/lib/secrets";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import type { NextRequest } from "next/server";

type ChatRole = "user" | "assistant" | "system" | "tool" | "function" | "data";
type IncomingMessage = { role: ChatRole; content: string };

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const messages = Array.isArray(payload?.messages) ? payload.messages : null;

  const allowedRoles: ChatRole[] = ["user", "assistant", "system", "tool", "function", "data"];
  const validMessages =
    messages &&
    messages.every(
      (message: unknown): message is IncomingMessage =>
        typeof message === "object" &&
        message !== null &&
        typeof (message as { role?: unknown }).role === "string" &&
        allowedRoles.includes((message as { role: string }).role as ChatRole) &&
        typeof (message as { content?: unknown }).content === "string",
    );

  if (!validMessages) {
    return new Response("Invalid message payload", { status: 400 });
  }

  const safeMessages = (messages as IncomingMessage[]).map(({ role, content }) => ({
    role,
    content,
  }));
  const apiKey = await getOpenAIKeyForUser(session.user.id);

  if (!apiKey) {
    return new Response("Missing OpenAI API key", { status: 400 });
  }

  const openai = createOpenAI({ apiKey });
  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages: convertToCoreMessages(safeMessages),
  });

  return result.toDataStreamResponse();
}
