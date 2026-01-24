"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import type { Recording, RecordingEvent } from "@/lib/types/recording";
import type { TweaksConfig } from "@/lib/types/tweaks";
import { getVisualizationBridge } from "@/lib/audio/visualizationBridge";

export interface UseRecordingPlaybackOptions {
  /** The recording to play back */
  recording: Recording | null;
  /** Whether playback is enabled */
  enabled?: boolean;
  /** Callback to apply tweak changes */
  onTweakChange?: (param: keyof TweaksConfig, value: number) => void;
  /** Callback to apply layer mute changes */
  onLayerMuteChange?: (layerId: string, muted: boolean) => void;
  /** Callback to apply layer volume changes */
  onLayerVolumeChange?: (layerId: string, volume: number) => void;
  /** Callback to apply layer solo changes */
  onLayerSoloChange?: (layerId: string, soloed: boolean) => void;
  /** Callback when an event is triggered (for visualization) */
  onEventTriggered?: (event: RecordingEvent) => void;
}

export interface UseRecordingPlaybackResult {
  /** Whether playback is currently active */
  isPlaying: boolean;
  /** Current playback position in ms */
  currentTimeMs: number;
  /** Start playback from current position */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Seek to a specific position in ms */
  seek: (positionMs: number) => void;
  /** Reset playback to start */
  reset: () => void;
  /** Index of the next event to apply */
  nextEventIndex: number;
}

/**
 * Hook for playing back recorded automation in sync with audio transport
 *
 * Subscribes to the transport state from VisualizationBridge and triggers
 * recorded events at the correct timestamps relative to the recording start.
 */
export function useRecordingPlayback({
  recording,
  enabled = true,
  onTweakChange,
  onLayerMuteChange,
  onLayerVolumeChange,
  onLayerSoloChange,
  onEventTriggered,
}: UseRecordingPlaybackOptions): UseRecordingPlaybackResult {
  // Use recording ID as a key to reset state when recording changes
  // This avoids calling setState in an effect
  const recordingId = recording?.id ?? null;
  const [stateKey, setStateKey] = useState<string | null>(null);

  // Reset state when recording changes by comparing keys
  const shouldReset = recordingId !== stateKey;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [nextEventIndex, setNextEventIndex] = useState(0);

  // Refs for playback state
  const playbackStartTimeRef = useRef<number>(0); // Transport time when playback started
  const lastAppliedIndexRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);

  // Handle state reset synchronously during render (not in an effect)
  // This is the recommended React pattern for derived state from props
  if (shouldReset) {
    setStateKey(recordingId);
    if (isPlaying) {
      setIsPlaying(false);
    }
    if (currentTimeMs !== 0) {
      setCurrentTimeMs(0);
    }
    if (nextEventIndex !== 0) {
      setNextEventIndex(0);
    }
    // Note: lastAppliedIndexRef will be reset when play() is called
  }

  // Memoize sorted events from recording
  const events = recording?.events;
  const sortedEvents = useMemo(() => {
    if (!events) return [];
    return [...events].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
  }, [events]);

  /**
   * Apply a recorded event to the current state
   */
  const applyEvent = useCallback(
    (event: RecordingEvent) => {
      switch (event.type) {
        case "tweak":
          if (event.param && typeof event.newValue === "number") {
            onTweakChange?.(event.param, event.newValue);
          }
          break;
        case "layer_mute":
          if (event.layerId && typeof event.newValue === "boolean") {
            onLayerMuteChange?.(event.layerId, event.newValue);
          }
          break;
        case "layer_volume":
          if (event.layerId && typeof event.newValue === "number") {
            onLayerVolumeChange?.(event.layerId, event.newValue);
          }
          break;
        case "layer_solo":
          if (event.layerId && typeof event.newValue === "boolean") {
            onLayerSoloChange?.(event.layerId, event.newValue);
          }
          break;
      }
      onEventTriggered?.(event);
    },
    [onTweakChange, onLayerMuteChange, onLayerVolumeChange, onLayerSoloChange, onEventTriggered]
  );

  // Run the playback loop when playing
  useEffect(() => {
    if (!isPlaying || !enabled || !recording || sortedEvents.length === 0) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const tick = () => {
      const bridge = getVisualizationBridge();
      const transport = bridge.getTransportSnapshot();

      if (!transport.playing) {
        // Transport stopped, pause playback
        setIsPlaying(false);
        return;
      }

      // Calculate current position in recording
      const transportTimeMs = transport.seconds * 1000;
      const recordingTimeMs = transportTimeMs - playbackStartTimeRef.current * 1000;

      setCurrentTimeMs(Math.max(0, recordingTimeMs));

      // Find and apply events that should have triggered by now
      for (let i = lastAppliedIndexRef.current + 1; i < sortedEvents.length; i++) {
        const event = sortedEvents[i];
        if (event.timestamp_ms <= recordingTimeMs) {
          applyEvent(event);
          lastAppliedIndexRef.current = i;
          setNextEventIndex(i + 1);
        } else {
          // Events are sorted, so we can stop here
          break;
        }
      }

      // Check if we've reached the end of the recording
      if (recordingTimeMs >= recording.duration_ms) {
        setIsPlaying(false);
        return;
      }

      // Schedule next tick
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, enabled, recording, sortedEvents, applyEvent]);

  /**
   * Start playback from current position
   */
  const play = useCallback(() => {
    if (!recording || !enabled) return;

    const bridge = getVisualizationBridge();
    const transport = bridge.getTransportSnapshot();

    if (!transport.playing) {
      // Transport not playing, can't sync
      return;
    }

    // Set start reference time and reset event tracking
    playbackStartTimeRef.current = transport.seconds - currentTimeMs / 1000;
    lastAppliedIndexRef.current = nextEventIndex - 1;
    setIsPlaying(true);
  }, [recording, enabled, currentTimeMs, nextEventIndex]);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  /**
   * Seek to a specific position in the recording
   */
  const seek = useCallback(
    (positionMs: number) => {
      if (!recording) return;

      const clampedPosition = Math.max(0, Math.min(positionMs, recording.duration_ms));
      setCurrentTimeMs(clampedPosition);

      // Find the event index at this position
      let newIndex = 0;
      for (let i = 0; i < sortedEvents.length; i++) {
        if (sortedEvents[i].timestamp_ms > clampedPosition) {
          break;
        }
        newIndex = i + 1;
      }
      setNextEventIndex(newIndex);
      lastAppliedIndexRef.current = newIndex - 1;

      // Update start reference time if playing
      if (isPlaying) {
        const bridge = getVisualizationBridge();
        const transport = bridge.getTransportSnapshot();
        playbackStartTimeRef.current = transport.seconds - clampedPosition / 1000;
      }
    },
    [recording, sortedEvents, isPlaying]
  );

  /**
   * Reset playback to start
   */
  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTimeMs(0);
    setNextEventIndex(0);
    lastAppliedIndexRef.current = -1;
  }, []);

  return {
    isPlaying,
    currentTimeMs,
    play,
    pause,
    seek,
    reset,
    nextEventIndex,
  };
}
