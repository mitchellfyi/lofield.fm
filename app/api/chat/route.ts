import { createOpenAI } from '@ai-sdk/openai';

// Explicitly configure OpenAI with API key from environment
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
import { streamText, type ModelMessage } from 'ai';
import { validateToneCode } from '@/lib/audio/llmContract';
import { loadSystemPrompt, buildRetryPrompt } from '@/lib/prompts/loader';

export const runtime = 'nodejs';

const MAX_RETRIES = 2;

async function generateWithValidation(
  messages: ModelMessage[], 
  retryCount = 0
): Promise<Response> {
  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
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
  let fullText = '';
  const chunks: string[] = [];

  // Read the entire stream
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    fullText += value;
  }

  // Validate the complete response
  const validation = validateToneCode(fullText);

  if (!validation.valid && retryCount < MAX_RETRIES) {
    // Build retry prompt with validation errors
    const errorMessages = validation.errors.map(e => e.message);
    const retryPrompt = buildRetryPrompt(errorMessages);
    
    // Add the failed attempt and retry prompt to messages
    const newMessages: ModelMessage[] = [
      ...messages,
      { role: 'assistant', content: fullText },
      { role: 'user', content: retryPrompt }
    ];

    // Retry recursively
    return generateWithValidation(newMessages, retryCount + 1);
  }

  // Return the response (either valid or max retries reached)
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Validation-Status': validation.valid ? 'valid' : 'invalid',
      'X-Retry-Count': retryCount.toString()
    }
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { messages } = body;

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
        const textParts = msg.parts.filter((p: Record<string, unknown>) => p.type === 'text');
        content = textParts.map((p: Record<string, unknown>) => p.text).join('\n');
      }

      return {
        role: msg.role as 'user' | 'assistant',
        content: content as string
      };
    })
    .filter((msg: { role: string; content: string }) =>
      typeof msg.content === 'string' && msg.content.trim() !== ''
    ) as ModelMessage[];

  if (contextMessages.length === 0) {
    return new Response('No valid messages provided', { status: 400 });
  }

  return generateWithValidation(contextMessages);
}
