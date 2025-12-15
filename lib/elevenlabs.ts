import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export type GenerateMusicParams = {
  apiKey: string;
  prompt: string;
  lengthMs: number;
  instrumental: boolean;
};

export type GenerateMusicResult = {
  audioBuffer: Uint8Array;
  latencyMs: number;
  audioBytes: number;
  audioSeconds?: number;
  requestId?: string;
};

/**
 * ElevenLabs subscription info (credits balance and limits)
 * Based on /v1/user/subscription endpoint
 */
export type ElevenLabsSubscription = {
  creditsUsedCurrentPeriod: number;
  creditsLimitCurrentPeriod: number;
  creditsRemaining: number;
  nextResetUnix: number;
  tier?: string;
  currency?: string;
  status?: string;
  billingPeriod?: string;
  nextInvoiceAmountCents?: number;
};

/**
 * Daily usage stats from ElevenLabs
 * Based on /v1/usage/character-stats endpoint
 */
export type ElevenLabsUsageStats = {
  startUnix: number;
  endUnix: number;
  dailyUsage: Array<{
    date: string; // ISO date string (YYYY-MM-DD)
    creditsUsed: number;
  }>;
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
    const latencyMs = Date.now() - startTime;

    return {
      audioBuffer,
      latencyMs,
      audioBytes: audioBuffer.length,
      audioSeconds: lengthMs / 1000,
      requestId: undefined, // ElevenLabs SDK doesn't expose request ID easily
    };
  } catch (error) {
    // Sanitize error - don't expose API keys or sensitive data
    if (error instanceof Error) {
      let message = error.message;
      // Remove any potential API keys or tokens from error message
      message = message.replace(
        /\b(sk|xi|pk|Bearer)[-_][a-zA-Z0-9]{20,}\b/gi,
        "[REDACTED]"
      );
      // Replace authorization headers
      message = message.replace(
        /authorization[:\s]+.+/gi,
        "authorization: [REDACTED]"
      );
      throw new Error(`ElevenLabs API error: ${message}`);
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

/**
 * Get ElevenLabs subscription info (credits balance and limits)
 * Uses the /v1/user/subscription endpoint
 */
export async function getSubscription(
  apiKey: string
): Promise<ElevenLabsSubscription> {
  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/user/subscription",
      {
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `ElevenLabs subscription API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Parse and map the response
    // ElevenLabs still uses "character_*" naming in the API even though credits were previously characters
    const creditsUsed = Number(data.character_count ?? 0);
    const creditsLimit = Number(data.character_limit ?? 0);
    // next_character_count_reset_unix is in seconds, convert to milliseconds
    const nextResetUnix = Number(data.next_character_count_reset_unix ?? 0);

    return {
      creditsUsedCurrentPeriod: creditsUsed,
      creditsLimitCurrentPeriod: creditsLimit,
      creditsRemaining: Math.max(0, creditsLimit - creditsUsed),
      nextResetUnix: nextResetUnix * 1000, // Convert seconds to milliseconds
      tier: data.tier,
      currency: data.currency,
      status: data.status,
      billingPeriod: data.billing_period,
      nextInvoiceAmountCents: data.next_invoice?.amount_due_cents,
    };
  } catch (error) {
    // Sanitize error - don't expose API keys or sensitive data
    if (error instanceof Error) {
      let message = error.message;
      // Remove any potential API keys or tokens from error message
      message = message.replace(
        /\b(sk|xi|pk|Bearer)[-_][a-zA-Z0-9]{20,}\b/gi,
        "[REDACTED]"
      );
      message = message.replace(
        /authorization[:\s]+.+/gi,
        "authorization: [REDACTED]"
      );
      throw new Error(`ElevenLabs subscription error: ${message}`);
    }
    throw new Error("ElevenLabs subscription error: Unknown error");
  }
}

/**
 * Get ElevenLabs daily usage stats
 * Uses the /v1/usage/character-stats endpoint
 * @param apiKey - ElevenLabs API key
 * @param startUnix - Start timestamp in milliseconds
 * @param endUnix - End timestamp in milliseconds
 */
export async function getUsageStats(
  apiKey: string,
  startUnix: number,
  endUnix: number
): Promise<ElevenLabsUsageStats> {
  try {
    const url = new URL("https://api.elevenlabs.io/v1/usage/character-stats");
    url.searchParams.set("start_unix", String(startUnix));
    url.searchParams.set("end_unix", String(endUnix));

    const response = await fetch(url.toString(), {
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `ElevenLabs usage stats API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Parse the daily usage from the response
    // The API returns a time axis with daily breakdown
    const dailyUsage: Array<{ date: string; creditsUsed: number }> = [];

    if (data.history && Array.isArray(data.history)) {
      for (const entry of data.history) {
        // Convert unix timestamp to ISO date string
        const date = new Date(entry.unix_timestamp);
        const dateStr = date.toISOString().split("T")[0];

        dailyUsage.push({
          date: dateStr,
          creditsUsed: Number(entry.character_count ?? 0),
        });
      }
    }

    return {
      startUnix,
      endUnix,
      dailyUsage,
    };
  } catch (error) {
    // Sanitize error - don't expose API keys or sensitive data
    if (error instanceof Error) {
      let message = error.message;
      // Remove any potential API keys or tokens from error message
      message = message.replace(
        /\b(sk|xi|pk|Bearer)[-_][a-zA-Z0-9]{20,}\b/gi,
        "[REDACTED]"
      );
      message = message.replace(
        /authorization[:\s]+.+/gi,
        "authorization: [REDACTED]"
      );
      throw new Error(`ElevenLabs usage stats error: ${message}`);
    }
    throw new Error("ElevenLabs usage stats error: Unknown error");
  }
}
