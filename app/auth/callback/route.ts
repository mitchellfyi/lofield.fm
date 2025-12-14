import { getServiceRoleClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

async function ensureUserProvisioned(userId: string) {
  const supabaseAdmin = getServiceRoleClient();

  // Ensure profiles row exists (upsert with id only, defaults apply)
  await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id" });

  // Ensure user_settings row exists (upsert with user_id, defaults apply)
  await supabaseAdmin
    .from("user_settings")
    .upsert({ user_id: userId }, { onConflict: "user_id" });

  // Ensure user_secrets row exists (empty, upsert with user_id)
  await supabaseAdmin
    .from("user_secrets")
    .upsert({ user_id: userId }, { onConflict: "user_id" });
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect") ?? "/app";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Provision user rows on first login
      await ensureUserProvisioned(data.session.user.id);
    }
  }

  // Redirect to the app or specified redirect path
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
