import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createMockClient } from "./mock";

/**
 * Check if we're running in E2E test mode
 */
function isE2EMode(): boolean {
  return process.env.NEXT_PUBLIC_E2E === "1";
}

/**
 * Create a Supabase client for browser-side operations
 *
 * In E2E mode (NEXT_PUBLIC_E2E=1), returns a mock client that uses
 * in-memory storage to prevent E2E tests from affecting production data.
 */
export function createClient(): SupabaseClient {
  // In E2E mode, use mock client to prevent production data access
  if (isE2EMode()) {
    return createMockClient() as unknown as SupabaseClient;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
