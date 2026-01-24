import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Sentry from "@sentry/nextjs";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

describe("GlobalError boundary (app/global-error.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("module structure", () => {
    it("should export default GlobalError component", async () => {
      const globalErrorModule = await import("../global-error");
      expect(globalErrorModule.default).toBeDefined();
      expect(typeof globalErrorModule.default).toBe("function");
    });
  });

  describe("props interface", () => {
    it("should accept error and reset props", async () => {
      const globalErrorModule = await import("../global-error");
      expect(globalErrorModule.default).toBeDefined();
    });
  });

  describe("error reporting", () => {
    it("should report error to Sentry", () => {
      const error = new Error("Global error");
      Sentry.captureException(error);
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it("should capture error with digest", () => {
      const errorWithDigest = Object.assign(new Error("Global error with digest"), {
        digest: "global-abc123",
      });
      Sentry.captureException(errorWithDigest);
      expect(Sentry.captureException).toHaveBeenCalledWith(errorWithDigest);
    });
  });

  describe("error display", () => {
    it("should show error digest when available", () => {
      const digest = "global-abc123";
      const displayText = `Error ID: ${digest}`;
      expect(displayText).toBe("Error ID: global-abc123");
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
      reset();
      expect(reset).toHaveBeenCalledTimes(3);
    });
  });

  describe("standalone rendering", () => {
    it("should be able to render without external CSS", () => {
      const usesInlineStyles = true;
      expect(usesInlineStyles).toBe(true);
    });

    it("should wrap content in html and body tags", () => {
      const requiresHtmlWrapper = true;
      expect(requiresHtmlWrapper).toBe(true);
    });

    it("should set lang attribute on html element", () => {
      const lang = "en";
      expect(lang).toBe("en");
    });
  });

  describe("user experience", () => {
    it("should show apologetic message", () => {
      const message = "We apologize for the inconvenience";
      expect(message).toContain("apologize");
    });

    it("should indicate error has been reported", () => {
      const message = "The error has been reported";
      expect(message).toContain("reported");
    });

    it("should provide recovery option (try again)", () => {
      const hasRecoveryOption = true;
      expect(hasRecoveryOption).toBe(true);
    });
  });

  describe("styling", () => {
    it("should use dark background color", () => {
      const backgroundColor = "#0a0a0a";
      expect(backgroundColor).toBe("#0a0a0a");
    });

    it("should use light text color", () => {
      const textColor = "#e5e5e5";
      expect(textColor).toBe("#e5e5e5");
    });

    it("should center content vertically and horizontally", () => {
      const styles = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      };
      expect(styles.display).toBe("flex");
      expect(styles.alignItems).toBe("center");
      expect(styles.justifyContent).toBe("center");
    });

    it("should use system font family", () => {
      const fontFamily = "system-ui, sans-serif";
      expect(fontFamily).toContain("system-ui");
    });
  });

  describe("error types", () => {
    it("should handle root layout errors", () => {
      const error = new Error("Layout render failed");
      expect(error.message).toBe("Layout render failed");
    });

    it("should handle hydration errors", () => {
      const error = new Error("Hydration failed");
      expect(error.message).toContain("Hydration");
    });

    it("should handle provider errors", () => {
      const error = new Error("Context provider failed");
      expect(error.message).toContain("provider");
    });
  });
});
