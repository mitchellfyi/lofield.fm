import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the crypto module for encryption tests
const originalEnv = { ...process.env };

// Mock Supabase client
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockUpsert = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

// Setup chain mocks
mockFrom.mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  upsert: mockUpsert,
});
mockSelect.mockReturnValue({ eq: mockEq });
mockDelete.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ single: mockSingle });
mockUpsert.mockResolvedValue({ error: null });

// Mock next/headers cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}));

// Mock Supabase SSR
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe("api-keys service", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockUpsert.mockClear();
    mockDelete.mockClear();
    mockEq.mockClear();
    mockSingle.mockClear();

    // Reset mock chains
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      upsert: mockUpsert,
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockUpsert.mockResolvedValue({ error: null });

    // Set up environment variables
    process.env.API_KEY_ENCRYPTION_SECRET = "test-encryption-secret-32-chars!!";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export encryptApiKey function", async () => {
      const apiKeysModule = await import("../api-keys");
      expect(apiKeysModule.encryptApiKey).toBeDefined();
      expect(typeof apiKeysModule.encryptApiKey).toBe("function");
    });

    it("should export decryptApiKey function", async () => {
      const apiKeysModule = await import("../api-keys");
      expect(apiKeysModule.decryptApiKey).toBeDefined();
      expect(typeof apiKeysModule.decryptApiKey).toBe("function");
    });

    it("should export extractLastFour function", async () => {
      const apiKeysModule = await import("../api-keys");
      expect(apiKeysModule.extractLastFour).toBeDefined();
      expect(typeof apiKeysModule.extractLastFour).toBe("function");
    });

    it("should export maskApiKey function", async () => {
      const apiKeysModule = await import("../api-keys");
      expect(apiKeysModule.maskApiKey).toBeDefined();
      expect(typeof apiKeysModule.maskApiKey).toBe("function");
    });

    it("should export getApiKeyInfo function", async () => {
      const apiKeysModule = await import("../api-keys");
      expect(apiKeysModule.getApiKeyInfo).toBeDefined();
      expect(typeof apiKeysModule.getApiKeyInfo).toBe("function");
    });

    it("should export getApiKey function", async () => {
      const apiKeysModule = await import("../api-keys");
      expect(apiKeysModule.getApiKey).toBeDefined();
      expect(typeof apiKeysModule.getApiKey).toBe("function");
    });

    it("should export setApiKey function", async () => {
      const apiKeysModule = await import("../api-keys");
      expect(apiKeysModule.setApiKey).toBeDefined();
      expect(typeof apiKeysModule.setApiKey).toBe("function");
    });

    it("should export deleteApiKey function", async () => {
      const apiKeysModule = await import("../api-keys");
      expect(apiKeysModule.deleteApiKey).toBeDefined();
      expect(typeof apiKeysModule.deleteApiKey).toBe("function");
    });

    it("should export hasApiKey function", async () => {
      const apiKeysModule = await import("../api-keys");
      expect(apiKeysModule.hasApiKey).toBeDefined();
      expect(typeof apiKeysModule.hasApiKey).toBe("function");
    });
  });

  describe("encryption functions", () => {
    it("encryptApiKey should produce encrypted output different from input", async () => {
      const apiKeysModule = await import("../api-keys");
      const plaintext = "sk-test-api-key-1234567890abcdef";
      const encrypted = apiKeysModule.encryptApiKey(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
    });

    it("decryptApiKey should reverse encryption", async () => {
      const apiKeysModule = await import("../api-keys");
      const plaintext = "sk-test-api-key-1234567890abcdef";
      const encrypted = apiKeysModule.encryptApiKey(plaintext);
      const decrypted = apiKeysModule.decryptApiKey(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should produce different encrypted values for same input (due to random IV)", async () => {
      const apiKeysModule = await import("../api-keys");
      const plaintext = "sk-test-api-key-1234567890abcdef";
      const encrypted1 = apiKeysModule.encryptApiKey(plaintext);
      const encrypted2 = apiKeysModule.encryptApiKey(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should throw error if encryption secret is not set", async () => {
      delete process.env.API_KEY_ENCRYPTION_SECRET;
      vi.resetModules();

      const apiKeysModule = await import("../api-keys");

      expect(() => apiKeysModule.encryptApiKey("test-key")).toThrow(
        "API_KEY_ENCRYPTION_SECRET environment variable is required"
      );
    });
  });

  describe("extractLastFour function", () => {
    it("should extract last 4 characters from API key", async () => {
      const apiKeysModule = await import("../api-keys");

      expect(apiKeysModule.extractLastFour("sk-test1234")).toBe("1234");
      expect(apiKeysModule.extractLastFour("sk-abcdefghijklmnop")).toBe("mnop");
      expect(apiKeysModule.extractLastFour("abcd")).toBe("abcd");
    });

    it("should handle short strings", async () => {
      const apiKeysModule = await import("../api-keys");

      expect(apiKeysModule.extractLastFour("abc")).toBe("abc");
      expect(apiKeysModule.extractLastFour("ab")).toBe("ab");
      expect(apiKeysModule.extractLastFour("a")).toBe("a");
      expect(apiKeysModule.extractLastFour("")).toBe("");
    });
  });

  describe("maskApiKey function", () => {
    it("should mask API key with sk-... prefix", async () => {
      const apiKeysModule = await import("../api-keys");

      expect(apiKeysModule.maskApiKey("1234")).toBe("sk-...1234");
      expect(apiKeysModule.maskApiKey("abcd")).toBe("sk-...abcd");
      expect(apiKeysModule.maskApiKey("WXYZ")).toBe("sk-...WXYZ");
    });
  });

  describe("getApiKeyInfo function", () => {
    it("should return key info when key exists", async () => {
      mockSingle.mockResolvedValue({
        data: { key_last_4: "1234" },
        error: null,
      });

      const apiKeysModule = await import("../api-keys");
      const result = await apiKeysModule.getApiKeyInfo("user-123");

      expect(result).toEqual({
        hasKey: true,
        keyLast4: "1234",
        maskedKey: "sk-...1234",
      });
    });

    it("should return no key when user has no API key", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      const apiKeysModule = await import("../api-keys");
      const result = await apiKeysModule.getApiKeyInfo("user-456");

      expect(result).toEqual({
        hasKey: false,
        keyLast4: null,
        maskedKey: null,
      });
    });

    it("should query the correct table and user", async () => {
      mockSingle.mockResolvedValue({
        data: { key_last_4: "5678" },
        error: null,
      });

      const apiKeysModule = await import("../api-keys");
      await apiKeysModule.getApiKeyInfo("user-789");

      expect(mockFrom).toHaveBeenCalledWith("api_keys");
      expect(mockSelect).toHaveBeenCalledWith("key_last_4");
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-789");
    });
  });

  describe("getApiKey function", () => {
    it("should return decrypted API key when it exists", async () => {
      const apiKeysModule = await import("../api-keys");
      const plainKey = "sk-test-decryption-key-12345";
      const encryptedKey = apiKeysModule.encryptApiKey(plainKey);

      mockSingle.mockResolvedValue({
        data: { encrypted_key: encryptedKey },
        error: null,
      });

      const result = await apiKeysModule.getApiKey("user-123");

      expect(result).toBe(plainKey);
    });

    it("should return null when user has no API key", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      const apiKeysModule = await import("../api-keys");
      const result = await apiKeysModule.getApiKey("user-456");

      expect(result).toBeNull();
    });

    it("should query encrypted_key column", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const apiKeysModule = await import("../api-keys");
      await apiKeysModule.getApiKey("user-789");

      expect(mockSelect).toHaveBeenCalledWith("encrypted_key");
    });
  });

  describe("setApiKey function", () => {
    it("should upsert encrypted key with last 4 chars", async () => {
      mockUpsert.mockResolvedValue({ error: null });

      const apiKeysModule = await import("../api-keys");
      const plainKey = "sk-test-key-abcd1234";

      await apiKeysModule.setApiKey("user-123", plainKey);

      expect(mockFrom).toHaveBeenCalledWith("api_keys");
      expect(mockUpsert).toHaveBeenCalled();

      const upsertCall = mockUpsert.mock.calls[0];
      expect(upsertCall[0].user_id).toBe("user-123");
      expect(upsertCall[0].key_last_4).toBe("1234");
      expect(upsertCall[0].encrypted_key).toBeDefined();
      expect(upsertCall[0].encrypted_key).not.toBe(plainKey);
      expect(upsertCall[1]).toEqual({ onConflict: "user_id" });
    });

    it("should throw error on database failure", async () => {
      mockUpsert.mockResolvedValue({
        error: { message: "Database connection failed" },
      });

      const apiKeysModule = await import("../api-keys");

      await expect(apiKeysModule.setApiKey("user-123", "sk-test")).rejects.toThrow(
        "Failed to save API key: Database connection failed"
      );
    });
  });

  describe("deleteApiKey function", () => {
    it("should delete API key for user", async () => {
      mockEq.mockResolvedValue({ error: null });

      const apiKeysModule = await import("../api-keys");
      await apiKeysModule.deleteApiKey("user-123");

      expect(mockFrom).toHaveBeenCalledWith("api_keys");
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-123");
    });

    it("should throw error on database failure", async () => {
      mockEq.mockResolvedValue({
        error: { message: "Delete failed" },
      });

      const apiKeysModule = await import("../api-keys");

      await expect(apiKeysModule.deleteApiKey("user-123")).rejects.toThrow(
        "Failed to delete API key: Delete failed"
      );
    });
  });

  describe("hasApiKey function", () => {
    it("should return true when user has API key", async () => {
      mockSingle.mockResolvedValue({
        data: { key_last_4: "1234" },
        error: null,
      });

      const apiKeysModule = await import("../api-keys");
      const result = await apiKeysModule.hasApiKey("user-123");

      expect(result).toBe(true);
    });

    it("should return false when user has no API key", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const apiKeysModule = await import("../api-keys");
      const result = await apiKeysModule.hasApiKey("user-456");

      expect(result).toBe(false);
    });
  });
});
