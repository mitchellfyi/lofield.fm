import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DEFAULT_RECORDING_STATE,
  createRecordingEvent,
  createRecording,
  getEventsInRange,
  getNextEvent,
  formatRecordingTime,
  getRecordingStats,
  EVENT_TYPE_COLORS,
  TWEAK_PARAM_COLORS,
  type RecordingEvent,
  type Recording,
} from "../recording";

describe("Recording types module", () => {
  describe("module exports", () => {
    it("should export DEFAULT_RECORDING_STATE constant", async () => {
      const recordingModule = await import("../recording");
      expect(recordingModule.DEFAULT_RECORDING_STATE).toBeDefined();
      expect(typeof recordingModule.DEFAULT_RECORDING_STATE).toBe("object");
    });

    it("should export createRecordingEvent function", async () => {
      const recordingModule = await import("../recording");
      expect(recordingModule.createRecordingEvent).toBeDefined();
      expect(typeof recordingModule.createRecordingEvent).toBe("function");
    });

    it("should export createRecording function", async () => {
      const recordingModule = await import("../recording");
      expect(recordingModule.createRecording).toBeDefined();
      expect(typeof recordingModule.createRecording).toBe("function");
    });

    it("should export getEventsInRange function", async () => {
      const recordingModule = await import("../recording");
      expect(recordingModule.getEventsInRange).toBeDefined();
      expect(typeof recordingModule.getEventsInRange).toBe("function");
    });

    it("should export getNextEvent function", async () => {
      const recordingModule = await import("../recording");
      expect(recordingModule.getNextEvent).toBeDefined();
      expect(typeof recordingModule.getNextEvent).toBe("function");
    });

    it("should export formatRecordingTime function", async () => {
      const recordingModule = await import("../recording");
      expect(recordingModule.formatRecordingTime).toBeDefined();
      expect(typeof recordingModule.formatRecordingTime).toBe("function");
    });

    it("should export getRecordingStats function", async () => {
      const recordingModule = await import("../recording");
      expect(recordingModule.getRecordingStats).toBeDefined();
      expect(typeof recordingModule.getRecordingStats).toBe("function");
    });

    it("should export EVENT_TYPE_COLORS constant", async () => {
      const recordingModule = await import("../recording");
      expect(recordingModule.EVENT_TYPE_COLORS).toBeDefined();
      expect(typeof recordingModule.EVENT_TYPE_COLORS).toBe("object");
    });

    it("should export TWEAK_PARAM_COLORS constant", async () => {
      const recordingModule = await import("../recording");
      expect(recordingModule.TWEAK_PARAM_COLORS).toBeDefined();
      expect(typeof recordingModule.TWEAK_PARAM_COLORS).toBe("object");
    });
  });

  describe("DEFAULT_RECORDING_STATE", () => {
    it("should have isRecording set to false", () => {
      expect(DEFAULT_RECORDING_STATE.isRecording).toBe(false);
    });

    it("should have startTime set to 0", () => {
      expect(DEFAULT_RECORDING_STATE.startTime).toBe(0);
    });

    it("should have startPerfTime set to 0", () => {
      expect(DEFAULT_RECORDING_STATE.startPerfTime).toBe(0);
    });

    it("should have empty events array", () => {
      expect(DEFAULT_RECORDING_STATE.events).toEqual([]);
      expect(Array.isArray(DEFAULT_RECORDING_STATE.events)).toBe(true);
    });

    it("should have elapsedMs set to 0", () => {
      expect(DEFAULT_RECORDING_STATE.elapsedMs).toBe(0);
    });

    it("should have exactly 5 properties", () => {
      expect(Object.keys(DEFAULT_RECORDING_STATE)).toHaveLength(5);
    });
  });

  describe("createRecordingEvent", () => {
    beforeEach(() => {
      vi.stubGlobal("crypto", {
        randomUUID: () => "test-uuid-1234",
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should create event with generated UUID", () => {
      const event = createRecordingEvent(1000, "tweak", 82, 100, "bpm");
      expect(event.id).toBe("test-uuid-1234");
    });

    it("should create tweak event with correct properties", () => {
      const event = createRecordingEvent(1500, "tweak", 82, 120, "bpm");
      expect(event.timestamp_ms).toBe(1500);
      expect(event.type).toBe("tweak");
      expect(event.param).toBe("bpm");
      expect(event.oldValue).toBe(82);
      expect(event.newValue).toBe(120);
    });

    it("should create layer_mute event with correct properties", () => {
      const event = createRecordingEvent(2000, "layer_mute", false, true, undefined, "layer-1");
      expect(event.timestamp_ms).toBe(2000);
      expect(event.type).toBe("layer_mute");
      expect(event.layerId).toBe("layer-1");
      expect(event.oldValue).toBe(false);
      expect(event.newValue).toBe(true);
      expect(event.param).toBeUndefined();
    });

    it("should create layer_volume event with correct properties", () => {
      const event = createRecordingEvent(3000, "layer_volume", 0.8, 0.5, undefined, "layer-2");
      expect(event.timestamp_ms).toBe(3000);
      expect(event.type).toBe("layer_volume");
      expect(event.layerId).toBe("layer-2");
      expect(event.oldValue).toBe(0.8);
      expect(event.newValue).toBe(0.5);
    });

    it("should create layer_solo event with correct properties", () => {
      const event = createRecordingEvent(4000, "layer_solo", false, true, undefined, "layer-3");
      expect(event.timestamp_ms).toBe(4000);
      expect(event.type).toBe("layer_solo");
      expect(event.layerId).toBe("layer-3");
      expect(event.oldValue).toBe(false);
      expect(event.newValue).toBe(true);
    });

    it("should handle filter tweak", () => {
      const event = createRecordingEvent(5000, "tweak", 8000, 2000, "filter");
      expect(event.param).toBe("filter");
      expect(event.oldValue).toBe(8000);
      expect(event.newValue).toBe(2000);
    });

    it("should handle all tweak param types", () => {
      const params = ["bpm", "swing", "filter", "reverb", "delay"] as const;
      params.forEach((param) => {
        const event = createRecordingEvent(1000, "tweak", 50, 75, param);
        expect(event.param).toBe(param);
      });
    });
  });

  describe("createRecording", () => {
    beforeEach(() => {
      vi.stubGlobal("crypto", {
        randomUUID: () => "test-recording-uuid",
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should create recording with generated UUID", () => {
      const recording = createRecording("track-1", [], 5000);
      expect(recording.id).toBe("test-recording-uuid");
    });

    it("should create recording with track_id", () => {
      const recording = createRecording("track-123", [], 5000);
      expect(recording.track_id).toBe("track-123");
    });

    it("should create recording with duration_ms", () => {
      const recording = createRecording("track-1", [], 10000);
      expect(recording.duration_ms).toBe(10000);
    });

    it("should create recording with optional name", () => {
      const recording = createRecording("track-1", [], 5000, "My Recording");
      expect(recording.name).toBe("My Recording");
    });

    it("should create recording without name when not provided", () => {
      const recording = createRecording("track-1", [], 5000);
      expect(recording.name).toBeUndefined();
    });

    it("should sort events by timestamp", () => {
      const events: RecordingEvent[] = [
        { id: "e3", timestamp_ms: 3000, type: "tweak", param: "bpm", oldValue: 82, newValue: 90 },
        { id: "e1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
        {
          id: "e2",
          timestamp_ms: 2000,
          type: "tweak",
          param: "filter",
          oldValue: 8000,
          newValue: 5000,
        },
      ];

      const recording = createRecording("track-1", events, 5000);
      expect(recording.events[0].id).toBe("e1");
      expect(recording.events[1].id).toBe("e2");
      expect(recording.events[2].id).toBe("e3");
    });

    it("should not modify original events array", () => {
      const events: RecordingEvent[] = [
        { id: "e2", timestamp_ms: 2000, type: "tweak", param: "bpm", oldValue: 82, newValue: 90 },
        { id: "e1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
      ];
      const originalOrder = [...events];

      createRecording("track-1", events, 3000);

      expect(events[0].id).toBe(originalOrder[0].id);
      expect(events[1].id).toBe(originalOrder[1].id);
    });
  });

  describe("getEventsInRange", () => {
    const testEvents: RecordingEvent[] = [
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
      { id: "e4", timestamp_ms: 4000, type: "tweak", param: "reverb", oldValue: 25, newValue: 50 },
      { id: "e5", timestamp_ms: 5000, type: "tweak", param: "delay", oldValue: 20, newValue: 40 },
    ];

    it("should return events within the range (inclusive)", () => {
      const result = getEventsInRange(testEvents, 2000, 4000);
      expect(result).toHaveLength(3);
      expect(result.map((e) => e.id)).toEqual(["e2", "e3", "e4"]);
    });

    it("should return empty array when no events in range", () => {
      const result = getEventsInRange(testEvents, 6000, 7000);
      expect(result).toHaveLength(0);
    });

    it("should include events at exact boundaries", () => {
      const result = getEventsInRange(testEvents, 2000, 2000);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("e2");
    });

    it("should return all events when range covers everything", () => {
      const result = getEventsInRange(testEvents, 0, 10000);
      expect(result).toHaveLength(5);
    });

    it("should handle empty events array", () => {
      const result = getEventsInRange([], 0, 5000);
      expect(result).toHaveLength(0);
    });

    it("should handle inverted range (returns empty)", () => {
      const result = getEventsInRange(testEvents, 5000, 1000);
      expect(result).toHaveLength(0);
    });
  });

  describe("getNextEvent", () => {
    const testEvents: RecordingEvent[] = [
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
    ];

    it("should return the first event after given timestamp", () => {
      const result = getNextEvent(testEvents, 500);
      expect(result?.id).toBe("e1");
    });

    it("should return second event when first is at or before timestamp", () => {
      const result = getNextEvent(testEvents, 1000);
      expect(result?.id).toBe("e2");
    });

    it("should return undefined when no events after timestamp", () => {
      const result = getNextEvent(testEvents, 3500);
      expect(result).toBeUndefined();
    });

    it("should return undefined for empty events array", () => {
      const result = getNextEvent([], 0);
      expect(result).toBeUndefined();
    });

    it("should handle exact timestamp match (returns next)", () => {
      const result = getNextEvent(testEvents, 2000);
      expect(result?.id).toBe("e3");
    });
  });

  describe("formatRecordingTime", () => {
    it("should format 0 ms as 00:00", () => {
      expect(formatRecordingTime(0)).toBe("00:00");
    });

    it("should format 1 second as 00:01", () => {
      expect(formatRecordingTime(1000)).toBe("00:01");
    });

    it("should format 59 seconds as 00:59", () => {
      expect(formatRecordingTime(59000)).toBe("00:59");
    });

    it("should format 1 minute as 01:00", () => {
      expect(formatRecordingTime(60000)).toBe("01:00");
    });

    it("should format 1:30 correctly", () => {
      expect(formatRecordingTime(90000)).toBe("01:30");
    });

    it("should format 10 minutes as 10:00", () => {
      expect(formatRecordingTime(600000)).toBe("10:00");
    });

    it("should handle fractional milliseconds (floor)", () => {
      expect(formatRecordingTime(1500)).toBe("00:01");
      expect(formatRecordingTime(1999)).toBe("00:01");
    });

    it("should pad single digit minutes", () => {
      expect(formatRecordingTime(120000)).toBe("02:00");
    });

    it("should pad single digit seconds", () => {
      expect(formatRecordingTime(5000)).toBe("00:05");
    });

    it("should handle large durations", () => {
      expect(formatRecordingTime(3600000)).toBe("60:00"); // 1 hour
    });
  });

  describe("EVENT_TYPE_COLORS", () => {
    it("should have color for tweak type", () => {
      expect(EVENT_TYPE_COLORS.tweak).toBeDefined();
      expect(typeof EVENT_TYPE_COLORS.tweak).toBe("string");
    });

    it("should have color for layer_mute type", () => {
      expect(EVENT_TYPE_COLORS.layer_mute).toBeDefined();
      expect(typeof EVENT_TYPE_COLORS.layer_mute).toBe("string");
    });

    it("should have color for layer_volume type", () => {
      expect(EVENT_TYPE_COLORS.layer_volume).toBeDefined();
      expect(typeof EVENT_TYPE_COLORS.layer_volume).toBe("string");
    });

    it("should have color for layer_solo type", () => {
      expect(EVENT_TYPE_COLORS.layer_solo).toBeDefined();
      expect(typeof EVENT_TYPE_COLORS.layer_solo).toBe("string");
    });

    it("should have all 4 event types", () => {
      expect(Object.keys(EVENT_TYPE_COLORS)).toHaveLength(4);
    });

    it("should have valid hex color format", () => {
      Object.values(EVENT_TYPE_COLORS).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe("TWEAK_PARAM_COLORS", () => {
    it("should have color for bpm param", () => {
      expect(TWEAK_PARAM_COLORS.bpm).toBeDefined();
      expect(typeof TWEAK_PARAM_COLORS.bpm).toBe("string");
    });

    it("should have color for swing param", () => {
      expect(TWEAK_PARAM_COLORS.swing).toBeDefined();
      expect(typeof TWEAK_PARAM_COLORS.swing).toBe("string");
    });

    it("should have color for filter param", () => {
      expect(TWEAK_PARAM_COLORS.filter).toBeDefined();
      expect(typeof TWEAK_PARAM_COLORS.filter).toBe("string");
    });

    it("should have color for reverb param", () => {
      expect(TWEAK_PARAM_COLORS.reverb).toBeDefined();
      expect(typeof TWEAK_PARAM_COLORS.reverb).toBe("string");
    });

    it("should have color for delay param", () => {
      expect(TWEAK_PARAM_COLORS.delay).toBeDefined();
      expect(typeof TWEAK_PARAM_COLORS.delay).toBe("string");
    });

    it("should have all 5 tweak params", () => {
      expect(Object.keys(TWEAK_PARAM_COLORS)).toHaveLength(5);
    });

    it("should have valid hex color format", () => {
      Object.values(TWEAK_PARAM_COLORS).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe("getRecordingStats", () => {
    it("should return correct totalEvents count", () => {
      const recording: Recording = {
        id: "r1",
        track_id: "t1",
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
        created_at: "2026-01-24T00:00:00Z",
        updated_at: "2026-01-24T00:00:00Z",
      };

      const stats = getRecordingStats(recording);
      expect(stats.totalEvents).toBe(3);
    });

    it("should count events by type correctly", () => {
      const recording: Recording = {
        id: "r1",
        track_id: "t1",
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
          {
            id: "e4",
            timestamp_ms: 4000,
            type: "layer_volume",
            layerId: "l1",
            oldValue: 0.8,
            newValue: 0.5,
          },
          {
            id: "e5",
            timestamp_ms: 5000,
            type: "layer_mute",
            layerId: "l2",
            oldValue: false,
            newValue: true,
          },
        ],
        created_at: "2026-01-24T00:00:00Z",
        updated_at: "2026-01-24T00:00:00Z",
      };

      const stats = getRecordingStats(recording);
      expect(stats.eventsByType.tweak).toBe(2);
      expect(stats.eventsByType.layer_mute).toBe(2);
      expect(stats.eventsByType.layer_volume).toBe(1);
    });

    it("should count events by param correctly", () => {
      const recording: Recording = {
        id: "r1",
        track_id: "t1",
        duration_ms: 10000,
        events: [
          { id: "e1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
          { id: "e2", timestamp_ms: 2000, type: "tweak", param: "bpm", oldValue: 85, newValue: 90 },
          {
            id: "e3",
            timestamp_ms: 3000,
            type: "tweak",
            param: "filter",
            oldValue: 8000,
            newValue: 5000,
          },
          {
            id: "e4",
            timestamp_ms: 4000,
            type: "layer_mute",
            layerId: "l1",
            oldValue: false,
            newValue: true,
          },
        ],
        created_at: "2026-01-24T00:00:00Z",
        updated_at: "2026-01-24T00:00:00Z",
      };

      const stats = getRecordingStats(recording);
      expect(stats.eventsByParam.bpm).toBe(2);
      expect(stats.eventsByParam.filter).toBe(1);
      expect(stats.eventsByParam.layer_mute).toBeUndefined(); // layer_mute has no param
    });

    it("should calculate average events per second", () => {
      const recording: Recording = {
        id: "r1",
        track_id: "t1",
        duration_ms: 10000, // 10 seconds
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
          { id: "e3", timestamp_ms: 3000, type: "tweak", param: "bpm", oldValue: 85, newValue: 90 },
          {
            id: "e4",
            timestamp_ms: 4000,
            type: "tweak",
            param: "filter",
            oldValue: 5000,
            newValue: 3000,
          },
          { id: "e5", timestamp_ms: 5000, type: "tweak", param: "bpm", oldValue: 90, newValue: 95 },
        ],
        created_at: "2026-01-24T00:00:00Z",
        updated_at: "2026-01-24T00:00:00Z",
      };

      const stats = getRecordingStats(recording);
      expect(stats.averageEventsPerSecond).toBe(0.5); // 5 events / 10 seconds
    });

    it("should return correct first and last event timestamps", () => {
      const recording: Recording = {
        id: "r1",
        track_id: "t1",
        duration_ms: 10000,
        events: [
          { id: "e2", timestamp_ms: 5000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
          {
            id: "e1",
            timestamp_ms: 1000,
            type: "tweak",
            param: "filter",
            oldValue: 8000,
            newValue: 5000,
          },
          { id: "e3", timestamp_ms: 8000, type: "tweak", param: "bpm", oldValue: 85, newValue: 90 },
        ],
        created_at: "2026-01-24T00:00:00Z",
        updated_at: "2026-01-24T00:00:00Z",
      };

      const stats = getRecordingStats(recording);
      expect(stats.firstEventMs).toBe(1000);
      expect(stats.lastEventMs).toBe(8000);
    });

    it("should handle empty events array", () => {
      const recording: Recording = {
        id: "r1",
        track_id: "t1",
        duration_ms: 10000,
        events: [],
        created_at: "2026-01-24T00:00:00Z",
        updated_at: "2026-01-24T00:00:00Z",
      };

      const stats = getRecordingStats(recording);
      expect(stats.totalEvents).toBe(0);
      expect(stats.eventsByType).toEqual({});
      expect(stats.eventsByParam).toEqual({});
      expect(stats.averageEventsPerSecond).toBe(0);
      expect(stats.firstEventMs).toBeNull();
      expect(stats.lastEventMs).toBeNull();
    });

    it("should handle zero duration recording", () => {
      const recording: Recording = {
        id: "r1",
        track_id: "t1",
        duration_ms: 0,
        events: [
          { id: "e1", timestamp_ms: 0, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
        ],
        created_at: "2026-01-24T00:00:00Z",
        updated_at: "2026-01-24T00:00:00Z",
      };

      const stats = getRecordingStats(recording);
      expect(stats.averageEventsPerSecond).toBe(0); // Division by zero handled
    });
  });
});
