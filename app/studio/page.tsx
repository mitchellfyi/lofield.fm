"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  validateToneCode,
  validateRawToneCode,
  extractStreamingCode,
} from "@/lib/audio/llmContract";
import { getAudioRuntime, type PlayerState, type RuntimeEvent } from "@/lib/audio/runtime";
import { TopBar } from "@/components/studio/TopBar";
import { ChatPanel } from "@/components/studio/ChatPanel";
import { CodePanel } from "@/components/studio/CodePanel";
import { PlayerControls } from "@/components/studio/PlayerControls";
import { ConsolePanel } from "@/components/studio/ConsolePanel";
import { TimelineBar } from "@/components/studio/TimelineBar";
import { ApiKeyPrompt } from "@/components/studio/ApiKeyPrompt";
import { useModelSelection } from "@/lib/hooks/useModelSelection";
import { useApiKey } from "@/lib/hooks/useApiKey";
import { useProjects } from "@/lib/hooks/useProjects";
import { useTracks, useAutoSave } from "@/lib/hooks/useTracks";
import { useDraftTrack } from "@/lib/hooks/useDraftTrack";
import { useRevisions } from "@/lib/hooks/useRevisions";
import { useHistory } from "@/lib/hooks/useHistory";
import { ApiKeyModal } from "@/components/settings/ApiKeyModal";
import { TrackBrowser } from "@/components/studio/TrackBrowser";
import { RevisionHistory } from "@/components/studio/RevisionHistory";
import { ExportModal } from "@/components/studio/ExportModal";
import { ShareDialog } from "@/components/studio/ShareDialog";
import { ToastProvider, useToast } from "@/components/studio/ToastProvider";
import { TweaksPanel } from "@/components/studio/TweaksPanel";
import { LayersPanel } from "@/components/studio/LayersPanel";
import { RecordButton } from "@/components/studio/RecordButton";
import { ActionsBar } from "@/components/studio/ActionsBar";
import { RecordingTimeline } from "@/components/studio/RecordingTimeline";
import { RecordingPanel } from "@/components/studio/RecordingPanel";
import { CommandPalette, useCommandPalette } from "@/components/shared/CommandPalette";
import { type Command } from "@/lib/commands/registry";
import { SpectrumAnalyzer } from "@/components/studio/SpectrumAnalyzer";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";
import { isTutorialCompleted, resetTutorial } from "@/lib/tutorial/steps";
import type { Track } from "@/lib/types/tracks";
import { type TweaksConfig, DEFAULT_TWEAKS } from "@/lib/types/tweaks";
import { extractTweaks, injectTweaks } from "@/lib/audio/tweaksInjector";
import { type AudioLayer, DEFAULT_LAYERS } from "@/lib/types/audioLayer";
import { combineLayers } from "@/lib/audio/layerCombiner";
import { useRecording } from "@/lib/hooks/useRecording";
import { useRecordings } from "@/lib/hooks/useRecordings";
import { useRecordingPlayback } from "@/lib/hooks/useRecordingPlayback";
import type { Recording } from "@/lib/types/recording";
import { DEFAULT_CODE } from "@/lib/audio/defaultCode";
import { SaveAsModal } from "@/components/studio/SaveAsModal";
import { MobileTabs } from "@/components/studio/MobileTabs";

// Shared ref for model selection accessible from body function
// This pattern is needed because TextStreamChatTransport.body is a function
// called at request time, not render time
const globalModelRef = { current: "gpt-4o-mini" };

/**
 * Snapshot of editor state for undo/redo history.
 * Captures everything needed to restore the composition state.
 */
interface HistorySnapshot {
  code: string;
  layers: AudioLayer[];
  tweaks: TweaksConfig;
  selectedLayerId: string | null;
}

/**
 * Create the initial history snapshot.
 */
function createInitialSnapshot(): HistorySnapshot {
  return {
    code: DEFAULT_CODE,
    layers: [{ ...DEFAULT_LAYERS[0], code: DEFAULT_CODE }],
    tweaks: DEFAULT_TWEAKS,
    selectedLayerId: DEFAULT_LAYERS[0]?.id || null,
  };
}

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

export default function StudioPage() {
  return (
    <ToastProvider>
      <StudioContent />
    </ToastProvider>
  );
}

function StudioContent() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const audioLoaded = true; // Tone.js is always available as a module
  const [runtimeEvents, setRuntimeEvents] = useState<RuntimeEvent[]>([]);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [chatStatusMessage, setChatStatusMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [liveMode, setLiveMode] = useState(true); // Live coding mode - auto-update on edit
  const [selectedModel, setSelectedModel] = useModelSelection();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const { hasKey, loading: apiKeyLoading, refresh: refreshApiKey } = useApiKey();

  // Track management state
  const [showTrackBrowser, setShowTrackBrowser] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [currentTrackName, setCurrentTrackName] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Auto-save is currently disabled - can be enabled via user settings later
  const autoSaveEnabled = false;
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [saving, setSaving] = useState(false);
  const lastSavedCodeRef = useRef<string>("");
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Toast notifications via context
  const { showToast } = useToast();

  // Tweaks state
  const [tweaks, setTweaks] = useState<TweaksConfig>(DEFAULT_TWEAKS);

  // Layout state - column widths and collapsible sections
  const [timelineExpanded, setTimelineExpanded] = useState(true);
  const [leftColumnWidth, setLeftColumnWidth] = useState(256); // 256px = w-64
  const [rightColumnWidth, setRightColumnWidth] = useState(50); // percentage of remaining space
  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null);

  // Layers state - for multi-track composition
  const [layers, setLayers] = useState<AudioLayer[]>(() => [
    { ...DEFAULT_LAYERS[0], code: DEFAULT_CODE },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    () => DEFAULT_LAYERS[0]?.id || null
  );

  // Undo/Redo history for the entire editor state
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

  // Track if we're currently restoring from history to avoid re-pushing
  const isRestoringFromHistoryRef = useRef(false);
  // Track whether history change was from undo/redo (vs push)
  const historyActionRef = useRef<"undo" | "redo" | null>(null);

  // Project and track hooks
  const { projects, createProject } = useProjects();
  const { createTrack, updateTrack } = useTracks(selectedProjectId);
  const { revisions, createRevision } = useRevisions(currentTrackId);

  // Auto-save hook
  const { saving: autoSaving } = useAutoSave(currentTrackId, code, autoSaveEnabled);

  // Draft state hook - saves work locally for recovery
  const { saveDraft, clearDraft } = useDraftTrack(currentTrackId);

  // Recording hooks
  const {
    isRecording,
    startRecording,
    stopRecording,
    captureTweak,
    elapsedMs: recordingElapsedMs,
    getRecordingForSave,
    clearRecording,
  } = useRecording();
  const {
    recordings,
    loading: recordingsLoading,
    createRecording: saveRecording,
    updateRecording: updateRecordingApi,
    deleteRecording,
  } = useRecordings(currentTrackId);

  // Active recording for playback/visualization
  const [activeRecording, setActiveRecording] = useState<Recording | null>(null);

  // Callback to apply a single tweak change during playback
  // This is used by useRecordingPlayback to replay automation
  const applyTweakDuringPlayback = useCallback(
    (param: keyof TweaksConfig, value: number) => {
      // Update tweaks state
      setTweaks((prev) => ({ ...prev, [param]: value }));
      // Inject into code and update playback
      setCode((prevCode) => {
        const updatedCode = injectTweaks(prevCode, { ...tweaks, [param]: value });
        // If playing, apply the change live
        if (playerState === "playing") {
          const runtime = runtimeRef.current;
          lastPlayedCodeRef.current = updatedCode;
          runtime.play(updatedCode, true).catch((err) => {
            console.warn("Playback automation error:", err);
          });
        }
        return updatedCode;
      });
    },
    [tweaks, playerState]
  );

  // Recording playback hook - replays automation in sync with transport
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedMessageRef = useRef<string>("");
  const runtimeRef = useRef(getAudioRuntime());
  const liveUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedCodeRef = useRef<string>("");
  const lastUserPromptRef = useRef<string>("");

  // Keep global ref in sync with state for body function
  useEffect(() => {
    globalModelRef.current = selectedModel;
  }, [selectedModel]);

  // Create transport with dynamic body that reads from global ref (called at request time)
  const chatTransport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/chat",
        body: () => ({ model: globalModelRef.current }),
      }),
    []
  );

  const {
    messages,
    sendMessage,
    status: chatStatus,
  } = useChat({
    transport: chatTransport,
  });

  const isLoading = chatStatus === "submitted" || chatStatus === "streaming";

  // Validate code for dangerous tokens
  const validateCode = useCallback(
    (codeToValidate: string): boolean => {
      for (const token of DANGEROUS_TOKENS) {
        if (codeToValidate.includes(token)) {
          setError(`Code contains dangerous token: ${token}`);
          return false;
        }
      }

      // Check for window usage - not allowed in user code
      if (codeToValidate.includes("window")) {
        setError("Code contains dangerous token: window");
        return false;
      }

      return true;
    },
    [setError]
  );

  // Subscribe to runtime state changes
  useEffect(() => {
    const runtime = runtimeRef.current;
    const unsubscribe = runtime.subscribe(() => {
      setPlayerState(runtime.getState());
      setRuntimeEvents(runtime.getEvents());
    });
    return unsubscribe;
  }, []);

  // Live coding: auto-update when layers change while playing
  useEffect(() => {
    // Only trigger live updates when in live mode and currently playing
    if (!liveMode || playerState !== "playing") {
      return;
    }

    // Combine all layers for playback
    const combinedCode = combineLayers(layers);

    // Skip if combined code hasn't actually changed from what's currently playing
    // This prevents the restart-on-first-play bug
    if (combinedCode === lastPlayedCodeRef.current) {
      return;
    }

    // Clear any pending update
    if (liveUpdateTimeoutRef.current) {
      clearTimeout(liveUpdateTimeoutRef.current);
    }

    // Debounce the update to avoid rapid re-evaluation
    liveUpdateTimeoutRef.current = setTimeout(() => {
      // Validate before playing
      if (!validateCode(combinedCode)) {
        return;
      }

      const validation = validateRawToneCode(combinedCode);
      if (!validation.valid) {
        // Don't show errors during live typing - just skip invalid code
        return;
      }

      // Re-play the updated code, keeping the current position
      const runtime = runtimeRef.current;
      lastPlayedCodeRef.current = combinedCode;
      runtime.play(combinedCode, true).catch((err) => {
        // Silently handle errors during live coding to avoid disrupting flow
        console.warn("Live update error:", err);
      });
    }, 150); // 150ms debounce - fast for responsiveness

    return () => {
      if (liveUpdateTimeoutRef.current) {
        clearTimeout(liveUpdateTimeoutRef.current);
      }
    };
  }, [layers, liveMode, playerState, validateCode]);

  const playCode = useCallback(
    async (codeToPlay: string) => {
      if (!audioLoaded) {
        showToast("Audio system not ready. Please wait.", "error");
        return;
      }

      if (!validateCode(codeToPlay)) {
        return;
      }

      // Validate raw Tone.js code before playing (code from editor, not LLM response)
      const validation = validateRawToneCode(codeToPlay);
      if (!validation.valid) {
        setError(`Code validation failed: ${validation.errors.map((e) => e.message).join(", ")}`);
        setValidationErrors(validation.errors.map((e) => e.message));
        return;
      }

      try {
        const runtime = runtimeRef.current;
        lastPlayedCodeRef.current = codeToPlay; // Track what we're playing
        await runtime.play(codeToPlay);
        setError("");
        setValidationErrors([]);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        showToast(`Failed to play: ${errorMsg}`, "error");
      }
    },
    [audioLoaded, validateCode, showToast]
  );

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Extract code from assistant messages - LIVE during streaming
  // Updates the code editor in real-time as the AI generates code
  // Falls back to last working code if validation fails after server retries
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        // Collect all text parts
        const textParts = lastMessage.parts.filter((part) => part.type === "text");
        const fullText = textParts.map((part) => part.text).join("\n");

        // Skip if already processed this exact text
        if (lastProcessedMessageRef.current === fullText) {
          return;
        }

        // Extract code (handles both complete and streaming code blocks)
        const { code: extractedCode, isComplete } = extractStreamingCode(fullText);

        if (extractedCode) {
          // Update the code editor live as text streams in
          // This is intentional - syncing external streaming data to state

          setCode(extractedCode);

          if (isComplete) {
            // Code block is complete - do final validation and auto-restart if playing
            lastProcessedMessageRef.current = fullText;

            const validation = validateToneCode(fullText);
            if (validation.valid) {
              setValidationErrors([]);
              setChatStatusMessage(""); // Clear any previous status
              // Auto-restart if playing
              const runtime = runtimeRef.current;
              if (runtime.getState() === "playing" && audioLoaded) {
                playCode(extractedCode);
              }
              // Auto-create revision for valid code changes (if track is saved)
              if (currentTrackId) {
                createRevision(extractedCode, lastUserPromptRef.current || undefined);
              }
            } else {
              // Validation failed after server-side retries
              // Fall back to last working code if available
              const errorMsgs = validation.errors.map((e) => e.message);
              setValidationErrors(errorMsgs);

              if (lastPlayedCodeRef.current) {
                // Revert to last working code in editor
                // This is intentional - recovering from failed AI generation
                setCode(lastPlayedCodeRef.current);
                setError("Code generation failed. Reverted to last working version.");
                setChatStatusMessage("Code fix failed, using previous version");
              } else {
                setError(`Code validation failed: ${errorMsgs.join(", ")}`);
                setChatStatusMessage("Code validation failed");
              }
            }
          }
          // While streaming (isComplete=false), just update the editor without validation
        }
      }
    }
  }, [messages, audioLoaded, playCode, currentTrackId, createRevision]);

  const stop = useCallback(() => {
    if (!audioLoaded) {
      showToast("Audio system not ready.", "error");
      return;
    }
    try {
      const runtime = runtimeRef.current;
      runtime.stop();
      setError("");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(`Failed to stop: ${errorMsg}`, "error");
    }
  }, [audioLoaded, showToast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Check if user has API key before sending
    if (!hasKey && !apiKeyLoading) {
      setShowApiKeyModal(true);
      return;
    }

    // Build context with all layers for the AI to understand the composition
    let codeContext: string;
    if (layers.length > 1) {
      // Multi-layer: show each layer's code with its name
      const layerContexts = layers.map(
        (layer) =>
          `=== LAYER: ${layer.name}${layer.muted ? " [MUTED]" : ""}${layer.soloed ? " [SOLO]" : ""} ===\n${layer.code}`
      );
      codeContext = layerContexts.join("\n\n");
    } else {
      // Single layer: just show the code
      codeContext = code;
    }

    // Include current code as context for the AI to make incremental changes
    const messageWithContext = `Current code:
\`\`\`js
${codeContext}
\`\`\`

Request: ${inputValue}`;

    // Save the user prompt for revision message
    lastUserPromptRef.current = inputValue.trim();
    sendMessage({ text: messageWithContext });
    setInputValue("");
  };

  const handleApiKeySuccess = async () => {
    await refreshApiKey();
  };

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
        lastPlayedCodeRef.current = combinedCode;
        runtime.play(combinedCode, true).catch((err) => {
          console.warn("Undo/redo playback error:", err);
        });
      }

      // Reset the flag after state updates are applied
      requestAnimationFrame(() => {
        isRestoringFromHistoryRef.current = false;
      });
    },
    [playerState]
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
  const prevHistoryStateRef = useRef<HistorySnapshot | null>(null);
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
        restoreSnapshot(historyState);
        historyActionRef.current = null; // Reset flag after restore
      }
    }
  }, [historyState, restoreSnapshot]);

  // Handle tweaks changes - inject into code and trigger live update
  // saveToHistory: true = save snapshot for undo (on slider release), false = live update only
  const handleTweaksChange = useCallback(
    (newTweaks: TweaksConfig, saveToHistory = false) => {
      // Only push to history when explicitly requested (on slider release)
      if (saveToHistory && !isRestoringFromHistoryRef.current) {
        pushHistory(createSnapshot());
      }

      // Capture tweak changes when recording
      if (isRecording) {
        for (const key of Object.keys(newTweaks) as Array<keyof TweaksConfig>) {
          if (newTweaks[key] !== tweaks[key]) {
            captureTweak(key, tweaks[key], newTweaks[key]);
          }
        }
      }

      setTweaks(newTweaks);
      const updatedCode = injectTweaks(code, newTweaks);
      setCode(updatedCode);

      // If playing, trigger live update
      if (playerState === "playing") {
        const runtime = runtimeRef.current;
        lastPlayedCodeRef.current = updatedCode;
        runtime.play(updatedCode, true).catch((err) => {
          console.warn("Tweaks update error:", err);
        });
      }
    },
    [code, playerState, createSnapshot, pushHistory, isRecording, tweaks, captureTweak]
  );

  // Handle layer changes
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
        lastPlayedCodeRef.current = combined;
        runtime.play(combined, true).catch((err) => {
          console.warn("Layer update error:", err);
        });
      }
    },
    [playerState, liveMode, createSnapshot, pushHistory]
  );

  // Handle selecting a layer - update the code editor to show that layer's code
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

  // Sync code editor changes back to the selected layer
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

  // Handle loading a preset - properly syncs with layers, history, and tweaks
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
        lastPlayedCodeRef.current = presetCode;
        runtime.play(presetCode, true).catch((err) => {
          console.warn("Preset load playback error:", err);
        });
      }
    },
    [selectedLayerId, createSnapshot, pushHistory, playerState]
  );

  // Track unsaved changes when code differs from last saved
  useEffect(() => {
    if (currentTrackId && code !== lastSavedCodeRef.current) {
      // Intentional - tracking unsaved changes when code changes
      setHasUnsavedChanges(true);
      // Save draft to localStorage for recovery
      saveDraft(code, currentTrackName || undefined);
    }
  }, [code, currentTrackId, currentTrackName, saveDraft]);

  // Handle selecting a track from the browser
  const handleSelectTrack = useCallback(
    (track: Track) => {
      setCurrentTrackId(track.id);
      setCurrentTrackName(track.name);
      setSelectedProjectId(track.project_id);
      const trackCode = track.current_code || DEFAULT_CODE;
      setCode(trackCode);
      lastSavedCodeRef.current = trackCode;
      setHasUnsavedChanges(false);
      setShowTrackBrowser(false);
      // Extract tweaks from loaded code
      const loadedTweaks = extractTweaks(trackCode);
      setTweaks(loadedTweaks || DEFAULT_TWEAKS);

      // Reset history when loading a different track
      resetHistory({
        code: trackCode,
        layers: [{ ...DEFAULT_LAYERS[0], code: trackCode }],
        tweaks: loadedTweaks || DEFAULT_TWEAKS,
        selectedLayerId: DEFAULT_LAYERS[0]?.id || null,
      });
    },
    [resetHistory]
  );

  // Handle reverting to a previous revision
  const handleRevert = useCallback((newCode: string) => {
    setCode(newCode);
    setHasUnsavedChanges(true);
    setShowRevisionHistory(false);
  }, []);

  // Handle previewing a revision (just load code temporarily)
  const handlePreviewRevision = useCallback((previewCode: string) => {
    setCode(previewCode);
    setHasUnsavedChanges(true);
  }, []);

  // Handle saving the current track
  const handleSave = useCallback(async () => {
    if (!currentTrackId) {
      // No track selected, open save-as modal
      setShowSaveAsModal(true);
      return;
    }

    try {
      setSaving(true);
      const result = await updateTrack(currentTrackId, { current_code: code });
      if (result) {
        lastSavedCodeRef.current = code;
        setHasUnsavedChanges(false);
        // Clear local draft after successful server save
        clearDraft();
        showToast("Track saved", "success");
      }
    } catch {
      showToast("Failed to save track", "error");
    } finally {
      setSaving(false);
    }
  }, [currentTrackId, code, updateTrack, clearDraft, showToast]);

  // Handle save-as (create new track)
  const handleSaveAs = useCallback(async () => {
    if (!saveAsName.trim()) return;

    try {
      setSaving(true);

      // Create a default project if none exists
      let projectId = selectedProjectId;
      if (!projectId) {
        if (projects.length === 0) {
          const newProject = await createProject("My Tracks");
          if (!newProject) {
            showToast("Failed to create project", "error");
            return;
          }
          projectId = newProject.id;
          setSelectedProjectId(projectId);
        } else {
          projectId = projects[0].id;
          setSelectedProjectId(projectId);
        }
      }

      const newTrack = await createTrack(projectId, saveAsName.trim(), code);
      if (newTrack) {
        setCurrentTrackId(newTrack.id);
        setCurrentTrackName(newTrack.name);
        lastSavedCodeRef.current = code;
        setHasUnsavedChanges(false);
        setShowSaveAsModal(false);
        setSaveAsName("");
        // Clear local draft after successful server save
        clearDraft();
        showToast(`Track "${newTrack.name}" created`, "success");
      }
    } catch {
      showToast("Failed to create track", "error");
    } finally {
      setSaving(false);
    }
  }, [
    saveAsName,
    selectedProjectId,
    projects,
    createProject,
    createTrack,
    code,
    clearDraft,
    showToast,
  ]);

  // Handle starting a recording
  const handleStartRecording = useCallback(() => {
    if (playerState !== "playing") {
      showToast("Start playback before recording", "error");
      return;
    }
    startRecording();
    showToast("Recording started", "info");
  }, [playerState, startRecording, showToast]);

  // Handle stopping a recording
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

  // Handle loading a recording for playback (used by RecordingPanel)
  const handleLoadRecording = useCallback(
    (recording: Recording) => {
      setActiveRecording(recording);
      showToast(`Loaded: ${recording.name || "Recording"}`, "info");
    },
    [showToast]
  );

  // Handle deleting a recording (used by RecordingPanel)
  const handleDeleteRecording = useCallback(
    async (recordingId: string) => {
      const success = await deleteRecording(recordingId);
      if (success) {
        if (activeRecording?.id === recordingId) {
          setActiveRecording(null);
        }
        showToast("Recording deleted", "info");
      }
    },
    [deleteRecording, activeRecording, showToast]
  );

  // Handle renaming a recording (used by RecordingPanel)
  const handleRenameRecording = useCallback(
    async (recordingId: string, newName: string) => {
      const result = await updateRecordingApi(recordingId, { name: newName });
      if (result) {
        // Update active recording if it's the one being renamed
        if (activeRecording?.id === recordingId) {
          setActiveRecording({ ...activeRecording, name: newName });
        }
        showToast("Recording renamed", "info");
      }
    },
    [updateRecordingApi, activeRecording, showToast]
  );

  // Keyboard shortcuts for save and undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+S: Save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

      // Cmd/Ctrl+Z: Undo (without Shift)
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Cmd/Ctrl+Shift+Z: Redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Cmd/Ctrl+Y: Redo (alternative shortcut)
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handleUndo, handleRedo]);

  // Command palette
  const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useCommandPalette();

  // Tutorial state - shows on first visit
  const [showTutorial, setShowTutorial] = useState(false);
  const tutorialInitializedRef = useRef(false);

  // Check if this is the user's first visit (after component mounts)
  useEffect(() => {
    if (tutorialInitializedRef.current) return;
    tutorialInitializedRef.current = true;

    // Small delay to let the UI settle before showing tutorial
    const timer = setTimeout(() => {
      if (!isTutorialCompleted()) {
        setShowTutorial(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Handler to restart tutorial (can be triggered from help menu)
  const handleRestartTutorial = useCallback(() => {
    resetTutorial();
    setShowTutorial(true);
  }, []);

  // Build commands list for command palette
  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [
      // Playback commands
      {
        id: "play",
        name: "Play",
        shortcut: "Space",
        section: "playback",
        handler: () => playCode(combineLayers(layers)),
        disabled: playerState === "loading" || playerState === "error",
      },
      {
        id: "stop",
        name: "Stop",
        section: "playback",
        handler: stop,
        disabled: playerState !== "playing",
      },
      {
        id: "toggle-live-mode",
        name: liveMode ? "Disable Live Mode" : "Enable Live Mode",
        section: "playback",
        handler: () => setLiveMode(!liveMode),
      },
      // File commands
      {
        id: "save",
        name: "Save Track",
        shortcut: "⌘S",
        section: "file",
        handler: handleSave,
      },
      {
        id: "save-as",
        name: "Save Track As...",
        section: "file",
        handler: () => setShowSaveAsModal(true),
      },
      {
        id: "open-tracks",
        name: "Open Track Browser",
        section: "file",
        handler: () => setShowTrackBrowser(true),
      },
      {
        id: "export",
        name: "Export Audio",
        section: "file",
        handler: () => setShowExportModal(true),
      },
      {
        id: "share",
        name: "Share Track",
        section: "file",
        handler: () => setShowShareDialog(true),
        disabled: !currentTrackId,
      },
      // Edit commands
      {
        id: "undo",
        name: "Undo",
        shortcut: "⌘Z",
        section: "edit",
        handler: handleUndo,
        disabled: !canUndo,
      },
      {
        id: "redo",
        name: "Redo",
        shortcut: "⌘⇧Z",
        section: "edit",
        handler: handleRedo,
        disabled: !canRedo,
      },
      {
        id: "copy-code",
        name: "Copy Code to Clipboard",
        section: "edit",
        handler: () => {
          navigator.clipboard.writeText(code);
          showToast("Code copied to clipboard", "success");
        },
      },
      {
        id: "reset-to-default",
        name: "Reset to Default Code",
        section: "edit",
        handler: () => setCode(DEFAULT_CODE),
      },
      // View commands
      {
        id: "revision-history",
        name: "View Revision History",
        section: "view",
        handler: () => setShowRevisionHistory(true),
        disabled: !currentTrackId || revisions.length === 0,
      },
      {
        id: "toggle-timeline",
        name: timelineExpanded ? "Collapse Timeline" : "Expand Timeline",
        section: "view",
        handler: () => setTimelineExpanded(!timelineExpanded),
      },
      // Navigation commands
      {
        id: "go-home",
        name: "Go to Home Page",
        section: "navigation",
        handler: () => {
          window.location.href = "/";
        },
      },
      {
        id: "go-explore",
        name: "Go to Explore Page",
        section: "navigation",
        handler: () => {
          window.location.href = "/explore";
        },
      },
      // Help commands
      {
        id: "restart-tutorial",
        name: "Restart Tutorial",
        section: "navigation",
        handler: handleRestartTutorial,
      },
    ];
    return cmds;
  }, [
    layers,
    playerState,
    liveMode,
    handleSave,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    currentTrackId,
    revisions.length,
    timelineExpanded,
    code,
    showToast,
    playCode,
    stop,
    handleRestartTutorial,
  ]);

  // Column resize handling
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResizeMouseDown = useCallback(
    (column: "left" | "right") => (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(column);
    },
    []
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      if (isResizing === "left") {
        const newWidth = Math.max(200, Math.min(400, e.clientX - containerRect.left));
        setLeftColumnWidth(newWidth);
      } else if (isResizing === "right") {
        const remainingWidth = containerRect.width - leftColumnWidth;
        const rightEdge = containerRect.right;
        const mouseFromRight = rightEdge - e.clientX;
        const newRightPercent = Math.max(30, Math.min(70, (mouseFromRight / remainingWidth) * 100));
        setRightColumnWidth(100 - newRightPercent);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, leftColumnWidth]);

  return (
    <>
      <div
        className="flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden"
        style={{ height: "var(--vh)" }}
      >
        {/* Animated background effect */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

        {/* Top Bar */}
        <TopBar
          playerState={playerState}
          onLoadPreset={handleLoadPreset}
          currentTrackName={currentTrackName}
          onOpenTracks={() => setShowTrackBrowser(true)}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {/* Actions Bar */}
        <ActionsBar
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onSave={handleSave}
          onSaveAs={() => setShowSaveAsModal(true)}
          hasUnsavedChanges={hasUnsavedChanges}
          saving={saving || autoSaving}
          onExport={() => setShowExportModal(true)}
          onShare={() => setShowShareDialog(true)}
          canShare={!!currentTrackId}
          onRevert={() => setCode(DEFAULT_CODE)}
          onCopy={() => {
            navigator.clipboard.writeText(code);
            showToast("Code copied to clipboard", "success");
          }}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onOpenHistory={currentTrackId ? () => setShowRevisionHistory(true) : undefined}
          hasRevisions={revisions.length > 0}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          {/* Desktop Layout: Three Column */}
          <div
            ref={containerRef}
            className={`hidden md:flex flex-1 ${isResizing ? "select-none" : ""}`}
          >
            {/* Left Sidebar - Tweaks, Layers, Bars */}
            <div
              className="flex flex-col border-r border-cyan-950/50 backdrop-blur-sm bg-slate-900/30 shrink-0"
              style={{ width: leftColumnWidth }}
            >
              <div className="p-3 flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
                {/* Timeline Section - Collapsible */}
                <div className="rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm overflow-hidden shrink-0">
                  <button
                    onClick={() => setTimelineExpanded(!timelineExpanded)}
                    className="w-full px-3 py-2 border-b border-cyan-500/20 bg-slate-900/50 hover:bg-slate-900/70 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                      Timeline
                    </div>
                    <svg
                      className={`w-3 h-3 text-cyan-400 transition-transform ${timelineExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {timelineExpanded && (
                    <div className="p-3">
                      <TimelineBar barsPerRow={8} totalRows={4} compact />
                    </div>
                  )}
                </div>

                {/* Tweaks Section */}
                <div className="shrink-0">
                  <TweaksPanel tweaks={tweaks} onTweaksChange={handleTweaksChange} />
                </div>

                {/* Layers Section - grows to fill available space */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-cyan-500/30">
                  <LayersPanel
                    layers={layers}
                    selectedLayerId={selectedLayerId}
                    isPlaying={playerState === "playing"}
                    onLayersChange={handleLayersChange}
                    onSelectLayer={handleSelectLayer}
                  />
                </div>

                {/* Recording Timeline - shows when there's an active recording */}
                {activeRecording && (
                  <div className="rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm p-3 shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                        Recording: {activeRecording.name || "Untitled"}
                      </div>
                      {/* Playback controls for recorded automation */}
                      <div className="flex items-center gap-2">
                        {isPlaybackActive ? (
                          <button
                            onClick={pausePlayback}
                            className="p-1 rounded hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                            title="Pause automation playback"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={startPlayback}
                            disabled={playerState !== "playing"}
                            className="p-1 rounded hover:bg-cyan-500/20 text-cyan-400 disabled:text-slate-600 disabled:hover:bg-transparent transition-colors"
                            title={
                              playerState === "playing"
                                ? "Play automation"
                                : "Start audio playback first"
                            }
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={resetPlayback}
                          className="p-1 rounded hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors"
                          title="Reset automation to start"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setActiveRecording(null)}
                          className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="Close recording"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <RecordingTimeline
                      recording={activeRecording}
                      currentTimeMs={isPlaybackActive ? playbackTimeMs : undefined}
                      onDeleteEvent={(eventId) => {
                        // Update active recording by removing the event
                        const newEvents = activeRecording.events.filter((e) => e.id !== eventId);
                        setActiveRecording({ ...activeRecording, events: newEvents });
                      }}
                      onUpdateEvent={(updatedEvent) => {
                        // Update local state with new event value
                        const newEvents = activeRecording.events.map((e) =>
                          e.id === updatedEvent.id ? updatedEvent : e
                        );
                        setActiveRecording({ ...activeRecording, events: newEvents });

                        // Persist to database if recording is saved
                        if (activeRecording.id && currentTrackId) {
                          updateRecordingApi(activeRecording.id, { events: newEvents });
                        }
                      }}
                    />
                  </div>
                )}

                {/* Recording Panel - shows saved recordings for current track */}
                {recordings.length > 0 && (
                  <div className="shrink-0">
                    <RecordingPanel
                      recordings={recordings}
                      activeRecording={activeRecording}
                      loading={recordingsLoading}
                      onLoadRecording={handleLoadRecording}
                      onDeleteRecording={handleDeleteRecording}
                      onRenameRecording={handleRenameRecording}
                    />
                  </div>
                )}

                {/* Spectrum Analyzer */}
                <div className="shrink-0">
                  <SpectrumAnalyzer height={80} showLabels={true} peakHold={true} />
                </div>

                {/* Console Panel */}
                <div className="shrink-0">
                  <ConsolePanel events={runtimeEvents} error={error} />
                </div>
              </div>
            </div>

            {/* Left Resize Handle */}
            <div
              onMouseDown={handleResizeMouseDown("left")}
              className="w-1 hover:w-1.5 bg-transparent hover:bg-cyan-500/50 cursor-col-resize transition-all shrink-0 group"
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-0.5 h-8 bg-cyan-500/30 group-hover:bg-cyan-500/70 rounded-full transition-colors" />
              </div>
            </div>

            {/* Main Content Area - Chat & Code */}
            <div className="flex-1 flex min-w-0">
              {/* Middle Panel - Chat */}
              <div
                className="flex flex-col border-r border-cyan-950/50 backdrop-blur-sm min-w-0"
                style={{ width: `${rightColumnWidth}%` }}
              >
                {!hasKey && !apiKeyLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <ApiKeyPrompt onAddKey={() => setShowApiKeyModal(true)} />
                  </div>
                ) : (
                  <ChatPanel
                    messages={messages}
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    statusMessage={chatStatusMessage}
                  />
                )}
              </div>

              {/* Right Resize Handle */}
              <div
                onMouseDown={handleResizeMouseDown("right")}
                className="w-1 hover:w-1.5 bg-transparent hover:bg-cyan-500/50 cursor-col-resize transition-all shrink-0 group"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-0.5 h-8 bg-cyan-500/30 group-hover:bg-cyan-500/70 rounded-full transition-colors" />
                </div>
              </div>

              {/* Right Panel - Code & Player Controls */}
              <div
                className="flex flex-col backdrop-blur-sm min-w-0"
                style={{ width: `${100 - rightColumnWidth}%` }}
              >
                <div className="flex-1 min-h-0" data-tutorial="code-panel">
                  <CodePanel
                    code={code}
                    onChange={handleCodeChange}
                    validationErrors={validationErrors}
                    defaultCode={DEFAULT_CODE}
                    liveMode={liveMode}
                    onLiveModeChange={setLiveMode}
                  />
                </div>

                {/* Player Controls */}
                <div className="px-4 py-4 border-t border-cyan-500/20 bg-slate-900/50">
                  <PlayerControls
                    playerState={playerState}
                    audioLoaded={audioLoaded}
                    onPlay={() => playCode(combineLayers(layers))}
                    onStop={stop}
                    hideTimeline
                    recordButton={
                      <RecordButton
                        isRecording={isRecording}
                        onStartRecording={handleStartRecording}
                        onStopRecording={handleStopRecording}
                        elapsedMs={recordingElapsedMs}
                        disabled={playerState !== "playing" && !isRecording}
                        disabledReason="Start playback to record"
                      />
                    }
                  />
                </div>
              </div>
            </div>
            {/* End Main Content Area */}
          </div>

          {/* Mobile Layout: Tabbed */}
          <div className="md:hidden flex flex-col flex-1">
            <MobileTabs
              code={code}
              setCode={handleCodeChange}
              validationErrors={validationErrors}
              messages={messages}
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              playerState={playerState}
              audioLoaded={audioLoaded}
              playCode={() => playCode(combineLayers(layers))}
              stop={stop}
              defaultCode={DEFAULT_CODE}
              liveMode={liveMode}
              onLiveModeChange={setLiveMode}
              chatStatusMessage={chatStatusMessage}
              tweaks={tweaks}
              onTweaksChange={handleTweaksChange}
              layers={layers}
              selectedLayerId={selectedLayerId}
              onLayersChange={handleLayersChange}
              onSelectLayer={handleSelectLayer}
            />
          </div>
        </div>
      </div>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSuccess={handleApiKeySuccess}
      />

      {/* Track Browser Modal */}
      <TrackBrowser
        isOpen={showTrackBrowser}
        onClose={() => setShowTrackBrowser(false)}
        onSelectTrack={handleSelectTrack}
        currentTrackId={currentTrackId}
      />

      {/* Revision History Modal */}
      <RevisionHistory
        isOpen={showRevisionHistory}
        onClose={() => setShowRevisionHistory(false)}
        trackId={currentTrackId}
        currentCode={code}
        onRevert={handleRevert}
        onPreview={handlePreviewRevision}
      />

      {/* Save As Modal */}
      <SaveAsModal
        isOpen={showSaveAsModal}
        name={saveAsName}
        onNameChange={setSaveAsName}
        onSave={handleSaveAs}
        onClose={() => {
          setShowSaveAsModal(false);
          setSaveAsName("");
        }}
        saving={saving}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        code={code}
        trackName={currentTrackName ?? undefined}
        onClose={() => setShowExportModal(false)}
        onSuccess={() => showToast("Audio exported successfully", "success")}
        recording={activeRecording}
      />

      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        trackId={currentTrackId}
        trackName={currentTrackName ?? undefined}
        onClose={() => setShowShareDialog(false)}
        onToast={showToast}
      />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        commands={commands}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay isActive={showTutorial} onComplete={() => setShowTutorial(false)} />
    </>
  );
}
