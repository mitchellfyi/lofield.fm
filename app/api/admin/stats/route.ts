import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isAdmin } from "@/lib/admin";

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

  const flaggedUsers = new Set(flaggedData?.map((f) => f.user_id) ?? []).size;

  return new Response(
    JSON.stringify({
      totalUsers: totalUsers ?? 0,
      activeToday: activeToday ?? 0,
      flaggedUsers,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
