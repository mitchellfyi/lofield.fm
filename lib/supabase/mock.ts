/**
 * Mock Supabase client for E2E testing
 *
 * Returns predictable data without touching any real database.
 * Used when NEXT_PUBLIC_E2E=1 to ensure E2E tests never affect production.
 *
 * This mock is designed to prevent production data access during E2E tests.
 * It returns empty/default values for most operations since E2E tests focus
 * on UI behavior, not database integration.
 */

// Mock user for E2E tests
export const MOCK_E2E_USER = {
  id: "e2e-test-user-00000000-0000-0000-0000-000000000000",
  email: "e2e-test@lofield.fm",
  created_at: new Date().toISOString(),
};

// In-memory store for E2E test data (reset on server restart)
const e2eStore = {
  projects: new Map<string, Record<string, unknown>>(),
  tracks: new Map<string, Record<string, unknown>>(),
  revisions: new Map<string, Record<string, unknown>>(),
  apiKeys: new Map<string, Record<string, unknown>>(),
  profiles: new Map<string, Record<string, unknown>>(),
  userUsage: new Map<string, Record<string, unknown>>(),
  userQuotas: new Map<string, Record<string, unknown>>(),
  abuseFlags: new Map<string, Record<string, unknown>>(),
  requestLog: new Map<string, Record<string, unknown>>(),
};

// Reset store (called from global setup if needed)
export function resetE2EStore() {
  Object.values(e2eStore).forEach((store) => store.clear());
}

/**
 * Creates a chainable mock query builder that mimics Supabase's query interface.
 * All operations are no-ops that return empty/default values.
 */
function createMockQueryBuilder(_tableName: string, store: Map<string, Record<string, unknown>>) {
  let pendingInsert: Record<string, unknown> | Record<string, unknown>[] | null = null;
  let pendingUpdate: Record<string, unknown> | null = null;
  let isDelete = false;
  let selectOptions: { count?: "exact"; head?: boolean } | null = null;
  const filters: Array<{
    column: string;
    value: unknown;
    op: "eq" | "neq" | "gte" | "gt" | "lte" | "lt" | "in";
  }> = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: (_columns?: string, options?: { count?: "exact"; head?: boolean }) => {
      // columns parameter is accepted for API compatibility but not used in mock
      selectOptions = options || null;
      return builder;
    },
    insert: (data: Record<string, unknown> | Record<string, unknown>[]) => {
      pendingInsert = data;
      return builder;
    },
    upsert: (data: Record<string, unknown> | Record<string, unknown>[]) => {
      pendingInsert = data;
      return builder;
    },
    update: (data: Record<string, unknown>) => {
      pendingUpdate = data;
      return builder;
    },
    delete: () => {
      isDelete = true;
      return builder;
    },
    eq: (column: string, value: unknown) => {
      filters.push({ column, value, op: "eq" });
      return builder;
    },
    neq: (column: string, value: unknown) => {
      filters.push({ column, value, op: "neq" });
      return builder;
    },
    gte: (column: string, value: unknown) => {
      filters.push({ column, value, op: "gte" });
      return builder;
    },
    gt: (column: string, value: unknown) => {
      filters.push({ column, value, op: "gt" });
      return builder;
    },
    lte: (column: string, value: unknown) => {
      filters.push({ column, value, op: "lte" });
      return builder;
    },
    lt: (column: string, value: unknown) => {
      filters.push({ column, value, op: "lt" });
      return builder;
    },
    in: (column: string, values: unknown[]) => {
      filters.push({ column, value: values, op: "in" });
      return builder;
    },
    order: () => builder,
    limit: () => builder,
    range: () => builder,

    single: async () => {
      // Handle insert
      if (pendingInsert) {
        const data = Array.isArray(pendingInsert) ? pendingInsert[0] : pendingInsert;
        const id = (data.id as string) || crypto.randomUUID();
        const record = {
          ...data,
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        store.set(id, record);
        return { data: record, error: null };
      }

      // Handle update
      if (pendingUpdate && filters.length > 0) {
        const idFilter = filters.find((f) => f.column === "id" && f.op === "eq");
        const userIdFilter = filters.find((f) => f.column === "user_id" && f.op === "eq");
        const filterToUse = idFilter || userIdFilter;

        if (filterToUse) {
          const existing = store.get(filterToUse.value as string);
          if (existing) {
            const updated = {
              ...existing,
              ...pendingUpdate,
              updated_at: new Date().toISOString(),
            };
            store.set(filterToUse.value as string, updated);
            return { data: updated, error: null };
          }
        }
      }

      // Handle select - find matching record
      for (const [, record] of store) {
        if (matchesFilters(record, filters)) {
          return { data: record, error: null };
        }
      }

      return { data: null, error: null };
    },

    maybeSingle: async () => {
      return builder.single();
    },

    // Make the builder thenable for implicit await
    then: async <T>(
      resolve: (value: { data: Record<string, unknown>[] | null; error: null; count?: number }) => T
    ): Promise<T> => {
      // Handle count queries
      if (selectOptions?.count === "exact" && selectOptions?.head) {
        const matchingCount = [...store.values()].filter((r) => matchesFilters(r, filters)).length;
        return resolve({ data: null, error: null, count: matchingCount });
      }

      // Handle delete
      if (isDelete) {
        const toDelete: string[] = [];
        for (const [id, record] of store) {
          if (matchesFilters(record, filters)) {
            toDelete.push(id);
          }
        }
        toDelete.forEach((id) => store.delete(id));
        return resolve({ data: [], error: null });
      }

      // Handle insert
      if (pendingInsert) {
        const items = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
        const results: Record<string, unknown>[] = [];
        for (const data of items) {
          const id = (data.id as string) || crypto.randomUUID();
          const record = {
            ...data,
            id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          store.set(id, record);
          results.push(record);
        }
        return resolve({ data: results, error: null });
      }

      // Handle update
      if (pendingUpdate) {
        const results: Record<string, unknown>[] = [];
        for (const [id, record] of store) {
          if (matchesFilters(record, filters)) {
            const updated = {
              ...record,
              ...pendingUpdate,
              updated_at: new Date().toISOString(),
            };
            store.set(id, updated);
            results.push(updated);
          }
        }
        return resolve({ data: results, error: null });
      }

      // Handle select - return all matching records
      const results: Record<string, unknown>[] = [];
      for (const [, record] of store) {
        if (matchesFilters(record, filters)) {
          results.push(record);
        }
      }
      return resolve({ data: results, error: null });
    },
  };

  return builder;
}

/**
 * Check if a record matches all filters
 */
function matchesFilters(
  record: Record<string, unknown>,
  filters: Array<{ column: string; value: unknown; op: string }>
): boolean {
  for (const filter of filters) {
    const recordValue = record[filter.column];

    switch (filter.op) {
      case "eq":
        if (recordValue !== filter.value) return false;
        break;
      case "neq":
        if (recordValue === filter.value) return false;
        break;
      case "gte":
        if (recordValue === undefined || recordValue === null) return false;
        if (String(recordValue) < String(filter.value)) return false;
        break;
      case "gt":
        if (recordValue === undefined || recordValue === null) return false;
        if (String(recordValue) <= String(filter.value)) return false;
        break;
      case "lte":
        if (recordValue === undefined || recordValue === null) return false;
        if (String(recordValue) > String(filter.value)) return false;
        break;
      case "lt":
        if (recordValue === undefined || recordValue === null) return false;
        if (String(recordValue) >= String(filter.value)) return false;
        break;
      case "in":
        if (!Array.isArray(filter.value)) return false;
        if (!filter.value.includes(recordValue)) return false;
        break;
    }
  }
  return true;
}

/**
 * Get the store for a given table name
 */
function getStoreForTable(table: string): Map<string, Record<string, unknown>> {
  switch (table) {
    case "projects":
      return e2eStore.projects;
    case "tracks":
      return e2eStore.tracks;
    case "revisions":
      return e2eStore.revisions;
    case "api_keys":
      return e2eStore.apiKeys;
    case "profiles":
      return e2eStore.profiles;
    case "user_usage":
      return e2eStore.userUsage;
    case "user_quotas":
      return e2eStore.userQuotas;
    case "abuse_flags":
      return e2eStore.abuseFlags;
    case "request_log":
      return e2eStore.requestLog;
    default:
      // Return empty store for unknown tables
      return new Map();
  }
}

/**
 * Create a mock Supabase client for E2E testing
 */
export function createMockClient() {
  return {
    auth: {
      getUser: async () => ({
        data: { user: MOCK_E2E_USER },
        error: null,
      }),
      getSession: async () => ({
        data: {
          session: {
            user: MOCK_E2E_USER,
            access_token: "mock-access-token",
          },
        },
        error: null,
      }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({
        data: {
          user: MOCK_E2E_USER,
          session: { user: MOCK_E2E_USER, access_token: "mock-access-token" },
        },
        error: null,
      }),
      signUp: async () => ({
        data: { user: MOCK_E2E_USER, session: null },
        error: null,
      }),
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
      updateUser: async () => ({ data: { user: MOCK_E2E_USER }, error: null }),
      // Subscribe to auth state changes - returns unsubscribe function
      onAuthStateChange: (
        callback: (event: string, session: { user: typeof MOCK_E2E_USER } | null) => void
      ) => {
        // Immediately call callback with mock session (simulates initial auth check)
        setTimeout(() => {
          callback("SIGNED_IN", { user: MOCK_E2E_USER });
        }, 0);
        // Return subscription object with unsubscribe method
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        };
      },
    },
    from: (table: string) => {
      const store = getStoreForTable(table);
      return createMockQueryBuilder(table, store);
    },
  };
}
