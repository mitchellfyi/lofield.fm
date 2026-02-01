/**
 * Mock Supabase client for unit testing API routes
 *
 * Provides configurable mock responses for Supabase operations.
 * Unlike the E2E mock which maintains in-memory state, this mock
 * allows tests to specify exact responses for each operation.
 */

import { vi } from "vitest";

// Types for mock configuration
export interface MockUser {
  id: string;
  email: string;
  created_at?: string;
}

export interface MockAuthResponse {
  user: MockUser | null;
  error?: { message: string } | null;
}

export interface MockQueryResponse<T = Record<string, unknown>> {
  data: T | T[] | null;
  error?: { message: string; code?: string } | null;
  count?: number;
}

// Default mock user for authenticated tests
export const MOCK_USER: MockUser = {
  id: "test-user-00000000-0000-0000-0000-000000000001",
  email: "test@example.com",
  created_at: "2024-01-01T00:00:00Z",
};

// Mock admin user
export const MOCK_ADMIN_USER: MockUser = {
  id: "admin-user-00000000-0000-0000-0000-000000000002",
  email: "admin@lofield.fm",
  created_at: "2024-01-01T00:00:00Z",
};

/**
 * Configuration for mock query builder behavior
 */
interface MockQueryConfig {
  selectResponse?: MockQueryResponse;
  insertResponse?: MockQueryResponse;
  updateResponse?: MockQueryResponse;
  deleteResponse?: MockQueryResponse;
  singleResponse?: MockQueryResponse;
}

/**
 * Creates a chainable mock query builder
 */
function createMockQueryBuilder(config: MockQueryConfig = {}) {
  const builder: Record<string, unknown> = {};

  // Chain methods that return the builder
  const chainMethods = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "in",
    "is",
    "not",
    "contains",
    "containedBy",
    "overlaps",
    "textSearch",
    "match",
    "filter",
    "order",
    "limit",
    "range",
    "or",
    "and",
  ];

  chainMethods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder);
  });

  // Terminal methods that return responses
  builder.single = vi
    .fn()
    .mockResolvedValue(
      config.singleResponse ?? config.selectResponse ?? { data: null, error: null }
    );

  builder.maybeSingle = vi
    .fn()
    .mockResolvedValue(
      config.singleResponse ?? config.selectResponse ?? { data: null, error: null }
    );

  // Make the builder thenable for implicit await
  builder.then = vi.fn((resolve) => {
    const response = config.selectResponse ?? { data: [], error: null };
    return Promise.resolve(response).then(resolve);
  });

  return builder;
}

/**
 * Configuration for the mock Supabase client
 */
export interface MockSupabaseConfig {
  auth?: {
    user?: MockUser | null;
    error?: { message: string } | null;
  };
  tables?: Record<string, MockQueryConfig>;
}

/**
 * Create a mock Supabase client for unit testing
 *
 * @example
 * // Authenticated user with profile data
 * const mockClient = createMockSupabaseClient({
 *   auth: { user: MOCK_USER },
 *   tables: {
 *     profiles: {
 *       selectResponse: { data: { id: MOCK_USER.id, username: 'testuser' }, error: null }
 *     }
 *   }
 * });
 *
 * @example
 * // Unauthenticated
 * const mockClient = createMockSupabaseClient({
 *   auth: { user: null }
 * });
 */
export function createMockSupabaseClient(config: MockSupabaseConfig = {}) {
  const tableConfigs = config.tables ?? {};

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: config.auth?.user ?? null },
        error: config.auth?.error ?? null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: config.auth?.user
            ? { user: config.auth.user, access_token: "mock-token" }
            : null,
        },
        error: config.auth?.error ?? null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn((tableName: string) => {
      const tableConfig = tableConfigs[tableName] ?? {};
      return createMockQueryBuilder(tableConfig);
    }),
  };
}

/**
 * Helper to create a mock client that returns auth error
 */
export function createAuthErrorClient(errorMessage = "Invalid token") {
  return createMockSupabaseClient({
    auth: {
      user: null,
      error: { message: errorMessage },
    },
  });
}

/**
 * Helper to create a mock client for authenticated user
 */
export function createAuthenticatedClient(
  user: MockUser = MOCK_USER,
  tables: Record<string, MockQueryConfig> = {}
) {
  return createMockSupabaseClient({
    auth: { user },
    tables,
  });
}

/**
 * Helper to create a mock client for unauthenticated requests
 */
export function createUnauthenticatedClient() {
  return createMockSupabaseClient({
    auth: { user: null },
  });
}

/**
 * Helper to create a mock client for admin user
 */
export function createAdminClient(tables: Record<string, MockQueryConfig> = {}) {
  return createMockSupabaseClient({
    auth: { user: MOCK_ADMIN_USER },
    tables,
  });
}

/**
 * Type for the mock client
 */
export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;
