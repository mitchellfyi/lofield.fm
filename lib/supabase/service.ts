/**
 * Service client for Supabase with admin/service role privileges
 *
 * Use this for operations that need to bypass RLS or access admin features.
 * In E2E mode (NEXT_PUBLIC_E2E=1), returns a mock client to prevent
 * production data access.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createMockClient } from "./mock";

/**
 * Check if we're running in E2E test mode
 */
function isE2EMode(): boolean {
  return process.env.NEXT_PUBLIC_E2E === "1";
}

/**
 * Create a Supabase client with service role privileges
 *
 * In E2E mode, returns a mock client to prevent production data access.
 */
export async function createServiceClient() {
  // In E2E mode, use mock client to prevent production data access
  if (isE2EMode()) {
    return createMockClient();
  }

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
