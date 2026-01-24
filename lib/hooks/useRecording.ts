"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  type RecordingState,
  type RecordingEvent,
  type RecordingEventType,
  DEFAULT_RECORDING_STATE,
  createRecordingEvent,
  createRecording,
} from "@/lib/types/recording";
import type { TweaksConfig } from "@/lib/types/tweaks";
import { getVisualizationBridge } from "@/lib/audio/visualizationBridge";

/** Debounce window in ms for rapid parameter changes */
const EVENT_DEBOUNCE_MS = 50;

export interface UseRecordingResult {
  /** Current recording state */
  state: RecordingState;
  /** Whether recording is active */
  isRecording: boolean;
  /** Start recording (requires playback to be active) */
  startRecording: () => void;
  /** Stop recording and return the captured events */
  stopRecording: () => RecordingEvent[];
  /** Capture a tweak parameter change */
  captureTweak: (
    param: keyof TweaksConfig,
    oldValue: number,
    newValue: number
  ) => void;
  /** Capture a layer mute toggle */
  captureLayerMute: (layerId: string, oldValue: boolean, newValue: boolean) => void;
  /** Capture a layer volume change */
  captureLayerVolume: (layerId: string, oldValue: number, newValue: number) => void;
  /** Capture a layer solo toggle */
  captureLayerSolo: (layerId: string, oldValue: boolean, newValue: boolean) => void;
  /** Clear the current recording */
  clearRecording: () => void;
  /** Get a Recording object ready to save (requires trackId) */
  getRecordingForSave: (trackId: string, name?: string) => ReturnType<typeof createRecording>;
  /** Elapsed recording time in ms */
  elapsedMs: number;
}

/**
 * Hook for managing recording state and capturing parameter changes
 *
 * Uses the visualization bridge's transport state for timing to ensure
 * recorded events are synchronized with audio playback position.
 */
export function useRecording(): UseRecordingResult {
  const [state, setState] = useState<RecordingState>(DEFAULT_RECORDING_STATE);

  // Refs for debouncing rapid changes
  const lastEventTimeRef = useRef<Map<string, number>>(new Map());
  const lastEventValueRef = useRef<Map<string, number | boolean>>(new Map());

  // RAF for elapsed time updates
  const rafIdRef = useRef<number | null>(null);

  // Update elapsed time while recording
  useEffect(() => {
    if (!state.isRecording) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const updateElapsed = () => {
      const now = performance.now();
      const elapsed = now - state.startPerfTime;
      setState((prev) => ({ ...prev, elapsedMs: elapsed }));
      rafIdRef.current = requestAnimationFrame(updateElapsed);
    };

    rafIdRef.current = requestAnimationFrame(updateElapsed);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [state.isRecording, state.startPerfTime]);

  /**
   * Start recording - captures the current transport time as the reference point
   */
  const startRecording = useCallback(() => {
    const bridge = getVisualizationBridge();
    const transport = bridge.getTransportSnapshot();

    setState({
      isRecording: true,
      startTime: transport.seconds,
      startPerfTime: performance.now(),
      events: [],
      elapsedMs: 0,
    });

    // Clear debounce state
    lastEventTimeRef.current.clear();
    lastEventValueRef.current.clear();
  }, []);

  /**
   * Stop recording and return captured events
   */
  const stopRecording = useCallback((): RecordingEvent[] => {
    const events = [...state.events];

    setState((prev) => ({
      ...prev,
      isRecording: false,
    }));

    return events;
  }, [state.events]);

  /**
   * Generic event capture with debouncing
   */
  const captureEvent = useCallback(
    (
      type: RecordingEventType,
      oldValue: number | boolean,
      newValue: number | boolean,
      param?: keyof TweaksConfig,
      layerId?: string
    ) => {
      if (!state.isRecording) return;

      const now = performance.now();
      const key = `${type}-${param || ""}-${layerId || ""}`;

      // Check debounce window
      const lastTime = lastEventTimeRef.current.get(key) || 0;
      if (now - lastTime < EVENT_DEBOUNCE_MS) {
        // Update the last event's newValue instead of creating a new one
        setState((prev) => {
          const events = [...prev.events];
          const lastEventIndex = events.findIndex(
            (e) =>
              e.type === type &&
              e.param === param &&
              e.layerId === layerId &&
              e.timestamp_ms >= prev.elapsedMs - EVENT_DEBOUNCE_MS
          );
          if (lastEventIndex >= 0) {
            events[lastEventIndex] = {
              ...events[lastEventIndex],
              newValue,
            };
          }
          return { ...prev, events };
        });
        lastEventTimeRef.current.set(key, now);
        lastEventValueRef.current.set(key, newValue);
        return;
      }

      // Use the last known value as oldValue for better continuity
      const effectiveOldValue = lastEventValueRef.current.get(key) ?? oldValue;

      // Calculate timestamp relative to recording start
      const timestamp_ms = now - state.startPerfTime;

      const event = createRecordingEvent(
        timestamp_ms,
        type,
        effectiveOldValue,
        newValue,
        param,
        layerId
      );

      setState((prev) => ({
        ...prev,
        events: [...prev.events, event],
      }));

      lastEventTimeRef.current.set(key, now);
      lastEventValueRef.current.set(key, newValue);
    },
    [state.isRecording, state.startPerfTime]
  );

  /**
   * Capture a tweak parameter change
   */
  const captureTweak = useCallback(
    (param: keyof TweaksConfig, oldValue: number, newValue: number) => {
      captureEvent("tweak", oldValue, newValue, param);
    },
    [captureEvent]
  );

  /**
   * Capture a layer mute toggle
   */
  const captureLayerMute = useCallback(
    (layerId: string, oldValue: boolean, newValue: boolean) => {
      captureEvent("layer_mute", oldValue, newValue, undefined, layerId);
    },
    [captureEvent]
  );

  /**
   * Capture a layer volume change
   */
  const captureLayerVolume = useCallback(
    (layerId: string, oldValue: number, newValue: number) => {
      captureEvent("layer_volume", oldValue, newValue, undefined, layerId);
    },
    [captureEvent]
  );

  /**
   * Capture a layer solo toggle
   */
  const captureLayerSolo = useCallback(
    (layerId: string, oldValue: boolean, newValue: boolean) => {
      captureEvent("layer_solo", oldValue, newValue, undefined, layerId);
    },
    [captureEvent]
  );

  /**
   * Clear the current recording
   */
  const clearRecording = useCallback(() => {
    setState(DEFAULT_RECORDING_STATE);
    lastEventTimeRef.current.clear();
    lastEventValueRef.current.clear();
  }, []);

  /**
   * Get a Recording object ready to save
   */
  const getRecordingForSave = useCallback(
    (trackId: string, name?: string) => {
      return createRecording(trackId, state.events, state.elapsedMs, name);
    },
    [state.events, state.elapsedMs]
  );

  return {
    state,
    isRecording: state.isRecording,
    startRecording,
    stopRecording,
    captureTweak,
    captureLayerMute,
    captureLayerVolume,
    captureLayerSolo,
    clearRecording,
    getRecordingForSave,
    elapsedMs: state.elapsedMs,
  };
}
