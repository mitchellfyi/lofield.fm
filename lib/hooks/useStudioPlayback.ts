"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getAudioRuntime, type PlayerState, type RuntimeEvent } from "@/lib/audio/runtime";
import { validateRawToneCode } from "@/lib/audio/llmContract";
import { useRecording, type UseRecordingResult } from "@/lib/hooks/useRecording";
import { useRecordingPlayback } from "@/lib/hooks/useRecordingPlayback";
import { type TweaksConfig } from "@/lib/types/tweaks";
import type { Recording } from "@/lib/types/recording";
import { injectTweaks } from "@/lib/audio/tweaksInjector";

// Dangerous tokens to reject
const DANGEROUS_TOKENS = [
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "document",
  "localStorage",
  "sessionStorage",
  "import",
  "require",
  "eval",
  "Function",
];

/**
 * Options for useStudioPlayback hook
 */
export interface UseStudioPlaybackOptions {
  /** Callback to show toast notifications */
  showToast: (message: string, type: "info" | "success" | "error") => void;
  /** Current track ID for saving recordings */
  currentTrackId: string | null;
  /** Callback to save a recording */
  saveRecording: (
    durationMs: number,
    events: Recording["events"],
    name?: string
  ) => Promise<Recording | null>;
  /** Get current tweaks config */
  getTweaks: () => TweaksConfig;
  /** Update tweaks config */
  setTweaks: (tweaks: TweaksConfig) => void;
  /** Get current code */
  getCode: () => string;
  /** Set code */
  setCode: (code: string) => void;
}

/**
 * Result from useStudioPlayback hook
 */
export interface UseStudioPlaybackResult {
  // Player state
  playerState: PlayerState;
  runtimeEvents: RuntimeEvent[];
  audioLoaded: boolean;

  // Core playback controls
  playCode: (code: string) => Promise<void>;
  stop: () => void;

  // Validation
  validateCode: (code: string) => boolean;

  // Recording capture state
  isRecording: boolean;
  recordingElapsedMs: number;
  handleStartRecording: () => void;
  handleStopRecording: () => Promise<void>;
  captureTweak: UseRecordingResult["captureTweak"];
  clearRecording: () => void;

  // Recording playback state
  activeRecording: Recording | null;
  setActiveRecording: (recording: Recording | null) => void;
  isPlaybackActive: boolean;
  playbackTimeMs: number;
  startPlayback: () => void;
  pausePlayback: () => void;
  resetPlayback: () => void;

  // Refs for external use
  runtimeRef: React.RefObject<ReturnType<typeof getAudioRuntime>>;
  lastPlayedCodeRef: React.MutableRefObject<string>;
}

/**
 * Hook that manages audio runtime, playback, and recording state coordination.
 * Extracts playback-related state management from the studio page.
 */
export function useStudioPlayback({
  showToast,
  currentTrackId,
  saveRecording,
  getTweaks,
  setTweaks,
  getCode,
  setCode,
}: UseStudioPlaybackOptions): UseStudioPlaybackResult {
  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [runtimeEvents, setRuntimeEvents] = useState<RuntimeEvent[]>([]);
  const audioLoaded = true; // Tone.js is always available as a module

  // Active recording for playback/visualization
  const [activeRecording, setActiveRecording] = useState<Recording | null>(null);

  // Refs
  const runtimeRef = useRef(getAudioRuntime());
  const lastPlayedCodeRef = useRef<string>("");

  // Recording capture hook
  const {
    isRecording,
    startRecording,
    stopRecording,
    captureTweak,
    elapsedMs: recordingElapsedMs,
    getRecordingForSave,
    clearRecording,
  } = useRecording();

  // Callback to apply a single tweak change during playback
  const applyTweakDuringPlayback = useCallback(
    (param: keyof TweaksConfig, value: number) => {
      const currentTweaks = getTweaks();
      const newTweaks = { ...currentTweaks, [param]: value };
      setTweaks(newTweaks);

      const currentCode = getCode();
      const updatedCode = injectTweaks(currentCode, newTweaks);
      setCode(updatedCode);

      // If playing, apply the change live
      if (playerState === "playing") {
        const runtime = runtimeRef.current;
        lastPlayedCodeRef.current = updatedCode;
        runtime.play(updatedCode, true).catch((err) => {
          console.warn("Playback automation error:", err);
        });
      }
    },
    [getTweaks, setTweaks, getCode, setCode, playerState]
  );

  // Recording playback hook
  const {
    isPlaying: isPlaybackActive,
    currentTimeMs: playbackTimeMs,
    play: startPlayback,
    pause: pausePlayback,
    reset: resetPlayback,
  } = useRecordingPlayback({
    recording: activeRecording,
    enabled: playerState === "playing",
    onTweakChange: applyTweakDuringPlayback,
  });

  // Subscribe to runtime state changes
  useEffect(() => {
    const runtime = runtimeRef.current;
    const unsubscribe = runtime.subscribe(() => {
      setPlayerState(runtime.getState());
      setRuntimeEvents(runtime.getEvents());
    });
    return unsubscribe;
  }, []);

  /**
   * Validate code for dangerous tokens.
   */
  const validateCode = useCallback((codeToValidate: string): boolean => {
    for (const token of DANGEROUS_TOKENS) {
      if (codeToValidate.includes(token)) {
        return false;
      }
    }

    // Check for window usage - not allowed in user code
    if (codeToValidate.includes("window")) {
      return false;
    }

    return true;
  }, []);

  /**
   * Play the given code.
   */
  const playCode = useCallback(
    async (codeToPlay: string) => {
      if (!audioLoaded) {
        showToast("Audio system not ready. Please wait.", "error");
        return;
      }

      if (!validateCode(codeToPlay)) {
        showToast("Code contains dangerous tokens", "error");
        return;
      }

      // Validate raw Tone.js code before playing
      const validation = validateRawToneCode(codeToPlay);
      if (!validation.valid) {
        showToast(
          `Code validation failed: ${validation.errors.map((e) => e.message).join(", ")}`,
          "error"
        );
        return;
      }

      try {
        const runtime = runtimeRef.current;
        lastPlayedCodeRef.current = codeToPlay;
        await runtime.play(codeToPlay);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        showToast(`Failed to play: ${errorMsg}`, "error");
      }
    },
    [audioLoaded, validateCode, showToast]
  );

  /**
   * Stop playback.
   */
  const stop = useCallback(() => {
    if (!audioLoaded) {
      showToast("Audio system not ready.", "error");
      return;
    }
    try {
      const runtime = runtimeRef.current;
      runtime.stop();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(`Failed to stop: ${errorMsg}`, "error");
    }
  }, [audioLoaded, showToast]);

  /**
   * Handle starting a recording.
   */
  const handleStartRecording = useCallback(() => {
    if (playerState !== "playing") {
      showToast("Start playback before recording", "error");
      return;
    }
    startRecording();
    showToast("Recording started", "info");
  }, [playerState, startRecording, showToast]);

  /**
   * Handle stopping a recording.
   */
  const handleStopRecording = useCallback(async () => {
    const events = stopRecording();
    if (events.length === 0) {
      showToast("No events recorded", "info");
      clearRecording();
      return;
    }

    // If no track is selected, just show the recording in the timeline
    if (!currentTrackId) {
      const tempRecording = getRecordingForSave("temp");
      setActiveRecording({
        ...tempRecording,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Recording);
      showToast(`Recorded ${events.length} events. Save track to persist.`, "success");
      clearRecording();
      return;
    }

    // Save to database
    const recordingData = getRecordingForSave(currentTrackId);
    const saved = await saveRecording(
      recordingData.duration_ms,
      recordingData.events,
      `Recording ${new Date().toLocaleTimeString()}`
    );

    if (saved) {
      setActiveRecording(saved);
      showToast(`Saved recording with ${events.length} events`, "success");
    } else {
      showToast("Failed to save recording", "error");
    }

    clearRecording();
  }, [
    stopRecording,
    currentTrackId,
    getRecordingForSave,
    saveRecording,
    clearRecording,
    showToast,
  ]);

  return {
    // Player state
    playerState,
    runtimeEvents,
    audioLoaded,

    // Core playback controls
    playCode,
    stop,

    // Validation
    validateCode,

    // Recording capture state
    isRecording,
    recordingElapsedMs,
    handleStartRecording,
    handleStopRecording,
    captureTweak,
    clearRecording,

    // Recording playback state
    activeRecording,
    setActiveRecording,
    isPlaybackActive,
    playbackTimeMs,
    startPlayback,
    pausePlayback,
    resetPlayback,

    // Refs
    runtimeRef,
    lastPlayedCodeRef,
  };
}
