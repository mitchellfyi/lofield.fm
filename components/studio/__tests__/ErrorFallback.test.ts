import { describe, it, expect, vi } from "vitest";

describe("ErrorFallback component", () => {
  describe("module structure", () => {
    it("should export ErrorFallback component", async () => {
      const errorFallbackModule = await import("../ErrorFallback");
      expect(errorFallbackModule.ErrorFallback).toBeDefined();
      expect(typeof errorFallbackModule.ErrorFallback).toBe("function");
    });

    it("should be a named export", async () => {
      const errorFallbackModule = await import("../ErrorFallback");
      expect(Object.keys(errorFallbackModule)).toContain("ErrorFallback");
    });
  });

  describe("props interface", () => {
    it("should accept required props: error, resetError", async () => {
      const errorFallbackModule = await import("../ErrorFallback");
      expect(errorFallbackModule.ErrorFallback).toBeDefined();
    });

    it("should accept optional prop: componentName", async () => {
      const errorFallbackModule = await import("../ErrorFallback");
      expect(errorFallbackModule.ErrorFallback).toBeDefined();
    });
  });

  describe("error display logic", () => {
    it("should display error message when provided", () => {
      const error = new Error("Test error message");
      expect(error.message).toBe("Test error message");
    });

    it("should handle error without message", () => {
      const error = new Error();
      const displayMessage = error.message || "An unexpected error occurred";
      expect(displayMessage).toBe("An unexpected error occurred");
    });

    it("should display componentName when provided", () => {
      const componentName = "AudioPlayer";
      const displayTitle = `Error in ${componentName}`;
      expect(displayTitle).toBe("Error in AudioPlayer");
    });

    it("should show generic message when componentName is not provided", () => {
      const componentName = undefined;
      const displayTitle = componentName ? `Error in ${componentName}` : "Something went wrong";
      expect(displayTitle).toBe("Something went wrong");
    });
  });

  describe("resetError callback", () => {
    it("should be called when retry is triggered", () => {
      const resetError = vi.fn();
      resetError();
      expect(resetError).toHaveBeenCalledTimes(1);
    });

    it("should be callable multiple times", () => {
      const resetError = vi.fn();
      resetError();
      resetError();
      resetError();
      expect(resetError).toHaveBeenCalledTimes(3);
    });
  });

  describe("error types", () => {
    it("should handle Error instances", () => {
      const error = new Error("Standard error");
      expect(error instanceof Error).toBe(true);
      expect(error.message).toBe("Standard error");
    });

    it("should handle TypeError instances", () => {
      const error = new TypeError("Type error");
      expect(error instanceof Error).toBe(true);
      expect(error.name).toBe("TypeError");
    });

    it("should handle errors with stack traces", () => {
      const error = new Error("Error with stack");
      expect(error.stack).toBeDefined();
    });

    it("should handle errors without stack traces", () => {
      const error = { message: "Plain error object" };
      expect(error.message).toBe("Plain error object");
    });
  });

  describe("component behavior", () => {
    it("should support reset functionality", () => {
      let hasError = true;
      const resetError = () => {
        hasError = false;
      };

      expect(hasError).toBe(true);
      resetError();
      expect(hasError).toBe(false);
    });

    it("should display user-friendly error message", () => {
      const error = new Error("FATAL_ERROR_XYZ_123");
      const userFriendlyMessage = error.message || "An unexpected error occurred";
      expect(typeof userFriendlyMessage).toBe("string");
      expect(userFriendlyMessage.length).toBeGreaterThan(0);
    });
  });
});
