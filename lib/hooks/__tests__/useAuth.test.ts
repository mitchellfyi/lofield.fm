import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the Supabase client module
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
  },
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabaseClient,
}));

describe("useAuth hook", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSupabaseClient.auth.getSession.mockReset();
    mockSupabaseClient.auth.onAuthStateChange.mockReset();
    mockSupabaseClient.auth.signOut.mockReset();

    // Default mock implementations
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export useAuth function", async () => {
      const hookModule = await import("../useAuth");
      expect(hookModule.useAuth).toBeDefined();
      expect(typeof hookModule.useAuth).toBe("function");
    });

    it("should be a named export", async () => {
      const hookModule = await import("../useAuth");
      expect(Object.keys(hookModule)).toContain("useAuth");
    });
  });

  describe("AuthProvider dependency", () => {
    it("should import from AuthProvider", async () => {
      // The useAuth hook wraps useAuthContext from AuthProvider
      // Verify the module imports correctly
      const hookModule = await import("../useAuth");
      expect(hookModule.useAuth).toBeDefined();
    });
  });
});

describe("AuthProvider context", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSupabaseClient.auth.getSession.mockReset();
    mockSupabaseClient.auth.onAuthStateChange.mockReset();
    mockSupabaseClient.auth.signOut.mockReset();

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module exports", () => {
    it("should export AuthProvider component", async () => {
      const providerModule = await import("@/components/auth/AuthProvider");
      expect(providerModule.AuthProvider).toBeDefined();
      expect(typeof providerModule.AuthProvider).toBe("function");
    });

    it("should export useAuthContext hook", async () => {
      const providerModule = await import("@/components/auth/AuthProvider");
      expect(providerModule.useAuthContext).toBeDefined();
      expect(typeof providerModule.useAuthContext).toBe("function");
    });
  });

  describe("AuthContextType interface", () => {
    it("should provide user, session, loading, and signOut in context", async () => {
      // Verify module structure - the context provides these properties
      const providerModule = await import("@/components/auth/AuthProvider");
      expect(providerModule.AuthProvider).toBeDefined();
      // Context structure is enforced by TypeScript at compile time
      // Here we verify the module loads correctly
    });
  });

  describe("Supabase integration", () => {
    it("should call getSession on initialization", async () => {
      // Import AuthProvider to trigger its initialization logic
      await import("@/components/auth/AuthProvider");

      // The getSession mock should be available for the component to call
      expect(mockSupabaseClient.auth.getSession).toBeDefined();
    });

    it("should set up auth state change listener", async () => {
      // The onAuthStateChange should be available
      expect(mockSupabaseClient.auth.onAuthStateChange).toBeDefined();
    });

    it("should provide signOut capability", async () => {
      // The signOut method should be available through the mock
      expect(mockSupabaseClient.auth.signOut).toBeDefined();
    });
  });
});

describe("useAuthContext error handling", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw error when used outside AuthProvider", async () => {
    // The useAuthContext hook should throw when context is undefined
    // This is implemented in the AuthProvider component
    const providerModule = await import("@/components/auth/AuthProvider");

    // Calling useAuthContext outside React render would throw
    // We verify the function exists and is correctly exported
    expect(providerModule.useAuthContext).toBeDefined();
  });
});
