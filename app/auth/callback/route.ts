import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Validate redirect path to prevent open redirect attacks.
 * Only allows relative paths starting with / that don't contain protocol markers.
 */
function validateRedirectPath(path: string): string {
  // Default fallback
  const fallback = "/studio";

  // Must start with / and not contain protocol markers
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return fallback;
  }

  return path;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = validateRedirectPath(searchParams.get("next") ?? "/studio");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_error`);
}
