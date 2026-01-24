import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  exportRecordingToJson,
  generateRecordingFilename,
  exportRecordingToCsv,
  mergeRecordings,
  trimRecording,
  getRecordingStats,
} from "../recordingExport";
import type { Recording } from "@/lib/types/recording";

// Helper to read blob as text in test environment
async function blobToText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

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

describe("recordingExport module", () => {
  describe("module exports", () => {
    it("should export exportRecordingToJson function", async () => {
      const recordingExportModule = await import("../recordingExport");
      expect(recordingExportModule.exportRecordingToJson).toBeDefined();
      expect(typeof recordingExportModule.exportRecordingToJson).toBe("function");
    });

    it("should export generateRecordingFilename function", async () => {
      const recordingExportModule = await import("../recordingExport");
      expect(recordingExportModule.generateRecordingFilename).toBeDefined();
      expect(typeof recordingExportModule.generateRecordingFilename).toBe("function");
    });

    it("should export exportRecordingToCsv function", async () => {
      const recordingExportModule = await import("../recordingExport");
      expect(recordingExportModule.exportRecordingToCsv).toBeDefined();
      expect(typeof recordingExportModule.exportRecordingToCsv).toBe("function");
    });

    it("should export importRecordingFromJson function", async () => {
      const recordingExportModule = await import("../recordingExport");
      expect(recordingExportModule.importRecordingFromJson).toBeDefined();
      expect(typeof recordingExportModule.importRecordingFromJson).toBe("function");
    });

    it("should export mergeRecordings function", async () => {
      const recordingExportModule = await import("../recordingExport");
      expect(recordingExportModule.mergeRecordings).toBeDefined();
      expect(typeof recordingExportModule.mergeRecordings).toBe("function");
    });

    it("should export trimRecording function", async () => {
      const recordingExportModule = await import("../recordingExport");
      expect(recordingExportModule.trimRecording).toBeDefined();
      expect(typeof recordingExportModule.trimRecording).toBe("function");
    });

    it("should re-export getRecordingStats function", async () => {
      const recordingExportModule = await import("../recordingExport");
      expect(recordingExportModule.getRecordingStats).toBeDefined();
      expect(typeof recordingExportModule.getRecordingStats).toBe("function");
    });
  });

  describe("exportRecordingToJson", () => {
    it("should return a Blob", () => {
      const recording = createTestRecording();
      const blob = exportRecordingToJson(recording);
      expect(blob).toBeInstanceOf(Blob);
    });

    it("should have application/json MIME type", () => {
      const recording = createTestRecording();
      const blob = exportRecordingToJson(recording);
      expect(blob.type).toBe("application/json");
    });

    it("should include recording name in export", async () => {
      const recording = createTestRecording({ name: "My Session" });
      const blob = exportRecordingToJson(recording);
      const text = await blobToText(blob);
      const data = JSON.parse(text);
      expect(data.name).toBe("My Session");
    });

    it("should use default name for untitled recordings", async () => {
      const recording = createTestRecording({ name: undefined });
      const blob = exportRecordingToJson(recording);
      const text = await blobToText(blob);
      const data = JSON.parse(text);
      expect(data.name).toBe("Untitled Recording");
    });

    it("should include track_id", async () => {
      const recording = createTestRecording({ track_id: "track-123" });
      const blob = exportRecordingToJson(recording);
      const text = await blobToText(blob);
      const data = JSON.parse(text);
      expect(data.track_id).toBe("track-123");
    });

    it("should include duration_ms", async () => {
      const recording = createTestRecording({ duration_ms: 15000 });
      const blob = exportRecordingToJson(recording);
      const text = await blobToText(blob);
      const data = JSON.parse(text);
      expect(data.duration_ms).toBe(15000);
    });

    it("should include duration_formatted", async () => {
      const recording = createTestRecording({ duration_ms: 90000 }); // 1:30
      const blob = exportRecordingToJson(recording);
      const text = await blobToText(blob);
      const data = JSON.parse(text);
      expect(data.duration_formatted).toBe("01:30");
    });

    it("should include event_count", async () => {
      const recording = createTestRecording();
      const blob = exportRecordingToJson(recording);
      const text = await blobToText(blob);
      const data = JSON.parse(text);
      expect(data.event_count).toBe(3);
    });

    it("should include events array with formatted timestamps", async () => {
      const recording = createTestRecording();
      const blob = exportRecordingToJson(recording);
      const text = await blobToText(blob);
      const data = JSON.parse(text);
      expect(data.events).toHaveLength(3);
      expect(data.events[0].timestamp_formatted).toBe("00:01");
      expect(data.events[1].timestamp_formatted).toBe("00:02");
    });

    it("should include timestamps in events", async () => {
      const recording = createTestRecording();
      const blob = exportRecordingToJson(recording);
      const text = await blobToText(blob);
      const data = JSON.parse(text);
      expect(data.created_at).toBe("2026-01-24T12:00:00Z");
      expect(data.updated_at).toBe("2026-01-24T12:30:00Z");
    });

    it("should produce valid JSON", async () => {
      const recording = createTestRecording();
      const blob = exportRecordingToJson(recording);
      const text = await blobToText(blob);
      expect(() => JSON.parse(text)).not.toThrow();
    });

    it("should be prettified (indented)", async () => {
      const recording = createTestRecording();
      const blob = exportRecordingToJson(recording);
      const text = await blobToText(blob);
      expect(text).toContain("\n");
      expect(text).toContain("  "); // Indentation
    });
  });

  describe("generateRecordingFilename", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-24T15:30:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should generate filename with json extension", () => {
      const recording = createTestRecording({ name: "My Session" });
      const filename = generateRecordingFilename(recording, "json");
      expect(filename).toBe("my-session-2026-01-24.json");
    });

    it("should generate filename with csv extension", () => {
      const recording = createTestRecording({ name: "My Session" });
      const filename = generateRecordingFilename(recording, "csv");
      expect(filename).toBe("my-session-2026-01-24.csv");
    });

    it("should sanitize special characters in name", () => {
      const recording = createTestRecording({ name: "My @ Session! #1" });
      const filename = generateRecordingFilename(recording, "json");
      expect(filename).toBe("my-session-1-2026-01-24.json");
    });

    it("should use default name for untitled recordings", () => {
      const recording = createTestRecording({ name: undefined });
      const filename = generateRecordingFilename(recording, "json");
      expect(filename).toBe("recording-2026-01-24.json");
    });

    it("should lowercase the name", () => {
      const recording = createTestRecording({ name: "MySession" });
      const filename = generateRecordingFilename(recording, "json");
      expect(filename).toBe("mysession-2026-01-24.json");
    });

    it("should remove leading and trailing dashes", () => {
      const recording = createTestRecording({ name: "---Session---" });
      const filename = generateRecordingFilename(recording, "json");
      expect(filename).toBe("session-2026-01-24.json");
    });
  });

  describe("exportRecordingToCsv", () => {
    it("should return a Blob", () => {
      const recording = createTestRecording();
      const blob = exportRecordingToCsv(recording);
      expect(blob).toBeInstanceOf(Blob);
    });

    it("should have text/csv MIME type", () => {
      const recording = createTestRecording();
      const blob = exportRecordingToCsv(recording);
      expect(blob.type).toBe("text/csv");
    });

    it("should include header row", async () => {
      const recording = createTestRecording();
      const blob = exportRecordingToCsv(recording);
      const text = await blobToText(blob);
      const lines = text.split("\n");
      expect(lines[0]).toBe(
        "timestamp_ms,timestamp_formatted,type,param,layer_id,old_value,new_value"
      );
    });

    it("should include event rows", async () => {
      const recording = createTestRecording();
      const blob = exportRecordingToCsv(recording);
      const text = await blobToText(blob);
      const lines = text.split("\n");
      expect(lines).toHaveLength(4); // Header + 3 events
    });

    it("should format tweak event correctly", async () => {
      const recording = createTestRecording({
        events: [
          {
            id: "e1",
            timestamp_ms: 1500,
            type: "tweak",
            param: "bpm",
            oldValue: 82,
            newValue: 100,
          },
        ],
      });
      const blob = exportRecordingToCsv(recording);
      const text = await blobToText(blob);
      const lines = text.split("\n");
      expect(lines[1]).toBe("1500,00:01,tweak,bpm,,82,100");
    });

    it("should format layer event correctly", async () => {
      const recording = createTestRecording({
        events: [
          {
            id: "e1",
            timestamp_ms: 2000,
            type: "layer_mute",
            layerId: "layer-1",
            oldValue: false,
            newValue: true,
          },
        ],
      });
      const blob = exportRecordingToCsv(recording);
      const text = await blobToText(blob);
      const lines = text.split("\n");
      expect(lines[1]).toBe("2000,00:02,layer_mute,,layer-1,false,true");
    });

    it("should handle empty events", async () => {
      const recording = createTestRecording({ events: [] });
      const blob = exportRecordingToCsv(recording);
      const text = await blobToText(blob);
      const lines = text.split("\n");
      expect(lines).toHaveLength(1); // Just header
    });
  });

  // Note: importRecordingFromJson tests require full File API with .text() method
  // which is not available in the test environment. These tests would need
  // a browser environment or polyfill to run properly.

  describe("mergeRecordings", () => {
    beforeEach(() => {
      let uuidCounter = 0;
      vi.stubGlobal("crypto", {
        randomUUID: () => `merged-uuid-${++uuidCounter}`,
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should return empty recording for empty input", () => {
      const result = mergeRecordings([]);
      expect(result.duration_ms).toBe(0);
      expect(result.events).toEqual([]);
    });

    it("should return copy of single recording (preserves event IDs)", () => {
      const recording = createTestRecording({
        name: "Solo",
        duration_ms: 5000,
        events: [
          { id: "e1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
        ],
      });

      const result = mergeRecordings([recording]);
      expect(result.name).toBe("Solo");
      expect(result.duration_ms).toBe(5000);
      expect(result.events).toHaveLength(1);
      // Single recording copies events directly without regenerating UUIDs
      expect(result.events![0].id).toBe("e1");
    });

    it("should merge two recordings with offset timestamps", () => {
      const rec1 = createTestRecording({
        duration_ms: 5000,
        events: [
          { id: "e1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
        ],
      });
      const rec2 = createTestRecording({
        duration_ms: 3000,
        events: [
          {
            id: "e2",
            timestamp_ms: 500,
            type: "tweak",
            param: "filter",
            oldValue: 8000,
            newValue: 5000,
          },
        ],
      });

      const result = mergeRecordings([rec1, rec2]);
      expect(result.duration_ms).toBe(8000); // 5000 + 3000
      expect(result.events).toHaveLength(2);
      expect(result.events![0].timestamp_ms).toBe(1000); // From rec1
      expect(result.events![1].timestamp_ms).toBe(5500); // 500 + 5000 offset
    });

    it("should generate new UUIDs when merging multiple recordings", () => {
      const rec1 = createTestRecording({
        duration_ms: 2000,
        events: [
          {
            id: "original-id-1",
            timestamp_ms: 1000,
            type: "tweak",
            param: "bpm",
            oldValue: 82,
            newValue: 85,
          },
        ],
      });
      const rec2 = createTestRecording({
        duration_ms: 2000,
        events: [
          {
            id: "original-id-2",
            timestamp_ms: 500,
            type: "tweak",
            param: "filter",
            oldValue: 8000,
            newValue: 5000,
          },
        ],
      });

      const result = mergeRecordings([rec1, rec2]);
      // When merging multiple recordings, new UUIDs are generated
      expect(result.events![0].id).not.toBe("original-id-1");
      expect(result.events![1].id).not.toBe("original-id-2");
      expect(result.events![0].id).toMatch(/^merged-uuid-/);
      expect(result.events![1].id).toMatch(/^merged-uuid-/);
    });

    it("should sort events by timestamp after merging", () => {
      const rec1 = createTestRecording({
        duration_ms: 10000,
        events: [
          { id: "e1", timestamp_ms: 8000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
        ],
      });
      const rec2 = createTestRecording({
        duration_ms: 5000,
        events: [
          {
            id: "e2",
            timestamp_ms: 1000,
            type: "tweak",
            param: "filter",
            oldValue: 8000,
            newValue: 5000,
          },
        ],
      });

      const result = mergeRecordings([rec1, rec2]);
      expect(result.events![0].timestamp_ms).toBe(8000); // From rec1
      expect(result.events![1].timestamp_ms).toBe(11000); // 1000 + 10000 offset from rec2
    });

    it("should create descriptive name for merged recordings", () => {
      const rec1 = createTestRecording({ duration_ms: 2000, events: [] });
      const rec2 = createTestRecording({ duration_ms: 3000, events: [] });
      const rec3 = createTestRecording({ duration_ms: 1000, events: [] });

      const result = mergeRecordings([rec1, rec2, rec3]);
      expect(result.name).toBe("Merged (3 recordings)");
    });

    it("should handle recordings with no events", () => {
      const rec1 = createTestRecording({ duration_ms: 5000, events: [] });
      const rec2 = createTestRecording({ duration_ms: 3000, events: [] });

      const result = mergeRecordings([rec1, rec2]);
      expect(result.duration_ms).toBe(8000);
      expect(result.events).toHaveLength(0);
    });
  });

  describe("trimRecording", () => {
    it("should trim events to time range", () => {
      const recording = createTestRecording({
        duration_ms: 10000,
        events: [
          { id: "e1", timestamp_ms: 1000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
          {
            id: "e2",
            timestamp_ms: 3000,
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
          {
            id: "e4",
            timestamp_ms: 8000,
            type: "tweak",
            param: "delay",
            oldValue: 20,
            newValue: 40,
          },
        ],
      });

      const result = trimRecording(recording, 2000, 6000);
      expect(result.events).toHaveLength(2); // e2 and e3
      expect(result.events![0].id).toBe("e2");
      expect(result.events![1].id).toBe("e3");
    });

    it("should offset timestamps relative to new start", () => {
      const recording = createTestRecording({
        duration_ms: 10000,
        events: [
          { id: "e1", timestamp_ms: 3000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
          {
            id: "e2",
            timestamp_ms: 5000,
            type: "tweak",
            param: "filter",
            oldValue: 8000,
            newValue: 5000,
          },
        ],
      });

      const result = trimRecording(recording, 2000, 6000);
      expect(result.events![0].timestamp_ms).toBe(1000); // 3000 - 2000
      expect(result.events![1].timestamp_ms).toBe(3000); // 5000 - 2000
    });

    it("should calculate new duration from trim range", () => {
      const recording = createTestRecording({ duration_ms: 10000, events: [] });

      const result = trimRecording(recording, 2000, 7000);
      expect(result.duration_ms).toBe(5000); // 7000 - 2000
    });

    it("should clamp start to 0", () => {
      const recording = createTestRecording({ duration_ms: 10000, events: [] });

      const result = trimRecording(recording, -5000, 5000);
      expect(result.duration_ms).toBe(5000); // Clamped to 0-5000
    });

    it("should clamp end to recording duration", () => {
      const recording = createTestRecording({ duration_ms: 10000, events: [] });

      const result = trimRecording(recording, 5000, 20000);
      expect(result.duration_ms).toBe(5000); // Clamped to 5000-10000
    });

    it("should return empty result for inverted range", () => {
      const recording = createTestRecording({
        duration_ms: 10000,
        events: [
          { id: "e1", timestamp_ms: 5000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
        ],
      });

      const result = trimRecording(recording, 6000, 4000);
      expect(result.duration_ms).toBe(0);
      expect(result.events).toHaveLength(0);
    });

    it("should preserve recording name", () => {
      const recording = createTestRecording({ name: "Original Name" });

      const result = trimRecording(recording, 0, 5000);
      expect(result.name).toBe("Original Name");
    });

    it("should include events at exact boundaries", () => {
      const recording = createTestRecording({
        duration_ms: 10000,
        events: [
          { id: "e1", timestamp_ms: 2000, type: "tweak", param: "bpm", oldValue: 82, newValue: 85 },
          {
            id: "e2",
            timestamp_ms: 5000,
            type: "tweak",
            param: "filter",
            oldValue: 8000,
            newValue: 5000,
          },
        ],
      });

      const result = trimRecording(recording, 2000, 5000);
      expect(result.events).toHaveLength(2);
    });
  });

  describe("getRecordingStats (re-export)", () => {
    it("should be the same function as the one from types", async () => {
      const typesModule = await import("@/lib/types/recording");
      expect(getRecordingStats).toBe(typesModule.getRecordingStats);
    });
  });
});
