import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  estimateTokens,
  estimateRequestTokens,
  getMaxTokensPerRequest,
  isRequestWithinTokenLimit,
} from "../tokens";
import { DEFAULT_MAX_TOKENS_PER_REQUEST } from "../types";

describe("tokens", () => {
  describe("estimateTokens", () => {
    it("should return 0 for empty string", () => {
      expect(estimateTokens("")).toBe(0);
    });

    it("should return 0 for null/undefined", () => {
      expect(estimateTokens(null as unknown as string)).toBe(0);
      expect(estimateTokens(undefined as unknown as string)).toBe(0);
    });

    it("should estimate ~4 characters per token", () => {
      // 8 characters = 2 tokens
      expect(estimateTokens("12345678")).toBe(2);

      // 4 characters = 1 token
      expect(estimateTokens("1234")).toBe(1);

      // 5 characters = 2 tokens (ceil)
      expect(estimateTokens("12345")).toBe(2);
    });

    it("should handle longer text", () => {
      // 100 characters = 25 tokens
      const text = "a".repeat(100);
      expect(estimateTokens(text)).toBe(25);
    });

    it("should handle text with special characters", () => {
      // Special characters still count as characters
      const text = "Hello! 👋 World 🌍";
      expect(estimateTokens(text)).toBeGreaterThan(0);
    });

    it("should handle whitespace", () => {
      // Whitespace counts as characters
      const text = "    "; // 4 spaces
      expect(estimateTokens(text)).toBe(1);
    });

    it("should handle newlines", () => {
      const text = "line1\nline2\nline3";
      expect(estimateTokens(text)).toBeGreaterThan(0);
    });
  });

  describe("estimateRequestTokens", () => {
    it("should return 0 for empty messages and no system prompt", () => {
      expect(estimateRequestTokens([])).toBe(0);
    });

    it("should include system prompt tokens", () => {
      const systemPrompt = "You are a helpful assistant."; // 28 chars = 7 tokens
      const result = estimateRequestTokens([], systemPrompt);
      expect(result).toBe(7);
    });

    it("should count message content tokens", () => {
      const messages = [{ role: "user", content: "12345678" }]; // 8 chars = 2 tokens + 4 overhead
      const result = estimateRequestTokens(messages);
      expect(result).toBe(6); // 2 content + 4 overhead
    });

    it("should add 4 tokens overhead per message", () => {
      const messages = [
        { role: "user", content: "" },
        { role: "assistant", content: "" },
        { role: "user", content: "" },
      ];
      // 3 messages * 4 overhead = 12 tokens
      expect(estimateRequestTokens(messages)).toBe(12);
    });

    it("should sum all message tokens plus overhead", () => {
      const messages = [
        { role: "user", content: "1234" }, // 1 token + 4 overhead
        { role: "assistant", content: "12345678" }, // 2 tokens + 4 overhead
      ];
      // 1 + 4 + 2 + 4 = 11 tokens
      expect(estimateRequestTokens(messages)).toBe(11);
    });

    it("should combine system prompt and messages", () => {
      const systemPrompt = "1234"; // 1 token
      const messages = [{ role: "user", content: "1234" }]; // 1 token + 4 overhead
      // 1 + 1 + 4 = 6 tokens
      expect(estimateRequestTokens(messages, systemPrompt)).toBe(6);
    });

    it("should handle messages with empty content", () => {
      const messages = [{ role: "user", content: "" }];
      // Just the 4 token overhead
      expect(estimateRequestTokens(messages)).toBe(4);
    });

    it("should handle messages with null/undefined content", () => {
      const messages = [
        { role: "user", content: null as unknown as string },
        { role: "assistant", content: undefined as unknown as string },
      ];
      // Just the overhead (4 * 2 = 8)
      expect(estimateRequestTokens(messages)).toBe(8);
    });
  });

  describe("getMaxTokensPerRequest", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should return default when env var is not set", () => {
      delete process.env.MAX_TOKENS_PER_REQUEST;
      expect(getMaxTokensPerRequest()).toBe(DEFAULT_MAX_TOKENS_PER_REQUEST);
    });

    it("should return env value when set", () => {
      process.env.MAX_TOKENS_PER_REQUEST = "8000";
      expect(getMaxTokensPerRequest()).toBe(8000);
    });

    it("should return default for invalid env value", () => {
      process.env.MAX_TOKENS_PER_REQUEST = "invalid";
      expect(getMaxTokensPerRequest()).toBe(DEFAULT_MAX_TOKENS_PER_REQUEST);
    });

    it("should return default for negative env value", () => {
      process.env.MAX_TOKENS_PER_REQUEST = "-100";
      expect(getMaxTokensPerRequest()).toBe(DEFAULT_MAX_TOKENS_PER_REQUEST);
    });

    it("should return default for zero env value", () => {
      process.env.MAX_TOKENS_PER_REQUEST = "0";
      expect(getMaxTokensPerRequest()).toBe(DEFAULT_MAX_TOKENS_PER_REQUEST);
    });

    it("should return default for empty string env value", () => {
      process.env.MAX_TOKENS_PER_REQUEST = "";
      expect(getMaxTokensPerRequest()).toBe(DEFAULT_MAX_TOKENS_PER_REQUEST);
    });
  });

  describe("isRequestWithinTokenLimit", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
      delete process.env.MAX_TOKENS_PER_REQUEST;
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should return valid=true when under limit", () => {
      const messages = [{ role: "user", content: "Hello" }];
      const result = isRequestWithinTokenLimit(messages);

      expect(result.valid).toBe(true);
      expect(result.tokens).toBeLessThanOrEqual(result.limit);
    });

    it("should return valid=false when over limit", () => {
      // Create a message that exceeds the default 4000 token limit
      // 4000 tokens * 4 chars = 16000 characters
      const longContent = "a".repeat(17000);
      const messages = [{ role: "user", content: longContent }];
      const result = isRequestWithinTokenLimit(messages);

      expect(result.valid).toBe(false);
      expect(result.tokens).toBeGreaterThan(result.limit);
    });

    it("should include system prompt in calculation", () => {
      const systemPrompt = "a".repeat(16000); // Just under limit
      const messages = [{ role: "user", content: "a".repeat(100) }];
      const result = isRequestWithinTokenLimit(messages, systemPrompt);

      expect(result.tokens).toBeGreaterThan(4000);
      expect(result.valid).toBe(false);
    });

    it("should return correct token count", () => {
      const messages = [{ role: "user", content: "12345678" }]; // 2 tokens + 4 overhead = 6
      const result = isRequestWithinTokenLimit(messages);

      expect(result.tokens).toBe(6);
      expect(result.limit).toBe(DEFAULT_MAX_TOKENS_PER_REQUEST);
    });

    it("should respect custom env limit", () => {
      process.env.MAX_TOKENS_PER_REQUEST = "10";
      const messages = [{ role: "user", content: "12345678" }]; // 6 tokens

      const result = isRequestWithinTokenLimit(messages);
      expect(result.valid).toBe(true);
      expect(result.limit).toBe(10);

      // Now test exceeding the small limit
      const longMessages = [{ role: "user", content: "a".repeat(50) }]; // ~13 tokens + 4 = 17
      const result2 = isRequestWithinTokenLimit(longMessages);
      expect(result2.valid).toBe(false);
    });
  });
});
