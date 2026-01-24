import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDefaultDailyTokenLimit } from "../quota";
import { DEFAULT_DAILY_TOKEN_LIMIT } from "../types";

// Note: The async functions (checkDailyQuota, recordTokenUsage, etc.) require
// Supabase server client with Next.js cookies and cannot be unit tested.
// They should be tested via integration tests or e2e tests.

describe("quota", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getDefaultDailyTokenLimit", () => {
    it("should return default when env var is not set", () => {
      delete process.env.DAILY_TOKEN_LIMIT;
      expect(getDefaultDailyTokenLimit()).toBe(DEFAULT_DAILY_TOKEN_LIMIT);
    });

    it("should return env value when set", () => {
      process.env.DAILY_TOKEN_LIMIT = "200000";
      expect(getDefaultDailyTokenLimit()).toBe(200000);
    });

    it("should return default for invalid env value", () => {
      process.env.DAILY_TOKEN_LIMIT = "not-a-number";
      expect(getDefaultDailyTokenLimit()).toBe(DEFAULT_DAILY_TOKEN_LIMIT);
    });

    it("should return default for negative env value", () => {
      process.env.DAILY_TOKEN_LIMIT = "-50000";
      expect(getDefaultDailyTokenLimit()).toBe(DEFAULT_DAILY_TOKEN_LIMIT);
    });

    it("should return default for zero env value", () => {
      process.env.DAILY_TOKEN_LIMIT = "0";
      expect(getDefaultDailyTokenLimit()).toBe(DEFAULT_DAILY_TOKEN_LIMIT);
    });

    it("should return default for empty string env value", () => {
      process.env.DAILY_TOKEN_LIMIT = "";
      expect(getDefaultDailyTokenLimit()).toBe(DEFAULT_DAILY_TOKEN_LIMIT);
    });

    it("should parse integer from float string", () => {
      process.env.DAILY_TOKEN_LIMIT = "150000.5";
      expect(getDefaultDailyTokenLimit()).toBe(150000);
    });

    it("should handle large values", () => {
      process.env.DAILY_TOKEN_LIMIT = "1000000";
      expect(getDefaultDailyTokenLimit()).toBe(1000000);
    });

    it("should handle whitespace around value", () => {
      process.env.DAILY_TOKEN_LIMIT = "  75000  ";
      expect(getDefaultDailyTokenLimit()).toBe(75000);
    });
  });

  describe("DEFAULT_DAILY_TOKEN_LIMIT", () => {
    it("should be 100000", () => {
      expect(DEFAULT_DAILY_TOKEN_LIMIT).toBe(100000);
    });
  });
});
