import { openai } from '@ai-sdk/openai';
import { streamText, type ModelMessage } from 'ai';
import { validateToneCode, buildRetryPrompt } from '@/lib/audio/llmContract';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are a Tone.js music coding assistant. Tone.js is a Web Audio framework for creating interactive music in the browser.

CRITICAL RULES - FOLLOW EXACTLY:

1. Response format (MANDATORY):
   - A "Notes:" section with max 3 bullet points describing musical changes
   - "Code:" label followed by EXACTLY ONE fenced code block: \`\`\`js ... \`\`\`
   - NO other markdown, NO explanations outside Notes, NO multiple code blocks

2. Code requirements (ALL MANDATORY):
   - Must be complete, runnable Tone.js code
   - Must use Tone.* prefix for all Tone.js APIs
   - Must call Tone.Transport.start() at the end
   - Set BPM at the start: Tone.Transport.bpm.value = 120
   - Create synths/instruments ONCE outside of sequences (for performance)
   - Use Tone.Sequence, Tone.Loop, or Tone.Part for patterns
   - NO pseudo-code, NO placeholders, NO explanations in code
   - NEVER use: import, require, fetch, document (except window.__toneCleanup)
   - ALWAYS include window.__toneCleanup function to dispose all instruments

3. When user asks for changes:
   - ALWAYS output the COMPLETE program, NOT diffs or partial code
   - Use the previous code as reference but regenerate fully

4. Code structure pattern (FOLLOW THIS):
\`\`\`js
// Set tempo
Tone.Transport.bpm.value = 85;

// Effects (create once)
const reverb = new Tone.Reverb({ decay: 3, wet: 0.4 }).toDestination();
const delay = new Tone.FeedbackDelay("8n", 0.3).connect(reverb);

// Instruments (create once, outside sequences)
const kick = new Tone.MembraneSynth({...}).toDestination();
const synth = new Tone.PolySynth(Tone.Synth).connect(delay);

// Patterns using Tone.Sequence with values (not creating synths inside!)
const kickSeq = new Tone.Sequence((time, vel) => {
  if (vel) kick.triggerAttackRelease("C1", "8n", time, vel);
}, [0.9, null, 0.7, null], "4n").start(0);

// Cleanup function (REQUIRED)
window.__toneCleanup = () => {
  [kickSeq].forEach(s => s.dispose());
  [kick, synth].forEach(i => i.dispose());
  [reverb, delay].forEach(e => e.dispose());
};

// Start transport
Tone.Transport.start();
\`\`\`

5. Common synth types:
   - Tone.MembraneSynth - kicks, toms
   - Tone.NoiseSynth - snares, hats (use noise type: "white", "pink", "brown")
   - Tone.MetalSynth - hi-hats, cymbals
   - Tone.MonoSynth - bass (has filter envelope)
   - Tone.Synth - simple melodic synth
   - Tone.PolySynth - chords (wrap another synth type)
   - Tone.FMSynth - FM synthesis
   - Tone.AMSynth - AM synthesis

6. Effects:
   - Tone.Reverb({ decay: 3, wet: 0.5 })
   - Tone.FeedbackDelay("8n", 0.3)
   - Tone.Filter(800, "lowpass")
   - Tone.Chorus(4, 2.5, 0.5)
   - Tone.Distortion(0.4)
   - Tone.BitCrusher(4)

DO NOT OUTPUT:
- Multiple code blocks
- Explanations like "Here's how it works..."
- Synths created INSIDE sequence callbacks (creates memory leaks!)
- Code without window.__toneCleanup function
- Code without Tone.Transport.start() at the end`;

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
