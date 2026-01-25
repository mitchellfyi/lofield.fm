import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  }),
  key: vi.fn((index: number) => Object.keys(mockLocalStorage.store)[index] ?? null),
  get length() {
    return Object.keys(this.store).length;
  },
};

Object.defineProperty(global, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("localCache", () => {
  beforeEach(() => {
    vi.resetModules();
    mockLocalStorage.store = {};
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCache", () => {
    it("should return null for non-existent key", async () => {
      const { getCache } = await import("../localCache");
      const result = getCache("nonexistent");
      expect(result).toBeNull();
    });

    it("should return cached data for valid key", async () => {
      const { getCache, setCache } = await import("../localCache");
      const testData = { name: "test", value: 123 };
      setCache("test-key", testData);

      const result = getCache<typeof testData>("test-key");
      expect(result).toEqual(testData);
    });

    it("should return null for expired cache", async () => {
      const { getCache } = await import("../localCache");

      // Manually set an expired entry
      const expiredEntry = {
        data: { test: "value" },
        timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        ttl: 1000 * 60 * 60, // 1 hour TTL
      };
      mockLocalStorage.store["lofield_expired-key"] = JSON.stringify(expiredEntry);

      const result = getCache("expired-key");
      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("lofield_expired-key");
    });

    it("should return data for cache with no expiry (ttl = 0)", async () => {
      const { getCache } = await import("../localCache");

      // Set entry with no expiry
      const noExpiryEntry = {
        data: { test: "permanent" },
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 365, // 1 year ago
        ttl: 0, // No expiry
      };
      mockLocalStorage.store["lofield_no-expiry"] = JSON.stringify(noExpiryEntry);

      const result = getCache<{ test: string }>("no-expiry");
      expect(result).toEqual({ test: "permanent" });
    });

    it("should return null for invalid JSON", async () => {
      const { getCache } = await import("../localCache");
      mockLocalStorage.store["lofield_invalid"] = "not valid json";

      const result = getCache("invalid");
      expect(result).toBeNull();
    });

    it("should use correct prefix", async () => {
      const { getCache } = await import("../localCache");
      getCache("my-key");

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("lofield_my-key");
    });
  });

  describe("setCache", () => {
    it("should store data with correct structure", async () => {
      const { setCache } = await import("../localCache");
      const testData = { name: "test" };

      const result = setCache("set-test", testData);

      expect(result).toBe(true);
      const stored = JSON.parse(mockLocalStorage.store["lofield_set-test"]);
      expect(stored.data).toEqual(testData);
      expect(stored.timestamp).toBeGreaterThan(0);
      expect(stored.ttl).toBe(1000 * 60 * 60); // Default 1 hour TTL
    });

    it("should use custom TTL when provided", async () => {
      const { setCache } = await import("../localCache");
      const customTTL = 1000 * 60 * 30; // 30 minutes

      setCache("custom-ttl", { test: true }, customTTL);

      const stored = JSON.parse(mockLocalStorage.store["lofield_custom-ttl"]);
      expect(stored.ttl).toBe(customTTL);
    });

    it("should handle zero TTL (no expiry)", async () => {
      const { setCache } = await import("../localCache");

      setCache("no-expiry-set", { test: true }, 0);

      const stored = JSON.parse(mockLocalStorage.store["lofield_no-expiry-set"]);
      expect(stored.ttl).toBe(0);
    });

    it("should return false on localStorage error", async () => {
      const { setCache } = await import("../localCache");
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error("QuotaExceeded");
      });

      const result = setCache("error-test", { test: true });
      expect(result).toBe(false);
    });

    it("should overwrite existing cache", async () => {
      const { setCache, getCache } = await import("../localCache");

      setCache("overwrite", { version: 1 });
      setCache("overwrite", { version: 2 });

      const result = getCache<{ version: number }>("overwrite");
      expect(result?.version).toBe(2);
    });
  });

  describe("clearCache", () => {
    it("should remove cached item", async () => {
      const { setCache, clearCache, getCache } = await import("../localCache");

      setCache("to-clear", { data: "test" });
      expect(getCache("to-clear")).not.toBeNull();

      clearCache("to-clear");
      expect(getCache("to-clear")).toBeNull();
    });

    it("should not throw for non-existent key", async () => {
      const { clearCache } = await import("../localCache");

      expect(() => clearCache("nonexistent")).not.toThrow();
    });

    it("should use correct prefix", async () => {
      const { clearCache } = await import("../localCache");
      clearCache("clear-key");

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("lofield_clear-key");
    });
  });

  describe("clearAllCache", () => {
    it("should remove all lofield_ prefixed items", async () => {
      const { clearAllCache } = await import("../localCache");

      // Set up mixed localStorage
      mockLocalStorage.store = {
        lofield_cache1: "{}",
        lofield_cache2: "{}",
        other_key: "{}",
        not_lofield: "{}",
      };

      clearAllCache();

      expect(mockLocalStorage.store["lofield_cache1"]).toBeUndefined();
      expect(mockLocalStorage.store["lofield_cache2"]).toBeUndefined();
      expect(mockLocalStorage.store["other_key"]).toBe("{}");
      expect(mockLocalStorage.store["not_lofield"]).toBe("{}");
    });

    it("should handle empty localStorage", async () => {
      const { clearAllCache } = await import("../localCache");
      mockLocalStorage.store = {};

      expect(() => clearAllCache()).not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle complex nested objects", async () => {
      const { setCache, getCache } = await import("../localCache");
      const complexData = {
        array: [1, 2, { nested: true }],
        obj: { deep: { deeper: { value: "test" } } },
        null: null,
        number: 42.5,
        boolean: true,
      };

      setCache("complex", complexData);
      const result = getCache<typeof complexData>("complex");

      expect(result).toEqual(complexData);
    });

    it("should handle empty strings as values", async () => {
      const { setCache, getCache } = await import("../localCache");

      setCache("empty-string", "");
      const result = getCache<string>("empty-string");

      expect(result).toBe("");
    });

    it("should handle empty arrays", async () => {
      const { setCache, getCache } = await import("../localCache");

      setCache("empty-array", []);
      const result = getCache<unknown[]>("empty-array");

      expect(result).toEqual([]);
    });

    it("should handle special characters in keys", async () => {
      const { setCache, getCache } = await import("../localCache");
      const specialKey = "key-with-special_chars.and/slashes";
      const data = { test: true };

      setCache(specialKey, data);
      const result = getCache<typeof data>(specialKey);

      expect(result).toEqual(data);
    });
  });
});
