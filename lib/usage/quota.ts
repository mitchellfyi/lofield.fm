import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  QuotaResult,
  UserQuota,
  DEFAULT_DAILY_TOKEN_LIMIT,
  ENV_DAILY_TOKEN_LIMIT,
} from "./types";

// Create a service client for server-side operations
async function createServiceClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  );
}

/**
 * Get the default daily token limit.
 */
export function getDefaultDailyTokenLimit(): number {
  const envValue = process.env[ENV_DAILY_TOKEN_LIMIT];
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_DAILY_TOKEN_LIMIT;
}

/**
 * Get start of today in UTC.
 */
function getStartOfToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/**
 * Check if a user is within their daily quota.
 */
export async function checkDailyQuota(userId: string): Promise<QuotaResult> {
  const supabase = await createServiceClient();
  const today = getStartOfToday();

  // Get user's usage
  const { data: usage } = await supabase
    .from("user_usage")
    .select("tokens_used, period_start")
    .eq("user_id", userId)
    .single();

  // Get user's custom limit if set
  const { data: quotaData } = await supabase
    .from("user_quotas")
    .select("daily_token_limit")
    .eq("user_id", userId)
    .single();

  const dailyLimit = quotaData?.daily_token_limit ?? getDefaultDailyTokenLimit();
  const periodStart = usage?.period_start ? new Date(usage.period_start) : today;

  // Check if we need to reset usage (new day)
  if (periodStart < today) {
    // Reset usage for new day
    await resetDailyUsage(userId);
    return {
      allowed: true,
      tokensUsed: 0,
      tokensRemaining: dailyLimit,
      dailyLimit,
      periodStart: today,
    };
  }

  const tokensUsed = usage?.tokens_used ?? 0;
  const tokensRemaining = Math.max(0, dailyLimit - tokensUsed);
  const allowed = tokensUsed < dailyLimit;

  return { allowed, tokensUsed, tokensRemaining, dailyLimit, periodStart };
}

/**
 * Record token usage for a user.
 */
export async function recordTokenUsage(
  userId: string,
  tokens: number
): Promise<void> {
  const supabase = await createServiceClient();
  const today = getStartOfToday();

  // Get current usage
  const { data: existing } = await supabase
    .from("user_usage")
    .select("id, tokens_used, requests_count, period_start")
    .eq("user_id", userId)
    .single();

  if (existing) {
    const existingPeriodStart = new Date(existing.period_start);

    // Check if we need to reset for new day
    if (existingPeriodStart < today) {
      // Reset and add new tokens
      await supabase
        .from("user_usage")
        .update({
          tokens_used: tokens,
          requests_count: 1,
          period_start: today.toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Increment existing usage
      await supabase
        .from("user_usage")
        .update({
          tokens_used: existing.tokens_used + tokens,
          requests_count: existing.requests_count + 1,
        })
        .eq("id", existing.id);
    }
  } else {
    // Create new usage record
    await supabase.from("user_usage").insert({
      user_id: userId,
      tokens_used: tokens,
      requests_count: 1,
      period_start: today.toISOString(),
    });
  }
}

/**
 * Reset daily usage for a user.
 */
export async function resetDailyUsage(userId: string): Promise<void> {
  const supabase = await createServiceClient();
  const today = getStartOfToday();

  const { data: existing } = await supabase
    .from("user_usage")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabase
      .from("user_usage")
      .update({
        tokens_used: 0,
        requests_count: 0,
        period_start: today.toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("user_usage").insert({
      user_id: userId,
      tokens_used: 0,
      requests_count: 0,
      period_start: today.toISOString(),
    });
  }
}

/**
 * Get user's quota information.
 */
export async function getUserQuota(userId: string): Promise<UserQuota> {
  const supabase = await createServiceClient();
  const today = getStartOfToday();

  // Get user's usage
  const { data: usage } = await supabase
    .from("user_usage")
    .select("tokens_used, requests_count, period_start")
    .eq("user_id", userId)
    .single();

  // Get user's quota settings
  const { data: quotaSettings } = await supabase
    .from("user_quotas")
    .select("daily_token_limit, requests_per_minute, tier")
    .eq("user_id", userId)
    .single();

  const periodStart = usage?.period_start ? new Date(usage.period_start) : today;

  // If period is from a previous day, return zeroed usage
  if (periodStart < today) {
    return {
      userId,
      dailyTokenLimit:
        quotaSettings?.daily_token_limit ?? getDefaultDailyTokenLimit(),
      requestsPerMinute: quotaSettings?.requests_per_minute ?? 20,
      tier: quotaSettings?.tier ?? "free",
      tokensUsed: 0,
      requestsCount: 0,
      periodStart: today,
    };
  }

  return {
    userId,
    dailyTokenLimit:
      quotaSettings?.daily_token_limit ?? getDefaultDailyTokenLimit(),
    requestsPerMinute: quotaSettings?.requests_per_minute ?? 20,
    tier: quotaSettings?.tier ?? "free",
    tokensUsed: usage?.tokens_used ?? 0,
    requestsCount: usage?.requests_count ?? 0,
    periodStart,
  };
}
