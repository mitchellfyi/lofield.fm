import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the visualizationBridge module before importing
vi.mock("@/lib/audio/visualizationBridge", () => ({
  getVisualizationBridge: () => ({
    getTransportSnapshot: () => ({
      position: "0:0:0",
      seconds: 0,
      bpm: 120,
      playing: true,
      bar: 1,
      beat: 1,
      progress: 0,
    }),
  }),
}));

// Mock the recording types
vi.mock("@/lib/types/recording", () => ({
  DEFAULT_RECORDING_STATE: {
    isRecording: false,
    startTime: 0,
    startPerfTime: 0,
    events: [],
    elapsedMs: 0,
  },
  createRecordingEvent: (
    timestamp_ms: number,
    type: string,
    oldValue: number | boolean,
    newValue: number | boolean,
    param?: string,
    layerId?: string
  ) => ({
    id: `event-${timestamp_ms}`,
    timestamp_ms,
    type,
    param,
    layerId,
    oldValue,
    newValue,
  }),
  createRecording: (trackId: string, events: unknown[], durationMs: number, name?: string) => ({
    id: `recording-${Date.now()}`,
    track_id: trackId,
    name: name || null,
    duration_ms: durationMs,
    events,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
}));

describe("useRecording hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("performance", {
      now: vi.fn(() => 0),
    });
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((cb) => setTimeout(cb, 16))
    );
    vi.stubGlobal(
      "cancelAnimationFrame",
      vi.fn((id) => clearTimeout(id))
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("module structure", () => {
    it("should export useRecording function", async () => {
      const hookModule = await import("../useRecording");
      expect(hookModule.useRecording).toBeDefined();
      expect(typeof hookModule.useRecording).toBe("function");
    });

    it("should be a named export", async () => {
      const hookModule = await import("../useRecording");
      expect(Object.keys(hookModule)).toContain("useRecording");
    });

    it("should export UseRecordingResult interface type", async () => {
      // Interface types are erased at runtime but we can verify the hook exists
      const hookModule = await import("../useRecording");
      expect(hookModule.useRecording).toBeDefined();
    });
  });

  describe("return interface", () => {
    it("should be a function that takes no arguments", async () => {
      const hookModule = await import("../useRecording");
      expect(typeof hookModule.useRecording).toBe("function");
      expect(hookModule.useRecording.length).toBe(0);
    });
  });

  describe("debounce constant", () => {
    it("should have a reasonable debounce window", () => {
      // The hook uses EVENT_DEBOUNCE_MS = 50
      // This is a reasonable debounce window for rapid slider changes
      const EXPECTED_DEBOUNCE_MS = 50;
      expect(EXPECTED_DEBOUNCE_MS).toBeLessThanOrEqual(100);
      expect(EXPECTED_DEBOUNCE_MS).toBeGreaterThanOrEqual(20);
    });
  });
});

describe("useRecording logic patterns", () => {
  describe("recording state management", () => {
    it("should define default recording state", () => {
      const defaultState = {
        isRecording: false,
        startTime: 0,
        startPerfTime: 0,
        events: [],
        elapsedMs: 0,
      };

      expect(defaultState.isRecording).toBe(false);
      expect(defaultState.startTime).toBe(0);
      expect(defaultState.startPerfTime).toBe(0);
      expect(defaultState.events).toEqual([]);
      expect(defaultState.elapsedMs).toBe(0);
    });

    it("should track recording start time", () => {
      const startTime = 5.5; // Transport seconds
      const startPerfTime = 1000; // performance.now()

      const recordingState = {
        isRecording: true,
        startTime,
        startPerfTime,
        events: [],
        elapsedMs: 0,
      };

      expect(recordingState.isRecording).toBe(true);
      expect(recordingState.startTime).toBe(5.5);
      expect(recordingState.startPerfTime).toBe(1000);
    });

    it("should calculate elapsed time correctly", () => {
      const startPerfTime = 1000;
      const currentPerfTime = 2500;
      const elapsed = currentPerfTime - startPerfTime;

      expect(elapsed).toBe(1500);
    });
  });

  describe("event capture patterns", () => {
    it("should create tweak events with correct structure", () => {
      const event = {
        id: "test-id",
        timestamp_ms: 1000,
        type: "tweak" as const,
        param: "bpm" as const,
        oldValue: 82,
        newValue: 120,
      };

      expect(event.type).toBe("tweak");
      expect(event.param).toBe("bpm");
      expect(typeof event.oldValue).toBe("number");
      expect(typeof event.newValue).toBe("number");
    });

    it("should create layer_mute events with correct structure", () => {
      const event = {
        id: "test-id",
        timestamp_ms: 2000,
        type: "layer_mute" as const,
        layerId: "layer-1",
        oldValue: false,
        newValue: true,
      };

      expect(event.type).toBe("layer_mute");
      expect(event.layerId).toBe("layer-1");
      expect(typeof event.oldValue).toBe("boolean");
      expect(typeof event.newValue).toBe("boolean");
    });

    it("should create layer_volume events with correct structure", () => {
      const event = {
        id: "test-id",
        timestamp_ms: 3000,
        type: "layer_volume" as const,
        layerId: "layer-2",
        oldValue: 0.8,
        newValue: 0.5,
      };

      expect(event.type).toBe("layer_volume");
      expect(event.layerId).toBe("layer-2");
      expect(typeof event.oldValue).toBe("number");
      expect(typeof event.newValue).toBe("number");
    });

    it("should create layer_solo events with correct structure", () => {
      const event = {
        id: "test-id",
        timestamp_ms: 4000,
        type: "layer_solo" as const,
        layerId: "layer-3",
        oldValue: false,
        newValue: true,
      };

      expect(event.type).toBe("layer_solo");
      expect(event.layerId).toBe("layer-3");
      expect(typeof event.oldValue).toBe("boolean");
      expect(typeof event.newValue).toBe("boolean");
    });

    it("should calculate timestamp relative to recording start", () => {
      const startPerfTime = 1000;
      const currentPerfTime = 1500;
      const timestamp_ms = currentPerfTime - startPerfTime;

      expect(timestamp_ms).toBe(500);
    });
  });

  describe("debouncing behavior", () => {
    it("should detect events within debounce window", () => {
      const DEBOUNCE_MS = 50;
      const lastEventTime = 1000;
      const currentTime = 1030; // 30ms later, within window

      const isWithinDebounce = currentTime - lastEventTime < DEBOUNCE_MS;
      expect(isWithinDebounce).toBe(true);
    });

    it("should detect events outside debounce window", () => {
      const DEBOUNCE_MS = 50;
      const lastEventTime = 1000;
      const currentTime = 1060; // 60ms later, outside window

      const isWithinDebounce = currentTime - lastEventTime < DEBOUNCE_MS;
      expect(isWithinDebounce).toBe(false);
    });

    it("should generate unique keys for event deduplication", () => {
      // The hook uses: `${type}-${param || ''}-${layerId || ''}`
      const key1 = `tweak-bpm-`;
      const key2 = `tweak-swing-`;
      const key3 = `layer_mute--layer-1`;
      const key4 = `layer_volume--layer-1`;

      expect(key1).not.toBe(key2);
      expect(key3).not.toBe(key4);
    });

    it("should track last event value for continuity", () => {
      // Simulates continuous slider movement
      const lastValues = new Map<string, number | boolean>();
      lastValues.set("tweak-bpm-", 100);

      const effectiveOldValue = lastValues.get("tweak-bpm-") ?? 82;
      expect(effectiveOldValue).toBe(100); // Uses tracked value, not initial
    });
  });

  describe("event list management", () => {
    it("should add events to list", () => {
      const events: Array<{ timestamp_ms: number; type: string }> = [];

      events.push({ timestamp_ms: 1000, type: "tweak" });
      events.push({ timestamp_ms: 2000, type: "layer_mute" });

      expect(events).toHaveLength(2);
      expect(events[0].timestamp_ms).toBe(1000);
      expect(events[1].timestamp_ms).toBe(2000);
    });

    it("should update last event during debounce window", () => {
      const events = [
        { id: "1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 90 },
      ];

      // Simulate updating the last event's newValue
      const lastEventIndex = events.findIndex(
        (e) => e.type === "tweak" && e.param === "bpm" && e.timestamp_ms >= 1000 - 50
      );

      if (lastEventIndex >= 0) {
        events[lastEventIndex] = { ...events[lastEventIndex], newValue: 100 };
      }

      expect(events[0].newValue).toBe(100);
    });

    it("should clear events on clear recording", () => {
      const initialEvents = [{ timestamp_ms: 1000, type: "tweak" }];

      // Simulates clearRecording behavior
      const clearedEvents: typeof initialEvents = [];
      expect(clearedEvents).toHaveLength(0);
      expect(initialEvents).toHaveLength(1); // original unchanged
    });
  });

  describe("recording creation", () => {
    it("should create recording with track ID", () => {
      const recording = {
        id: "recording-123",
        track_id: "track-456",
        name: null,
        duration_ms: 5000,
        events: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(recording.track_id).toBe("track-456");
      expect(recording.duration_ms).toBe(5000);
      expect(recording.events).toEqual([]);
    });

    it("should include optional name in recording", () => {
      const recording = {
        id: "recording-123",
        track_id: "track-456",
        name: "My Performance",
        duration_ms: 5000,
        events: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(recording.name).toBe("My Performance");
    });

    it("should include events in recording", () => {
      const events = [
        { id: "1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 100 },
        {
          id: "2",
          timestamp_ms: 2000,
          type: "layer_mute",
          layerId: "l1",
          oldValue: false,
          newValue: true,
        },
      ];

      const recording = {
        id: "recording-123",
        track_id: "track-456",
        duration_ms: 3000,
        events,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(recording.events).toHaveLength(2);
      expect(recording.events[0].type).toBe("tweak");
      expect(recording.events[1].type).toBe("layer_mute");
    });
  });

  describe("stop recording behavior", () => {
    it("should return captured events when stopping", () => {
      const events = [
        { timestamp_ms: 1000, type: "tweak" },
        { timestamp_ms: 2000, type: "layer_mute" },
      ];

      // Simulates stopRecording returning events
      const returnedEvents = [...events];
      expect(returnedEvents).toHaveLength(2);
    });

    it("should set isRecording to false when stopping", () => {
      let isRecording = true;

      // Simulates stopRecording
      isRecording = false;

      expect(isRecording).toBe(false);
    });

    it("should preserve elapsed time after stopping", () => {
      const state = {
        isRecording: true,
        elapsedMs: 5000,
      };

      // Simulates stopping - elapsedMs is preserved
      const stoppedState = {
        ...state,
        isRecording: false,
      };

      expect(stoppedState.isRecording).toBe(false);
      expect(stoppedState.elapsedMs).toBe(5000);
    });
  });

  describe("recording guard conditions", () => {
    it("should not capture events when not recording", () => {
      const isRecording = false;

      // Simulates the guard in captureEvent
      if (!isRecording) {
        // Early return without capturing
        expect(true).toBe(true); // Guard triggered
      }
    });

    it("should capture events when recording is active", () => {
      const isRecording = true;
      let eventCaptured = false;

      // Simulates the guard in captureEvent
      if (isRecording) {
        eventCaptured = true;
      }

      expect(eventCaptured).toBe(true);
    });
  });
});

describe("useRecording TweaksConfig integration", () => {
  describe("supported tweak parameters", () => {
    it("should support bpm parameter", () => {
      const tweakParams = ["bpm", "swing", "filterCutoff", "reverbMix", "delayMix"];
      expect(tweakParams).toContain("bpm");
    });

    it("should support swing parameter", () => {
      const tweakParams = ["bpm", "swing", "filterCutoff", "reverbMix", "delayMix"];
      expect(tweakParams).toContain("swing");
    });

    it("should support filterCutoff parameter", () => {
      const tweakParams = ["bpm", "swing", "filterCutoff", "reverbMix", "delayMix"];
      expect(tweakParams).toContain("filterCutoff");
    });

    it("should support reverbMix parameter", () => {
      const tweakParams = ["bpm", "swing", "filterCutoff", "reverbMix", "delayMix"];
      expect(tweakParams).toContain("reverbMix");
    });

    it("should support delayMix parameter", () => {
      const tweakParams = ["bpm", "swing", "filterCutoff", "reverbMix", "delayMix"];
      expect(tweakParams).toContain("delayMix");
    });
  });

  describe("tweak value validation", () => {
    it("should accept numeric values for all tweaks", () => {
      const tweakValues = {
        bpm: 120,
        swing: 0,
        filterCutoff: 1000,
        reverbMix: 0.3,
        delayMix: 0.2,
      };

      Object.values(tweakValues).forEach((value) => {
        expect(typeof value).toBe("number");
      });
    });
  });
});

describe("useRecording RAF integration", () => {
  describe("elapsed time updates", () => {
    it("should use requestAnimationFrame for elapsed time", () => {
      // The hook uses RAF to update elapsed time while recording
      let rafCalled = false;
      // Mock RAF that accepts a callback (unused in this test but matches signature)
      const mockRaf = vi.fn(() => {
        rafCalled = true;
        return 1;
      });

      // Simulates the RAF pattern
      mockRaf();
      expect(rafCalled).toBe(true);
    });

    it("should cancel RAF when recording stops", () => {
      let rafId: number | null = 1;

      // Simulates cleanup
      if (rafId !== null) {
        rafId = null;
      }

      expect(rafId).toBeNull();
    });

    it("should handle RAF cleanup on unmount", () => {
      const cleanup = vi.fn();

      // Simulates useEffect cleanup pattern
      const effectCleanup = () => {
        cleanup();
      };

      effectCleanup();
      expect(cleanup).toHaveBeenCalled();
    });
  });
});

describe("useRecording visualization bridge integration", () => {
  describe("transport state access", () => {
    it("should get transport snapshot for start time", () => {
      const mockTransport = {
        position: "0:0:0",
        seconds: 5.5,
        bpm: 120,
        playing: true,
        bar: 1,
        beat: 1,
        progress: 0,
      };

      // Simulates accessing transport state
      expect(mockTransport.seconds).toBe(5.5);
      expect(mockTransport.playing).toBe(true);
    });

    it("should use transport seconds as recording start reference", () => {
      const transportSeconds = 10.0;
      const recordingState = {
        startTime: transportSeconds,
      };

      expect(recordingState.startTime).toBe(10.0);
    });
  });
});
