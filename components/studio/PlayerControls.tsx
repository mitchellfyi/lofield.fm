'use client';

import { PlayerState } from '@/lib/audio/runtime';

interface PlayerControlsProps {
  playerState: PlayerState;
  audioLoaded: boolean;
  onInitAudio: () => void;
  onPlay: () => void;
  onStop: () => void;
}

export function PlayerControls({
  playerState,
  audioLoaded,
  onInitAudio,
  onPlay,
  onStop,
}: PlayerControlsProps) {
  const needsInit = playerState === 'idle';
  const canPlay = audioLoaded && playerState !== 'loading' && playerState !== 'error';
  const isPlaying = playerState === 'playing';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {needsInit && (
          <button
            onClick={onInitAudio}
            disabled={!audioLoaded}
            className="px-6 py-3 rounded-lg font-semibold text-sm bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:shadow-none border border-purple-500/30 disabled:border-slate-600"
          >
            Init Audio
          </button>
        )}

        <button
          onClick={onPlay}
          disabled={!canPlay}
          className="flex-1 px-8 py-4 rounded-lg font-bold text-base bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:shadow-none border border-emerald-500/30 disabled:border-slate-600 relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              {isPlaying ? (
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              ) : (
                <path d="M8 5v14l11-7z" />
              )}
            </svg>
            {isPlaying ? 'Restart' : 'Play'}
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

      {/* Tempo Display (placeholder for now) */}
      <div className="px-4 py-2 rounded-lg bg-slate-900/50 border border-cyan-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Tempo</span>
          <span className="text-sm font-mono text-slate-300">— BPM</span>
        </div>
      </div>
    </div>
  );
}
