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

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH: Update user quotas
export async function PATCH(req: Request, context: RouteContext) {
  const params = await context.params;
  const userId = params.id;

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

  const body = await req.json();
  const { dailyTokenLimit, requestsPerMinute, tier } = body;

  const serviceClient = await createServiceClient();

  // Check if user quota exists
  const { data: existing } = await serviceClient
    .from("user_quotas")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Update existing quota
    const { error } = await serviceClient
      .from("user_quotas")
      .update({
        daily_token_limit: dailyTokenLimit,
        requests_per_minute: requestsPerMinute,
        tier,
      })
      .eq("user_id", userId);

    if (error) {
      return new Response(JSON.stringify({ error: "Failed to update user quotas" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    // Create new quota record
    const { error } = await serviceClient.from("user_quotas").insert({
      user_id: userId,
      daily_token_limit: dailyTokenLimit,
      requests_per_minute: requestsPerMinute,
      tier,
    });

    if (error) {
      return new Response(JSON.stringify({ error: "Failed to create user quotas" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

// DELETE: Clear abuse flags for a user
export async function DELETE(req: Request, context: RouteContext) {
  const params = await context.params;
  const userId = params.id;

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

  // Delete all abuse flags for this user
  const { error } = await serviceClient.from("abuse_flags").delete().eq("user_id", userId);

  if (error) {
    return new Response(JSON.stringify({ error: "Failed to clear abuse flags" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
