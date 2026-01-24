/**
 * Recording - Capture and playback of live performance parameter changes
 *
 * Enables recording of parameter tweaks during playback to create automation
 * lanes that can be saved, edited, and exported.
 */

import type { TweaksConfig } from "./tweaks";

/**
 * Types of events that can be recorded
 */
export type RecordingEventType =
  | "tweak" // Parameter tweak (BPM, filter, etc.)
  | "layer_mute" // Layer mute toggle
  | "layer_volume" // Layer volume change
  | "layer_solo"; // Layer solo toggle

/**
 * A single recorded event capturing a parameter change at a specific time
 */
export interface RecordingEvent {
  /** Unique identifier for this event */
  id: string;
  /** Time offset from recording start in milliseconds */
  timestamp_ms: number;
  /** Type of event */
  type: RecordingEventType;
  /** For tweak events: which parameter was changed */
  param?: keyof TweaksConfig;
  /** For layer events: which layer was affected */
  layerId?: string;
  /** Previous value before the change */
  oldValue: number | boolean;
  /** New value after the change */
  newValue: number | boolean;
}

/**
 * A complete recording session with all captured events
 */
export interface Recording {
  /** Unique identifier */
  id: string;
  /** Associated track ID */
  track_id: string;
  /** User-defined name for the recording */
  name?: string;
  /** Total duration of the recording in milliseconds */
  duration_ms: number;
  /** Array of recorded events sorted by timestamp */
  events: RecordingEvent[];
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Recording state for the useRecording hook
 */
export interface RecordingState {
  /** Whether recording is currently active */
  isRecording: boolean;
  /** Transport time (seconds) when recording started */
  startTime: number;
  /** Performance.now() when recording started (for high-precision timing) */
  startPerfTime: number;
  /** Events captured during this recording session */
  events: RecordingEvent[];
  /** Elapsed time in milliseconds since recording started */
  elapsedMs: number;
}

/**
 * Default/empty recording state
 */
export const DEFAULT_RECORDING_STATE: RecordingState = {
  isRecording: false,
  startTime: 0,
  startPerfTime: 0,
  events: [],
  elapsedMs: 0,
};

/**
 * Create a new recording event with a generated ID
 */
export function createRecordingEvent(
  timestamp_ms: number,
  type: RecordingEventType,
  oldValue: number | boolean,
  newValue: number | boolean,
  param?: keyof TweaksConfig,
  layerId?: string
): RecordingEvent {
  return {
    id: crypto.randomUUID(),
    timestamp_ms,
    type,
    param,
    layerId,
    oldValue,
    newValue,
  };
}

/**
 * Create a new recording from captured events
 */
export function createRecording(
  trackId: string,
  events: RecordingEvent[],
  durationMs: number,
  name?: string
): Omit<Recording, "created_at" | "updated_at"> {
  return {
    id: crypto.randomUUID(),
    track_id: trackId,
    name,
    duration_ms: durationMs,
    events: [...events].sort((a, b) => a.timestamp_ms - b.timestamp_ms),
  };
}

/**
 * Get events within a time range (useful for partial playback)
 */
export function getEventsInRange(
  events: RecordingEvent[],
  startMs: number,
  endMs: number
): RecordingEvent[] {
  return events.filter((e) => e.timestamp_ms >= startMs && e.timestamp_ms <= endMs);
}

/**
 * Get the next event after a given timestamp
 */
export function getNextEvent(
  events: RecordingEvent[],
  afterMs: number
): RecordingEvent | undefined {
  return events.find((e) => e.timestamp_ms > afterMs);
}

/**
 * Format elapsed time as MM:SS
 */
export function formatRecordingTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Color mapping for different event types (for timeline visualization)
 */
export const EVENT_TYPE_COLORS: Record<RecordingEventType, string> = {
  tweak: "#06b6d4", // cyan-500
  layer_mute: "#f59e0b", // amber-500
  layer_volume: "#10b981", // emerald-500
  layer_solo: "#8b5cf6", // violet-500
};

/**
 * Color mapping for specific tweak parameters
 */
export const TWEAK_PARAM_COLORS: Record<keyof TweaksConfig, string> = {
  bpm: "#06b6d4", // cyan-500
  swing: "#14b8a6", // teal-500
  filter: "#f59e0b", // amber-500
  reverb: "#8b5cf6", // violet-500
  delay: "#ec4899", // pink-500
};
