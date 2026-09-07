import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authRedirect } from "@/lib/supabase/auth-redirect";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/studio";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(authRedirect(request, next));
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(authRedirect(request, "/auth/sign-in?error=auth_error"));
}
