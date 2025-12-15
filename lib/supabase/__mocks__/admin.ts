import { createMockSupabaseAdmin } from "../../../tests/test-utils";

// Singleton mock instance
export const mockSupabaseAdmin = createMockSupabaseAdmin();

export function getServiceRoleClient() {
  return mockSupabaseAdmin;
}
