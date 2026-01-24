/**
 * Recording export module - export recordings to various formats
 *
 * Supports:
 * - JSON export (human-readable with formatted timestamps)
 * - Audio export with recorded automation applied
 */

import type { Recording, RecordingEvent } from "@/lib/types/recording";
import type { TweaksConfig } from "@/lib/types/tweaks";
import { formatRecordingTime } from "@/lib/types/recording";

/**
 * Export recording to JSON file
 */
export function exportRecordingToJson(recording: Recording): Blob {
  // Create a more readable format with formatted timestamps
  const exportData = {
    name: recording.name || "Untitled Recording",
    track_id: recording.track_id,
    duration_ms: recording.duration_ms,
    duration_formatted: formatRecordingTime(recording.duration_ms),
    event_count: recording.events.length,
    created_at: recording.created_at,
    updated_at: recording.updated_at,
    events: recording.events.map((event) => ({
      ...event,
      timestamp_formatted: formatRecordingTime(event.timestamp_ms),
    })),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  return new Blob([jsonString], { type: "application/json" });
}

/**
 * Generate a filename for the recording export
 */
export function generateRecordingFilename(recording: Recording, extension: "json" | "csv"): string {
  const sanitizedName = (recording.name || "recording")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const timestamp = new Date().toISOString().split("T")[0];
  return `${sanitizedName}-${timestamp}.${extension}`;
}

/**
 * Export recording events to CSV format
 */
export function exportRecordingToCsv(recording: Recording): Blob {
  const headers = [
    "timestamp_ms",
    "timestamp_formatted",
    "type",
    "param",
    "layer_id",
    "old_value",
    "new_value",
  ];

  const rows = recording.events.map((event) => [
    event.timestamp_ms.toString(),
    formatRecordingTime(event.timestamp_ms),
    event.type,
    event.param || "",
    event.layerId || "",
    String(event.oldValue),
    String(event.newValue),
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  return new Blob([csvContent], { type: "text/csv" });
}

/**
 * Trigger a browser download of a blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import recording from JSON file
 */
export async function importRecordingFromJson(file: File): Promise<Partial<Recording>> {
  const text = await file.text();
  const data = JSON.parse(text);

  // Validate basic structure
  if (!Array.isArray(data.events)) {
    throw new Error("Invalid recording file: missing events array");
  }

  if (typeof data.duration_ms !== "number") {
    throw new Error("Invalid recording file: missing duration_ms");
  }

  // Validate and clean events
  const events: RecordingEvent[] = data.events.map((event: unknown, index: number) => {
    const e = event as Record<string, unknown>;
    if (typeof e.timestamp_ms !== "number") {
      throw new Error(`Invalid event at index ${index}: missing timestamp_ms`);
    }
    if (
      !e.type ||
      !["tweak", "layer_mute", "layer_volume", "layer_solo"].includes(e.type as string)
    ) {
      throw new Error(`Invalid event at index ${index}: invalid type`);
    }

    return {
      id: (e.id as string) || crypto.randomUUID(),
      timestamp_ms: e.timestamp_ms as number,
      type: e.type as RecordingEvent["type"],
      param: e.param as keyof TweaksConfig | undefined,
      layerId: e.layerId as string | undefined,
      oldValue: e.oldValue as number | boolean,
      newValue: e.newValue as number | boolean,
    };
  });

  return {
    name: (data.name as string) || "Imported Recording",
    duration_ms: data.duration_ms,
    events,
  };
}

/**
 * Merge multiple recordings into a single recording
 * Events are offset by the cumulative duration of previous recordings
 */
export function mergeRecordings(recordings: Recording[]): Partial<Recording> {
  if (recordings.length === 0) {
    return {
      duration_ms: 0,
      events: [],
    };
  }

  if (recordings.length === 1) {
    return {
      name: recordings[0].name,
      duration_ms: recordings[0].duration_ms,
      events: [...recordings[0].events],
    };
  }

  let cumulativeOffset = 0;
  const mergedEvents: RecordingEvent[] = [];

  for (const recording of recordings) {
    const offsetEvents = recording.events.map((event) => ({
      ...event,
      id: crypto.randomUUID(), // Generate new IDs to avoid conflicts
      timestamp_ms: event.timestamp_ms + cumulativeOffset,
    }));
    mergedEvents.push(...offsetEvents);
    cumulativeOffset += recording.duration_ms;
  }

  // Sort by timestamp
  mergedEvents.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  return {
    name: `Merged (${recordings.length} recordings)`,
    duration_ms: cumulativeOffset,
    events: mergedEvents,
  };
}

/**
 * Trim a recording to a specific time range
 */
export function trimRecording(
  recording: Recording,
  startMs: number,
  endMs: number
): Partial<Recording> {
  const clampedStart = Math.max(0, startMs);
  const clampedEnd = Math.min(recording.duration_ms, endMs);

  if (clampedStart >= clampedEnd) {
    return {
      name: recording.name,
      duration_ms: 0,
      events: [],
    };
  }

  const trimmedEvents = recording.events
    .filter((event) => event.timestamp_ms >= clampedStart && event.timestamp_ms <= clampedEnd)
    .map((event) => ({
      ...event,
      timestamp_ms: event.timestamp_ms - clampedStart,
    }));

  return {
    name: recording.name,
    duration_ms: clampedEnd - clampedStart,
    events: trimmedEvents,
  };
}

// Re-export getRecordingStats from types for convenience
export { getRecordingStats, type RecordingStats } from "@/lib/types/recording";
