import { describe, it, expect } from "vitest";
import {
  getHttpErrorMessage,
  getFriendlyErrorMessage,
  extractStatusCode,
  isErrorWithMessage,
  getErrorMessage,
} from "../errors";

describe("errors", () => {
  describe("getHttpErrorMessage", () => {
    it("returns correct message for 400", () => {
      expect(getHttpErrorMessage(400)).toBe("Invalid request. Please check your input.");
    });

    it("returns correct message for 401 with context", () => {
      expect(getHttpErrorMessage(401, "tracks")).toBe("Please sign in to access your tracks.");
    });

    it("returns correct message for 403", () => {
      expect(getHttpErrorMessage(403, "projects")).toBe(
        "You don't have permission to access this projects."
      );
    });

    it("returns correct message for 404", () => {
      expect(getHttpErrorMessage(404, "data")).toBe("Could not find your data.");
    });

    it("returns correct message for 409", () => {
      expect(getHttpErrorMessage(409)).toBe("This operation conflicts with existing data.");
    });

    it("returns correct message for 422", () => {
      expect(getHttpErrorMessage(422)).toBe("The provided data is invalid.");
    });

    it("returns correct message for 429", () => {
      expect(getHttpErrorMessage(429)).toBe(
        "Too many requests. Please wait a moment and try again."
      );
    });

    it("returns server error message for 5xx codes", () => {
      expect(getHttpErrorMessage(500)).toBe("Server error. Please try again later.");
      expect(getHttpErrorMessage(502)).toBe("Server error. Please try again later.");
      expect(getHttpErrorMessage(503)).toBe("Server error. Please try again later.");
      expect(getHttpErrorMessage(504)).toBe("Server error. Please try again later.");
    });

    it("returns generic 4xx message for unknown 4xx codes", () => {
      expect(getHttpErrorMessage(418)).toBe("There was a problem with your request.");
    });

    it("returns generic 5xx message for unknown 5xx codes", () => {
      expect(getHttpErrorMessage(599)).toBe("Server error. Please try again later.");
    });

    it("returns generic message for other codes", () => {
      expect(getHttpErrorMessage(200, "data")).toBe("Unable to load data. Please try again.");
    });
  });

  describe("getFriendlyErrorMessage", () => {
    it("handles TypeError for fetch failures", () => {
      const error = new TypeError("Failed to fetch");
      expect(getFriendlyErrorMessage(error)).toBe(
        "Unable to connect. Check your internet connection."
      );
    });

    it("handles AbortError", () => {
      const error = new DOMException("Aborted", "AbortError");
      expect(getFriendlyErrorMessage(error)).toBe("Request was cancelled.");
    });

    it("uses status code when provided", () => {
      expect(getFriendlyErrorMessage(null, "tracks", 401)).toBe(
        "Please sign in to access your tracks."
      );
    });

    it("extracts message from Error objects", () => {
      const error = new Error("Custom error message");
      expect(getFriendlyErrorMessage(error, "data")).toBe("Custom error message");
    });

    it("hides internal database errors", () => {
      const error = new Error("PGRST116: not found");
      expect(getFriendlyErrorMessage(error, "tracks")).toBe(
        "Unable to load tracks. Please try again."
      );
    });

    it("hides supabase errors", () => {
      const error = new Error("supabase connection failed");
      expect(getFriendlyErrorMessage(error, "data")).toBe("Unable to load data. Please try again.");
    });

    it("extracts status from error object", () => {
      const error = { status: 404 };
      expect(getFriendlyErrorMessage(error, "tracks")).toBe("Could not find your tracks.");
    });

    it("returns generic message for unknown errors", () => {
      expect(getFriendlyErrorMessage("some string", "data")).toBe(
        "Unable to load data. Please try again."
      );
    });
  });

  describe("extractStatusCode", () => {
    it("extracts status from object with status property", () => {
      expect(extractStatusCode({ status: 404 })).toBe(404);
    });

    it("returns undefined for objects without status", () => {
      expect(extractStatusCode({ message: "error" })).toBeUndefined();
    });

    it("returns undefined for non-numeric status", () => {
      expect(extractStatusCode({ status: "404" })).toBeUndefined();
    });

    it("returns undefined for null", () => {
      expect(extractStatusCode(null)).toBeUndefined();
    });

    it("returns undefined for primitives", () => {
      expect(extractStatusCode("error")).toBeUndefined();
      expect(extractStatusCode(123)).toBeUndefined();
    });
  });

  describe("isErrorWithMessage", () => {
    it("returns true for Error objects", () => {
      expect(isErrorWithMessage(new Error("test"))).toBe(true);
    });

    it("returns true for objects with message property", () => {
      expect(isErrorWithMessage({ message: "test" })).toBe(true);
    });

    it("returns false for objects without message", () => {
      expect(isErrorWithMessage({ error: "test" })).toBe(false);
    });

    it("returns false for null", () => {
      expect(isErrorWithMessage(null)).toBe(false);
    });

    it("returns false for primitives", () => {
      expect(isErrorWithMessage("error")).toBe(false);
      expect(isErrorWithMessage(123)).toBe(false);
    });

    it("returns false for objects with non-string message", () => {
      expect(isErrorWithMessage({ message: 123 })).toBe(false);
    });
  });

  describe("getErrorMessage", () => {
    it("extracts message from Error objects", () => {
      expect(getErrorMessage(new Error("test error"))).toBe("test error");
    });

    it("extracts message from objects with message property", () => {
      expect(getErrorMessage({ message: "custom message" })).toBe("custom message");
    });

    it("returns string errors as-is", () => {
      expect(getErrorMessage("string error")).toBe("string error");
    });

    it("returns fallback for unknown error types", () => {
      expect(getErrorMessage(123)).toBe("An error occurred");
      expect(getErrorMessage(null)).toBe("An error occurred");
      expect(getErrorMessage(undefined)).toBe("An error occurred");
    });

    it("uses custom fallback when provided", () => {
      expect(getErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
    });
  });
});
