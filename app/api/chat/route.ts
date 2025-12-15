import { getOpenAIKeyForUser } from "@/lib/secrets";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";
import type { NextRequest } from "next/server";

type ChatRole = "user" | "assistant" | "system";
type IncomingMessage = { role: ChatRole; content: string };

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const messages = Array.isArray(payload?.messages) ? payload.messages : null;

  const allowedRoles = ["user", "assistant", "system"] as const;
  const validMessages =
    messages &&
    messages.every(
      (message: unknown): message is IncomingMessage =>
        typeof message === "object" &&
        message !== null &&
        typeof (message as { role?: unknown }).role === "string" &&
        allowedRoles.includes(
          (message as { role: string }).role as (typeof allowedRoles)[number]
        ) &&
        typeof (message as { content?: unknown }).content === "string"
    );

  if (!validMessages) {
    return new Response("Invalid message payload", { status: 400 });
  }

  const coreMessages: CoreMessage[] = (messages as IncomingMessage[]).map(
    ({ role, content }) => ({
      role,
      content,
    })
  );
  const apiKey = await getOpenAIKeyForUser(user.id);

  if (!apiKey) {
    return new Response("Missing OpenAI API key", { status: 400 });
  }

  const openai = createOpenAI({ apiKey });
  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages: coreMessages,
  });

  return result.toTextStreamResponse();
}
