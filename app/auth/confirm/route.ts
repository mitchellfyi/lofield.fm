import { type EmailOtpType } from "@supabase/supabase-js";
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
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = validateRedirectPath(searchParams.get("next") ?? "/studio");

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/sign-in?error=verification_failed`);
}
