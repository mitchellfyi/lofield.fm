import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRequestsPerMinuteLimit } from "../rate-limit";
import { DEFAULT_REQUESTS_PER_MINUTE } from "../types";

// Note: The async functions (checkRateLimit, recordRequest, etc.) require
// Supabase server client with Next.js cookies and cannot be unit tested.
// They should be tested via integration tests or e2e tests.

describe("rate-limit", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getRequestsPerMinuteLimit", () => {
    it("should return default when env var is not set", () => {
      delete process.env.REQUESTS_PER_MINUTE;
      expect(getRequestsPerMinuteLimit()).toBe(DEFAULT_REQUESTS_PER_MINUTE);
    });

    it("should return env value when set", () => {
      process.env.REQUESTS_PER_MINUTE = "50";
      expect(getRequestsPerMinuteLimit()).toBe(50);
    });

    it("should return default for invalid env value", () => {
      process.env.REQUESTS_PER_MINUTE = "not-a-number";
      expect(getRequestsPerMinuteLimit()).toBe(DEFAULT_REQUESTS_PER_MINUTE);
    });

    it("should return default for negative env value", () => {
      process.env.REQUESTS_PER_MINUTE = "-10";
      expect(getRequestsPerMinuteLimit()).toBe(DEFAULT_REQUESTS_PER_MINUTE);
    });

    it("should return default for zero env value", () => {
      process.env.REQUESTS_PER_MINUTE = "0";
      expect(getRequestsPerMinuteLimit()).toBe(DEFAULT_REQUESTS_PER_MINUTE);
    });

    it("should return default for empty string env value", () => {
      process.env.REQUESTS_PER_MINUTE = "";
      expect(getRequestsPerMinuteLimit()).toBe(DEFAULT_REQUESTS_PER_MINUTE);
    });

    it("should parse integer from float string", () => {
      process.env.REQUESTS_PER_MINUTE = "25.5";
      expect(getRequestsPerMinuteLimit()).toBe(25);
    });

    it("should handle large values", () => {
      process.env.REQUESTS_PER_MINUTE = "1000";
      expect(getRequestsPerMinuteLimit()).toBe(1000);
    });

    it("should handle whitespace around value", () => {
      process.env.REQUESTS_PER_MINUTE = "  30  ";
      // parseInt handles leading whitespace but not trailing
      expect(getRequestsPerMinuteLimit()).toBe(30);
    });
  });

  describe("DEFAULT_REQUESTS_PER_MINUTE", () => {
    it("should be 20", () => {
      expect(DEFAULT_REQUESTS_PER_MINUTE).toBe(20);
    });
  });
});
