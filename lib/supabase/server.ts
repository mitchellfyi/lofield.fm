import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createMockClient } from "./mock";
import { supabaseUrl } from "./url";

/**
 * Check if we're running in E2E test mode
 */
function isE2EMode(): boolean {
  return process.env.NEXT_PUBLIC_E2E === "1";
}

/**
 * Create a Supabase client for server-side operations
 *
 * In E2E mode (NEXT_PUBLIC_E2E=1), returns a mock client that uses
 * in-memory storage to prevent E2E tests from affecting production data.
 */
export async function createClient(): Promise<SupabaseClient> {
  // In E2E mode, use mock client to prevent production data access
  if (isE2EMode()) {
    return createMockClient() as unknown as SupabaseClient;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
