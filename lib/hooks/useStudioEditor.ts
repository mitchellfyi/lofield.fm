"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useHistory } from "@/lib/hooks/useHistory";
import { type TweaksConfig, DEFAULT_TWEAKS } from "@/lib/types/tweaks";
import { type AudioLayer, DEFAULT_LAYERS } from "@/lib/types/audioLayer";
import { extractTweaks, injectTweaks } from "@/lib/audio/tweaksInjector";
import { combineLayers } from "@/lib/audio/layerCombiner";
import { validateRawToneCode } from "@/lib/audio/llmContract";
import { getAudioRuntime, type PlayerState } from "@/lib/audio/runtime";
import { DEFAULT_CODE } from "@/lib/audio/defaultCode";

/**
 * Snapshot of editor state for undo/redo history.
 * Captures everything needed to restore the composition state.
 */
export interface HistorySnapshot {
  code: string;
  layers: AudioLayer[];
  tweaks: TweaksConfig;
  selectedLayerId: string | null;
}

/**
 * Create the initial history snapshot.
 */
export function createInitialSnapshot(): HistorySnapshot {
  return {
    code: DEFAULT_CODE,
    layers: [{ ...DEFAULT_LAYERS[0], code: DEFAULT_CODE }],
    tweaks: DEFAULT_TWEAKS,
    selectedLayerId: DEFAULT_LAYERS[0]?.id || null,
  };
}

/**
 * Options for useStudioEditor hook
 */
export interface UseStudioEditorOptions {
  /** Player state from runtime for live updates */
  playerState: PlayerState;
  /** Callback when validation errors change */
  onValidationError?: (errors: string[]) => void;
  /** Ref to the audio runtime */
  runtimeRef: React.RefObject<ReturnType<typeof getAudioRuntime>>;
  /** Whether recording is active (for capturing tweak changes) */
  isRecording?: boolean;
  /** Callback to capture tweak changes during recording */
  onCaptureTweak?: (param: keyof TweaksConfig, oldValue: number, newValue: number) => void;
  /** Ref to track last played code */
  lastPlayedCodeRef: React.MutableRefObject<string>;
}

/**
 * Result from useStudioEditor hook
 */
export interface UseStudioEditorResult {
  // Code state
  code: string;
  setCode: (code: string) => void;
  validationErrors: string[];
  setValidationErrors: (errors: string[]) => void;

  // Live mode
  liveMode: boolean;
  setLiveMode: (enabled: boolean) => void;

  // Layers state
  layers: AudioLayer[];
  setLayers: (layers: AudioLayer[]) => void;
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;

  // Tweaks state
  tweaks: TweaksConfig;
  setTweaks: (tweaks: TweaksConfig) => void;

  // History
  canUndo: boolean;
  canRedo: boolean;
  resetHistory: (snapshot: HistorySnapshot) => void;

  // Handlers
  handleCodeChange: (newCode: string) => void;
  handleLayersChange: (newLayers: AudioLayer[]) => void;
  handleSelectLayer: (layerId: string | null) => void;
  handleTweaksChange: (newTweaks: TweaksConfig, saveToHistory?: boolean) => void;
  handleLoadPreset: (presetCode: string) => void;
  handleUndo: () => void;
  handleRedo: () => void;
}

/**
 * Hook that manages code, layers, tweaks, and history coordination for the studio editor.
 * Extracts the core editor state management from the studio page.
 */
export function useStudioEditor({
  playerState,
  runtimeRef,
  isRecording = false,
  onCaptureTweak,
  lastPlayedCodeRef,
}: UseStudioEditorOptions): UseStudioEditorResult {
  // Code state
  const [code, setCode] = useState(DEFAULT_CODE);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [liveMode, setLiveMode] = useState(true);

  // Layers state
  const [layers, setLayers] = useState<AudioLayer[]>(() => [
    { ...DEFAULT_LAYERS[0], code: DEFAULT_CODE },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    () => DEFAULT_LAYERS[0]?.id || null
  );

  // Tweaks state
  const [tweaks, setTweaks] = useState<TweaksConfig>(DEFAULT_TWEAKS);

  // History state
  const {
    state: historyState,
    push: pushHistory,
    pushDebounced: pushHistoryDebounced,
    undo: historyUndo,
    redo: historyRedo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useHistory<HistorySnapshot>(createInitialSnapshot());

  // Refs for history management
  const isRestoringFromHistoryRef = useRef(false);
  const historyActionRef = useRef<"undo" | "redo" | null>(null);
  const prevHistoryStateRef = useRef<HistorySnapshot | null>(null);

  // Ref for live update debouncing
  const liveUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Create a snapshot of the current state for history.
   */
  const createSnapshot = useCallback((): HistorySnapshot => {
    return {
      code,
      layers,
      tweaks,
      selectedLayerId,
    };
  }, [code, layers, tweaks, selectedLayerId]);

  /**
   * Restore state from a history snapshot.
   */
  const restoreSnapshot = useCallback(
    (snapshot: HistorySnapshot) => {
      isRestoringFromHistoryRef.current = true;
      setCode(snapshot.code);
      setLayers(snapshot.layers);
      setTweaks(snapshot.tweaks);
      setSelectedLayerId(snapshot.selectedLayerId);

      // If playing, update playback with restored code
      if (playerState === "playing") {
        const combinedCode = combineLayers(snapshot.layers);
        const runtime = runtimeRef.current;
        if (runtime) {
          lastPlayedCodeRef.current = combinedCode;
          runtime.play(combinedCode, true).catch((err) => {
            console.warn("Undo/redo playback error:", err);
          });
        }
      }

      // Reset the flag after state updates are applied
      requestAnimationFrame(() => {
        isRestoringFromHistoryRef.current = false;
      });
    },
    [playerState, runtimeRef, lastPlayedCodeRef]
  );

  /**
   * Handle undo - restore previous state from history.
   */
  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    historyActionRef.current = "undo";
    historyUndo();
  }, [canUndo, historyUndo]);

  /**
   * Handle redo - restore next state from history.
   */
  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    historyActionRef.current = "redo";
    historyRedo();
  }, [canRedo, historyRedo]);

  // Sync component state when history state changes (from undo/redo only)
  // This is intentional - restoring state from history requires updating multiple state values
  useEffect(() => {
    // Skip initial render
    if (prevHistoryStateRef.current === null) {
      prevHistoryStateRef.current = historyState;
      return;
    }

    // Only restore if history state changed AND it was from undo/redo (not push)
    if (prevHistoryStateRef.current !== historyState) {
      prevHistoryStateRef.current = historyState;
      // Only restore on undo/redo, not on push operations
      if (historyActionRef.current === "undo" || historyActionRef.current === "redo") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        restoreSnapshot(historyState);
        historyActionRef.current = null;
      }
    }
  }, [historyState, restoreSnapshot]);

  // Live coding: auto-update when layers change while playing
  useEffect(() => {
    if (!liveMode || playerState !== "playing") {
      return;
    }

    const combinedCode = combineLayers(layers);

    // Skip if combined code hasn't actually changed
    if (combinedCode === lastPlayedCodeRef.current) {
      return;
    }

    // Clear any pending update
    if (liveUpdateTimeoutRef.current) {
      clearTimeout(liveUpdateTimeoutRef.current);
    }

    // Debounce the update
    liveUpdateTimeoutRef.current = setTimeout(() => {
      const validation = validateRawToneCode(combinedCode);
      if (!validation.valid) {
        return;
      }

      const runtime = runtimeRef.current;
      if (runtime) {
        lastPlayedCodeRef.current = combinedCode;
        runtime.play(combinedCode, true).catch((err) => {
          console.warn("Live update error:", err);
        });
      }
    }, 150);

    return () => {
      if (liveUpdateTimeoutRef.current) {
        clearTimeout(liveUpdateTimeoutRef.current);
      }
    };
  }, [layers, liveMode, playerState, runtimeRef, lastPlayedCodeRef]);

  /**
   * Handle code changes from the editor.
   */
  const handleCodeChange = useCallback(
    (newCode: string) => {
      // Push current state to history before changing (debounced for typing)
      if (!isRestoringFromHistoryRef.current) {
        pushHistoryDebounced(createSnapshot());
      }

      setCode(newCode);
      // Update the selected layer's code
      if (selectedLayerId) {
        setLayers((prevLayers) =>
          prevLayers.map((layer) =>
            layer.id === selectedLayerId ? { ...layer, code: newCode } : layer
          )
        );
      }
    },
    [selectedLayerId, createSnapshot, pushHistoryDebounced]
  );

  /**
   * Handle layer changes.
   */
  const handleLayersChange = useCallback(
    (newLayers: AudioLayer[]) => {
      // Push current state to history before changing
      if (!isRestoringFromHistoryRef.current) {
        pushHistory(createSnapshot());
      }

      setLayers(newLayers);
      // Update the combined code for playback
      const combined = combineLayers(newLayers);
      setCode(combined);

      // If playing in live mode, update playback
      if (playerState === "playing" && liveMode) {
        const runtime = runtimeRef.current;
        if (runtime) {
          lastPlayedCodeRef.current = combined;
          runtime.play(combined, true).catch((err) => {
            console.warn("Layer update error:", err);
          });
        }
      }
    },
    [playerState, liveMode, createSnapshot, pushHistory, runtimeRef, lastPlayedCodeRef]
  );

  /**
   * Handle selecting a layer.
   */
  const handleSelectLayer = useCallback(
    (layerId: string | null) => {
      setSelectedLayerId(layerId);
      if (layerId) {
        const layer = layers.find((l) => l.id === layerId);
        if (layer) {
          setCode(layer.code);
        }
      }
    },
    [layers]
  );

  /**
   * Handle tweaks changes.
   */
  const handleTweaksChange = useCallback(
    (newTweaks: TweaksConfig, saveToHistory = false) => {
      // Only push to history when explicitly requested (on slider release)
      if (saveToHistory && !isRestoringFromHistoryRef.current) {
        pushHistory(createSnapshot());
      }

      // Capture tweak changes when recording
      if (isRecording && onCaptureTweak) {
        for (const key of Object.keys(newTweaks) as Array<keyof TweaksConfig>) {
          if (newTweaks[key] !== tweaks[key]) {
            onCaptureTweak(key, tweaks[key], newTweaks[key]);
          }
        }
      }

      setTweaks(newTweaks);
      const updatedCode = injectTweaks(code, newTweaks);
      setCode(updatedCode);

      // If playing, trigger live update
      if (playerState === "playing") {
        const runtime = runtimeRef.current;
        if (runtime) {
          lastPlayedCodeRef.current = updatedCode;
          runtime.play(updatedCode, true).catch((err) => {
            console.warn("Tweaks update error:", err);
          });
        }
      }
    },
    [
      code,
      playerState,
      createSnapshot,
      pushHistory,
      isRecording,
      tweaks,
      onCaptureTweak,
      runtimeRef,
      lastPlayedCodeRef,
    ]
  );

  /**
   * Handle loading a preset.
   */
  const handleLoadPreset = useCallback(
    (presetCode: string) => {
      // Push current state to history for undo capability
      if (!isRestoringFromHistoryRef.current) {
        pushHistory(createSnapshot());
      }

      // Update code state
      setCode(presetCode);

      // Update the selected layer's code
      if (selectedLayerId) {
        setLayers((prevLayers) =>
          prevLayers.map((layer) =>
            layer.id === selectedLayerId ? { ...layer, code: presetCode } : layer
          )
        );
      }

      // Extract and apply tweaks from the preset
      const presetTweaks = extractTweaks(presetCode);
      if (presetTweaks) {
        setTweaks(presetTweaks);
      }

      // If audio is playing, update playback with the new code
      if (playerState === "playing") {
        const runtime = runtimeRef.current;
        if (runtime) {
          lastPlayedCodeRef.current = presetCode;
          runtime.play(presetCode, true).catch((err) => {
            console.warn("Preset load playback error:", err);
          });
        }
      }
    },
    [selectedLayerId, createSnapshot, pushHistory, playerState, runtimeRef, lastPlayedCodeRef]
  );

  return {
    // Code state
    code,
    setCode,
    validationErrors,
    setValidationErrors,

    // Live mode
    liveMode,
    setLiveMode,

    // Layers state
    layers,
    setLayers,
    selectedLayerId,
    setSelectedLayerId,

    // Tweaks state
    tweaks,
    setTweaks,

    // History
    canUndo,
    canRedo,
    resetHistory,

    // Handlers
    handleCodeChange,
    handleLayersChange,
    handleSelectLayer,
    handleTweaksChange,
    handleLoadPreset,
    handleUndo,
    handleRedo,
  };
}
