import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isAdmin } from "@/lib/admin";
import { DEFAULT_DAILY_TOKEN_LIMIT, DEFAULT_REQUESTS_PER_MINUTE } from "@/lib/usage";

export const runtime = "nodejs";

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

  const serviceClient = await createServiceClient();

  // Get all profiles with usage and quota data
  const { data: profiles, error: profilesError } = await serviceClient
    .from("profiles")
    .select("id, email, display_name, created_at")
    .order("created_at", { ascending: false });

  if (profilesError) {
    return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get usage data for all users
  const { data: usageData } = await serviceClient
    .from("user_usage")
    .select("user_id, tokens_used");

  // Get quota data for all users
  const { data: quotaData } = await serviceClient
    .from("user_quotas")
    .select("user_id, daily_token_limit, requests_per_minute, tier");

  // Get abuse flags count per user
  const { data: flagsData } = await serviceClient
    .from("abuse_flags")
    .select("user_id, count");

  // Create lookup maps
  const usageMap = new Map(usageData?.map((u) => [u.user_id, u]) ?? []);
  const quotaMap = new Map(quotaData?.map((q) => [q.user_id, q]) ?? []);

  // Sum up flags per user
  const flagsCountMap = new Map<string, number>();
  flagsData?.forEach((f) => {
    const current = flagsCountMap.get(f.user_id) ?? 0;
    flagsCountMap.set(f.user_id, current + f.count);
  });

  // Combine data
  const users = profiles.map((p) => {
    const usage = usageMap.get(p.id);
    const quota = quotaMap.get(p.id);
    return {
      id: p.id,
      email: p.email,
      displayName: p.display_name,
      tokensUsed: usage?.tokens_used ?? 0,
      dailyTokenLimit: quota?.daily_token_limit ?? DEFAULT_DAILY_TOKEN_LIMIT,
      requestsPerMinute: quota?.requests_per_minute ?? DEFAULT_REQUESTS_PER_MINUTE,
      tier: quota?.tier ?? "free",
      abuseFlags: flagsCountMap.get(p.id) ?? 0,
      createdAt: p.created_at,
    };
  });

  return new Response(JSON.stringify({ users }), {
    headers: { "Content-Type": "application/json" },
  });
}
