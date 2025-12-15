import { z } from "zod";

/**
 * Helper functions for Usage API endpoints
 * Handles date parsing, validation, and common aggregation logic
 *
 * Aggregation rules:
 * - Date grouping: Events are stored in UTC (occurred_at), date grouping uses UTC dates (YYYY-MM-DD)
 * - Cost: sum cost_usd where non-null, track cost_usd_unknown_count for missing pricing
 * - Attribution:
 *   - Chat totals: sum events where chat_id matches
 *   - Track totals: sum events where track_id matches OR action_group_id matches track creation
 *     (this covers "refine then generate" flows where refine costs should be attributed to track)
 */

// Zod schemas for query parameter validation
export const DateRangeSchema = z.object({
  start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
  end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
});

export const DailyGroupBySchema = z.enum(["provider", "model", "action_type"]);

export const EventFiltersSchema = z.object({
  start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  provider: z.enum(["openai", "elevenlabs"]).optional(),
  model: z.string().optional(),
  chat_id: z.string().uuid().optional(),
  track_id: z.string().uuid().optional(),
  status: z.enum(["ok", "error"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Parse ISO date string (YYYY-MM-DD) to UTC timestamptz range
 * Returns [startTimestamp, endTimestamp] for querying
 */
export function parseISODateToUTCRange(isoDate: string): {
  startOfDay: string;
  endOfDay: string;
} {
  // Parse as UTC by appending time
  const startOfDay = new Date(`${isoDate}T00:00:00.000Z`);
  const endOfDay = new Date(`${isoDate}T23:59:59.999Z`);

  return {
    startOfDay: startOfDay.toISOString(),
    endOfDay: endOfDay.toISOString(),
  };
}

/**
 * Parse date range for querying usage_events
 */
export function parseDateRange(
  start: string,
  end: string
): {
  startTimestamp: string;
  endTimestamp: string;
} {
  const startRange = parseISODateToUTCRange(start);
  const endRange = parseISODateToUTCRange(end);

  return {
    startTimestamp: startRange.startOfDay,
    endTimestamp: endRange.endOfDay,
  };
}

/**
 * Validate that end date is not before start date
 */
export function validateDateRange(start: string, end: string): boolean {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return endDate >= startDate;
}

/**
 * Common type definitions for usage API responses
 */

export type ProviderSummary = {
  provider: "openai" | "elevenlabs";
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  creditsUsed?: number;
  audioSeconds?: number;
  requestCount: number;
  costUsd: number;
  costUsdUnknownCount: number;
  errorCount: number;
  errorRate: number;
};

export type ModelSummary = {
  model: string;
  provider: "openai" | "elevenlabs";
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  creditsUsed?: number;
  audioSeconds?: number;
  requestCount: number;
  costUsd: number;
  costUsdUnknownCount: number;
};

export type ChatSummary = {
  chatId: string;
  title: string;
  lastActivity: string;
  openaiTokens: number;
  openaiCost: number;
  elevenCredits: number;
  tracksCount: number;
};

export type TrackSummary = {
  trackId: string;
  title: string;
  chatId: string;
  lengthMs: number;
  openaiTokensUsed: number;
  elevenAudioSeconds: number;
  elevenCredits: number;
  totalCost: number;
};

export type DailyMetrics = {
  date: string; // YYYY-MM-DD
  provider?: string;
  model?: string;
  actionType?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  creditsUsed?: number;
  audioSeconds?: number;
  requestCount: number;
  costUsd: number;
  errorCount: number;
};
