'use client';

import { PlayerState } from '@/lib/audio/runtime';
import { TimelineBar } from './TimelineBar';

interface PlayerControlsProps {
  playerState: PlayerState;
  audioLoaded: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export function PlayerControls({
  playerState,
  audioLoaded,
  onPlay,
  onStop,
}: PlayerControlsProps) {
  const isLoading = playerState === 'loading';
  const canPlay = audioLoaded && !isLoading && playerState !== 'error';
  const isPlaying = playerState === 'playing';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onPlay}
          disabled={!canPlay}
          className="flex-1 px-8 py-4 rounded-lg font-bold text-base bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:shadow-none border border-emerald-500/30 disabled:border-slate-600 relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
                {isPlaying ? 'Restart' : 'Play'}
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/20 to-emerald-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </button>

        <button
          onClick={onStop}
          disabled={!isPlaying}
          className="px-8 py-4 rounded-lg font-bold text-base bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white transition-all duration-200 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 disabled:shadow-none border border-rose-500/30 disabled:border-slate-600"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
            Stop
          </span>
        </button>
      </div>

      {/* Timeline Visualization */}
      <TimelineBar />
    </div>
  );
}
