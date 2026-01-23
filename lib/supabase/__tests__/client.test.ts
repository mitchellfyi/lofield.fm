import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @supabase/ssr before importing the module under test
const mockCreateBrowserClient = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: mockCreateBrowserClient,
}));

describe("Supabase Browser Client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    mockCreateBrowserClient.mockReset();
    // Set up test environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test-project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key-123",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("createClient", () => {
    it("should create a browser client with correct environment variables", async () => {
      const mockClient = { auth: { getSession: vi.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient);

      const { createClient } = await import("../client");
      const client = createClient();

      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        "https://test-project.supabase.co",
        "test-anon-key-123"
      );
      expect(client).toBe(mockClient);
    });

    it("should call createBrowserClient from @supabase/ssr", async () => {
      mockCreateBrowserClient.mockReturnValue({});

      const { createClient } = await import("../client");
      createClient();

      expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
    });

    it("should pass URL and anon key to createBrowserClient", async () => {
      mockCreateBrowserClient.mockReturnValue({});

      const { createClient } = await import("../client");
      createClient();

      const [url, key] = mockCreateBrowserClient.mock.calls[0];
      expect(url).toBe("https://test-project.supabase.co");
      expect(key).toBe("test-anon-key-123");
    });

    it("should return a new client instance on each call", async () => {
      const mockClient1 = { id: 1 };
      const mockClient2 = { id: 2 };
      mockCreateBrowserClient.mockReturnValueOnce(mockClient1).mockReturnValueOnce(mockClient2);

      const { createClient } = await import("../client");
      const client1 = createClient();
      const client2 = createClient();

      expect(client1).toBe(mockClient1);
      expect(client2).toBe(mockClient2);
      expect(mockCreateBrowserClient).toHaveBeenCalledTimes(2);
    });
  });

  describe("module structure", () => {
    it("should export createClient function", async () => {
      mockCreateBrowserClient.mockReturnValue({});
      const clientModule = await import("../client");
      expect(clientModule.createClient).toBeDefined();
      expect(typeof clientModule.createClient).toBe("function");
    });

    it("should be a named export", async () => {
      mockCreateBrowserClient.mockReturnValue({});
      const clientModule = await import("../client");
      expect(Object.keys(clientModule)).toContain("createClient");
    });
  });
});
