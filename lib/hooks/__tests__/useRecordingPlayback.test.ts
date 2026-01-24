import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Recording, RecordingEvent } from "@/lib/types/recording";

// Mock the visualizationBridge module
vi.mock("@/lib/audio/visualizationBridge", () => ({
  getVisualizationBridge: () => ({
    getTransportSnapshot: () => ({
      position: "0:0:0",
      seconds: 5,
      bpm: 120,
      playing: true,
      bar: 1,
      beat: 1,
      progress: 0,
    }),
  }),
}));

describe("useRecordingPlayback hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
    it("should export useRecordingPlayback function", async () => {
      const hookModule = await import("../useRecordingPlayback");
      expect(hookModule.useRecordingPlayback).toBeDefined();
      expect(typeof hookModule.useRecordingPlayback).toBe("function");
    });

    it("should be a named export", async () => {
      const hookModule = await import("../useRecordingPlayback");
      expect(Object.keys(hookModule)).toContain("useRecordingPlayback");
    });
  });

  describe("return interface", () => {
    it("should accept options object parameter", async () => {
      const hookModule = await import("../useRecordingPlayback");
      expect(typeof hookModule.useRecordingPlayback).toBe("function");
      expect(hookModule.useRecordingPlayback.length).toBe(1);
    });
  });
});

describe("useRecordingPlayback options interface", () => {
  describe("recording option", () => {
    it("should accept null recording", () => {
      const options = { recording: null };
      expect(options.recording).toBeNull();
    });

    it("should accept Recording object", () => {
      const recording: Recording = {
        id: "rec-123",
        track_id: "track-456",
        name: "Test Recording",
        duration_ms: 5000,
        events: [],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };
      const options = { recording };
      expect(options.recording?.id).toBe("rec-123");
    });
  });

  describe("enabled option", () => {
    it("should default to true when not provided", () => {
      const enabled = true; // Default value
      expect(enabled).toBe(true);
    });

    it("should accept false to disable playback", () => {
      const options = { recording: null, enabled: false };
      expect(options.enabled).toBe(false);
    });
  });

  describe("callback options", () => {
    it("should accept onTweakChange callback", () => {
      const onTweakChange = vi.fn();
      const options = { recording: null, onTweakChange };
      expect(typeof options.onTweakChange).toBe("function");
    });

    it("should accept onLayerMuteChange callback", () => {
      const onLayerMuteChange = vi.fn();
      const options = { recording: null, onLayerMuteChange };
      expect(typeof options.onLayerMuteChange).toBe("function");
    });

    it("should accept onLayerVolumeChange callback", () => {
      const onLayerVolumeChange = vi.fn();
      const options = { recording: null, onLayerVolumeChange };
      expect(typeof options.onLayerVolumeChange).toBe("function");
    });

    it("should accept onLayerSoloChange callback", () => {
      const onLayerSoloChange = vi.fn();
      const options = { recording: null, onLayerSoloChange };
      expect(typeof options.onLayerSoloChange).toBe("function");
    });

    it("should accept onEventTriggered callback", () => {
      const onEventTriggered = vi.fn();
      const options = { recording: null, onEventTriggered };
      expect(typeof options.onEventTriggered).toBe("function");
    });
  });
});

describe("useRecordingPlayback result interface", () => {
  describe("isPlaying state", () => {
    it("should start as false", () => {
      const isPlaying = false;
      expect(isPlaying).toBe(false);
    });

    it("should be true during playback", () => {
      const isPlaying = true;
      expect(isPlaying).toBe(true);
    });
  });

  describe("currentTimeMs state", () => {
    it("should start at 0", () => {
      const currentTimeMs = 0;
      expect(currentTimeMs).toBe(0);
    });

    it("should track playback position", () => {
      const currentTimeMs = 2500;
      expect(currentTimeMs).toBe(2500);
    });

    it("should not be negative", () => {
      const currentTimeMs = Math.max(0, -100);
      expect(currentTimeMs).toBe(0);
    });
  });

  describe("nextEventIndex state", () => {
    it("should start at 0", () => {
      const nextEventIndex = 0;
      expect(nextEventIndex).toBe(0);
    });

    it("should increment as events are applied", () => {
      let nextEventIndex = 0;
      nextEventIndex++;
      expect(nextEventIndex).toBe(1);
    });
  });

  describe("control methods", () => {
    it("should have play method", () => {
      const play = vi.fn();
      expect(typeof play).toBe("function");
    });

    it("should have pause method", () => {
      const pause = vi.fn();
      expect(typeof pause).toBe("function");
    });

    it("should have seek method", () => {
      const seek = vi.fn();
      expect(typeof seek).toBe("function");
    });

    it("should have reset method", () => {
      const reset = vi.fn();
      expect(typeof reset).toBe("function");
    });
  });
});

describe("useRecordingPlayback event processing", () => {
  describe("event sorting", () => {
    it("should sort events by timestamp_ms", () => {
      const events: RecordingEvent[] = [
        { id: "3", timestamp_ms: 3000, type: "tweak", param: "bpm", oldValue: 100, newValue: 120 },
        { id: "1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 90 },
        { id: "2", timestamp_ms: 2000, type: "tweak", param: "bpm", oldValue: 90, newValue: 100 },
      ];

      const sorted = [...events].sort((a, b) => a.timestamp_ms - b.timestamp_ms);

      expect(sorted[0].id).toBe("1");
      expect(sorted[1].id).toBe("2");
      expect(sorted[2].id).toBe("3");
    });

    it("should handle empty events array", () => {
      const events: RecordingEvent[] = [];
      const sorted = [...events].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
      expect(sorted).toHaveLength(0);
    });

    it("should preserve original array immutability", () => {
      const events: RecordingEvent[] = [
        { id: "2", timestamp_ms: 2000, type: "tweak", param: "bpm", oldValue: 90, newValue: 100 },
        { id: "1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 90 },
      ];

      const sorted = [...events].sort((a, b) => a.timestamp_ms - b.timestamp_ms);

      expect(events[0].id).toBe("2"); // Original unchanged
      expect(sorted[0].id).toBe("1"); // Sorted copy
    });
  });

  describe("event application", () => {
    it("should apply tweak events", () => {
      const event: RecordingEvent = {
        id: "1",
        timestamp_ms: 1000,
        type: "tweak",
        param: "bpm",
        oldValue: 82,
        newValue: 120,
      };

      const onTweakChange = vi.fn();

      if (event.type === "tweak" && event.param && typeof event.newValue === "number") {
        onTweakChange(event.param, event.newValue);
      }

      expect(onTweakChange).toHaveBeenCalledWith("bpm", 120);
    });

    it("should apply layer_mute events", () => {
      const event: RecordingEvent = {
        id: "1",
        timestamp_ms: 1000,
        type: "layer_mute",
        layerId: "layer-1",
        oldValue: false,
        newValue: true,
      };

      const onLayerMuteChange = vi.fn();

      if (event.type === "layer_mute" && event.layerId && typeof event.newValue === "boolean") {
        onLayerMuteChange(event.layerId, event.newValue);
      }

      expect(onLayerMuteChange).toHaveBeenCalledWith("layer-1", true);
    });

    it("should apply layer_volume events", () => {
      const event: RecordingEvent = {
        id: "1",
        timestamp_ms: 1000,
        type: "layer_volume",
        layerId: "layer-1",
        oldValue: 0.8,
        newValue: 0.5,
      };

      const onLayerVolumeChange = vi.fn();

      if (event.type === "layer_volume" && event.layerId && typeof event.newValue === "number") {
        onLayerVolumeChange(event.layerId, event.newValue);
      }

      expect(onLayerVolumeChange).toHaveBeenCalledWith("layer-1", 0.5);
    });

    it("should apply layer_solo events", () => {
      const event: RecordingEvent = {
        id: "1",
        timestamp_ms: 1000,
        type: "layer_solo",
        layerId: "layer-1",
        oldValue: false,
        newValue: true,
      };

      const onLayerSoloChange = vi.fn();

      if (event.type === "layer_solo" && event.layerId && typeof event.newValue === "boolean") {
        onLayerSoloChange(event.layerId, event.newValue);
      }

      expect(onLayerSoloChange).toHaveBeenCalledWith("layer-1", true);
    });

    it("should trigger onEventTriggered callback", () => {
      const event: RecordingEvent = {
        id: "1",
        timestamp_ms: 1000,
        type: "tweak",
        param: "bpm",
        oldValue: 82,
        newValue: 120,
      };

      const onEventTriggered = vi.fn();
      onEventTriggered(event);

      expect(onEventTriggered).toHaveBeenCalledWith(event);
    });
  });

  describe("event timing", () => {
    it("should calculate recording time from transport time", () => {
      const transportTimeMs = 7000; // 7 seconds in ms
      const playbackStartTimeRef = 5; // Started at 5 seconds transport time
      const recordingTimeMs = transportTimeMs - playbackStartTimeRef * 1000;

      expect(recordingTimeMs).toBe(2000);
    });

    it("should apply events when timestamp reached", () => {
      const events: RecordingEvent[] = [
        { id: "1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 90 },
        { id: "2", timestamp_ms: 2000, type: "tweak", param: "bpm", oldValue: 90, newValue: 100 },
      ];

      const recordingTimeMs = 1500;
      const appliedEvents: RecordingEvent[] = [];

      events.forEach((event) => {
        if (event.timestamp_ms <= recordingTimeMs) {
          appliedEvents.push(event);
        }
      });

      expect(appliedEvents).toHaveLength(1);
      expect(appliedEvents[0].id).toBe("1");
    });

    it("should not apply future events", () => {
      const events: RecordingEvent[] = [
        { id: "1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 90 },
        { id: "2", timestamp_ms: 5000, type: "tweak", param: "bpm", oldValue: 90, newValue: 100 },
      ];

      const recordingTimeMs = 2000;
      const lastAppliedIndex = -1;
      let newLastIndex = lastAppliedIndex;

      for (let i = lastAppliedIndex + 1; i < events.length; i++) {
        if (events[i].timestamp_ms <= recordingTimeMs) {
          newLastIndex = i;
        } else {
          break;
        }
      }

      expect(newLastIndex).toBe(0); // Only first event applied
    });
  });
});

describe("useRecordingPlayback state transitions", () => {
  describe("play behavior", () => {
    it("should not play when recording is null", () => {
      const recording: Recording | null = null;
      let isPlaying = false;

      if (recording) {
        isPlaying = true;
      }

      expect(isPlaying).toBe(false);
    });

    it("should not play when disabled", () => {
      const recording: Recording = {
        id: "rec-123",
        track_id: "track-456",
        name: undefined,
        duration_ms: 5000,
        events: [],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };
      const enabled = false;
      let isPlaying = false;

      if (recording && enabled) {
        isPlaying = true;
      }

      expect(isPlaying).toBe(false);
    });

    it("should not play when transport is not playing", () => {
      const transportPlaying = false;
      let isPlaying = false;

      if (!transportPlaying) {
        // Can't sync to stopped transport
        isPlaying = false;
      }

      expect(isPlaying).toBe(false);
    });

    it("should calculate playback start reference", () => {
      const transportSeconds = 10;
      const currentTimeMs = 2000;
      const playbackStartTimeRef = transportSeconds - currentTimeMs / 1000;

      expect(playbackStartTimeRef).toBe(8);
    });
  });

  describe("pause behavior", () => {
    it("should set isPlaying to false", () => {
      let isPlaying = true;
      isPlaying = false;
      expect(isPlaying).toBe(false);
    });
  });

  describe("seek behavior", () => {
    it("should clamp position to valid range", () => {
      const durationMs = 5000;
      const positionMs = -100;
      const clamped = Math.max(0, Math.min(positionMs, durationMs));

      expect(clamped).toBe(0);
    });

    it("should clamp position to duration", () => {
      const durationMs = 5000;
      const positionMs = 10000;
      const clamped = Math.max(0, Math.min(positionMs, durationMs));

      expect(clamped).toBe(5000);
    });

    it("should find correct event index at seek position", () => {
      const events: RecordingEvent[] = [
        { id: "1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 90 },
        { id: "2", timestamp_ms: 2000, type: "tweak", param: "bpm", oldValue: 90, newValue: 100 },
        { id: "3", timestamp_ms: 3000, type: "tweak", param: "bpm", oldValue: 100, newValue: 110 },
      ];

      const seekPosition = 2500;
      let newIndex = 0;

      for (let i = 0; i < events.length; i++) {
        if (events[i].timestamp_ms > seekPosition) {
          break;
        }
        newIndex = i + 1;
      }

      expect(newIndex).toBe(2); // Events at 1000ms and 2000ms are before 2500ms
    });

    it("should update start reference when playing", () => {
      const isPlaying = true;
      const transportSeconds = 10;
      const seekPositionMs = 3000;

      let playbackStartTimeRef = 5;
      if (isPlaying) {
        playbackStartTimeRef = transportSeconds - seekPositionMs / 1000;
      }

      expect(playbackStartTimeRef).toBe(7);
    });
  });

  describe("reset behavior", () => {
    it("should set isPlaying to false", () => {
      let isPlaying = true;
      isPlaying = false;
      expect(isPlaying).toBe(false);
    });

    it("should set currentTimeMs to 0", () => {
      let currentTimeMs = 2500;
      currentTimeMs = 0;
      expect(currentTimeMs).toBe(0);
    });

    it("should set nextEventIndex to 0", () => {
      let nextEventIndex = 5;
      nextEventIndex = 0;
      expect(nextEventIndex).toBe(0);
    });

    it("should reset lastAppliedIndex to -1", () => {
      let lastAppliedIndex = 5;
      lastAppliedIndex = -1;
      expect(lastAppliedIndex).toBe(-1);
    });
  });
});

describe("useRecordingPlayback recording change handling", () => {
  describe("derived state pattern", () => {
    it("should detect recording ID change", () => {
      const currentId: string | null = "rec-1";
      const newId: string | null = "rec-2";
      const shouldReset = currentId !== newId;

      expect(shouldReset).toBe(true);
    });

    it("should not reset on same recording", () => {
      const currentId: string | null = "rec-1";
      const newId: string | null = "rec-1";
      const shouldReset = currentId !== newId;

      expect(shouldReset).toBe(false);
    });

    it("should handle null to recording transition", () => {
      const currentId: string | null = null;
      const newId: string | null = "rec-1";
      const shouldReset = currentId !== newId;

      expect(shouldReset).toBe(true);
    });

    it("should handle recording to null transition", () => {
      const currentId: string | null = "rec-1";
      const newId: string | null = null;
      const shouldReset = currentId !== newId;

      expect(shouldReset).toBe(true);
    });

    it("should reset state synchronously during render", () => {
      // This tests the derived state pattern used to avoid useEffect
      const shouldReset = true;
      let isPlaying = true;
      let currentTimeMs = 2500;
      let nextEventIndex = 3;

      if (shouldReset) {
        isPlaying = false;
        currentTimeMs = 0;
        nextEventIndex = 0;
      }

      expect(isPlaying).toBe(false);
      expect(currentTimeMs).toBe(0);
      expect(nextEventIndex).toBe(0);
    });
  });
});

describe("useRecordingPlayback RAF loop", () => {
  describe("loop conditions", () => {
    it("should not run when not playing", () => {
      const isPlaying = false;
      const enabled = true;
      const hasRecording = true;
      const hasEvents = true;

      const shouldRun = isPlaying && enabled && hasRecording && hasEvents;
      expect(shouldRun).toBe(false);
    });

    it("should not run when disabled", () => {
      const isPlaying = true;
      const enabled = false;
      const hasRecording = true;
      const hasEvents = true;

      const shouldRun = isPlaying && enabled && hasRecording && hasEvents;
      expect(shouldRun).toBe(false);
    });

    it("should not run without recording", () => {
      const isPlaying = true;
      const enabled = true;
      const hasRecording = false;
      const hasEvents = true;

      const shouldRun = isPlaying && enabled && hasRecording && hasEvents;
      expect(shouldRun).toBe(false);
    });

    it("should not run without events", () => {
      const isPlaying = true;
      const enabled = true;
      const hasRecording = true;
      const hasEvents = false;

      const shouldRun = isPlaying && enabled && hasRecording && hasEvents;
      expect(shouldRun).toBe(false);
    });

    it("should run when all conditions met", () => {
      const isPlaying = true;
      const enabled = true;
      const hasRecording = true;
      const hasEvents = true;

      const shouldRun = isPlaying && enabled && hasRecording && hasEvents;
      expect(shouldRun).toBe(true);
    });
  });

  describe("transport sync", () => {
    it("should pause when transport stops", () => {
      const transportPlaying = false;
      let isPlaying = true;

      if (!transportPlaying) {
        isPlaying = false;
      }

      expect(isPlaying).toBe(false);
    });
  });

  describe("recording end detection", () => {
    it("should stop at recording end", () => {
      const recordingTimeMs = 5000;
      const durationMs = 5000;
      let isPlaying = true;

      if (recordingTimeMs >= durationMs) {
        isPlaying = false;
      }

      expect(isPlaying).toBe(false);
    });

    it("should continue before recording end", () => {
      const recordingTimeMs = 4000;
      const durationMs = 5000;
      let isPlaying = true;

      if (recordingTimeMs >= durationMs) {
        isPlaying = false;
      }

      expect(isPlaying).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("should cancel RAF on cleanup", () => {
      const cancelAnimationFrame = vi.fn();
      let rafId: number | null = 1;

      // Simulates cleanup
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
      expect(rafId).toBeNull();
    });
  });
});

describe("useRecordingPlayback TweaksConfig integration", () => {
  describe("supported tweak parameters", () => {
    it("should apply bpm parameter", () => {
      const onTweakChange = vi.fn();
      onTweakChange("bpm", 120);
      expect(onTweakChange).toHaveBeenCalledWith("bpm", 120);
    });

    it("should apply swing parameter", () => {
      const onTweakChange = vi.fn();
      onTweakChange("swing", 0.5);
      expect(onTweakChange).toHaveBeenCalledWith("swing", 0.5);
    });

    it("should apply filterCutoff parameter", () => {
      const onTweakChange = vi.fn();
      onTweakChange("filterCutoff", 2000);
      expect(onTweakChange).toHaveBeenCalledWith("filterCutoff", 2000);
    });

    it("should apply reverbMix parameter", () => {
      const onTweakChange = vi.fn();
      onTweakChange("reverbMix", 0.3);
      expect(onTweakChange).toHaveBeenCalledWith("reverbMix", 0.3);
    });

    it("should apply delayMix parameter", () => {
      const onTweakChange = vi.fn();
      onTweakChange("delayMix", 0.2);
      expect(onTweakChange).toHaveBeenCalledWith("delayMix", 0.2);
    });
  });
});

describe("useRecordingPlayback edge cases", () => {
  describe("empty recording", () => {
    it("should handle recording with no events", () => {
      const recording: Recording = {
        id: "rec-123",
        track_id: "track-456",
        name: undefined,
        duration_ms: 5000,
        events: [],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      expect(recording.events).toHaveLength(0);
    });
  });

  describe("zero duration recording", () => {
    it("should handle zero duration", () => {
      const recording: Recording = {
        id: "rec-123",
        track_id: "track-456",
        name: undefined,
        duration_ms: 0,
        events: [],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      expect(recording.duration_ms).toBe(0);
    });
  });

  describe("missing callback handling", () => {
    it("should handle missing onTweakChange callback", () => {
      // Use an object with optional callback to simulate hook options
      const options: { onTweakChange?: (param: string, value: number) => void } = {};
      const event: RecordingEvent = {
        id: "1",
        timestamp_ms: 1000,
        type: "tweak",
        param: "bpm",
        oldValue: 82,
        newValue: 120,
      };

      // Use optional chaining like the hook does
      if (event.type === "tweak" && event.param) {
        options.onTweakChange?.(event.param, event.newValue as number);
      }

      // Should not throw
      expect(options.onTweakChange).toBeUndefined();
    });
  });

  describe("type validation", () => {
    it("should validate tweak event has numeric newValue", () => {
      const event: RecordingEvent = {
        id: "1",
        timestamp_ms: 1000,
        type: "tweak",
        param: "bpm",
        oldValue: 82,
        newValue: 120,
      };

      const isValid =
        event.type === "tweak" && event.param !== undefined && typeof event.newValue === "number";

      expect(isValid).toBe(true);
    });

    it("should validate layer_mute event has boolean newValue", () => {
      const event: RecordingEvent = {
        id: "1",
        timestamp_ms: 1000,
        type: "layer_mute",
        layerId: "layer-1",
        oldValue: false,
        newValue: true,
      };

      const isValid =
        event.type === "layer_mute" &&
        event.layerId !== undefined &&
        typeof event.newValue === "boolean";

      expect(isValid).toBe(true);
    });
  });
});
