import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Sentry from "@sentry/nextjs";
import {
  captureError,
  captureAudioError,
  captureLLMError,
  captureEvent,
  setUser,
  clearUser,
  addBreadcrumb,
  type ErrorContext,
  type AudioErrorContext,
  type LLMErrorContext,
} from "../index";

// Track scope calls for verification
let lastScopeTags: Record<string, string> = {};
let lastScopeContext: { name: string; data: Record<string, unknown> } | null = null;

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  setContext: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  withScope: vi.fn((callback: (scope: Sentry.Scope) => void) => {
    const mockScope = {
      setTags: vi.fn((tags: Record<string, string>) => {
        lastScopeTags = tags;
      }),
      setContext: vi.fn((name: string, data: Record<string, unknown>) => {
        lastScopeContext = { name, data };
      }),
    };
    callback(mockScope as unknown as Sentry.Scope);
    return mockScope;
  }),
}));

describe("observability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastScopeTags = {};
    lastScopeContext = null;
  });

  describe("captureError", () => {
    it("should capture error without context", () => {
      const error = new Error("Test error");

      captureError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it("should capture error with basic context", () => {
      const error = new Error("Test error");
      const context: ErrorContext = {
        component: "TestComponent",
        action: "test-action",
        userMessage: "Something went wrong",
      };

      captureError(error, context);

      expect(Sentry.setContext).toHaveBeenCalledWith("errorContext", {
        component: "TestComponent",
        action: "test-action",
        userMessage: "Something went wrong",
      });
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it("should capture error with extra metadata", () => {
      const error = new Error("Test error");
      const context: ErrorContext = {
        component: "TestComponent",
        extra: {
          userId: "123",
          requestId: "req-456",
        },
      };

      captureError(error, context);

      expect(Sentry.setContext).toHaveBeenCalledWith("errorContext", {
        component: "TestComponent",
        action: undefined,
        userMessage: undefined,
      });
      expect(Sentry.setContext).toHaveBeenCalledWith("extra", {
        userId: "123",
        requestId: "req-456",
      });
    });

    it("should not set extra context when not provided", () => {
      const error = new Error("Test error");
      const context: ErrorContext = {
        component: "TestComponent",
      };

      captureError(error, context);

      expect(Sentry.setContext).toHaveBeenCalledTimes(1);
      expect(Sentry.setContext).not.toHaveBeenCalledWith("extra", expect.anything());
    });
  });

  describe("captureAudioError", () => {
    it("should capture audio error with errorType tag", () => {
      const error = new Error("Audio init failed");

      captureAudioError(error);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it("should capture audio error with full context", () => {
      const error = new Error("Strudel eval failed");
      const context: AudioErrorContext = {
        component: "StrudelRuntime",
        action: "eval",
        code: 'sound("bd hh").fast(2)',
        line: 5,
        audioContextState: "running",
      };

      captureAudioError(error, context);

      // Verify withScope was called
      expect(Sentry.withScope).toHaveBeenCalled();

      // Verify tags were set
      expect(lastScopeTags).toEqual({
        errorType: "audio",
        audioContextState: "running",
      });

      // Verify context was set
      expect(lastScopeContext).toEqual({
        name: "audioError",
        data: {
          component: "StrudelRuntime",
          action: "eval",
          line: 5,
          code: 'sound("bd hh").fast(2)',
        },
      });
    });

    it("should truncate long code to 500 characters", () => {
      const error = new Error("Long code failed");
      const longCode = "a".repeat(1000);
      const context: AudioErrorContext = {
        code: longCode,
      };

      captureAudioError(error, context);

      expect(lastScopeContext?.data.code).toBe("a".repeat(500));
    });

    it("should use default component name when not provided", () => {
      const error = new Error("Audio error");

      captureAudioError(error, {});

      expect(lastScopeContext?.data.component).toBe("audio");
    });
  });

  describe("captureLLMError", () => {
    it("should capture LLM error with errorType tag", () => {
      const error = new Error("API call failed");

      captureLLMError(error);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it("should capture LLM error with full context", () => {
      const error = new Error("Rate limit exceeded");
      const context: LLMErrorContext = {
        component: "ChatRoute",
        action: "generate",
        model: "claude-sonnet",
        requestId: "req-123",
        retryCount: 2,
        isValidationError: false,
      };

      captureLLMError(error, context);

      // Verify tags were set
      expect(lastScopeTags).toEqual({
        errorType: "llm",
        model: "claude-sonnet",
      });

      // Verify context was set
      expect(lastScopeContext).toEqual({
        name: "llmError",
        data: {
          component: "ChatRoute",
          action: "generate",
          model: "claude-sonnet",
          requestId: "req-123",
          retryCount: 2,
          isValidationError: false,
        },
      });
    });

    it("should tag validation errors correctly", () => {
      const error = new Error("Invalid response format");
      const context: LLMErrorContext = {
        isValidationError: true,
      };

      captureLLMError(error, context);

      expect(lastScopeTags.isValidationError).toBe("true");
    });

    it("should spread extra fields into context", () => {
      const error = new Error("LLM error");
      const context: LLMErrorContext = {
        component: "ChatRoute",
        extra: {
          promptLength: 1500,
          temperature: 0.7,
        },
      };

      captureLLMError(error, context);

      expect(lastScopeContext?.data.promptLength).toBe(1500);
      expect(lastScopeContext?.data.temperature).toBe(0.7);
    });

    it("should use default component name when not provided", () => {
      const error = new Error("LLM error");

      captureLLMError(error, {});

      expect(lastScopeContext?.data.component).toBe("llm");
    });
  });

  describe("captureEvent", () => {
    it("should add breadcrumb for event tracking", () => {
      captureEvent("button_click");

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "event",
        message: "button_click",
        level: "info",
        data: undefined,
      });
    });

    it("should use custom category from data", () => {
      captureEvent("page_view", { category: "navigation", path: "/studio" });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "navigation",
        message: "page_view",
        level: "info",
        data: { category: "navigation", path: "/studio" },
      });
    });

    it("should pass through additional data properties", () => {
      captureEvent("export_audio", {
        format: "wav",
        duration: 30,
        sampleRate: 44100,
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "event",
        message: "export_audio",
        level: "info",
        data: {
          format: "wav",
          duration: 30,
          sampleRate: 44100,
        },
      });
    });
  });

  describe("setUser", () => {
    it("should set user with id only", () => {
      setUser({ id: "user-123" });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: "user-123",
        email: undefined,
      });
    });

    it("should set user with id and email", () => {
      setUser({ id: "user-123", email: "test@example.com" });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: "user-123",
        email: "test@example.com",
      });
    });
  });

  describe("clearUser", () => {
    it("should clear user context", () => {
      clearUser();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe("addBreadcrumb", () => {
    it("should add breadcrumb with message only", () => {
      addBreadcrumb("User clicked button");

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "navigation",
        message: "User clicked button",
        level: "info",
        data: undefined,
      });
    });

    it("should add breadcrumb with custom category", () => {
      addBreadcrumb("Audio started", "audio");

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "audio",
        message: "Audio started",
        level: "info",
        data: undefined,
      });
    });

    it("should add breadcrumb with data", () => {
      addBreadcrumb("Code updated", "editor", { lineCount: 50 });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "editor",
        message: "Code updated",
        level: "info",
        data: { lineCount: 50 },
      });
    });
  });
});
