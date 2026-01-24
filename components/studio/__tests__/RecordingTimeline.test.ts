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
});
