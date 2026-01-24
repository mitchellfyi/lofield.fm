import { describe, it, expect } from "vitest";
import {
  DEFAULT_DAILY_TOKEN_LIMIT,
  DEFAULT_REQUESTS_PER_MINUTE,
  DEFAULT_MAX_TOKENS_PER_REQUEST,
  ENV_DAILY_TOKEN_LIMIT,
  ENV_REQUESTS_PER_MINUTE,
  ENV_MAX_TOKENS_PER_REQUEST,
  type RateLimitResult,
  type QuotaResult,
  type UserQuota,
  type UsageStats,
  type RateLimitHeaders,
} from "../types";

describe("usage types", () => {
  describe("default constants", () => {
    it("should have correct default daily token limit", () => {
      expect(DEFAULT_DAILY_TOKEN_LIMIT).toBe(100000);
    });

    it("should have correct default requests per minute", () => {
      expect(DEFAULT_REQUESTS_PER_MINUTE).toBe(20);
    });

    it("should have correct default max tokens per request", () => {
      expect(DEFAULT_MAX_TOKENS_PER_REQUEST).toBe(4000);
    });
  });

  describe("environment variable names", () => {
    it("should have correct env var name for daily token limit", () => {
      expect(ENV_DAILY_TOKEN_LIMIT).toBe("DAILY_TOKEN_LIMIT");
    });

    it("should have correct env var name for requests per minute", () => {
      expect(ENV_REQUESTS_PER_MINUTE).toBe("REQUESTS_PER_MINUTE");
    });

    it("should have correct env var name for max tokens per request", () => {
      expect(ENV_MAX_TOKENS_PER_REQUEST).toBe("MAX_TOKENS_PER_REQUEST");
    });
  });

  describe("RateLimitResult type", () => {
    it("should have correct structure when allowed", () => {
      const result: RateLimitResult = {
        allowed: true,
        remaining: 15,
        limit: 20,
        resetAt: new Date("2024-01-15T10:01:00Z"),
      };

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(15);
      expect(result.limit).toBe(20);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it("should have correct structure when denied", () => {
      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        limit: 20,
        resetAt: new Date("2024-01-15T10:01:00Z"),
      };

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("QuotaResult type", () => {
    it("should have correct structure when under quota", () => {
      const result: QuotaResult = {
        allowed: true,
        tokensUsed: 50000,
        tokensRemaining: 50000,
        dailyLimit: 100000,
        periodStart: new Date("2024-01-15T00:00:00Z"),
      };

      expect(result.allowed).toBe(true);
      expect(result.tokensUsed).toBe(50000);
      expect(result.tokensRemaining).toBe(50000);
      expect(result.dailyLimit).toBe(100000);
      expect(result.periodStart).toBeInstanceOf(Date);
    });

    it("should have correct structure when over quota", () => {
      const result: QuotaResult = {
        allowed: false,
        tokensUsed: 100000,
        tokensRemaining: 0,
        dailyLimit: 100000,
        periodStart: new Date("2024-01-15T00:00:00Z"),
      };

      expect(result.allowed).toBe(false);
      expect(result.tokensRemaining).toBe(0);
    });
  });

  describe("UserQuota type", () => {
    it("should have correct structure", () => {
      const quota: UserQuota = {
        userId: "user-123",
        dailyTokenLimit: 100000,
        requestsPerMinute: 20,
        tier: "free",
        tokensUsed: 25000,
        requestsCount: 50,
        periodStart: new Date("2024-01-15T00:00:00Z"),
      };

      expect(quota.userId).toBe("user-123");
      expect(quota.dailyTokenLimit).toBe(100000);
      expect(quota.requestsPerMinute).toBe(20);
      expect(quota.tier).toBe("free");
      expect(quota.tokensUsed).toBe(25000);
      expect(quota.requestsCount).toBe(50);
      expect(quota.periodStart).toBeInstanceOf(Date);
    });

    it("should support different tiers", () => {
      const freeTier: UserQuota = {
        userId: "user-1",
        dailyTokenLimit: 100000,
        requestsPerMinute: 20,
        tier: "free",
        tokensUsed: 0,
        requestsCount: 0,
        periodStart: new Date(),
      };

      const proTier: UserQuota = {
        userId: "user-2",
        dailyTokenLimit: 500000,
        requestsPerMinute: 100,
        tier: "pro",
        tokensUsed: 0,
        requestsCount: 0,
        periodStart: new Date(),
      };

      expect(freeTier.tier).toBe("free");
      expect(proTier.tier).toBe("pro");
      expect(proTier.dailyTokenLimit).toBeGreaterThan(freeTier.dailyTokenLimit);
    });
  });

  describe("UsageStats type", () => {
    it("should have correct structure", () => {
      const stats: UsageStats = {
        tokensUsed: 30000,
        tokensRemaining: 70000,
        dailyLimit: 100000,
        requestsThisMinute: 5,
        requestsPerMinuteLimit: 20,
        periodStart: new Date("2024-01-15T00:00:00Z"),
        tier: "free",
      };

      expect(stats.tokensUsed).toBe(30000);
      expect(stats.tokensRemaining).toBe(70000);
      expect(stats.dailyLimit).toBe(100000);
      expect(stats.requestsThisMinute).toBe(5);
      expect(stats.requestsPerMinuteLimit).toBe(20);
      expect(stats.tier).toBe("free");
      expect(stats.periodStart).toBeInstanceOf(Date);
    });
  });

  describe("RateLimitHeaders type", () => {
    it("should have correct header names", () => {
      const headers: RateLimitHeaders = {
        "X-RateLimit-Limit": "20",
        "X-RateLimit-Remaining": "15",
        "X-RateLimit-Reset": "1705315260",
        "X-Quota-Used": "50000",
        "X-Quota-Remaining": "50000",
      };

      expect(headers["X-RateLimit-Limit"]).toBe("20");
      expect(headers["X-RateLimit-Remaining"]).toBe("15");
      expect(headers["X-RateLimit-Reset"]).toBeDefined();
      expect(headers["X-Quota-Used"]).toBe("50000");
      expect(headers["X-Quota-Remaining"]).toBe("50000");
    });
  });
});
