import { getServiceRoleClient } from "@/lib/supabase/admin";

// Daily limits for rate limiting
const DAILY_REFINE_LIMIT = 200;
const DAILY_GENERATE_LIMIT = 50;

export type RateLimitType = "refine" | "generate";

/**
 * Check if user has exceeded their daily rate limit
 * Returns true if user can proceed, false if limit exceeded
 */
export async function checkRateLimit(
  userId: string,
  type: RateLimitType
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabaseAdmin = getServiceRoleClient();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const limit = type === "refine" ? DAILY_REFINE_LIMIT : DAILY_GENERATE_LIMIT;

  // Get or create today's usage counter
  const { data: counter, error } = await supabaseAdmin
    .from("usage_counters")
    .select("refine_count, generate_count")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (error) {
    console.error("Failed to check rate limit", { userId, type, error });
    // On error, allow the request (fail open)
    return { allowed: true, current: 0, limit };
  }

  const current =
    type === "refine"
      ? (counter?.refine_count ?? 0)
      : (counter?.generate_count ?? 0);

  return {
    allowed: current < limit,
    current,
    limit,
  };
}

/**
 * Increment the rate limit counter for a user
 * Should be called after a successful operation
 */
export async function incrementRateLimit(
  userId: string,
  type: RateLimitType
): Promise<void> {
  const supabaseAdmin = getServiceRoleClient();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const columnToIncrement =
    type === "refine" ? "refine_count" : "generate_count";

  // Try to update existing counter
  const { data: existingCounter } = await supabaseAdmin
    .from("usage_counters")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (existingCounter) {
    // Update existing counter
    await supabaseAdmin
      .from("usage_counters")
      .update({
        [columnToIncrement]: existingCounter[columnToIncrement] + 1,
      })
      .eq("user_id", userId)
      .eq("date", today);
  } else {
    // Insert new counter
    await supabaseAdmin.from("usage_counters").insert({
      user_id: userId,
      date: today,
      [columnToIncrement]: 1,
    });
  }
}
