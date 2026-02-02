"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { TimelineBar } from "@/components/studio/TimelineBar";
import { TweaksPanel } from "@/components/studio/TweaksPanel";
import { LayersPanel } from "@/components/studio/LayersPanel";
import { RecordingControls } from "@/components/studio/layouts/RecordingControls";
import { RecordingPanel } from "@/components/studio/RecordingPanel";
import { SpectrumAnalyzer } from "@/components/studio/SpectrumAnalyzer";
import { ConsolePanel } from "@/components/studio/ConsolePanel";
import { ChatPanel } from "@/components/studio/ChatPanel";
import { ApiKeyPrompt } from "@/components/studio/ApiKeyPrompt";
import { CodePanel } from "@/components/studio/CodePanel";
import { PlayerControls } from "@/components/studio/PlayerControls";
import { RecordButton } from "@/components/studio/RecordButton";
import type { PlayerState, RuntimeEvent } from "@/lib/audio/runtime";
import type { TweaksConfig } from "@/lib/types/tweaks";
import type { AudioLayer } from "@/lib/types/audioLayer";
import type { Recording, RecordingEvent } from "@/lib/types/recording";
import type { UIMessage } from "@ai-sdk/react";

export interface DesktopLayoutProps {
  // Layout state
  timelineExpanded: boolean;
  setTimelineExpanded: (expanded: boolean) => void;

  // Tweaks
  tweaks: TweaksConfig;
  onTweaksChange: (tweaks: TweaksConfig, saveToHistory?: boolean) => void;

  // Layers
  layers: AudioLayer[];
  selectedLayerId: string | null;
  onLayersChange: (layers: AudioLayer[]) => void;
  onSelectLayer: (layerId: string | null) => void;

  // Active recording
  activeRecording: Recording | null;
  setActiveRecording: (recording: Recording | null) => void;
  isPlaybackActive: boolean;
  playbackTimeMs: number;
  onStartPlayback: () => void;
  onPausePlayback: () => void;
  onResetPlayback: () => void;
  currentTrackId: string | null;
  onUpdateRecording: (
    id: string,
    updates: { events?: RecordingEvent[] }
  ) => Promise<Recording | null>;

  // Recordings list
  recordings: Recording[];
  recordingsLoading: boolean;
  onLoadRecording: (recording: Recording) => void;
  onDeleteRecording: (id: string) => Promise<boolean>;
  onRenameRecording: (id: string, newName: string) => Promise<void>;

  // Console
  runtimeEvents: RuntimeEvent[];
  error: string;

  // Chat
  hasKey: boolean;
  apiKeyLoading: boolean;
  onAddApiKey: () => void;
  messages: UIMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  chatStatusMessage: string;

  // Code
  code: string;
  onCodeChange: (code: string) => void;
  validationErrors: string[];
  defaultCode: string;
  liveMode: boolean;
  onLiveModeChange: (enabled: boolean) => void;

  // Player
  playerState: PlayerState;
  audioLoaded: boolean;
  onPlay: () => void;
  onStop: () => void;

  // Recording capture
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recordingElapsedMs: number;
}

/**
 * Desktop three-column layout for the studio page.
 * Extracted from the studio page to reduce component size.
 */
export function DesktopLayout({
  timelineExpanded,
  setTimelineExpanded,
  tweaks,
  onTweaksChange,
  layers,
  selectedLayerId,
  onLayersChange,
  onSelectLayer,
  activeRecording,
  setActiveRecording,
  isPlaybackActive,
  playbackTimeMs,
  onStartPlayback,
  onPausePlayback,
  onResetPlayback,
  currentTrackId,
  onUpdateRecording,
  recordings,
  recordingsLoading,
  onLoadRecording,
  onDeleteRecording,
  onRenameRecording,
  runtimeEvents,
  error,
  hasKey,
  apiKeyLoading,
  onAddApiKey,
  messages,
  inputValue,
  onInputChange,
  onSubmit,
  isLoading,
  chatStatusMessage,
  code,
  onCodeChange,
  validationErrors,
  defaultCode,
  liveMode,
  onLiveModeChange,
  playerState,
  audioLoaded,
  onPlay,
  onStop,
  isRecording,
  onStartRecording,
  onStopRecording,
  recordingElapsedMs,
}: DesktopLayoutProps) {
  // Column resize state
  const [leftColumnWidth, setLeftColumnWidth] = useState(256);
  const [rightColumnWidth, setRightColumnWidth] = useState(50);
  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null);
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
    <div ref={containerRef} className={`hidden md:flex flex-1 ${isResizing ? "select-none" : ""}`}>
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
            <TweaksPanel tweaks={tweaks} onTweaksChange={onTweaksChange} />
          </div>

          {/* Layers Section - grows to fill available space */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-cyan-500/30">
            <LayersPanel
              layers={layers}
              selectedLayerId={selectedLayerId}
              isPlaying={playerState === "playing"}
              onLayersChange={onLayersChange}
              onSelectLayer={onSelectLayer}
            />
          </div>

          {/* Recording Timeline - shows when there's an active recording */}
          {activeRecording && (
            <RecordingControls
              recording={activeRecording}
              playerState={playerState}
              isPlaybackActive={isPlaybackActive}
              playbackTimeMs={playbackTimeMs}
              onStartPlayback={onStartPlayback}
              onPausePlayback={onPausePlayback}
              onResetPlayback={onResetPlayback}
              onClose={() => setActiveRecording(null)}
              onDeleteEvent={(eventId) => {
                const newEvents = activeRecording.events.filter((e) => e.id !== eventId);
                setActiveRecording({ ...activeRecording, events: newEvents });
              }}
              onUpdateEvent={(updatedEvent) => {
                const newEvents = activeRecording.events.map((e) =>
                  e.id === updatedEvent.id ? updatedEvent : e
                );
                setActiveRecording({ ...activeRecording, events: newEvents });
                if (activeRecording.id && currentTrackId) {
                  onUpdateRecording(activeRecording.id, { events: newEvents });
                }
              }}
            />
          )}

          {/* Recording Panel - shows saved recordings for current track */}
          {recordings.length > 0 && (
            <div className="shrink-0">
              <RecordingPanel
                recordings={recordings}
                activeRecording={activeRecording}
                loading={recordingsLoading}
                onLoadRecording={onLoadRecording}
                onDeleteRecording={onDeleteRecording}
                onRenameRecording={onRenameRecording}
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
              <ApiKeyPrompt onAddKey={onAddApiKey} />
            </div>
          ) : (
            <ChatPanel
              messages={messages}
              inputValue={inputValue}
              onInputChange={onInputChange}
              onSubmit={onSubmit}
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
              onChange={onCodeChange}
              validationErrors={validationErrors}
              defaultCode={defaultCode}
              liveMode={liveMode}
              onLiveModeChange={onLiveModeChange}
            />
          </div>

          {/* Player Controls */}
          <div className="px-4 py-4 border-t border-cyan-500/20 bg-slate-900/50">
            <PlayerControls
              playerState={playerState}
              audioLoaded={audioLoaded}
              onPlay={onPlay}
              onStop={onStop}
              hideTimeline
              recordButton={
                <RecordButton
                  isRecording={isRecording}
                  onStartRecording={onStartRecording}
                  onStopRecording={onStopRecording}
                  elapsedMs={recordingElapsedMs}
                  disabled={playerState !== "playing" && !isRecording}
                  disabledReason="Start playback to record"
                />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
