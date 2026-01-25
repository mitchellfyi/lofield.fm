/**
 * Playwright Global Setup
 *
 * Runs once before all tests to ensure clean test environment.
 */

import type { FullConfig } from "@playwright/test";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function globalSetup(_config: FullConfig) {
  // Log E2E mode activation
  console.log("\n🧪 E2E Test Mode Active");
  console.log("   - Supabase calls will use in-memory mock storage");
  console.log("   - No production data will be affected\n");

  // Note: The mock store in lib/supabase/mock.ts resets on server restart,
  // which happens when the dev server starts for E2E tests.
  // For additional test isolation, you could expose a reset endpoint.
}

export default globalSetup;
