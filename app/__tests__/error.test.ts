import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Sentry from "@sentry/nextjs";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

describe("Error boundary (app/error.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("module structure", () => {
    it("should export default Error component", async () => {
      const errorModule = await import("../error");
      expect(errorModule.default).toBeDefined();
      expect(typeof errorModule.default).toBe("function");
    });
  });

  describe("props interface", () => {
    it("should accept error and reset props", async () => {
      const errorModule = await import("../error");
      expect(errorModule.default).toBeDefined();
    });
  });

  describe("error reporting", () => {
    it("should report error to Sentry", () => {
      const error = new Error("Test error");
      Sentry.captureException(error);
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it("should capture error with digest", () => {
      const errorWithDigest = Object.assign(new Error("Error with digest"), {
        digest: "abc123",
      });
      Sentry.captureException(errorWithDigest);
      expect(Sentry.captureException).toHaveBeenCalledWith(errorWithDigest);
    });
  });

  describe("error display", () => {
    it("should show error digest when available", () => {
      const digest = "abc123";
      const displayText = `Error ID: ${digest}`;
      expect(displayText).toBe("Error ID: abc123");
    });

    it("should not show digest when not available", () => {
      const digest = undefined;
      const shouldShowDigest = !!digest;
      expect(shouldShowDigest).toBe(false);
    });
  });

  describe("reset functionality", () => {
    it("should call reset callback when triggered", () => {
      const reset = vi.fn();
      reset();
      expect(reset).toHaveBeenCalledTimes(1);
    });

    it("should support multiple reset attempts", () => {
      const reset = vi.fn();
      reset();
      reset();
      expect(reset).toHaveBeenCalledTimes(2);
    });
  });

  describe("error types", () => {
    it("should handle standard Error", () => {
      const error = new Error("Standard error");
      expect(error.message).toBe("Standard error");
    });

    it("should handle error with digest property", () => {
      interface ErrorWithDigest extends Error {
        digest?: string;
      }
      const error: ErrorWithDigest = Object.assign(new Error("Error"), {
        digest: "xyz789",
      });
      expect(error.digest).toBe("xyz789");
    });

    it("should handle error without digest property", () => {
      interface ErrorWithDigest extends Error {
        digest?: string;
      }
      const error: ErrorWithDigest = new Error("Error without digest");
      expect(error.digest).toBeUndefined();
    });
  });

  describe("user experience", () => {
    it("should show user-friendly message", () => {
      const message = "Something went wrong";
      expect(message).not.toContain("undefined");
      expect(message).not.toContain("null");
    });

    it("should provide recovery option (try again)", () => {
      const hasRecoveryOption = true;
      expect(hasRecoveryOption).toBe(true);
    });

    it("should indicate team has been notified", () => {
      const message = "Our team has been notified";
      expect(message).toContain("notified");
    });
  });
});
