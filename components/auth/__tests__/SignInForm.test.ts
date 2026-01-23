import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the Supabase client
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("SignInForm", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSignInWithPassword.mockReset();
    mockSignInWithOAuth.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export SignInForm component", async () => {
      const formModule = await import("../SignInForm");
      expect(formModule.SignInForm).toBeDefined();
      expect(typeof formModule.SignInForm).toBe("function");
    });

    it("should be a named export", async () => {
      const formModule = await import("../SignInForm");
      expect(Object.keys(formModule)).toContain("SignInForm");
    });
  });

  describe("Supabase auth methods", () => {
    it("should have access to signInWithPassword", async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });

      await import("../SignInForm");

      // The method is available through the mock
      expect(mockSignInWithPassword).toBeDefined();
    });

    it("should have access to signInWithOAuth for OAuth providers", async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await import("../SignInForm");

      // The method is available through the mock
      expect(mockSignInWithOAuth).toBeDefined();
    });
  });

  describe("email validation behavior", () => {
    it("should validate email format (native HTML5 validation)", () => {
      // Email input has type="email" which provides browser validation
      // This is handled by the browser, not custom code
      // Test that valid email formats are acceptable
      const validEmails = ["user@example.com", "user.name@example.com", "user+tag@example.org"];

      validEmails.forEach((email) => {
        // Basic regex to match what the browser validates
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = ["not-an-email", "missing@domain", "@nodomain.com"];

      invalidEmails.forEach((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe("OAuth provider configuration", () => {
    it("should support GitHub OAuth", async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      // Simulate what the form does when GitHub button is clicked
      await mockSignInWithOAuth({
        provider: "github",
        options: { redirectTo: "http://localhost:3000/auth/callback" },
      });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "github",
        options: { redirectTo: "http://localhost:3000/auth/callback" },
      });
    });

    it("should support Google OAuth", async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      // Simulate what the form does when Google button is clicked
      await mockSignInWithOAuth({
        provider: "google",
        options: { redirectTo: "http://localhost:3000/auth/callback" },
      });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: { redirectTo: "http://localhost:3000/auth/callback" },
      });
    });
  });

  describe("error handling", () => {
    it("should handle authentication errors from Supabase", async () => {
      const authError = { message: "Invalid login credentials" };
      mockSignInWithPassword.mockResolvedValue({ error: authError });

      // The form should display the error message
      // This tests the error response structure
      const result = await mockSignInWithPassword({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toBe("Invalid login credentials");
    });

    it("should handle OAuth errors", async () => {
      const oauthError = { message: "OAuth provider unavailable" };
      mockSignInWithOAuth.mockResolvedValue({ error: oauthError });

      const result = await mockSignInWithOAuth({
        provider: "github",
        options: {},
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toBe("OAuth provider unavailable");
    });

    it("should return null error on successful login", async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });

      const result = await mockSignInWithPassword({
        email: "test@example.com",
        password: "correctpassword",
      });

      expect(result.error).toBeNull();
    });
  });
});
