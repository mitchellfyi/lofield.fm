"use client";

import { useState } from "react";
import Link from "next/link";
import { PlayerState } from "@/lib/audio/runtime";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { PresetBrowser } from "./PresetBrowser";
import { UserMenu } from "@/components/auth/UserMenu";

interface TopBarProps {
  playerState: PlayerState;
  onLoadPreset?: (code: string) => void;
  currentTrackName?: string | null;
  onOpenTracks?: () => void;
  hasUnsavedChanges?: boolean;
}

export function TopBar({
  playerState,
  onLoadPreset,
  currentTrackName,
  onOpenTracks,
  hasUnsavedChanges = false,
}: TopBarProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [showPresetBrowser, setShowPresetBrowser] = useState(false);

  const getStateColor = () => {
    switch (playerState) {
      case "playing":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      case "ready":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
      case "loading":
        return "bg-amber-500/20 text-amber-400 border-amber-500/50";
      case "error":
        return "bg-rose-500/20 text-rose-400 border-rose-500/50";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  const getStateLabel = () => {
    return playerState.toUpperCase();
  };

  return (
    <>
      <div className="border-b border-cyan-950/50 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 backdrop-blur-sm relative z-50 overflow-visible">
        {/* Full-width background waveform visualizer */}
        <div className="absolute inset-0 z-0">
          <WaveformVisualizer className="w-full h-full" fillContainer />
        </div>

        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 relative z-10">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50" />
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-500 bg-clip-text text-transparent tracking-tight">
                <span className="hidden sm:inline">LoField Music Lab</span>
                <span className="sm:hidden">LoField</span>
              </h1>
            </div>

            <div
              className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold border backdrop-blur-sm transition-all duration-300 ${getStateColor()}`}
            >
              {getStateLabel()}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* My Tracks Button */}
            {onOpenTracks && (
              <button
                onClick={onOpenTracks}
                className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-sm text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all duration-200 backdrop-blur-sm"
                aria-label="My Tracks"
              >
                <svg
                  className="w-5 h-5 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span className="hidden sm:inline">{currentTrackName || "My Tracks"}</span>
                {hasUnsavedChanges && currentTrackName && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
                )}
              </button>
            )}

            {/* Preset Library Button */}
            {onLoadPreset && (
              <button
                onClick={() => setShowPresetBrowser(true)}
                className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-sm text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all duration-200 backdrop-blur-sm"
                aria-label="Preset Library"
              >
                <svg
                  className="w-5 h-5 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                <span className="hidden sm:inline">Presets</span>
              </button>
            )}

            {/* Settings Link */}
            <Link
              href="/settings"
              className="px-2.5 sm:px-4 py-2 rounded-sm text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all duration-200 backdrop-blur-sm"
              aria-label="Settings"
            >
              <svg
                className="w-5 h-5 sm:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </Link>

            <button
              onClick={() => setShowHelp(true)}
              className="px-2.5 sm:px-4 py-2 rounded-sm text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all duration-200 backdrop-blur-sm"
              aria-label="Help"
            >
              <svg
                className="w-5 h-5 sm:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="hidden sm:inline">Help</span>
            </button>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-2xl w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800">
              <h2 className="text-xl font-bold text-cyan-300">How to Use LoField Music Lab</h2>
            </div>

            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Getting Started</h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
                  <li>Click &ldquo;Init Audio&rdquo; to initialize the audio engine</li>
                  <li>
                    Type your prompt in the chat (e.g., &ldquo;make a lofi beat at 90bpm&rdquo;)
                  </li>
                  <li>The AI will generate Tone.js code for you</li>
                  <li>Click &ldquo;Play&rdquo; to hear your beat</li>
                  <li>Modify the code or chat again to iterate</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Example Prompts</h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="pl-4 border-l-2 border-cyan-500/30">
                    &ldquo;Create a minimal techno beat at 128 bpm&rdquo;
                  </li>
                  <li className="pl-4 border-l-2 border-cyan-500/30">
                    &ldquo;Make a relaxed lofi beat with piano&rdquo;
                  </li>
                  <li className="pl-4 border-l-2 border-cyan-500/30">
                    &ldquo;Add a hi-hat pattern to the current beat&rdquo;
                  </li>
                  <li className="pl-4 border-l-2 border-cyan-500/30">
                    &ldquo;Slow down the tempo to 85 bpm&rdquo;
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Tips</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                  <li>You can edit the code directly in the editor</li>
                  <li>Watch the console for events and errors</li>
                  <li>Valid code requires Tone.js API calls and Transport.start()</li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-6 py-2 rounded-sm text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preset Browser Modal */}
      {onLoadPreset && (
        <PresetBrowser
          isOpen={showPresetBrowser}
          onClose={() => setShowPresetBrowser(false)}
          onLoadPreset={onLoadPreset}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      )}
    </>
  );
}
