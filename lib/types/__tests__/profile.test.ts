import { describe, it, expect } from "vitest";
import { validateUsername, validateBio, getGravatarUrl, RESERVED_USERNAMES } from "../profile";

describe("Profile Types", () => {
  describe("validateUsername", () => {
    it("should accept valid usernames", () => {
      const validUsernames = ["john", "john_doe", "john123", "john_doe_123", "abc"];

      validUsernames.forEach((username) => {
        const result = validateUsername(username);
        expect(result.valid).toBe(true);
      });
    });

    it("should reject usernames shorter than 3 characters", () => {
      const result = validateUsername("ab");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 3 characters");
    });

    it("should reject usernames longer than 30 characters", () => {
      const result = validateUsername("a".repeat(31));
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at most 30 characters");
    });

    it("should reject usernames with invalid characters", () => {
      // Note: JOHN is not invalid because it gets lowercased to "john"
      const invalidUsernames = ["john-doe", "john.doe", "john doe", "john@doe"];

      invalidUsernames.forEach((username) => {
        const result = validateUsername(username);
        expect(result.valid).toBe(false);
      });
    });

    it("should accept uppercase usernames by lowercasing", () => {
      // Uppercase is handled by lowercasing the input
      const result = validateUsername("JOHN");
      expect(result.valid).toBe(true);
    });

    it("should reject usernames starting with underscore", () => {
      const result = validateUsername("_john");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("start or end with underscore");
    });

    it("should reject usernames ending with underscore", () => {
      const result = validateUsername("john_");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("start or end with underscore");
    });

    it("should reject usernames with consecutive underscores", () => {
      const result = validateUsername("john__doe");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("consecutive underscores");
    });

    it("should reject reserved usernames", () => {
      const result = validateUsername("admin");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("reserved");
    });

    it("should reject empty username", () => {
      const result = validateUsername("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("required");
    });
  });

  describe("validateBio", () => {
    it("should accept valid bios", () => {
      const validBios = ["Hello world!", "A".repeat(500), ""];

      validBios.forEach((bio) => {
        const result = validateBio(bio);
        expect(result.valid).toBe(true);
      });
    });

    it("should reject bios longer than 500 characters", () => {
      const result = validateBio("A".repeat(501));
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at most 500 characters");
    });
  });

  describe("getGravatarUrl", () => {
    it("should return a gravatar URL", () => {
      const url = getGravatarUrl("test@example.com");
      expect(url).toContain("gravatar.com/avatar");
    });

    it("should include size parameter", () => {
      const url = getGravatarUrl("test@example.com", 100);
      expect(url).toContain("s=100");
    });

    it("should default to size 200", () => {
      const url = getGravatarUrl("test@example.com");
      expect(url).toContain("s=200");
    });

    it("should include identicon fallback", () => {
      const url = getGravatarUrl("test@example.com");
      expect(url).toContain("d=identicon");
    });
  });

  describe("RESERVED_USERNAMES", () => {
    it("should include common reserved names", () => {
      const expected = ["admin", "api", "settings", "studio", "explore"];
      expected.forEach((name) => {
        expect(RESERVED_USERNAMES).toContain(name);
      });
    });

    it("should have all lowercase entries", () => {
      RESERVED_USERNAMES.forEach((name) => {
        expect(name).toBe(name.toLowerCase());
      });
    });
  });
});
