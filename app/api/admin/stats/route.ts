import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdmin } from "@/lib/admin";

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

  // Check admin access
  if (!isAdmin(user.email)) {
    return new Response("Forbidden", { status: 403 });
  }

  // Get stats using service client (bypasses RLS)
  const serviceClient = await createServiceClient();

  // Get total users
  const { count: totalUsers } = await serviceClient
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Get users active today
  const today = new Date();
  const startOfDay = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  const { count: activeToday } = await serviceClient
    .from("user_usage")
    .select("*", { count: "exact", head: true })
    .gte("period_start", startOfDay.toISOString());

  // Get flagged users (users with any abuse flags meeting threshold)
  const { data: flaggedData } = await serviceClient
    .from("abuse_flags")
    .select("user_id")
    .gte("count", 3);

  const flaggedUsers = new Set(flaggedData?.map((f: { user_id: string }) => f.user_id) ?? []).size;

  return new Response(
    JSON.stringify({
      totalUsers: totalUsers ?? 0,
      activeToday: activeToday ?? 0,
      flaggedUsers,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
