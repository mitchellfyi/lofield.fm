import { openai } from '@ai-sdk/openai';
import { streamText, type ModelMessage } from 'ai';
import { validateStrudelCode, buildRetryPrompt } from '@/lib/strudel/llmContract';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are a Strudel live-coding assistant. Strudel is a live coding environment for music.

CRITICAL RULES - FOLLOW EXACTLY:

1. Response format (MANDATORY):
   - A "Notes:" section with max 3 bullet points describing musical changes
   - "Code:" label followed by EXACTLY ONE fenced code block: \`\`\`js ... \`\`\`
   - NO other markdown, NO explanations outside Notes, NO multiple code blocks

2. Code requirements (ALL MANDATORY):
   - Must be complete, runnable Strudel code using @strudel/web globals
   - Must explicitly set tempo: setcps(bpm/60/4) at the start
   - Must end with .play() to start playback
   - Use ONLY common Strudel constructs: note, sound, s, n, stack, sequence, .slow(), .fast(), .rev(), .jux(), .delay(), .room(), .gain()
   - NO pseudo-code, NO placeholders, NO "steps" or explanations in code
   - NEVER use: import, require, fetch, document, window

3. When user asks for changes:
   - ALWAYS output the COMPLETE program, NOT diffs or partial code
   - Use the previous code as reference but regenerate fully

4. Common patterns for lofi beats:
   - Drums: s("bd sd bd sd").slow(2) or s("bd*2 sd")
   - Hi-hats: s("hh*8").gain(0.4)
   - Bass: note("c2 eb2 g2").s("sawtooth").slow(4)
   - Chords: note("c3 eb3 g3").s("piano")
   - Effects: .delay(0.3), .room(0.5), .lpf(800)

CORRECT example:
Notes:
- Chill lofi beat at 85 BPM
- Jazzy piano chords with delay
- Vinyl crackle texture

Code:
\`\`\`js
setcps(85/60/4)
stack(
  s("bd sd:1 bd sd:2").slow(2),
  s("hh*8").gain(0.4),
  note("c3 eb3 g3").s("piano").slow(4).delay(0.3)
).play()
\`\`\`

DO NOT OUTPUT:
- Multiple code blocks
- Explanations like "Here's how it works..."
- Pseudo-code or comments about steps
- Incomplete code requiring user edits`;

const MAX_RETRIES = 2;

async function generateWithValidation(
  messages: ModelMessage[], 
  retryCount = 0
): Promise<Response> {
  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: SYSTEM_PROMPT,
    messages,
  });

  // For streaming responses in edge runtime, we need to validate after generation.
  // Note: We buffer the full response to enable retry logic. For typical Strudel code
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
  const validation = validateStrudelCode(fullText);

  if (!validation.valid && retryCount < MAX_RETRIES) {
    // Build retry prompt with validation errors
    const retryPrompt = buildRetryPrompt(validation.errors);
    
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

  // Build messages with context: include previous accepted code if available
  const contextMessages: ModelMessage[] = messages.map((msg: ModelMessage) => ({
    role: msg.role,
    content: msg.content
  }));

  return generateWithValidation(contextMessages);
}
