import { z } from "zod";

/**
 * Server-side validation schemas for track generation parameters
 */

// Length validation (3s to 5min as per ElevenLabs limits)
export const LENGTH_MS_MIN = 3000;
export const LENGTH_MS_MAX = 300000;

export const LengthMsSchema = z
  .number()
  .min(LENGTH_MS_MIN, `Track length must be at least ${LENGTH_MS_MIN / 1000}s`)
  .max(LENGTH_MS_MAX, `Track length must be at most ${LENGTH_MS_MAX / 1000}s`);

// BPM validation (sensible range for music)
export const BPM_MIN = 40;
export const BPM_MAX = 220;

export const BpmSchema = z
  .number()
  .min(BPM_MIN, `BPM must be at least ${BPM_MIN}`)
  .max(BPM_MAX, `BPM must be at most ${BPM_MAX}`);

// Mood validation (0-100 range)
export const MoodValueSchema = z
  .number()
  .min(0, "Mood values must be between 0 and 100")
  .max(100, "Mood values must be between 0 and 100");

export const MoodSchema = z.object({
  energy: MoodValueSchema,
  focus: MoodValueSchema,
  chill: MoodValueSchema,
});

/**
 * Validate generation parameters
 */
export function validateGenerationParams(params: {
  length_ms?: number;
  bpm?: number;
  mood?: { energy: number; focus: number; chill: number };
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.length_ms !== undefined) {
    const result = LengthMsSchema.safeParse(params.length_ms);
    if (!result.success) {
      errors.push(...result.error.errors.map((e) => e.message));
    }
  }

  if (params.bpm !== undefined) {
    const result = BpmSchema.safeParse(params.bpm);
    if (!result.success) {
      errors.push(...result.error.errors.map((e) => e.message));
    }
  }

  if (params.mood !== undefined) {
    const result = MoodSchema.safeParse(params.mood);
    if (!result.success) {
      errors.push(...result.error.errors.map((e) => e.message));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Prompt safety lint - check for potentially problematic patterns
 */
export function checkPromptSafety(prompt: string): {
  safe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for "in the style of [artist]" patterns
  const styleOfPattern = /in\s+the\s+style\s+of\s+([a-zA-Z\s&.'-]+)/gi;
  const matches = prompt.matchAll(styleOfPattern);

  for (const match of matches) {
    const artistName = match[1].trim();
    warnings.push(
      `Detected "in the style of ${artistName}". Consider rephrasing to describe musical characteristics (e.g., instrumentation, tempo, mood) instead of referencing specific artists to avoid copyright concerns.`
    );
  }

  // Check for direct artist name mentions with common keywords
  const artistMentionPattern =
    /(?:sounds?\s+like|similar\s+to|reminds?\s+me\s+of)\s+([a-zA-Z\s&.'-]+)/gi;
  const artistMatches = prompt.matchAll(artistMentionPattern);

  for (const match of artistMatches) {
    warnings.push(
      `Detected artist reference: "${match[0]}". Consider describing the musical elements you want instead of referencing specific artists.`
    );
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}
