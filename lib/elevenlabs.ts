import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export type GenerateMusicParams = {
  apiKey: string;
  prompt: string;
  lengthMs: number;
  instrumental: boolean;
};

export type GenerateMusicResult = {
  audioBuffer: Uint8Array;
  durationMs: number;
  audioBytes: number;
  audioSeconds?: number;
  requestId?: string;
};

/**
 * Generate music using ElevenLabs Eleven Music API
 * Uses the music_v1 model to create instrumental tracks
 */
export async function generateMusic(
  params: GenerateMusicParams
): Promise<GenerateMusicResult> {
  const { apiKey, prompt, lengthMs, instrumental } = params;

  // Validate length constraints (3s to 5min as per API docs)
  const MIN_LENGTH_MS = 3000;
  const MAX_LENGTH_MS = 300000;

  if (lengthMs < MIN_LENGTH_MS || lengthMs > MAX_LENGTH_MS) {
    throw new Error(
      `Invalid length: must be between ${MIN_LENGTH_MS}ms and ${MAX_LENGTH_MS}ms`
    );
  }

  const client = new ElevenLabsClient({ apiKey });

  const startTime = Date.now();

  try {
    // Use the compose method with prompt
    const audioStream = await client.music.compose({
      prompt,
      musicLengthMs: lengthMs,
      modelId: "music_v1",
      forceInstrumental: instrumental,
      outputFormat: "mp3_44100_128", // High quality MP3
    });

    // Convert stream to buffer
    const audioBuffer = await streamToBuffer(audioStream);
    const durationMs = Date.now() - startTime;

    return {
      audioBuffer,
      durationMs,
      audioBytes: audioBuffer.length,
      audioSeconds: lengthMs / 1000,
      requestId: undefined, // ElevenLabs SDK doesn't expose request ID easily
    };
  } catch (error) {
    // Sanitize error - don't expose API keys or sensitive data
    if (error instanceof Error) {
      throw new Error(`ElevenLabs API error: ${error.message}`);
    }
    throw new Error("ElevenLabs API error: Unknown error");
  }
}

/**
 * Convert a ReadableStream to a Uint8Array buffer
 */
async function streamToBuffer(
  stream: ReadableStream<Uint8Array>
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  // Calculate total length
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);

  // Merge all chunks into a single Uint8Array
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}
