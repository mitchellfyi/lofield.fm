/**
 * React hooks for visualization state
 *
 * Uses useSyncExternalStore for efficient React 18+ integration
 */

'use client';

import { useSyncExternalStore, useCallback, useRef, useEffect, useState } from 'react';
import {
  getVisualizationBridge,
  TransportState,
  TriggerEvent,
  AudioAnalysisData,
} from './visualizationBridge';

const DEFAULT_TRANSPORT_STATE: TransportState = {
  position: '0:0:0',
  seconds: 0,
  bpm: 120,
  playing: false,
  bar: 1,
  beat: 1,
  progress: 0,
};

const EMPTY_SET = new Set<number>();

const DEFAULT_AUDIO_ANALYSIS: AudioAnalysisData = {
  fft: new Float32Array(64),
  waveform: new Float32Array(256),
  rms: 0,
};

/**
 * Hook for transport state (position, BPM, playing)
 */
export function useTransportState(): TransportState {
  const bridge = getVisualizationBridge();

  return useSyncExternalStore(
    bridge.subscribeTransport,
    bridge.getTransportSnapshot,
    // Server snapshot
    () => DEFAULT_TRANSPORT_STATE
  );
}

/**
 * Hook for active line numbers (for code highlighting)
 * Returns a Set of line numbers that are currently "active" (triggered recently)
 */
export function useActiveLines(): Set<number> {
  const bridge = getVisualizationBridge();

  // We need to handle the Set specially since it's a reference type
  // useSyncExternalStore doesn't deep compare, so we use the Set directly
  return useSyncExternalStore(
    bridge.subscribeTriggers,
    bridge.getActiveLinesSnapshot,
    // Server snapshot
    () => EMPTY_SET
  );
}

/**
 * Hook for trigger events (recent note/chord triggers)
 */
export function useTriggerEvents(): TriggerEvent[] {
  const bridge = getVisualizationBridge();
  const [events, setEvents] = useState<TriggerEvent[]>([]);

  useEffect(() => {
    const update = () => {
      setEvents(bridge.getTriggerEvents());
    };

    // Initial update
    update();

    // Subscribe
    const unsubscribe = bridge.subscribeTriggers(update);
    return unsubscribe;
  }, [bridge]);

  return events;
}

/**
 * Hook for bridge lifecycle management
 * Call this in the main page component to start/stop the bridge
 */
export function useVisualizationBridge() {
  const bridgeRef = useRef(getVisualizationBridge());

  const start = useCallback(() => {
    bridgeRef.current.start();
  }, []);

  const stop = useCallback(() => {
    bridgeRef.current.stop();
  }, []);

  const reset = useCallback(() => {
    bridgeRef.current.reset();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      bridgeRef.current.stop();
      bridgeRef.current.reset();
    };
  }, []);

  return { start, stop, reset };
}

/**
 * Hook for audio analysis data (FFT, waveform, RMS)
 * Updates at 60fps when audio is playing
 */
export function useAudioAnalysis(): AudioAnalysisData {
  const bridge = getVisualizationBridge();

  return useSyncExternalStore(
    bridge.subscribeAnalysis,
    bridge.getAnalysisSnapshot,
    // Server snapshot
    () => DEFAULT_AUDIO_ANALYSIS
  );
}
