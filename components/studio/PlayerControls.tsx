"use client";

import { PlayerState } from "@/lib/audio/runtime";
import { TimelineBar } from "./TimelineBar";

interface PlayerControlsProps {
  playerState: PlayerState;
  audioLoaded: boolean;
  onPlay: () => void;
  onStop: () => void;
  exportButton?: React.ReactNode;
  shareButton?: React.ReactNode;
  recordButton?: React.ReactNode;
  hideTimeline?: boolean;
}

export function PlayerControls({
  playerState,
  audioLoaded,
  onPlay,
  onStop,
  exportButton,
  shareButton,
  recordButton,
  hideTimeline = false,
}: PlayerControlsProps) {
  const isLoading = playerState === "loading";
  const canPlay = audioLoaded && !isLoading && playerState !== "error";
  const isPlaying = playerState === "playing";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onPlay}
          disabled={!canPlay}
          className="flex-1 px-8 py-4 rounded-sm font-bold text-base bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 hover:from-cyan-500 hover:via-cyan-400 hover:to-cyan-500 disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:shadow-none border border-cyan-500/30 disabled:border-slate-600 relative overflow-hidden group backdrop-blur-sm"
          data-tutorial="play-button"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
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
                Initializing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  {isPlaying ? (
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  ) : (
                    <path d="M8 5v14l11-7z" />
                  )}
                </svg>
                {isPlaying ? "Restart" : "Play"}
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/30 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.1)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        <button
          onClick={onStop}
          disabled={!isPlaying}
          className="px-8 py-4 rounded-sm font-bold text-base bg-gradient-to-r from-slate-800/90 via-slate-700/90 to-slate-800/90 hover:from-slate-700/90 hover:via-slate-600/90 hover:to-slate-700/90 disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-cyan-100 hover:text-white transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 disabled:shadow-none border border-cyan-500/30 hover:border-cyan-500/50 disabled:border-slate-600 relative overflow-hidden group backdrop-blur-sm"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
            Stop
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </button>

        {/* Record Button Slot */}
        {recordButton}

        {/* Share Button Slot */}
        {shareButton}

        {/* Export Button Slot */}
        {exportButton}
      </div>

      {/* Timeline Visualization */}
      {!hideTimeline && <TimelineBar />}
    </div>
  );
}
