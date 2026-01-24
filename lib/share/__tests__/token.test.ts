import { describe, it, expect } from "vitest";
import {
  generateShareToken,
  isValidShareToken,
  buildShareUrl,
} from "../token";

describe("share token utilities", () => {
  describe("generateShareToken", () => {
    it("should generate a 12-character token", () => {
      const token = generateShareToken();
      expect(token).toHaveLength(12);
    });

    it("should generate alphanumeric tokens only", () => {
      const token = generateShareToken();
      expect(token).toMatch(/^[A-Za-z0-9]+$/);
    });

    it("should generate unique tokens on each call", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateShareToken());
      }
      // All 100 tokens should be unique
      expect(tokens.size).toBe(100);
    });

    it("should use the safe alphabet (no ambiguous chars)", () => {
      // Generate many tokens to test distribution
      const allChars = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        const token = generateShareToken();
        for (const char of token) {
          allChars.add(char);
        }
      }

      // Should not contain ambiguous characters (0, O, 1, l, I)
      expect(allChars.has("0")).toBe(false);
      expect(allChars.has("O")).toBe(false);
      expect(allChars.has("1")).toBe(false);
      expect(allChars.has("l")).toBe(false);
      expect(allChars.has("I")).toBe(false);
    });
  });

  describe("isValidShareToken", () => {
    it("should return true for valid 12-char alphanumeric tokens", () => {
      expect(isValidShareToken("Ab3Cd5Ef7Gh9")).toBe(true);
      expect(isValidShareToken("ABCDEFGHIJKL")).toBe(true);
      expect(isValidShareToken("abcdefghijkl")).toBe(true);
      expect(isValidShareToken("123456789012")).toBe(true);
    });

    it("should return false for tokens that are too short", () => {
      expect(isValidShareToken("abc")).toBe(false);
      expect(isValidShareToken("12345678901")).toBe(false);
    });

    it("should return false for tokens that are too long", () => {
      expect(isValidShareToken("1234567890123")).toBe(false);
      expect(isValidShareToken("abcdefghijklm")).toBe(false);
    });

    it("should return false for tokens with special characters", () => {
      expect(isValidShareToken("abc-def-ghi!")).toBe(false);
      expect(isValidShareToken("abc_def_ghij")).toBe(false);
      expect(isValidShareToken("abc def ghij")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidShareToken("")).toBe(false);
    });

    it("should return true for generated tokens", () => {
      const token = generateShareToken();
      expect(isValidShareToken(token)).toBe(true);
    });
  });

  describe("buildShareUrl", () => {
    it("should build URL with provided base", () => {
      const url = buildShareUrl("Ab3Cd5Ef7Gh9", "https://lofield.fm");
      expect(url).toBe("https://lofield.fm/share/Ab3Cd5Ef7Gh9");
    });

    it("should handle base URL with trailing slash", () => {
      // Note: current implementation does not strip trailing slash
      // This test documents current behavior
      const url = buildShareUrl("Ab3Cd5Ef7Gh9", "https://lofield.fm/");
      expect(url).toBe("https://lofield.fm//share/Ab3Cd5Ef7Gh9");
    });

    it("should use window.location.origin when no base provided", () => {
      const url = buildShareUrl("Ab3Cd5Ef7Gh9");
      // In test environment with window, uses window.location.origin
      expect(url).toMatch(/^https?:\/\/[^/]+\/share\/Ab3Cd5Ef7Gh9$/);
    });

    it("should construct proper path format", () => {
      const token = generateShareToken();
      const url = buildShareUrl(token, "https://example.com");
      expect(url).toContain("/share/");
      expect(url).toContain(token);
    });
  });
});
