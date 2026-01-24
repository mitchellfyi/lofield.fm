import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  RateLimitResult,
  DEFAULT_REQUESTS_PER_MINUTE,
  ENV_REQUESTS_PER_MINUTE,
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
 * Get the requests per minute limit.
 */
export function getRequestsPerMinuteLimit(): number {
  const envValue = process.env[ENV_REQUESTS_PER_MINUTE];
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_REQUESTS_PER_MINUTE;
}

/**
 * Check if a user is within their rate limit.
 * Uses a sliding window approach - counts requests in the last minute.
 */
export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const supabase = await createServiceClient();
  const limit = getRequestsPerMinuteLimit();
  const windowStart = new Date(Date.now() - 60 * 1000); // 1 minute ago
  const resetAt = new Date(Date.now() + 60 * 1000); // 1 minute from now

  // Get user's custom limit if set
  const { data: quotaData } = await supabase
    .from("user_quotas")
    .select("requests_per_minute")
    .eq("user_id", userId)
    .single();

  const userLimit = quotaData?.requests_per_minute ?? limit;

  // Count requests in the sliding window
  const { count, error } = await supabase
    .from("request_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart.toISOString());

  if (error) {
    console.error("Error checking rate limit:", error);
    // On error, allow the request but don't track
    return { allowed: true, remaining: userLimit, limit: userLimit, resetAt };
  }

  const requestCount = count ?? 0;
  const remaining = Math.max(0, userLimit - requestCount);
  const allowed = requestCount < userLimit;

  return { allowed, remaining, limit: userLimit, resetAt };
}

/**
 * Record a request for rate limiting.
 */
export async function recordRequest(userId: string): Promise<void> {
  const supabase = await createServiceClient();

  const { error } = await supabase.from("request_log").insert({
    user_id: userId,
  });

  if (error) {
    console.error("Error recording request:", error);
  }

  // Clean up old logs periodically (1% chance on each request)
  if (Math.random() < 0.01) {
    await cleanupOldRequestLogs();
  }
}

/**
 * Get rate limit info for a user.
 */
export async function getRateLimitInfo(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(userId);
}

/**
 * Clean up request logs older than 1 hour.
 */
async function cleanupOldRequestLogs(): Promise<void> {
  const supabase = await createServiceClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  await supabase.from("request_log").delete().lt("created_at", oneHourAgo.toISOString());
}
