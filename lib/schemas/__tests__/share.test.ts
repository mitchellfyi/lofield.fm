import { describe, it, expect } from "vitest";
import { privacyLevelSchema, shareTokenSchema, updateShareSchema } from "../share";

describe("share schemas", () => {
  describe("privacyLevelSchema", () => {
    it("should accept 'private'", () => {
      const result = privacyLevelSchema.safeParse("private");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("private");
      }
    });

    it("should accept 'unlisted'", () => {
      const result = privacyLevelSchema.safeParse("unlisted");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("unlisted");
      }
    });

    it("should accept 'public'", () => {
      const result = privacyLevelSchema.safeParse("public");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("public");
      }
    });

    it("should reject invalid privacy levels", () => {
      const result = privacyLevelSchema.safeParse("secret");
      expect(result.success).toBe(false);
    });

    it("should reject empty string", () => {
      const result = privacyLevelSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("should reject null", () => {
      const result = privacyLevelSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("should reject numbers", () => {
      const result = privacyLevelSchema.safeParse(1);
      expect(result.success).toBe(false);
    });
  });

  describe("shareTokenSchema", () => {
    it("should accept valid 12-char alphanumeric tokens", () => {
      const result = shareTokenSchema.safeParse("Ab3Cd5Ef7Gh9");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("Ab3Cd5Ef7Gh9");
      }
    });

    it("should accept all uppercase tokens", () => {
      const result = shareTokenSchema.safeParse("ABCDEFGHIJKL");
      expect(result.success).toBe(true);
    });

    it("should accept all lowercase tokens", () => {
      const result = shareTokenSchema.safeParse("abcdefghijkl");
      expect(result.success).toBe(true);
    });

    it("should accept all numeric tokens", () => {
      const result = shareTokenSchema.safeParse("123456789012");
      expect(result.success).toBe(true);
    });

    it("should reject tokens shorter than 12 characters", () => {
      const result = shareTokenSchema.safeParse("12345678901");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("12 characters");
      }
    });

    it("should reject tokens longer than 12 characters", () => {
      const result = shareTokenSchema.safeParse("1234567890123");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("12 characters");
      }
    });

    it("should reject tokens with special characters", () => {
      const result = shareTokenSchema.safeParse("abc-def-ghi!");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("alphanumeric");
      }
    });

    it("should reject tokens with spaces", () => {
      const result = shareTokenSchema.safeParse("abc def ghij");
      expect(result.success).toBe(false);
    });

    it("should reject empty string", () => {
      const result = shareTokenSchema.safeParse("");
      expect(result.success).toBe(false);
    });
  });

  describe("updateShareSchema", () => {
    it("should accept valid update with privacy: private", () => {
      const result = updateShareSchema.safeParse({ privacy: "private" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.privacy).toBe("private");
      }
    });

    it("should accept valid update with privacy: unlisted", () => {
      const result = updateShareSchema.safeParse({ privacy: "unlisted" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.privacy).toBe("unlisted");
      }
    });

    it("should accept valid update with privacy: public", () => {
      const result = updateShareSchema.safeParse({ privacy: "public" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.privacy).toBe("public");
      }
    });

    it("should reject missing privacy field", () => {
      const result = updateShareSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject invalid privacy value", () => {
      const result = updateShareSchema.safeParse({ privacy: "invalid" });
      expect(result.success).toBe(false);
    });

    it("should reject null object", () => {
      const result = updateShareSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("should ignore extra fields (strip unknown)", () => {
      const result = updateShareSchema.safeParse({
        privacy: "public",
        extra: "field",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.privacy).toBe("public");
        // Note: Zod by default passes through extra fields unless using strict()
      }
    });
  });
});
