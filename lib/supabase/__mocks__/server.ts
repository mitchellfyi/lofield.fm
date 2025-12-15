import { createMockSupabaseClient } from "../../../tests/test-utils";

// Singleton mock instance
export const mockSupabase = createMockSupabaseClient();

export const createServerSupabaseClient = async () => mockSupabase;
