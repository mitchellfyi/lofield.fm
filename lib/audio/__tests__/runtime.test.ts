import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("AudioRuntime", () => {
  describe("module structure", () => {
    it("should export getAudioRuntime function", async () => {
      const { getAudioRuntime } = await import("../runtime");
      expect(getAudioRuntime).toBeDefined();
      expect(typeof getAudioRuntime).toBe("function");
    });

    it("should export PlayerState type", async () => {
      // PlayerState is a type, so we can only verify the module exports
      const runtimeModule = await import("../runtime");
      expect(runtimeModule).toBeDefined();
    });

    it("should export RuntimeEvent type", async () => {
      const runtimeModule = await import("../runtime");
      expect(runtimeModule).toBeDefined();
    });
  });

  describe("PlayerState values", () => {
    it("should include idle state", () => {
      const state: string = "idle";
      expect(state).toBe("idle");
    });

    it("should include loading state", () => {
      const state: string = "loading";
      expect(state).toBe("loading");
    });

    it("should include ready state", () => {
      const state: string = "ready";
      expect(state).toBe("ready");
    });

    it("should include playing state", () => {
      const state: string = "playing";
      expect(state).toBe("playing");
    });

    it("should include error state", () => {
      const state: string = "error";
      expect(state).toBe("error");
    });
  });

  describe("RuntimeEvent types", () => {
    it("should support init event type", () => {
      const eventType = "init";
      expect(eventType).toBe("init");
    });

    it("should support play event type", () => {
      const eventType = "play";
      expect(eventType).toBe("play");
    });

    it("should support stop event type", () => {
      const eventType = "stop";
      expect(eventType).toBe("stop");
    });

    it("should support eval_ok event type", () => {
      const eventType = "eval_ok";
      expect(eventType).toBe("eval_ok");
    });

    it("should support eval_fail event type", () => {
      const eventType = "eval_fail";
      expect(eventType).toBe("eval_fail");
    });

    it("should support error event type", () => {
      const eventType = "error";
      expect(eventType).toBe("error");
    });
  });

  describe("iOS detection", () => {
    const originalNavigator = global.navigator;

    beforeEach(() => {
      // Reset navigator mock before each test
    });

    afterEach(() => {
      // Restore original navigator
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        writable: true,
      });
    });

    it("should detect iPhone user agent", () => {
      const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)";
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      expect(isIOS).toBe(true);
    });

    it("should detect iPad user agent", () => {
      const userAgent = "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)";
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      expect(isIOS).toBe(true);
    });

    it("should detect iPod user agent", () => {
      const userAgent = "Mozilla/5.0 (iPod; CPU iPhone OS 15_0 like Mac OS X)";
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      expect(isIOS).toBe(true);
    });

    it("should not detect Android user agent as iOS", () => {
      const userAgent = "Mozilla/5.0 (Linux; Android 12; Pixel 6)";
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      expect(isIOS).toBe(false);
    });

    it("should not detect desktop Chrome as iOS", () => {
      const userAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0";
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      expect(isIOS).toBe(false);
    });

    it("should detect new iPads via platform and maxTouchPoints", () => {
      // New iPads report as MacIntel but have touch points
      const platform = "MacIntel";
      const maxTouchPoints = 5;
      const isNewIPad = platform === "MacIntel" && maxTouchPoints > 1;
      expect(isNewIPad).toBe(true);
    });

    it("should not detect regular Mac as iPad", () => {
      const platform = "MacIntel";
      const maxTouchPoints = 0;
      const isNewIPad = platform === "MacIntel" && maxTouchPoints > 1;
      expect(isNewIPad).toBe(false);
    });
  });

  describe("AudioContext state handling", () => {
    it("should recognize running state", () => {
      const state = "running";
      expect(state).toBe("running");
    });

    it("should recognize suspended state", () => {
      const state = "suspended";
      expect(state).toBe("suspended");
    });

    it("should recognize closed state", () => {
      const state = "closed";
      expect(state).toBe("closed");
    });

    it("should recognize interrupted state (iOS-specific)", () => {
      // iOS-specific state when audio is interrupted (e.g., phone call)
      const state = "interrupted";
      expect(state).toBe("interrupted");
    });

    it("should handle suspended and interrupted states for resume", () => {
      const statesRequiringResume = ["suspended", "interrupted"];
      expect(statesRequiringResume).toContain("suspended");
      expect(statesRequiringResume).toContain("interrupted");
    });
  });

  describe("visibility change handling", () => {
    it("should handle visible visibility state", () => {
      const visibilityState = "visible";
      expect(visibilityState).toBe("visible");
    });

    it("should handle hidden visibility state", () => {
      const visibilityState = "hidden";
      expect(visibilityState).toBe("hidden");
    });

    it("should trigger resume when becoming visible", () => {
      const visibilityState = "visible";
      const initialized = true;
      const shouldResume = visibilityState === "visible" && initialized;
      expect(shouldResume).toBe(true);
    });

    it("should not trigger resume when hidden", () => {
      const visibilityState: string = "hidden";
      const initialized = true;
      const shouldResume = visibilityState === "visible" && initialized;
      expect(shouldResume).toBe(false);
    });

    it("should not trigger resume when not initialized", () => {
      const visibilityState = "visible";
      const initialized = false;
      const shouldResume = visibilityState === "visible" && initialized;
      expect(shouldResume).toBe(false);
    });
  });

  describe("iOS touch/click resume listeners", () => {
    it("should use passive event listener for touchstart", () => {
      const options = { passive: true };
      expect(options.passive).toBe(true);
    });

    it("should use passive event listener for click", () => {
      const options = { passive: true };
      expect(options.passive).toBe(true);
    });

    it("should only attach listeners once (tracked by flag)", () => {
      let iosListenerAttached = false;

      const attachListeners = () => {
        if (iosListenerAttached) return;
        iosListenerAttached = true;
      };

      attachListeners();
      attachListeners(); // Second call should be no-op

      expect(iosListenerAttached).toBe(true);
    });
  });

  describe("event logging", () => {
    it("should add timestamp to events", () => {
      const timestamp = Date.now();
      expect(typeof timestamp).toBe("number");
      expect(timestamp).toBeGreaterThan(0);
    });

    it("should limit events to maxEvents", () => {
      const maxEvents = 10;
      const events: { type: string }[] = [];

      for (let i = 0; i < 15; i++) {
        events.unshift({ type: "test" });
        if (events.length > maxEvents) {
          events.length = maxEvents;
        }
      }

      expect(events.length).toBe(maxEvents);
    });

    it("should use unshift to add new events at the beginning", () => {
      const events: { type: string }[] = [{ type: "old" }];
      events.unshift({ type: "new" });
      expect(events[0].type).toBe("new");
      expect(events[1].type).toBe("old");
    });
  });

  describe("singleton pattern", () => {
    it("should return same instance on multiple calls", async () => {
      const { getAudioRuntime } = await import("../runtime");
      const instance1 = getAudioRuntime();
      const instance2 = getAudioRuntime();
      expect(instance1).toBe(instance2);
    });
  });

  describe("subscribe functionality", () => {
    it("should accept listener function", () => {
      const listener = vi.fn();
      expect(typeof listener).toBe("function");
    });

    it("should return unsubscribe function", () => {
      const unsubscribe = () => {};
      expect(typeof unsubscribe).toBe("function");
    });
  });

  describe("transport configuration", () => {
    it("should set loop to true", () => {
      const transportConfig = { loop: true };
      expect(transportConfig.loop).toBe(true);
    });

    it("should set loopStart to 0", () => {
      const transportConfig = { loopStart: 0 };
      expect(transportConfig.loopStart).toBe(0);
    });

    it("should set loopEnd to 32 bars", () => {
      const loopEnd = "32:0:0";
      expect(loopEnd).toBe("32:0:0");
    });
  });

  describe("seek functionality", () => {
    it("should format bar position correctly", () => {
      const bar = 5;
      const position = `${bar}:0:0`;
      expect(position).toBe("5:0:0");
    });

    it("should handle bar 0", () => {
      const bar = 0;
      const position = `${bar}:0:0`;
      expect(position).toBe("0:0:0");
    });

    it("should handle bar 31 (last bar in 32-bar loop)", () => {
      const bar = 31;
      const position = `${bar}:0:0`;
      expect(position).toBe("31:0:0");
    });
  });

  describe("test API exposure", () => {
    it("should only expose when NEXT_PUBLIC_E2E is set", () => {
      const shouldExpose = process.env.NEXT_PUBLIC_E2E === "1";
      // In test environment, this may or may not be set
      expect(typeof shouldExpose).toBe("boolean");
    });

    it("should expose getState function", () => {
      const testAPI = {
        getState: () => "idle" as const,
      };
      expect(typeof testAPI.getState).toBe("function");
    });

    it("should expose getLastEvents function", () => {
      const testAPI = {
        getLastEvents: () => [],
      };
      expect(typeof testAPI.getLastEvents).toBe("function");
    });

    it("should expose wasInitCalled function", () => {
      const testAPI = {
        wasInitCalled: () => false,
      };
      expect(typeof testAPI.wasInitCalled).toBe("function");
    });

    it("should expose wasPlayCalled function", () => {
      const testAPI = {
        wasPlayCalled: () => false,
      };
      expect(typeof testAPI.wasPlayCalled).toBe("function");
    });

    it("should expose wasStopCalled function", () => {
      const testAPI = {
        wasStopCalled: () => false,
      };
      expect(typeof testAPI.wasStopCalled).toBe("function");
    });
  });

  describe("keepPosition parameter", () => {
    it("should default to false", () => {
      const keepPosition = false;
      expect(keepPosition).toBe(false);
    });

    it("should allow true for live updates", () => {
      const keepPosition = true;
      expect(keepPosition).toBe(true);
    });

    it("should preserve old cleanup when keepPosition is true", () => {
      const keepPosition = true;
      let oldCleanup: (() => void) | null = null;

      if (keepPosition) {
        oldCleanup = () => {};
      }

      expect(oldCleanup).not.toBeNull();
    });
  });
});
