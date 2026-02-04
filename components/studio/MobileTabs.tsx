"use client";

import { useState } from "react";
import type { UIMessage } from "@ai-sdk/react";
import type { PlayerState } from "@/lib/audio/runtime";
import { ChatPanel } from "@/components/studio/ChatPanel";
import { CodePanel } from "@/components/studio/CodePanel";
import { TimelineBar } from "@/components/studio/TimelineBar";
import { TweaksPanel } from "@/components/studio/TweaksPanel";
import { LayersPanel } from "@/components/studio/LayersPanel";
import { MiniTimeline } from "@/components/studio/MiniTimeline";
import { QuickShareButtons } from "@/components/share/QuickShareButtons";
import { type TweaksConfig } from "@/lib/types/tweaks";
import { type AudioLayer } from "@/lib/types/audioLayer";

export interface MobileTabsProps {
  code: string;
  setCode: (code: string) => void;
  validationErrors: string[];
  messages: UIMessage[];
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  playerState: PlayerState;
  audioLoaded: boolean;
  playCode: () => void;
  stop: () => void;
  defaultCode: string;
  liveMode: boolean;
  onLiveModeChange: (enabled: boolean) => void;
  chatStatusMessage: string;
  tweaks: TweaksConfig;
  onTweaksChange: (tweaks: TweaksConfig, saveToHistory?: boolean) => void;
  layers: AudioLayer[];
  selectedLayerId: string | null;
  onLayersChange: (layers: AudioLayer[]) => void;
  onSelectLayer: (layerId: string | null) => void;
  currentTrackName?: string | null;
  onShareAction?: (platform: string) => void;
}

export function MobileTabs({
  code,
  setCode,
  validationErrors,
  messages,
  inputValue,
  setInputValue,
  handleSubmit,
  isLoading,
  playerState,
  audioLoaded,
  playCode,
  stop,
  defaultCode,
  liveMode,
  onLiveModeChange,
  chatStatusMessage,
  tweaks,
  onTweaksChange,
  layers,
  selectedLayerId,
  onLayersChange,
  onSelectLayer,
  currentTrackName,
  onShareAction,
}: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "controls" | "code">("chat");
  const isPlaying = playerState === "playing";
  const canPlay = audioLoaded && playerState !== "loading" && playerState !== "error";

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation - min-h-12 ensures adequate touch targets */}
      <div className="flex border-b border-cyan-500/20 bg-slate-900/50">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 px-4 py-3 min-h-12 text-sm font-semibold transition-all duration-200 ${
            activeTab === "chat"
              ? "text-cyan-400 border-b-2 border-cyan-500 bg-cyan-500/10"
              : "text-slate-400 active:text-cyan-300"
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab("controls")}
          className={`flex-1 px-4 py-3 min-h-12 text-sm font-semibold transition-all duration-200 ${
            activeTab === "controls"
              ? "text-cyan-400 border-b-2 border-cyan-500 bg-cyan-500/10"
              : "text-slate-400 active:text-cyan-300"
          }`}
        >
          Controls
        </button>
        <button
          onClick={() => setActiveTab("code")}
          className={`flex-1 px-4 py-3 min-h-12 text-sm font-semibold transition-all duration-200 ${
            activeTab === "code"
              ? "text-cyan-400 border-b-2 border-cyan-500 bg-cyan-500/10"
              : "text-slate-400 active:text-cyan-300"
          }`}
        >
          Code
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" && (
          <ChatPanel
            messages={messages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            statusMessage={chatStatusMessage}
          />
        )}

        {activeTab === "controls" && (
          <div className="flex flex-col h-full p-3 gap-3 overflow-y-auto">
            {/* Timeline */}
            <div className="rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm p-3">
              <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                Timeline
              </div>
              <TimelineBar barsPerRow={8} totalRows={4} compact />
            </div>

            {/* Tweaks */}
            <TweaksPanel tweaks={tweaks} onTweaksChange={onTweaksChange} />

            {/* Layers */}
            <LayersPanel
              layers={layers}
              selectedLayerId={selectedLayerId}
              isPlaying={isPlaying}
              onLayersChange={onLayersChange}
              onSelectLayer={onSelectLayer}
            />
          </div>
        )}

        {activeTab === "code" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
              <CodePanel
                code={code}
                onChange={setCode}
                validationErrors={validationErrors}
                defaultCode={defaultCode}
                liveMode={liveMode}
                onLiveModeChange={onLiveModeChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Persistent Mobile Player Bar */}
      <div className="border-t border-cyan-500/20 bg-slate-900/80 backdrop-blur-sm px-3 py-3 safe-area-bottom">
        <div className="flex items-center gap-3">
          {/* Play/Stop Buttons */}
          <button
            onClick={playCode}
            disabled={!canPlay}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-sm font-bold text-sm bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 hover:from-cyan-500 hover:via-cyan-400 hover:to-cyan-500 disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:shadow-none border border-cyan-500/30 disabled:border-slate-600 relative overflow-hidden group backdrop-blur-sm"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {playerState === "loading" ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  {isPlaying ? (
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  ) : (
                    <path d="M8 5v14l11-7z" />
                  )}
                </svg>
              )}
              {isPlaying ? "Restart" : "Play"}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/30 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.1)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <button
            onClick={stop}
            disabled={!isPlaying}
            className="px-4 py-3 rounded-sm font-bold text-sm bg-gradient-to-r from-slate-800/90 via-slate-700/90 to-slate-800/90 hover:from-slate-700/90 hover:via-slate-600/90 hover:to-slate-700/90 disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-cyan-100 hover:text-white transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 disabled:shadow-none border border-cyan-500/30 hover:border-cyan-500/50 disabled:border-slate-600 relative overflow-hidden group backdrop-blur-sm"
          >
            <span className="relative z-10 flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </button>

          {/* Mini Timeline */}
          <MiniTimeline />

          {/* Quick Share Buttons - only visible when playing */}
          <QuickShareButtons
            isPlaying={isPlaying}
            trackName={currentTrackName}
            onShare={onShareAction}
          />
        </div>
      </div>
    </div>
  );
}
