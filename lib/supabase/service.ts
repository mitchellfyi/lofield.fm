/**
 * Service client for Supabase with admin/service role privileges
 *
 * Use this for operations that need to bypass RLS or access admin features.
 * In E2E mode (NEXT_PUBLIC_E2E=1), returns a mock client to prevent
 * production data access.
 */

import { createClient } from "@supabase/supabase-js";
import { createMockClient } from "./mock";
import { supabaseUrl } from "./url";

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

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");

  return createClient(supabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
