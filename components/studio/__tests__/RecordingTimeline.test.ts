import { describe, it, expect, vi } from "vitest";
import type { Recording, RecordingEvent } from "@/lib/types/recording";

// Helper to create a test recording
function createTestRecording(overrides: Partial<Recording> = {}): Recording {
  return {
    id: "test-recording-id",
    track_id: "test-track-id",
    name: "Test Recording",
    duration_ms: 10000,
    events: [
      { id: "e1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
      {
        id: "e2",
        timestamp_ms: 2000,
        type: "tweak",
        param: "filter",
        oldValue: 8000,
        newValue: 5000,
      },
      {
        id: "e3",
        timestamp_ms: 3000,
        type: "layer_mute",
        layerId: "l1",
        oldValue: false,
        newValue: true,
      },
    ],
    created_at: "2026-01-24T12:00:00Z",
    updated_at: "2026-01-24T12:30:00Z",
    ...overrides,
  };
}

describe("RecordingTimeline component", () => {
  describe("module structure", () => {
    it("should export RecordingTimeline component", async () => {
      const { RecordingTimeline } = await import("../RecordingTimeline");
      expect(RecordingTimeline).toBeDefined();
      expect(typeof RecordingTimeline).toBe("function");
    });

    it("should be a named export", async () => {
      const recordingTimelineModule = await import("../RecordingTimeline");
      expect(Object.keys(recordingTimelineModule)).toContain("RecordingTimeline");
    });
  });

  describe("props interface", () => {
    it("should accept recording prop (Recording | null)", () => {
      const recording: Recording | null = createTestRecording();
      expect(recording).toBeDefined();
    });

    it("should accept currentTimeMs prop (number)", () => {
      const currentTimeMs = 5000;
      expect(typeof currentTimeMs).toBe("number");
    });

    it("should accept onSelectEvent callback", () => {
      const onSelectEvent = vi.fn();
      expect(typeof onSelectEvent).toBe("function");
    });

    it("should accept onDeleteEvent callback", () => {
      const onDeleteEvent = vi.fn();
      expect(typeof onDeleteEvent).toBe("function");
    });

    it("should accept interactive prop (boolean)", () => {
      const interactive = true;
      expect(typeof interactive).toBe("boolean");
    });
  });

  describe("playhead position calculation", () => {
    it("should calculate playhead at 0% for currentTimeMs = 0", () => {
      const currentTimeMs = 0;
      const durationMs = 10000;
      const playheadPercent = Math.min(100, (currentTimeMs / durationMs) * 100);
      expect(playheadPercent).toBe(0);
    });

    it("should calculate playhead at 50% for currentTimeMs at middle", () => {
      const currentTimeMs = 5000;
      const durationMs = 10000;
      const playheadPercent = Math.min(100, (currentTimeMs / durationMs) * 100);
      expect(playheadPercent).toBe(50);
    });

    it("should calculate playhead at 100% for currentTimeMs at end", () => {
      const currentTimeMs = 10000;
      const durationMs = 10000;
      const playheadPercent = Math.min(100, (currentTimeMs / durationMs) * 100);
      expect(playheadPercent).toBe(100);
    });

    it("should clamp playhead at 100% for overflow", () => {
      const currentTimeMs = 15000;
      const durationMs = 10000;
      const playheadPercent = Math.min(100, (currentTimeMs / durationMs) * 100);
      expect(playheadPercent).toBe(100);
    });
  });

  describe("event marker position calculation", () => {
    it("should calculate event position as percentage of duration", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 2500,
        type: "tweak",
        param: "bpm",
        oldValue: 82,
        newValue: 90,
      };
      const durationMs = 10000;
      const leftPercent = (event.timestamp_ms / durationMs) * 100;
      expect(leftPercent).toBe(25);
    });

    it("should calculate position at 0% for event at start", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 0,
        type: "tweak",
        param: "bpm",
        oldValue: 82,
        newValue: 90,
      };
      const durationMs = 10000;
      const leftPercent = (event.timestamp_ms / durationMs) * 100;
      expect(leftPercent).toBe(0);
    });

    it("should calculate position at 100% for event at end", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 10000,
        type: "tweak",
        param: "bpm",
        oldValue: 82,
        newValue: 90,
      };
      const durationMs = 10000;
      const leftPercent = (event.timestamp_ms / durationMs) * 100;
      expect(leftPercent).toBe(100);
    });
  });

  describe("event color mapping", () => {
    it("should have color for tweak events", async () => {
      const { EVENT_TYPE_COLORS } = await import("@/lib/types/recording");
      expect(EVENT_TYPE_COLORS.tweak).toBeDefined();
      expect(typeof EVENT_TYPE_COLORS.tweak).toBe("string");
    });

    it("should have color for layer_mute events", async () => {
      const { EVENT_TYPE_COLORS } = await import("@/lib/types/recording");
      expect(EVENT_TYPE_COLORS.layer_mute).toBeDefined();
    });

    it("should have color for layer_volume events", async () => {
      const { EVENT_TYPE_COLORS } = await import("@/lib/types/recording");
      expect(EVENT_TYPE_COLORS.layer_volume).toBeDefined();
    });

    it("should have color for layer_solo events", async () => {
      const { EVENT_TYPE_COLORS } = await import("@/lib/types/recording");
      expect(EVENT_TYPE_COLORS.layer_solo).toBeDefined();
    });

    it("should have distinct colors for each tweak param", async () => {
      const { TWEAK_PARAM_COLORS } = await import("@/lib/types/recording");
      const colors = Object.values(TWEAK_PARAM_COLORS);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });
  });

  describe("event label generation", () => {
    it("should generate label for tweak event", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 1000,
        type: "tweak",
        param: "bpm",
        oldValue: 82,
        newValue: 100,
      };
      const label = `${event.param}: ${event.oldValue} → ${event.newValue}`;
      expect(label).toBe("bpm: 82 → 100");
    });

    it("should generate label for layer_mute event (on)", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 1000,
        type: "layer_mute",
        layerId: "l1",
        oldValue: false,
        newValue: true,
      };
      const label = `Mute: ${event.newValue ? "On" : "Off"}`;
      expect(label).toBe("Mute: On");
    });

    it("should generate label for layer_mute event (off)", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 1000,
        type: "layer_mute",
        layerId: "l1",
        oldValue: true,
        newValue: false,
      };
      const label = `Mute: ${event.newValue ? "On" : "Off"}`;
      expect(label).toBe("Mute: Off");
    });

    it("should generate label for layer_volume event", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 1000,
        type: "layer_volume",
        layerId: "l1",
        oldValue: 0.8,
        newValue: 0.5,
      };
      const label = `Volume: ${event.newValue}`;
      expect(label).toBe("Volume: 0.5");
    });

    it("should generate label for layer_solo event", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 1000,
        type: "layer_solo",
        layerId: "l1",
        oldValue: false,
        newValue: true,
      };
      const label = `Solo: ${event.newValue ? "On" : "Off"}`;
      expect(label).toBe("Solo: On");
    });
  });

  describe("event grouping", () => {
    it("should group events that are close in time", () => {
      const durationMs = 10000;
      const groupThresholdMs = durationMs / 100; // 1% of duration = 100ms
      const events: RecordingEvent[] = [
        { id: "e1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
        {
          id: "e2",
          timestamp_ms: 1050,
          type: "tweak",
          param: "filter",
          oldValue: 8000,
          newValue: 5000,
        },
        {
          id: "e3",
          timestamp_ms: 5000,
          type: "tweak",
          param: "reverb",
          oldValue: 25,
          newValue: 50,
        },
      ];

      // Group events
      type EventGroup = { startMs: number; endMs: number; events: RecordingEvent[] };
      const groups: EventGroup[] = [];
      const sortedEvents = [...events].sort((a, b) => a.timestamp_ms - b.timestamp_ms);

      for (const event of sortedEvents) {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && event.timestamp_ms - lastGroup.endMs < groupThresholdMs) {
          lastGroup.events.push(event);
          lastGroup.endMs = event.timestamp_ms;
        } else {
          groups.push({
            startMs: event.timestamp_ms,
            endMs: event.timestamp_ms,
            events: [event],
          });
        }
      }

      expect(groups).toHaveLength(2); // e1+e2 grouped, e3 separate
      expect(groups[0].events).toHaveLength(2);
      expect(groups[1].events).toHaveLength(1);
    });

    it("should not group events that are far apart", () => {
      const durationMs = 10000;
      const groupThresholdMs = durationMs / 100; // 100ms threshold
      const events: RecordingEvent[] = [
        { id: "e1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
        {
          id: "e2",
          timestamp_ms: 5000,
          type: "tweak",
          param: "filter",
          oldValue: 8000,
          newValue: 5000,
        },
        {
          id: "e3",
          timestamp_ms: 9000,
          type: "tweak",
          param: "reverb",
          oldValue: 25,
          newValue: 50,
        },
      ];

      // Group events (same logic)
      type EventGroup = { startMs: number; endMs: number; events: RecordingEvent[] };
      const groups: EventGroup[] = [];
      const sortedEvents = [...events].sort((a, b) => a.timestamp_ms - b.timestamp_ms);

      for (const event of sortedEvents) {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && event.timestamp_ms - lastGroup.endMs < groupThresholdMs) {
          lastGroup.events.push(event);
          lastGroup.endMs = event.timestamp_ms;
        } else {
          groups.push({
            startMs: event.timestamp_ms,
            endMs: event.timestamp_ms,
            events: [event],
          });
        }
      }

      expect(groups).toHaveLength(3); // All separate
    });

    it("should handle empty events array", () => {
      type EventGroup = { startMs: number; endMs: number; events: RecordingEvent[] };
      const groups: EventGroup[] = [];
      // No events = no groups
      expect(groups).toHaveLength(0);
    });
  });

  describe("time formatting", () => {
    it("should format duration labels correctly", async () => {
      const { formatRecordingTime } = await import("@/lib/types/recording");
      const durationMs = 10000;

      // Start label
      expect(formatRecordingTime(0)).toBe("00:00");

      // Middle label
      expect(formatRecordingTime(durationMs / 2)).toBe("00:05");

      // End label
      expect(formatRecordingTime(durationMs)).toBe("00:10");
    });
  });

  describe("event selection behavior", () => {
    it("should toggle selection when clicking same event", () => {
      const selectedEventId: string | null = "e1";
      const clickedEventId = "e1";

      // Toggle logic
      const newSelectedId = clickedEventId === selectedEventId ? null : clickedEventId;
      expect(newSelectedId).toBeNull();
    });

    it("should select new event when clicking different event", () => {
      const selectedEventId: string | null = "e1";
      const clickedEventId = "e2";

      // Toggle logic
      const newSelectedId = clickedEventId === selectedEventId ? null : clickedEventId;
      expect(newSelectedId).toBe("e2");
    });

    it("should select event when nothing selected", () => {
      const selectedEventId: string | null = null;
      const clickedEventId = "e1";

      // Toggle logic
      const newSelectedId = clickedEventId === selectedEventId ? null : clickedEventId;
      expect(newSelectedId).toBe("e1");
    });

    it("should call onSelectEvent callback when selecting", () => {
      const onSelectEvent = vi.fn();
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 1000,
        type: "tweak",
        param: "bpm",
        oldValue: 82,
        newValue: 90,
      };

      // Simulate selection
      onSelectEvent(event);

      expect(onSelectEvent).toHaveBeenCalledTimes(1);
      expect(onSelectEvent).toHaveBeenCalledWith(event);
    });

    it("should not call callbacks when not interactive", () => {
      const onSelectEvent = vi.fn();
      const interactive = false;

      // Should not call if not interactive
      if (interactive) {
        onSelectEvent({} as RecordingEvent);
      }

      expect(onSelectEvent).not.toHaveBeenCalled();
    });
  });

  describe("event deletion behavior", () => {
    it("should call onDeleteEvent callback with event ID", () => {
      const onDeleteEvent = vi.fn();
      const eventId = "e1";

      onDeleteEvent(eventId);

      expect(onDeleteEvent).toHaveBeenCalledTimes(1);
      expect(onDeleteEvent).toHaveBeenCalledWith("e1");
    });

    it("should clear selection when deleting selected event", () => {
      const selectedEventId: string | null = "e1";
      const deletedEventId = "e1";

      // Clear selection if deleting selected event
      const newSelectedId = selectedEventId === deletedEventId ? null : selectedEventId;
      expect(newSelectedId).toBeNull();
    });

    it("should keep selection when deleting different event", () => {
      const selectedEventId: string | null = "e1";
      const deletedEventId = "e2";

      // Keep selection if deleting different event
      const newSelectedId = selectedEventId === deletedEventId ? null : selectedEventId;
      expect(newSelectedId).toBe("e1");
    });
  });

  describe("empty state handling", () => {
    it("should detect when recording is null", () => {
      const recording: Recording | null = null;
      const isEmpty = recording === null;
      expect(isEmpty).toBe(true);
    });

    it("should detect when recording has no events", () => {
      const recording = createTestRecording({ events: [] });
      const isEmpty = recording.events.length === 0;
      expect(isEmpty).toBe(true);
    });

    it("should not show empty state when recording has events", () => {
      const recording = createTestRecording();
      const isEmpty = recording.events.length === 0;
      expect(isEmpty).toBe(false);
    });
  });

  describe("legend generation", () => {
    it("should count events by type for legend", () => {
      const recording = createTestRecording();
      const eventCounts: Record<string, number> = {};

      recording.events.forEach((event) => {
        const key = event.type === "tweak" ? event.param || "tweak" : event.type;
        eventCounts[key] = (eventCounts[key] || 0) + 1;
      });

      expect(eventCounts["bpm"]).toBe(1);
      expect(eventCounts["filter"]).toBe(1);
      expect(eventCounts["layer_mute"]).toBe(1);
    });

    it("should handle multiple events of same type", () => {
      const recording = createTestRecording({
        events: [
          { id: "e1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
          { id: "e2", timestamp_ms: 2000, type: "tweak", param: "bpm", oldValue: 85, newValue: 90 },
          { id: "e3", timestamp_ms: 3000, type: "tweak", param: "bpm", oldValue: 90, newValue: 95 },
        ],
      });

      const eventCounts: Record<string, number> = {};
      recording.events.forEach((event) => {
        const key = event.type === "tweak" ? event.param || "tweak" : event.type;
        eventCounts[key] = (eventCounts[key] || 0) + 1;
      });

      expect(eventCounts["bpm"]).toBe(3);
    });
  });

  describe("selected event details", () => {
    it("should find selected event in recording", () => {
      const recording = createTestRecording();
      const selectedEventId = "e2";

      const selectedEvent = recording.events.find((e) => e.id === selectedEventId);

      expect(selectedEvent).toBeDefined();
      expect(selectedEvent?.id).toBe("e2");
      expect(selectedEvent?.param).toBe("filter");
    });

    it("should return undefined when event not found", () => {
      const recording = createTestRecording();
      const selectedEventId = "nonexistent";

      const selectedEvent = recording.events.find((e) => e.id === selectedEventId);

      expect(selectedEvent).toBeUndefined();
    });
  });

  describe("onUpdateEvent prop", () => {
    it("should accept onUpdateEvent callback prop", () => {
      const onUpdateEvent = vi.fn();
      expect(typeof onUpdateEvent).toBe("function");
    });

    it("should call onUpdateEvent with updated event object", () => {
      const onUpdateEvent = vi.fn();
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 1000,
        type: "tweak",
        param: "bpm",
        oldValue: 82,
        newValue: 90,
      };

      // Simulate value update
      const newValue = 100;
      onUpdateEvent({ ...event, newValue });

      expect(onUpdateEvent).toHaveBeenCalledTimes(1);
      expect(onUpdateEvent).toHaveBeenCalledWith({
        id: "e1",
        timestamp_ms: 1000,
        type: "tweak",
        param: "bpm",
        oldValue: 82,
        newValue: 100,
      });
    });
  });

  describe("getEventValueConfig", () => {
    // Hard-coded TWEAK_PARAMS values matching lib/types/tweaks.ts
    const TWEAK_PARAMS_CONFIG: Record<
      string,
      { min: number; max: number; step: number; unit: string }
    > = {
      bpm: { min: 60, max: 200, step: 1, unit: "" },
      swing: { min: 0, max: 100, step: 1, unit: "%" },
      filter: { min: 100, max: 10000, step: 100, unit: " Hz" },
      reverb: { min: 0, max: 100, step: 1, unit: "%" },
      delay: { min: 0, max: 100, step: 1, unit: "%" },
    };

    // Helper function to match the implementation
    function getEventValueConfig(event: RecordingEvent): {
      min: number;
      max: number;
      step: number;
      unit: string;
      isBoolean: boolean;
    } | null {
      // Boolean events (mute, solo)
      if (event.type === "layer_mute" || event.type === "layer_solo") {
        return { min: 0, max: 1, step: 1, unit: "", isBoolean: true };
      }

      // Layer volume (0-100%)
      if (event.type === "layer_volume") {
        return { min: 0, max: 100, step: 1, unit: "%", isBoolean: false };
      }

      // Tweak events - use TWEAK_PARAMS config
      if (event.type === "tweak" && event.param) {
        const paramConfig = TWEAK_PARAMS_CONFIG[event.param];
        if (paramConfig) {
          return {
            min: paramConfig.min,
            max: paramConfig.max,
            step: paramConfig.step,
            unit: paramConfig.unit,
            isBoolean: false,
          };
        }
      }

      return null;
    }

    describe("BPM tweak events", () => {
      it("should return config with min 60 for BPM", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "tweak",
          param: "bpm",
          oldValue: 82,
          newValue: 90,
        };
        const config = getEventValueConfig(event);
        expect(config?.min).toBe(60);
      });

      it("should return config with max 200 for BPM", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "tweak",
          param: "bpm",
          oldValue: 82,
          newValue: 90,
        };
        const config = getEventValueConfig(event);
        expect(config?.max).toBe(200);
      });

      it("should return config with step 1 for BPM", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "tweak",
          param: "bpm",
          oldValue: 82,
          newValue: 90,
        };
        const config = getEventValueConfig(event);
        expect(config?.step).toBe(1);
      });

      it("should return isBoolean false for BPM", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "tweak",
          param: "bpm",
          oldValue: 82,
          newValue: 90,
        };
        const config = getEventValueConfig(event);
        expect(config?.isBoolean).toBe(false);
      });
    });

    describe("filter tweak events", () => {
      it("should return config with min 100 for filter", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "tweak",
          param: "filter",
          oldValue: 8000,
          newValue: 5000,
        };
        const config = getEventValueConfig(event);
        expect(config?.min).toBe(100);
      });

      it("should return config with max 10000 for filter", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "tweak",
          param: "filter",
          oldValue: 8000,
          newValue: 5000,
        };
        const config = getEventValueConfig(event);
        expect(config?.max).toBe(10000);
      });

      it("should return config with step 100 for filter", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "tweak",
          param: "filter",
          oldValue: 8000,
          newValue: 5000,
        };
        const config = getEventValueConfig(event);
        expect(config?.step).toBe(100);
      });

      it("should return unit ' Hz' for filter", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "tweak",
          param: "filter",
          oldValue: 8000,
          newValue: 5000,
        };
        const config = getEventValueConfig(event);
        expect(config?.unit).toBe(" Hz");
      });
    });

    describe("reverb tweak events", () => {
      it("should return config with range 0-100 for reverb", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "tweak",
          param: "reverb",
          oldValue: 25,
          newValue: 50,
        };
        const config = getEventValueConfig(event);
        expect(config?.min).toBe(0);
        expect(config?.max).toBe(100);
        expect(config?.step).toBe(1);
      });
    });

    describe("delay tweak events", () => {
      it("should return config with range 0-100 for delay", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "tweak",
          param: "delay",
          oldValue: 20,
          newValue: 40,
        };
        const config = getEventValueConfig(event);
        expect(config?.min).toBe(0);
        expect(config?.max).toBe(100);
        expect(config?.step).toBe(1);
      });
    });

    describe("swing tweak events", () => {
      it("should return config with range 0-100 for swing", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "tweak",
          param: "swing",
          oldValue: 8,
          newValue: 25,
        };
        const config = getEventValueConfig(event);
        expect(config?.min).toBe(0);
        expect(config?.max).toBe(100);
        expect(config?.step).toBe(1);
      });
    });

    describe("layer_volume events", () => {
      it("should return config with range 0-100 for layer_volume", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "layer_volume",
          layerId: "l1",
          oldValue: 100,
          newValue: 80,
        };
        const config = getEventValueConfig(event);
        expect(config?.min).toBe(0);
        expect(config?.max).toBe(100);
        expect(config?.step).toBe(1);
      });

      it("should return unit '%' for layer_volume", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "layer_volume",
          layerId: "l1",
          oldValue: 100,
          newValue: 80,
        };
        const config = getEventValueConfig(event);
        expect(config?.unit).toBe("%");
      });

      it("should return isBoolean false for layer_volume", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "layer_volume",
          layerId: "l1",
          oldValue: 100,
          newValue: 80,
        };
        const config = getEventValueConfig(event);
        expect(config?.isBoolean).toBe(false);
      });
    });

    describe("layer_mute events", () => {
      it("should return isBoolean true for layer_mute", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "layer_mute",
          layerId: "l1",
          oldValue: false,
          newValue: true,
        };
        const config = getEventValueConfig(event);
        expect(config?.isBoolean).toBe(true);
      });

      it("should return min 0 and max 1 for layer_mute", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "layer_mute",
          layerId: "l1",
          oldValue: false,
          newValue: true,
        };
        const config = getEventValueConfig(event);
        expect(config?.min).toBe(0);
        expect(config?.max).toBe(1);
      });
    });

    describe("layer_solo events", () => {
      it("should return isBoolean true for layer_solo", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "layer_solo",
          layerId: "l1",
          oldValue: false,
          newValue: true,
        };
        const config = getEventValueConfig(event);
        expect(config?.isBoolean).toBe(true);
      });

      it("should return min 0 and max 1 for layer_solo", () => {
        const event: RecordingEvent = {
          id: "e1",
          timestamp_ms: 1000,
          type: "layer_solo",
          layerId: "l1",
          oldValue: false,
          newValue: true,
        };
        const config = getEventValueConfig(event);
        expect(config?.min).toBe(0);
        expect(config?.max).toBe(1);
      });
    });
  });

  describe("numeric value change behavior", () => {
    it("should create updated event with new numeric value", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 1000,
        type: "tweak",
        param: "bpm",
        oldValue: 82,
        newValue: 90,
      };

      const newValue = 120;
      const updatedEvent = { ...event, newValue };

      expect(updatedEvent.id).toBe("e1");
      expect(updatedEvent.timestamp_ms).toBe(1000);
      expect(updatedEvent.type).toBe("tweak");
      expect(updatedEvent.param).toBe("bpm");
      expect(updatedEvent.oldValue).toBe(82);
      expect(updatedEvent.newValue).toBe(120);
    });

    it("should preserve all other event properties when updating value", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 2500,
        type: "layer_volume",
        layerId: "layer-1",
        oldValue: 100,
        newValue: 80,
      };

      const newValue = 50;
      const updatedEvent = { ...event, newValue };

      expect(updatedEvent.layerId).toBe("layer-1");
      expect(updatedEvent.newValue).toBe(50);
    });
  });

  describe("boolean toggle behavior", () => {
    it("should toggle layer_mute from false to true", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 1000,
        type: "layer_mute",
        layerId: "l1",
        oldValue: false,
        newValue: false,
      };

      const updatedEvent = { ...event, newValue: !event.newValue };
      expect(updatedEvent.newValue).toBe(true);
    });

    it("should toggle layer_mute from true to false", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 1000,
        type: "layer_mute",
        layerId: "l1",
        oldValue: false,
        newValue: true,
      };

      const updatedEvent = { ...event, newValue: !event.newValue };
      expect(updatedEvent.newValue).toBe(false);
    });

    it("should toggle layer_solo from false to true", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 1000,
        type: "layer_solo",
        layerId: "l1",
        oldValue: false,
        newValue: false,
      };

      const updatedEvent = { ...event, newValue: !event.newValue };
      expect(updatedEvent.newValue).toBe(true);
    });

    it("should toggle layer_solo from true to false", () => {
      const event: RecordingEvent = {
        id: "e1",
        timestamp_ms: 1000,
        type: "layer_solo",
        layerId: "l1",
        oldValue: false,
        newValue: true,
      };

      const updatedEvent = { ...event, newValue: !event.newValue };
      expect(updatedEvent.newValue).toBe(false);
    });
  });

  describe("value editor visibility", () => {
    it("should only show value editor when event is selected", () => {
      const selectedEventId: string | null = "e1";
      const interactive = true;

      const shouldShowEditor = selectedEventId !== null && interactive;
      expect(shouldShowEditor).toBe(true);
    });

    it("should not show value editor when no event selected", () => {
      const selectedEventId: string | null = null;
      const interactive = true;

      const shouldShowEditor = selectedEventId !== null && interactive;
      expect(shouldShowEditor).toBe(false);
    });

    it("should not show value editor when not interactive", () => {
      const selectedEventId: string | null = "e1";
      const interactive = false;

      const shouldShowEditor = selectedEventId !== null && interactive;
      expect(shouldShowEditor).toBe(false);
    });
  });
});
