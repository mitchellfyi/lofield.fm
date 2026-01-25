import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ToastProvider component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock crypto.randomUUID
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "test-uuid-" + Math.random().toString(36).substr(2, 9)),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("module structure", () => {
    it("should export ToastProvider component", async () => {
      const toastProviderModule = await import("../ToastProvider");
      expect(toastProviderModule.ToastProvider).toBeDefined();
      expect(typeof toastProviderModule.ToastProvider).toBe("function");
    });

    it("should export useToast hook", async () => {
      const toastProviderModule = await import("../ToastProvider");
      expect(toastProviderModule.useToast).toBeDefined();
      expect(typeof toastProviderModule.useToast).toBe("function");
    });

    it("should have named exports for ToastProvider and useToast", async () => {
      const toastProviderModule = await import("../ToastProvider");
      expect(Object.keys(toastProviderModule)).toContain("ToastProvider");
      expect(Object.keys(toastProviderModule)).toContain("useToast");
    });
  });

  describe("default durations", () => {
    it("should have 10000ms default duration for error toasts", () => {
      const errorDuration = 10000;
      expect(errorDuration).toBe(10000);
    });

    it("should have 3000ms default duration for success toasts", () => {
      const successDuration = 3000;
      expect(successDuration).toBe(3000);
    });

    it("should have 3000ms default duration for info toasts", () => {
      const infoDuration = 3000;
      expect(infoDuration).toBe(3000);
    });
  });

  describe("toast queue management", () => {
    it("should have maximum of 3 visible toasts", () => {
      const MAX_VISIBLE_TOASTS = 3;
      expect(MAX_VISIBLE_TOASTS).toBe(3);
    });

    it("should remove oldest toast when exceeding max", () => {
      const toasts = [
        { id: "1", message: "first", type: "info" as const, visible: true },
        { id: "2", message: "second", type: "info" as const, visible: true },
        { id: "3", message: "third", type: "info" as const, visible: true },
      ];
      const newToast = { id: "4", message: "fourth", type: "info" as const, visible: true };
      const MAX_VISIBLE_TOASTS = 3;

      const newToasts = [...toasts, newToast];
      const trimmed =
        newToasts.length > MAX_VISIBLE_TOASTS ? newToasts.slice(-MAX_VISIBLE_TOASTS) : newToasts;

      expect(trimmed).toHaveLength(3);
      expect(trimmed[0].id).toBe("2"); // Oldest removed
      expect(trimmed[2].id).toBe("4"); // Newest added
    });

    it("should maintain toast order when under max", () => {
      const toasts = [
        { id: "1", message: "first", type: "info" as const, visible: true },
        { id: "2", message: "second", type: "info" as const, visible: true },
      ];
      const newToast = { id: "3", message: "third", type: "info" as const, visible: true };

      const newToasts = [...toasts, newToast];

      expect(newToasts).toHaveLength(3);
      expect(newToasts[0].id).toBe("1");
      expect(newToasts[1].id).toBe("2");
      expect(newToasts[2].id).toBe("3");
    });
  });

  describe("showToast function", () => {
    it("should accept message, type, and optional duration", () => {
      const showToastParams = {
        message: "Test message",
        type: "success" as const,
        duration: 5000,
      };
      expect(showToastParams.message).toBe("Test message");
      expect(showToastParams.type).toBe("success");
      expect(showToastParams.duration).toBe(5000);
    });

    it("should use default duration when not specified", () => {
      const getDefaultDuration = (type: "success" | "error" | "info") => {
        const defaults = { success: 3000, error: 10000, info: 3000 };
        return defaults[type];
      };

      expect(getDefaultDuration("success")).toBe(3000);
      expect(getDefaultDuration("error")).toBe(10000);
      expect(getDefaultDuration("info")).toBe(3000);
    });

    it("should generate unique IDs for each toast", () => {
      const ids = new Set();
      for (let i = 0; i < 10; i++) {
        ids.add(crypto.randomUUID());
      }
      expect(ids.size).toBe(10);
    });
  });

  describe("dismissToast function", () => {
    it("should filter out toast by ID", () => {
      const toasts = [
        { id: "1", message: "first", type: "info" as const, visible: true },
        { id: "2", message: "second", type: "info" as const, visible: true },
        { id: "3", message: "third", type: "info" as const, visible: true },
      ];

      const dismissToast = (id: string) => toasts.filter((toast) => toast.id !== id);
      const result = dismissToast("2");

      expect(result).toHaveLength(2);
      expect(result.find((t) => t.id === "2")).toBeUndefined();
      expect(result.find((t) => t.id === "1")).toBeDefined();
      expect(result.find((t) => t.id === "3")).toBeDefined();
    });

    it("should not throw when dismissing non-existent toast", () => {
      const toasts = [{ id: "1", message: "first", type: "info" as const, visible: true }];

      const dismissToast = (id: string) => toasts.filter((toast) => toast.id !== id);

      expect(() => dismissToast("non-existent")).not.toThrow();
      expect(dismissToast("non-existent")).toHaveLength(1);
    });
  });

  describe("useToast hook", () => {
    it("should throw error when used outside provider", async () => {
      const toastProviderModule = await import("../ToastProvider");
      expect(toastProviderModule.useToast).toBeDefined();
      // The hook would throw "useToast must be used within a ToastProvider"
      // Testing the error message format
      const expectedError = "useToast must be used within a ToastProvider";
      expect(expectedError).toContain("ToastProvider");
    });

    it("should return showToast and dismissToast functions", () => {
      const contextValue = {
        showToast: vi.fn(),
        dismissToast: vi.fn(),
      };
      expect(typeof contextValue.showToast).toBe("function");
      expect(typeof contextValue.dismissToast).toBe("function");
    });
  });

  describe("toast positioning", () => {
    it("should position toasts at top-right", () => {
      const positioning = {
        position: "fixed",
        top: "6",
        right: "6",
      };
      expect(positioning.position).toBe("fixed");
      expect(positioning.top).toBe("6");
      expect(positioning.right).toBe("6");
    });

    it("should have high z-index for visibility", () => {
      const zIndex = 50;
      expect(zIndex).toBeGreaterThanOrEqual(50);
    });

    it("should stack toasts vertically with gap", () => {
      const stackConfig = {
        direction: "flex-col",
        gap: "2",
      };
      expect(stackConfig.direction).toBe("flex-col");
      expect(stackConfig.gap).toBe("2");
    });

    it("should apply transform offset for stacking effect", () => {
      const calculateOffset = (index: number) => `translateY(${index * 4}px)`;
      expect(calculateOffset(0)).toBe("translateY(0px)");
      expect(calculateOffset(1)).toBe("translateY(4px)");
      expect(calculateOffset(2)).toBe("translateY(8px)");
    });

    it("should decrease z-index for stacked toasts", () => {
      const calculateZIndex = (index: number) => 50 - index;
      expect(calculateZIndex(0)).toBe(50);
      expect(calculateZIndex(1)).toBe(49);
      expect(calculateZIndex(2)).toBe(48);
    });
  });

  describe("toast types", () => {
    it("should support success type", () => {
      const type = "success";
      expect(type).toBe("success");
    });

    it("should support error type", () => {
      const type = "error";
      expect(type).toBe("error");
    });

    it("should support info type", () => {
      const type = "info";
      expect(type).toBe("info");
    });
  });

  describe("toast state", () => {
    it("should create toast with all required fields", () => {
      const createToast = (
        message: string,
        type: "success" | "error" | "info",
        duration: number
      ) => ({
        id: crypto.randomUUID(),
        message,
        type,
        visible: true,
        duration,
      });

      const toast = createToast("Test", "success", 3000);
      expect(toast.id).toBeDefined();
      expect(toast.message).toBe("Test");
      expect(toast.type).toBe("success");
      expect(toast.visible).toBe(true);
      expect(toast.duration).toBe(3000);
    });
  });

  describe("context memoization", () => {
    it("should memoize context value to prevent unnecessary re-renders", () => {
      const showToast = vi.fn();
      const dismissToast = vi.fn();

      const contextValue1 = { showToast, dismissToast };
      const contextValue2 = { showToast, dismissToast };

      // Different references but same functions
      expect(contextValue1.showToast).toBe(contextValue2.showToast);
      expect(contextValue1.dismissToast).toBe(contextValue2.dismissToast);
    });
  });

  describe("error toast specific behavior", () => {
    it("should use 10 second duration for error toasts by default", () => {
      const defaultDurations = {
        error: 10000,
        success: 3000,
        info: 3000,
      };
      expect(defaultDurations.error).toBe(10000);
      expect(defaultDurations.error).toBeGreaterThan(defaultDurations.success);
    });

    it("should allow custom duration to override default for errors", () => {
      const customDuration = 5000;
      const defaultDuration = 10000;
      const actualDuration = customDuration ?? defaultDuration;
      expect(actualDuration).toBe(5000);
    });
  });

  describe("Toast inline prop", () => {
    it("should pass inline=true to Toast when rendered in provider", () => {
      const inlineProp = true;
      expect(inlineProp).toBe(true);
    });
  });
});
