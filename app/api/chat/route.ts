import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { validateToneCode } from "@/lib/audio/llmContract";
import { loadSystemPrompt, buildRetryPrompt } from "@/lib/prompts/loader";
import { isValidModel, DEFAULT_MODEL } from "@/lib/models";
import { createClient } from "@/lib/supabase/server";
import { getApiKey } from "@/lib/api-keys";
import {
  checkRateLimit,
  recordRequest,
  checkDailyQuota,
  recordTokenUsage,
  checkAbusePatterns,
  flagAbuse,
  estimateTokens,
  type RateLimitHeaders,
} from "@/lib/usage";

export const runtime = "nodejs";

const MAX_RETRIES = 3;

interface GenerationContext {
  messages: ModelMessage[];
  modelName: string;
  openai: OpenAIProvider;
  userId: string;
  rateLimitHeaders: RateLimitHeaders;
  retryCount?: number;
}

async function generateWithValidation(ctx: GenerationContext): Promise<Response> {
  const { messages, modelName, openai, userId, rateLimitHeaders, retryCount = 0 } = ctx;
  const systemPrompt = loadSystemPrompt();
  const result = streamText({
    model: openai(modelName),
    system: systemPrompt,
    messages,
  });

  // For streaming responses, we need to validate after generation.
  // Note: We buffer the full response to enable retry logic. For typical Tone.js code
  // (usually < 1KB), this is acceptable. The streaming experience is preserved for the
  // client, and validation happens after the stream completes.
  const reader = result.textStream.getReader();
  let fullText = "";
  const chunks: string[] = [];

  // Read the entire stream
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    fullText += value;
  }

  // Track token usage for the response
  const responseTokens = estimateTokens(fullText);
  await recordTokenUsage(userId, responseTokens);

  // Validate the complete response
  const validation = validateToneCode(fullText);

  if (!validation.valid && retryCount < MAX_RETRIES) {
    // Build retry prompt with validation errors
    const errorMessages = validation.errors.map((e) => e.message);
    const retryPrompt = buildRetryPrompt(errorMessages);

    // Add the failed attempt and retry prompt to messages
    const newMessages: ModelMessage[] = [
      ...messages,
      { role: "assistant", content: fullText },
      { role: "user", content: retryPrompt },
    ];

    // Retry recursively
    return generateWithValidation({
      ...ctx,
      messages: newMessages,
      retryCount: retryCount + 1,
    });
  }

  // Return the response (either valid or max retries reached)
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

  // Build error type string for UI feedback
  const errorTypes = validation.errors.map((e) => e.type).join(",");

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Validation-Status": validation.valid ? "valid" : "invalid",
      "X-Retry-Count": retryCount.toString(),
      "X-Max-Retries": MAX_RETRIES.toString(),
      "X-Validation-Errors": errorTypes || "",
      ...rateLimitHeaders,
    },
  });
}

export async function POST(req: Request) {
  // Get user session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check for abuse flags before any processing
  const abuseStatus = await checkAbusePatterns(user.id);
  if (abuseStatus.flagged) {
    return new Response(
      JSON.stringify({
        error: "Account temporarily restricted due to unusual activity. Please contact support.",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    // Flag repeated rate limit violations
    await flagAbuse(user.id, "rate_limit_exceeded");
    return new Response(
      JSON.stringify({
        error: `Rate limit exceeded. Please wait before making more requests.`,
        retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil(
            (rateLimit.resetAt.getTime() - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }

  // Check daily quota
  const quota = await checkDailyQuota(user.id);
  if (!quota.allowed) {
    // Flag repeated quota violations
    await flagAbuse(user.id, "quota_exceeded");
    return new Response(
      JSON.stringify({
        error: `Daily token quota exceeded. Your quota resets at midnight UTC.`,
        tokensUsed: quota.tokensUsed,
        dailyLimit: quota.dailyLimit,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // Record this request for rate limiting
  await recordRequest(user.id);

  // Get user's API key
  let apiKey = await getApiKey(user.id);

  // In development, fall back to env var if no user key
  if (!apiKey && process.env.NODE_ENV === "development") {
    apiKey = process.env.OPENAI_API_KEY ?? null;
  }

  // In production, require user's key
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key required. Please add your OpenAI API key in Settings." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create OpenAI client with user's key
  const openai = createOpenAI({ apiKey });

  const body = await req.json();
  const { messages, model: requestedModel } = body;

  // Validate and select model
  const modelName = requestedModel && isValidModel(requestedModel) ? requestedModel : DEFAULT_MODEL;

  // Build messages with context, filtering out invalid messages
  // The frontend may send messages with 'text' instead of 'content' or parts array
  const contextMessages: ModelMessage[] = messages
    .map((msg: Record<string, unknown>) => {
      // Handle different message formats from useChat
      let content = msg.content;

      // Try to extract content from 'text' field (TextStreamChatTransport format)
      if (!content && msg.text) {
        content = msg.text;
      }

      // Try to extract from parts array (UIMessage format)
      if (!content && Array.isArray(msg.parts)) {
        const textParts = msg.parts.filter((p: Record<string, unknown>) => p.type === "text");
        content = textParts.map((p: Record<string, unknown>) => p.text).join("\n");
      }

      return {
        role: msg.role as "user" | "assistant",
        content: content as string,
      };
    })
    .filter(
      (msg: { role: string; content: string }) =>
        typeof msg.content === "string" && msg.content.trim() !== ""
    ) as ModelMessage[];

  if (contextMessages.length === 0) {
    return new Response("No valid messages provided", { status: 400 });
  }

  // Build rate limit headers for the response
  const rateLimitHeaders: RateLimitHeaders = {
    "X-RateLimit-Limit": rateLimit.limit.toString(),
    "X-RateLimit-Remaining": rateLimit.remaining.toString(),
    "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
    "X-Quota-Used": quota.tokensUsed.toString(),
    "X-Quota-Remaining": quota.tokensRemaining.toString(),
  };

  return generateWithValidation({
    messages: contextMessages,
    modelName,
    openai,
    userId: user.id,
    rateLimitHeaders,
  });
}
