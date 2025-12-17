import { getOpenAIKeyForUser } from "@/lib/secrets";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";
import type { NextRequest } from "next/server";
import {
  normalizeContent,
  firstEmptyMessageIndex,
  getMessageContent,
  type ChatRole,
} from "./utils";
import { logUsageEvent, calculateOpenAICost } from "@/lib/usage-tracking";

type IncomingMessage = { role: ChatRole; content?: unknown; parts?: unknown[] };

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

  // Log raw messages for debugging empty content issues
  if (messages) {
    console.log(
      "[api/chat] Received messages:",
      JSON.stringify(messages, null, 2)
    );
  }

  const chatId =
    typeof payload?.chat_id === "string" && payload.chat_id.length > 0
      ? payload.chat_id
      : null;

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
        )
    );

  if (!validMessages) {
    return Response.json({ error: "Invalid message payload" }, { status: 400 });
  }

  const normalizedMessages: CoreMessage[] = (messages as IncomingMessage[]).map(
    (msg) => ({
      role: msg.role,
      content: normalizeContent(getMessageContent(msg)) ?? "",
    })
  );

  const emptyIndex = firstEmptyMessageIndex(
    normalizedMessages as Array<{ role: ChatRole; content: unknown }>
  );
  if (emptyIndex !== null) {
    console.warn("[api/chat] Empty message content", {
      emptyIndex,
      count: normalizedMessages.length,
    });
  }

  const filteredMessages = normalizedMessages.filter(
    (m) => typeof m.content === "string" && m.content.trim().length > 0
  );

  if (filteredMessages.length === 0) {
    console.warn("[api/chat] Message content empty after normalization", {
      count: normalizedMessages.length,
    });
    return Response.json(
      { error: "Message content is empty" },
      { status: 400 }
    );
  }

  // If chatId is provided, verify ownership
  if (chatId) {
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id, user_id")
      .eq("id", chatId)
      .single();
    if (chatError || !chat || chat.user_id !== user.id) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }
  }

  // Find last user message to persist
  const lastUser = [...filteredMessages]
    .reverse()
    .find((m) => m.role === "user" && typeof m.content === "string");

  if (
    chatId &&
    (!lastUser ||
      typeof lastUser.content !== "string" ||
      lastUser.content.trim().length === 0)
  ) {
    return Response.json(
      { error: "No user message to persist" },
      { status: 400 }
    );
  }

  if (chatId && lastUser) {
    const { error: userMsgError } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        role: "user",
        content: lastUser.content,
      });
    if (userMsgError) {
      console.error("[api/chat] Failed to save user message", userMsgError);
      return Response.json(
        { error: "Failed to save user message" },
        { status: 500 }
      );
    }
  }

  const apiKey = await getOpenAIKeyForUser(user.id);

  if (!apiKey) {
    return Response.json({ error: "Missing OpenAI API key" }, { status: 400 });
  }

  const actionGroupId = crypto.randomUUID();
  const startTime = Date.now();

  // Inject system prompt if not present
  const hasSystemPrompt = filteredMessages.some((m) => m.role === "system");
  const messagesToSend = hasSystemPrompt
    ? filteredMessages
    : [
        {
          role: "system",
          content: `You are an AI music production assistant for "Lofield Studio".
Your goal is to help users conceptualize and refine lo-fi hip hop, chillhop, and ambient tracks.
Focus on discussing musical elements: genre, mood, instruments, BPM, and atmosphere.
Do not write lyrics or poems unless explicitly asked.
Do not recommend existing real-world tracks or artists.
If the user asks for a specific style (e.g. "west coast rap"), discuss the musical characteristics (instruments, tempo, rhythm) that define that style and how to apply them to a lo-fi context.`,
        } as CoreMessage,
        ...filteredMessages,
      ];

  const openai = createOpenAI({ apiKey });
  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages: messagesToSend,
    onFinish: async ({ text, usage, response }) => {
      const durationMs = Date.now() - startTime;
      let costUsd: number | undefined;
      let costNotes: string | undefined;

      try {
        if (usage?.inputTokens && usage?.outputTokens) {
          const cost = await calculateOpenAICost({
            model: "gpt-4o-mini",
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
          });
          if (cost) {
            costUsd = cost.costUsd;
            costNotes = cost.costNotes;
          }
        }
      } catch (error) {
        console.error("[api/chat] Failed to calculate cost", error);
      }

      // Save message first as it's critical for UI
      if (chatId) {
        try {
          const { error: assistantError } = await supabase
            .from("chat_messages")
            .insert({
              chat_id: chatId,
              role: "assistant",
              content: text,
              draft_spec: null,
            });

          if (assistantError) {
            console.error(
              "[api/chat] Failed to save assistant message",
              assistantError
            );
          } else {
            // Update chat updated_at
            try {
              await supabase
                .from("chats")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", chatId);
            } catch (timestampErr) {
              console.error(
                "[api/chat] Failed to update chat timestamp",
                timestampErr
              );
            }
          }
        } catch (error) {
          console.error("[api/chat] Exception saving assistant message", error);
        }
      }

      // Log usage event
      try {
        await logUsageEvent({
          userId: user.id,
          chatId: chatId ?? undefined,
          actionGroupId,
          actionType: "chat_stream",
          provider: "openai",
          providerOperation: "responses.streamText",
          providerRequestId: response?.id,
          model: "gpt-4o-mini",
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
          totalTokens: usage?.totalTokens,
          costUsd,
          costNotes,
          status: "ok",
          latencyMs: durationMs,
        });
      } catch (error) {
        console.error("[api/chat] Failed to log usage event", error);
      }
    },
  });

  return result.toTextStreamResponse();
}
