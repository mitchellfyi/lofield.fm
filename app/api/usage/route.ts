import { createClient } from "@/lib/supabase/server";
import { getUserQuota, getRateLimitInfo, type UsageStats } from "@/lib/usage";

export const runtime = "nodejs";

export async function GET() {
  // Get user session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get user's quota and usage
  const quota = await getUserQuota(user.id);
  const rateLimit = await getRateLimitInfo(user.id);

  const stats: UsageStats = {
    tokensUsed: quota.tokensUsed,
    tokensRemaining: quota.dailyTokenLimit - quota.tokensUsed,
    dailyLimit: quota.dailyTokenLimit,
    requestsThisMinute: quota.requestsPerMinute - rateLimit.remaining,
    requestsPerMinuteLimit: quota.requestsPerMinute,
    periodStart: quota.periodStart,
    tier: quota.tier,
  };

  return new Response(JSON.stringify(stats), {
    headers: { "Content-Type": "application/json" },
  });
}
