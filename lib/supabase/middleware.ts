import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createMockClient, MOCK_E2E_USER } from "./mock";

/**
 * Check if we're running in E2E test mode
 */
function isE2EMode(): boolean {
  return process.env.NEXT_PUBLIC_E2E === "1";
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // In E2E mode, use mock client and user to prevent production data access
  if (isE2EMode()) {
    const supabase = createMockClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { supabaseResponse, user: user || MOCK_E2E_USER };
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
