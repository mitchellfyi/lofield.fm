/**
 * Audio export module - renders Tone.js code to audio files
 * Uses OfflineAudioContext for faster-than-realtime rendering
 */

import * as Tone from "tone";
import { encodeWav } from "./wavEncoder";
import type { ExportFormat, ExportProgress } from "./types";
import type { Recording, RecordingEvent } from "@/lib/types/recording";
import type { TweaksConfig } from "@/lib/types/tweaks";

/** Options for audio export */
export interface AudioExportOptions {
  format: ExportFormat;
  duration: number; // in seconds
  sampleRate?: number;
  onProgress?: (progress: ExportProgress) => void;
  /** Optional recording containing automation events to render */
  recording?: Recording;
}

/** Default sample rate for exports */
const DEFAULT_SAMPLE_RATE = 44100;

/** Transport type from Tone.js (using ReturnType since Transport isn't exported as a type) */
type ToneTransport = ReturnType<typeof Tone.getTransport>;

/**
 * Tracked Tone.js objects for automation scheduling
 * These are captured during code execution to allow parameter changes during render
 */
interface TrackedObjects {
  transport: ToneTransport | null;
  masterLowpass: Tone.Filter | null;
  masterReverb: Tone.Reverb | null;
  tapeDelay: Tone.FeedbackDelay | null;
}

/**
 * Schedule automation events from a recording to play during offline render
 * Uses Tone.js parameter automation to change values at specific times
 *
 * @param transport - The offline transport to schedule events on
 * @param events - Recording events to schedule
 * @param objects - Tracked Tone.js objects to apply automation to
 */
export function scheduleAutomationEvents(
  transport: ToneTransport,
  events: RecordingEvent[],
  objects: TrackedObjects
): void {
  // Sort events by timestamp
  const sortedEvents = [...events].sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  for (const event of sortedEvents) {
    if (event.type !== "tweak" || !event.param || typeof event.newValue !== "number") {
      continue;
    }

    // Convert ms to seconds for transport scheduling
    const timeSeconds = event.timestamp_ms / 1000;
    const param = event.param as keyof TweaksConfig;
    const value = event.newValue;

    // Schedule the parameter change at the event time
    transport.schedule(() => {
      applyTweakToObjects(param, value, objects);
    }, timeSeconds);
  }
}

/**
 * Apply a tweak parameter value to the appropriate Tone.js object
 */
function applyTweakToObjects(
  param: keyof TweaksConfig,
  value: number,
  objects: TrackedObjects
): void {
  switch (param) {
    case "bpm":
      // BPM changes mid-render are complex - log warning and skip
      // Changing BPM affects transport timing which can desync events
      console.warn(
        `[audioExport] BPM change to ${value} at runtime skipped - BPM automation not supported in export`
      );
      break;

    case "swing":
      // Swing changes also affect transport timing
      if (objects.transport) {
        objects.transport.swing = value / 100;
      }
      break;

    case "filter":
      if (objects.masterLowpass) {
        // Use rampTo for smooth transitions
        objects.masterLowpass.frequency.rampTo(value, 0.05);
      }
      break;

    case "reverb":
      if (objects.masterReverb) {
        objects.masterReverb.wet.rampTo(value / 100, 0.05);
      }
      break;

    case "delay":
      if (objects.tapeDelay) {
        objects.tapeDelay.wet.rampTo(value / 100, 0.05);
      }
      break;
  }
}

/**
 * Render Tone.js code to an audio file
 * @param code - The Tone.js code to render
 * @param options - Export options
 * @returns A Blob containing the audio file
 */
export async function renderAudio(code: string, options: AudioExportOptions): Promise<Blob> {
  const { format, duration, sampleRate = DEFAULT_SAMPLE_RATE, onProgress, recording } = options;

  const reportProgress = (phase: ExportProgress["phase"], percent: number, message?: string) => {
    onProgress?.({ phase, percent, message });
  };

  reportProgress("preparing", 0, "Setting up offline audio context...");

  // Calculate total samples
  const numSamples = Math.ceil(duration * sampleRate);

  // Create offline audio context
  const offlineCtx = new OfflineAudioContext(2, numSamples, sampleRate);

  reportProgress("preparing", 10, "Initializing Tone.js with offline context...");

  // Create a temporary Tone.js context with the offline context
  const offlineToneContext = new Tone.Context(offlineCtx);

  // Store disposables for cleanup
  const disposables: Array<{ dispose: () => void }> = [];

  // Track named objects for automation (populated by code evaluation)
  const trackedObjects: TrackedObjects = {
    transport: null,
    masterLowpass: null,
    masterReverb: null,
    tapeDelay: null,
  };

  try {
    // Create a proxy that tracks all new Tone.js object instantiations
    // and binds them to the offline context
    const createOfflineTrackedTone = (objectTracker: TrackedObjects) => {
      return new Proxy(Tone, {
        get(target, prop: string) {
          const value = (target as Record<string, unknown>)[prop];

          // Handle Transport specially - need to use the offline context's transport
          if (prop === "Transport" || prop === "getTransport") {
            if (prop === "Transport") {
              return offlineToneContext.transport;
            }
            return () => offlineToneContext.transport;
          }

          // Handle getContext to return offline context
          if (prop === "getContext") {
            return () => offlineToneContext;
          }

          // Handle Destination to route to offline context destination
          if (prop === "Destination" || prop === "getDestination") {
            if (prop === "Destination") {
              return offlineToneContext.destination;
            }
            return () => offlineToneContext.destination;
          }

          // If it's a constructor (starts with capital letter), wrap it to track instances
          // and set the context to offline
          if (typeof value === "function" && /^[A-Z]/.test(prop)) {
            const constructorName = prop;
            return new Proxy(value, {
              construct(constructorTarget, args): object {
                // Create instance with offline context
                const instance = new (constructorTarget as new (...args: unknown[]) => object)(
                  ...args
                );

                // Set the context to offline if possible
                if (
                  instance &&
                  typeof (instance as { context?: Tone.Context }).context !== "undefined"
                ) {
                  try {
                    // Many Tone objects inherit from ToneWithContext
                    Object.defineProperty(instance, "context", {
                      value: offlineToneContext,
                      writable: false,
                    });
                  } catch {
                    // Some objects may not allow context modification
                  }
                }

                // Track anything with a dispose method
                if (
                  instance &&
                  typeof (instance as { dispose?: () => void }).dispose === "function"
                ) {
                  disposables.push(instance as { dispose: () => void });
                }

                // Capture specific object types for automation
                // We capture the first instance of each type as the "master" effect
                if (constructorName === "Filter" && !objectTracker.masterLowpass) {
                  objectTracker.masterLowpass = instance as Tone.Filter;
                } else if (constructorName === "Reverb" && !objectTracker.masterReverb) {
                  objectTracker.masterReverb = instance as Tone.Reverb;
                } else if (constructorName === "FeedbackDelay" && !objectTracker.tapeDelay) {
                  objectTracker.tapeDelay = instance as Tone.FeedbackDelay;
                }

                return instance;
              },
            });
          }
          return value;
        },
      });
    };

    reportProgress("preparing", 25, "Evaluating code...");

    const trackedTone = createOfflineTrackedTone(trackedObjects);

    // Execute the code with tracked Tone
    const playFunction = new Function("Tone", code);
    playFunction(trackedTone);

    reportProgress("preparing", 40, "Waiting for effects to initialize...");

    // Wait for effects (especially Reverb) to be ready
    const reverbs = disposables.filter((obj) => obj instanceof Tone.Reverb) as Tone.Reverb[];
    if (reverbs.length > 0) {
      await Promise.all(reverbs.map((r) => r.ready));
    }

    reportProgress("preparing", 50, "Starting transport...");

    // Configure and start transport
    const transport = offlineToneContext.transport;
    transport.loop = false; // Don't loop for export
    transport.position = 0;

    // Set transport reference for automation
    trackedObjects.transport = transport;

    // Schedule automation events from recording if provided
    if (recording && recording.events.length > 0) {
      reportProgress("preparing", 52, "Scheduling automation events...");
      scheduleAutomationEvents(transport, recording.events, trackedObjects);
    }

    transport.start(0);

    // Schedule transport stop at duration
    transport.schedule(() => {
      transport.stop();
    }, duration);

    reportProgress("rendering", 55, "Rendering audio...");

    // Render the audio
    // Note: OfflineAudioContext.startRendering is synchronous in execution
    // but returns a promise. Progress tracking is limited here.
    const renderedBuffer = await offlineCtx.startRendering();

    reportProgress("rendering", 90, "Audio rendered successfully");

    // Clean up Tone objects
    for (const obj of disposables) {
      try {
        obj.dispose();
      } catch (e) {
        console.warn("Error disposing Tone object during export:", e);
      }
    }

    reportProgress("encoding", 92, "Encoding to file format...");

    // Encode to the requested format
    let blob: Blob;
    if (format === "wav") {
      blob = encodeWav(renderedBuffer);
    } else {
      // MP3 not yet supported - would require lamejs
      throw new Error("MP3 export not yet supported. Please use WAV format.");
    }

    reportProgress("complete", 100, "Export complete");

    return blob;
  } catch (error) {
    // Clean up on error
    for (const obj of disposables) {
      try {
        obj.dispose();
      } catch (e) {
        console.warn("Error disposing during cleanup:", e);
      }
    }
    throw error;
  } finally {
    // Dispose the offline context
    try {
      offlineToneContext.dispose();
    } catch {
      // Ignore dispose errors
    }
  }
}

/**
 * Get estimated file size for a given duration and format
 * @param duration - Duration in seconds
 * @param format - Audio format
 * @param sampleRate - Sample rate (default 44100)
 * @returns Estimated file size in bytes
 */
export function estimateFileSize(
  duration: number,
  format: ExportFormat,
  sampleRate: number = DEFAULT_SAMPLE_RATE
): number {
  const channels = 2; // Stereo
  const bytesPerSample = 2; // 16-bit

  if (format === "wav") {
    // WAV: header (44 bytes) + raw PCM data
    return 44 + duration * sampleRate * channels * bytesPerSample;
  } else {
    // MP3: roughly 128kbps = 16KB per second
    return Math.ceil(duration * 16 * 1024);
  }
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "5.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
