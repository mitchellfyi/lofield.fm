/**
 * Audio export module - renders Tone.js code to audio files
 * Uses OfflineAudioContext for faster-than-realtime rendering
 */

import * as Tone from "tone";
import { encodeWav } from "./wavEncoder";
import type { ExportFormat, ExportProgress } from "./types";

/** Options for audio export */
export interface AudioExportOptions {
  format: ExportFormat;
  duration: number; // in seconds
  sampleRate?: number;
  onProgress?: (progress: ExportProgress) => void;
}

/** Default sample rate for exports */
const DEFAULT_SAMPLE_RATE = 44100;

/**
 * Render Tone.js code to an audio file
 * @param code - The Tone.js code to render
 * @param options - Export options
 * @returns A Blob containing the audio file
 */
export async function renderAudio(
  code: string,
  options: AudioExportOptions
): Promise<Blob> {
  const {
    format,
    duration,
    sampleRate = DEFAULT_SAMPLE_RATE,
    onProgress,
  } = options;

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

  try {
    // Create a proxy that tracks all new Tone.js object instantiations
    // and binds them to the offline context
    const createOfflineTrackedTone = () => {
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
                return instance;
              },
            });
          }
          return value;
        },
      });
    };

    reportProgress("preparing", 25, "Evaluating code...");

    const trackedTone = createOfflineTrackedTone();

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
