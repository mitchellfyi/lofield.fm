import { getOpenAIKeyForUser } from "@/lib/secrets";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages = [] } = await req.json();
  const apiKey = await getOpenAIKeyForUser(session.user.id);

  if (!apiKey) {
    return new Response("Missing OpenAI API key", { status: 400 });
  }

  const openai = createOpenAI({ apiKey });
  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages: convertToCoreMessages(messages),
  });

  return result.toDataStreamResponse();
}
