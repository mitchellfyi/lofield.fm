import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isAdmin, getAdminEmails } from "../admin";

describe("admin", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getAdminEmails", () => {
    it("should return empty array when env var is not set", () => {
      delete process.env.ADMIN_EMAILS;
      expect(getAdminEmails()).toEqual([]);
    });

    it("should return empty array when env var is empty", () => {
      process.env.ADMIN_EMAILS = "";
      expect(getAdminEmails()).toEqual([]);
    });

    it("should return empty array when env var is whitespace", () => {
      process.env.ADMIN_EMAILS = "   ";
      expect(getAdminEmails()).toEqual([]);
    });

    it("should return single email", () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      expect(getAdminEmails()).toEqual(["admin@example.com"]);
    });

    it("should return multiple emails", () => {
      process.env.ADMIN_EMAILS = "admin@example.com,other@example.com";
      expect(getAdminEmails()).toEqual(["admin@example.com", "other@example.com"]);
    });

    it("should trim whitespace from emails", () => {
      process.env.ADMIN_EMAILS = "  admin@example.com  ,  other@example.com  ";
      expect(getAdminEmails()).toEqual(["admin@example.com", "other@example.com"]);
    });

    it("should lowercase emails", () => {
      process.env.ADMIN_EMAILS = "Admin@Example.COM,OTHER@EXAMPLE.com";
      expect(getAdminEmails()).toEqual(["admin@example.com", "other@example.com"]);
    });

    it("should filter out empty entries", () => {
      process.env.ADMIN_EMAILS = "admin@example.com,,other@example.com,";
      expect(getAdminEmails()).toEqual(["admin@example.com", "other@example.com"]);
    });

    it("should handle only commas", () => {
      process.env.ADMIN_EMAILS = ",,,";
      expect(getAdminEmails()).toEqual([]);
    });
  });

  describe("isAdmin", () => {
    beforeEach(() => {
      process.env.ADMIN_EMAILS = "admin@example.com,superadmin@example.com";
    });

    it("should return true for admin email", () => {
      expect(isAdmin("admin@example.com")).toBe(true);
    });

    it("should return true for another admin email", () => {
      expect(isAdmin("superadmin@example.com")).toBe(true);
    });

    it("should return false for non-admin email", () => {
      expect(isAdmin("user@example.com")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isAdmin("ADMIN@EXAMPLE.COM")).toBe(true);
      expect(isAdmin("Admin@Example.Com")).toBe(true);
      expect(isAdmin("SUPERADMIN@example.COM")).toBe(true);
    });

    it("should return false for null", () => {
      expect(isAdmin(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isAdmin(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isAdmin("")).toBe(false);
    });

    it("should return false when ADMIN_EMAILS is not set", () => {
      delete process.env.ADMIN_EMAILS;
      expect(isAdmin("admin@example.com")).toBe(false);
    });

    it("should return false when ADMIN_EMAILS is empty", () => {
      process.env.ADMIN_EMAILS = "";
      expect(isAdmin("admin@example.com")).toBe(false);
    });

    it("should handle partial matches correctly (no false positives)", () => {
      expect(isAdmin("admin@example.com.malicious.com")).toBe(false);
      expect(isAdmin("notadmin@example.com")).toBe(false);
      expect(isAdmin("admin@example")).toBe(false);
    });

    it("should handle emails with extra whitespace in input", () => {
      // Note: The isAdmin function trims via lowercase comparison
      // The input email is lowercased but not explicitly trimmed
      // However, whitespace would mean it's a different string
      expect(isAdmin(" admin@example.com")).toBe(false);
      expect(isAdmin("admin@example.com ")).toBe(false);
    });
  });
});
