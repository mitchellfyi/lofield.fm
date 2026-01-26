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
                  <span
                    className="ml-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                    title="Unsaved changes"
                  />
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

            {/* Explore Link */}
            <Link
              href="/explore"
              className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-sm text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all duration-200 backdrop-blur-sm"
              aria-label="Explore Tracks"
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
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <span className="hidden sm:inline">Explore</span>
            </Link>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>

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
