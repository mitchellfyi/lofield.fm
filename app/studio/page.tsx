"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { validateToneCode, extractStreamingCode } from "@/lib/audio/llmContract";
import { validateRawToneCode } from "@/lib/audio/llmContract";
import { getAudioRuntime, type PlayerState, type RuntimeEvent } from "@/lib/audio/runtime";
import { TopBar } from "@/components/studio/TopBar";
import { ApiKeyModal } from "@/components/settings/ApiKeyModal";
import { TrackBrowser } from "@/components/studio/TrackBrowser";
import { RevisionHistory } from "@/components/studio/RevisionHistory";
import { ExportModal } from "@/components/studio/ExportModal";
import { ShareDialog } from "@/components/studio/ShareDialog";
import { SaveAsModal } from "@/components/studio/SaveAsModal";
import { ToastProvider, useToast } from "@/components/studio/ToastProvider";
import { ActionsBar } from "@/components/studio/ActionsBar";
import { CommandPalette, useCommandPalette } from "@/components/shared/CommandPalette";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";
import { MobileTabs } from "@/components/studio/MobileTabs";
import { DesktopLayout } from "@/components/studio/layouts/DesktopLayout";
import { isTutorialCompleted, resetTutorial } from "@/lib/tutorial/steps";
import { useModelSelection } from "@/lib/hooks/useModelSelection";
import { useApiKey } from "@/lib/hooks/useApiKey";
import { useStudioEditor } from "@/lib/hooks/useStudioEditor";
import { useStudioTracks } from "@/lib/hooks/useStudioTracks";
import { useRecording } from "@/lib/hooks/useRecording";
import { useRecordingPlayback } from "@/lib/hooks/useRecordingPlayback";
import { createStudioCommands } from "@/lib/commands/studioCommands";
import { combineLayers } from "@/lib/audio/layerCombiner";
import { injectTweaks } from "@/lib/audio/tweaksInjector";
import { DEFAULT_CODE } from "@/lib/audio/defaultCode";
import type { Recording } from "@/lib/types/recording";
import type { TweaksConfig } from "@/lib/types/tweaks";

// Shared ref for model selection accessible from body function
const globalModelRef = { current: "gpt-4o-mini" };

export default function StudioPage() {
  return (
    <ToastProvider>
      <StudioContent />
    </ToastProvider>
  );
}

function StudioContent() {
  const { showToast } = useToast();
  const [selectedModel, setSelectedModel] = useModelSelection();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const { hasKey, loading: apiKeyLoading, refresh: refreshApiKey } = useApiKey();

  // Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(true);

  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [runtimeEvents, setRuntimeEvents] = useState<RuntimeEvent[]>([]);
  const [error, setError] = useState("");
  const runtimeRef = useRef(getAudioRuntime());
  const lastPlayedCodeRef = useRef<string>("");

  // Chat state
  const [chatStatusMessage, setChatStatusMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const lastProcessedMessageRef = useRef<string>("");
  const lastUserPromptRef = useRef<string>("");

  // Active recording for playback
  const [activeRecording, setActiveRecording] = useState<Recording | null>(null);

  // Keep global ref in sync
  useEffect(() => {
    globalModelRef.current = selectedModel;
  }, [selectedModel]);

  const chatTransport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/chat",
        body: () => ({ model: globalModelRef.current }),
      }),
    []
  );

  const { messages, sendMessage, status: chatStatus } = useChat({ transport: chatTransport });
  const isLoading = chatStatus === "submitted" || chatStatus === "streaming";

  // Subscribe to runtime
  useEffect(() => {
    const runtime = runtimeRef.current;
    const unsubscribe = runtime.subscribe(() => {
      setPlayerState(runtime.getState());
      setRuntimeEvents(runtime.getEvents());
    });
    return unsubscribe;
  }, []);

  // Recording capture
  const recording = useRecording();

  // Editor hook
  const editor = useStudioEditor({
    playerState,
    runtimeRef,
    isRecording: recording.isRecording,
    onCaptureTweak: recording.captureTweak,
    lastPlayedCodeRef,
  });

  // Tracks hook
  const tracks = useStudioTracks({
    showToast,
    getCode: () => editor.code,
    setCode: editor.setCode,
    setTweaks: editor.setTweaks,
    resetHistory: editor.resetHistory,
  });

  // Recording playback - apply tweaks during playback
  const applyTweakDuringPlayback = useCallback(
    (param: keyof TweaksConfig, value: number) => {
      const newTweaks = { ...editor.tweaks, [param]: value };
      editor.setTweaks(newTweaks);
      const updatedCode = injectTweaks(editor.code, newTweaks);
      editor.setCode(updatedCode);
      if (playerState === "playing") {
        lastPlayedCodeRef.current = updatedCode;
        runtimeRef.current.play(updatedCode, true).catch(() => {});
      }
    },
    [editor, playerState]
  );

  const playbackControls = useRecordingPlayback({
    recording: activeRecording,
    enabled: playerState === "playing",
    onTweakChange: applyTweakDuringPlayback,
  });

  // Play code
  const playCode = useCallback(
    async (codeToPlay: string) => {
      const validation = validateRawToneCode(codeToPlay);
      if (!validation.valid) {
        showToast(`Validation failed: ${validation.errors[0]?.message}`, "error");
        return;
      }
      try {
        lastPlayedCodeRef.current = codeToPlay;
        await runtimeRef.current.play(codeToPlay);
      } catch (err) {
        showToast(`Failed to play: ${err instanceof Error ? err.message : err}`, "error");
      }
    },
    [showToast]
  );

  const stop = useCallback(() => {
    runtimeRef.current.stop();
  }, []);

  // Recording handlers
  const handleStartRecording = useCallback(() => {
    if (playerState !== "playing") {
      showToast("Start playback before recording", "error");
      return;
    }
    recording.startRecording();
    showToast("Recording started", "info");
  }, [playerState, recording, showToast]);

  const handleStopRecording = useCallback(async () => {
    const events = recording.stopRecording();
    if (events.length === 0) {
      showToast("No events recorded", "info");
      recording.clearRecording();
      return;
    }

    if (!tracks.currentTrackId) {
      const temp = recording.getRecordingForSave("temp");
      setActiveRecording({
        ...temp,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Recording);
      showToast(`Recorded ${events.length} events. Save track to persist.`, "success");
      recording.clearRecording();
      return;
    }

    const data = recording.getRecordingForSave(tracks.currentTrackId);
    const saved = await tracks.createRecording(
      data.duration_ms,
      data.events,
      `Recording ${new Date().toLocaleTimeString()}`
    );
    if (saved) {
      setActiveRecording(saved);
      showToast(`Saved recording with ${events.length} events`, "success");
    } else {
      showToast("Failed to save recording", "error");
    }
    recording.clearRecording();
  }, [recording, tracks, showToast]);

  // Extract code from AI messages
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "assistant") return;

    const textParts = lastMessage.parts.filter((p) => p.type === "text");
    const fullText = textParts.map((p) => p.text).join("\n");
    if (lastProcessedMessageRef.current === fullText) return;

    const { code: extractedCode, isComplete } = extractStreamingCode(fullText);
    if (extractedCode) {
      editor.setCode(extractedCode);
      if (isComplete) {
        lastProcessedMessageRef.current = fullText;
        const validation = validateToneCode(fullText);
        if (validation.valid) {
          editor.setValidationErrors([]);
          setChatStatusMessage("");
          if (playerState === "playing") playCode(extractedCode);
          if (tracks.currentTrackId)
            tracks.createRevision(extractedCode, lastUserPromptRef.current || undefined);
        } else {
          editor.setValidationErrors(validation.errors.map((e) => e.message));
          if (lastPlayedCodeRef.current) {
            editor.setCode(lastPlayedCodeRef.current);
            setError("Code generation failed. Reverted to last working version.");
          }
        }
      }
    }
  }, [messages, editor, playerState, playCode, tracks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    if (!hasKey && !apiKeyLoading) {
      setShowApiKeyModal(true);
      return;
    }

    const codeContext =
      editor.layers.length > 1
        ? editor.layers
            .map(
              (l) =>
                `=== LAYER: ${l.name}${l.muted ? " [MUTED]" : ""}${l.soloed ? " [SOLO]" : ""} ===\n${l.code}`
            )
            .join("\n\n")
        : editor.code;

    lastUserPromptRef.current = inputValue.trim();
    sendMessage({
      text: `Current code:\n\`\`\`js\n${codeContext}\n\`\`\`\n\nRequest: ${inputValue}`,
    });
    setInputValue("");
  };

  // Track unsaved changes
  useEffect(() => {
    tracks.trackUnsavedChanges(editor.code);
  }, [editor.code, tracks]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        tracks.handleSave();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        editor.handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        editor.handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        editor.handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tracks, editor]);

  // Tutorial
  const [showTutorial, setShowTutorial] = useState(false);
  const tutorialInitRef = useRef(false);
  useEffect(() => {
    if (tutorialInitRef.current) return;
    tutorialInitRef.current = true;
    const t = setTimeout(() => {
      if (!isTutorialCompleted()) setShowTutorial(true);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const handleRestartTutorial = useCallback(() => {
    resetTutorial();
    setShowTutorial(true);
  }, []);

  // Command palette
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();
  // The handlers are memoized callbacks that internally use refs, but they're only
  // executed in event handlers, not during render. This is safe.
  /* eslint-disable react-hooks/refs */
  const commands = useMemo(
    () =>
      createStudioCommands({
        playerState,
        liveMode: editor.liveMode,
        canUndo: editor.canUndo,
        canRedo: editor.canRedo,
        currentTrackId: tracks.currentTrackId,
        revisions: tracks.revisions,
        timelineExpanded,
        layers: editor.layers,
        code: editor.code,
        playCode,
        stop,
        setLiveMode: editor.setLiveMode,
        handleSave: tracks.handleSave,
        handleUndo: editor.handleUndo,
        handleRedo: editor.handleRedo,
        setCode: editor.setCode,
        setShowSaveAsModal: tracks.setShowSaveAsModal,
        setShowTrackBrowser: tracks.setShowTrackBrowser,
        setShowExportModal,
        setShowShareDialog,
        setShowRevisionHistory: tracks.setShowRevisionHistory,
        setTimelineExpanded,
        handleRestartTutorial,
        showToast,
        combineLayers,
        defaultCode: DEFAULT_CODE,
      }),
    [
      playerState,
      editor.liveMode,
      editor.canUndo,
      editor.canRedo,
      editor.layers,
      editor.code,
      editor.setLiveMode,
      editor.handleUndo,
      editor.handleRedo,
      editor.setCode,
      tracks.currentTrackId,
      tracks.revisions,
      tracks.handleSave,
      tracks.setShowSaveAsModal,
      tracks.setShowTrackBrowser,
      tracks.setShowRevisionHistory,
      timelineExpanded,
      playCode,
      stop,
      handleRestartTutorial,
      showToast,
    ]
  );
  /* eslint-enable react-hooks/refs */

  // Recording panel handlers
  const handleLoadRecording = useCallback(
    (rec: Recording) => {
      setActiveRecording(rec);
      showToast(`Loaded: ${rec.name || "Recording"}`, "info");
    },
    [showToast]
  );

  const handleDeleteRecording = useCallback(
    async (id: string) => {
      const ok = await tracks.deleteRecording(id);
      if (ok) {
        if (activeRecording?.id === id) setActiveRecording(null);
        showToast("Recording deleted", "info");
      }
      return ok;
    },
    [tracks, activeRecording, showToast]
  );

  const handleRenameRecording = useCallback(
    async (id: string, name: string) => {
      const r = await tracks.updateRecording(id, { name });
      if (r && activeRecording?.id === id) setActiveRecording({ ...activeRecording, name });
      if (r) showToast("Recording renamed", "info");
    },
    [tracks, activeRecording, showToast]
  );

  return (
    <>
      <div
        className="flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden"
        style={{ height: "var(--vh)" }}
      >
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

        <TopBar
          playerState={playerState}
          onLoadPreset={editor.handleLoadPreset}
          currentTrackName={tracks.currentTrackName}
          onOpenTracks={() => tracks.setShowTrackBrowser(true)}
          hasUnsavedChanges={tracks.hasUnsavedChanges}
        />

        <ActionsBar
          onUndo={editor.handleUndo}
          onRedo={editor.handleRedo}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          onSave={tracks.handleSave}
          onSaveAs={() => tracks.setShowSaveAsModal(true)}
          hasUnsavedChanges={tracks.hasUnsavedChanges}
          saving={tracks.saving || tracks.autoSaving}
          onExport={() => setShowExportModal(true)}
          onShare={() => setShowShareDialog(true)}
          canShare={!!tracks.currentTrackId}
          onRevert={() => editor.setCode(DEFAULT_CODE)}
          onCopy={() => {
            navigator.clipboard.writeText(editor.code);
            showToast("Code copied to clipboard", "success");
          }}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onOpenHistory={
            tracks.currentTrackId ? () => tracks.setShowRevisionHistory(true) : undefined
          }
          hasRevisions={tracks.revisions.length > 0}
        />

        <div className="flex-1 flex overflow-hidden relative z-10">
          <DesktopLayout
            timelineExpanded={timelineExpanded}
            setTimelineExpanded={setTimelineExpanded}
            tweaks={editor.tweaks}
            onTweaksChange={editor.handleTweaksChange}
            layers={editor.layers}
            selectedLayerId={editor.selectedLayerId}
            onLayersChange={editor.handleLayersChange}
            onSelectLayer={editor.handleSelectLayer}
            activeRecording={activeRecording}
            setActiveRecording={setActiveRecording}
            isPlaybackActive={playbackControls.isPlaying}
            playbackTimeMs={playbackControls.currentTimeMs}
            onStartPlayback={playbackControls.play}
            onPausePlayback={playbackControls.pause}
            onResetPlayback={playbackControls.reset}
            currentTrackId={tracks.currentTrackId}
            onUpdateRecording={tracks.updateRecording}
            recordings={tracks.recordings}
            recordingsLoading={tracks.recordingsLoading}
            onLoadRecording={handleLoadRecording}
            onDeleteRecording={handleDeleteRecording}
            onRenameRecording={handleRenameRecording}
            runtimeEvents={runtimeEvents}
            error={error}
            hasKey={hasKey}
            apiKeyLoading={apiKeyLoading}
            onAddApiKey={() => setShowApiKeyModal(true)}
            messages={messages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            chatStatusMessage={chatStatusMessage}
            code={editor.code}
            onCodeChange={editor.handleCodeChange}
            validationErrors={editor.validationErrors}
            defaultCode={DEFAULT_CODE}
            liveMode={editor.liveMode}
            onLiveModeChange={editor.setLiveMode}
            playerState={playerState}
            audioLoaded={true}
            onPlay={() => playCode(combineLayers(editor.layers))}
            onStop={stop}
            isRecording={recording.isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            recordingElapsedMs={recording.elapsedMs}
          />

          <div className="md:hidden flex flex-col flex-1">
            <MobileTabs
              code={editor.code}
              setCode={editor.handleCodeChange}
              validationErrors={editor.validationErrors}
              messages={messages}
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              playerState={playerState}
              audioLoaded={true}
              playCode={() => playCode(combineLayers(editor.layers))}
              stop={stop}
              defaultCode={DEFAULT_CODE}
              liveMode={editor.liveMode}
              onLiveModeChange={editor.setLiveMode}
              chatStatusMessage={chatStatusMessage}
              tweaks={editor.tweaks}
              onTweaksChange={editor.handleTweaksChange}
              layers={editor.layers}
              selectedLayerId={editor.selectedLayerId}
              onLayersChange={editor.handleLayersChange}
              onSelectLayer={editor.handleSelectLayer}
            />
          </div>
        </div>
      </div>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSuccess={refreshApiKey}
      />
      <TrackBrowser
        isOpen={tracks.showTrackBrowser}
        onClose={() => tracks.setShowTrackBrowser(false)}
        onSelectTrack={tracks.handleSelectTrack}
        currentTrackId={tracks.currentTrackId}
      />
      <RevisionHistory
        isOpen={tracks.showRevisionHistory}
        onClose={() => tracks.setShowRevisionHistory(false)}
        trackId={tracks.currentTrackId}
        currentCode={editor.code}
        onRevert={tracks.handleRevert}
        onPreview={tracks.handlePreviewRevision}
      />
      <SaveAsModal
        isOpen={tracks.showSaveAsModal}
        name={tracks.saveAsName}
        onNameChange={tracks.setSaveAsName}
        onSave={tracks.handleSaveAs}
        onClose={() => {
          tracks.setShowSaveAsModal(false);
          tracks.setSaveAsName("");
        }}
        saving={tracks.saving}
      />
      <ExportModal
        isOpen={showExportModal}
        code={editor.code}
        trackName={tracks.currentTrackName ?? undefined}
        onClose={() => setShowExportModal(false)}
        onSuccess={() => showToast("Audio exported successfully", "success")}
        recording={activeRecording}
      />
      <ShareDialog
        isOpen={showShareDialog}
        trackId={tracks.currentTrackId}
        trackName={tracks.currentTrackName ?? undefined}
        onClose={() => setShowShareDialog(false)}
        onToast={showToast}
      />
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} commands={commands} />
      <TutorialOverlay isActive={showTutorial} onComplete={() => setShowTutorial(false)} />
    </>
  );
}
