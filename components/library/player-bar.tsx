"use client";

import { usePlayer } from "@/lib/contexts/player-context";
import { useCallback } from "react";

// Helper to format time (seconds) to mm:ss
function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    currentIndex,
    autoplay,
    repeat,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleAutoplay,
    toggleRepeat,
  } = usePlayer();

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = parseFloat(e.target.value);
      seek(newTime);
    },
    [seek]
  );

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
    },
    [setVolume]
  );

  // Don't show player if no track
  if (!currentTrack) {
    return null;
  }

  const queuePosition =
    currentIndex >= 0 ? `${currentIndex + 1} of ${queue.length}` : "";

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white shadow-lg z-50">
      <div className="mx-auto max-w-7xl px-4 py-3">
        {/* Track info and controls */}
        <div className="flex items-center gap-4">
          {/* Track info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col">
              <span className="truncate text-sm font-medium text-slate-900">
                {currentTrack.title}
              </span>
              <span className="truncate text-xs text-slate-600">
                {currentTrack.artist_name || "Unknown Artist"}
              </span>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            {/* Previous */}
            <button
              onClick={playPrevious}
              className="rounded-full p-2 text-slate-700 transition hover:bg-slate-100"
              title="Previous track"
              aria-label="Previous track"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="rounded-full bg-emerald-600 p-3 text-white transition hover:bg-emerald-700"
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={playNext}
              className="rounded-full p-2 text-slate-700 transition hover:bg-slate-100"
              title="Next track"
              aria-label="Next track"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Seek bar and time - desktop only */}
          <div className="hidden md:flex flex-1 items-center gap-2">
            <span className="text-xs text-slate-600 w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 rounded-lg appearance-none cursor-pointer bg-slate-200"
              style={{
                background: `linear-gradient(to right, rgb(5 150 105) 0%, rgb(5 150 105) ${(currentTime / (duration || 1)) * 100}%, rgb(226 232 240) ${(currentTime / (duration || 1)) * 100}%, rgb(226 232 240) 100%)`,
              }}
              aria-label="Seek"
            />
            <span className="text-xs text-slate-600 w-12">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume control - desktop only */}
          <div className="hidden lg:flex items-center gap-2 w-32">
            <svg
              className="h-4 w-4 text-slate-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 rounded-lg appearance-none cursor-pointer bg-slate-200"
              style={{
                background: `linear-gradient(to right, rgb(5 150 105) 0%, rgb(5 150 105) ${volume * 100}%, rgb(226 232 240) ${volume * 100}%, rgb(226 232 240) 100%)`,
              }}
              aria-label="Volume"
            />
          </div>

          {/* Queue position and settings - desktop only */}
          <div className="hidden lg:flex items-center gap-3">
            {queuePosition && (
              <span className="text-xs text-slate-600">{queuePosition}</span>
            )}

            {/* Autoplay toggle */}
            <button
              onClick={toggleAutoplay}
              className={`rounded p-1 text-xs transition ${
                autoplay
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
              title={autoplay ? "Autoplay on" : "Autoplay off"}
              aria-label={autoplay ? "Autoplay on" : "Autoplay off"}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </button>

            {/* Repeat toggle */}
            <button
              onClick={toggleRepeat}
              className={`rounded p-1 text-xs transition ${
                repeat
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
              title={repeat ? "Repeat on" : "Repeat off"}
              aria-label={repeat ? "Repeat on" : "Repeat off"}
            >
              <svg
                className="h-4 w-4"
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
          </div>
        </div>

        {/* Mobile seek bar */}
        <div className="mt-2 flex md:hidden items-center gap-2">
          <span className="text-xs text-slate-600">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgb(5 150 105) 0%, rgb(5 150 105) ${(currentTime / (duration || 1)) * 100}%, rgb(226 232 240) ${(currentTime / (duration || 1)) * 100}%, rgb(226 232 240) 100%)`,
            }}
            aria-label="Seek"
          />
          <span className="text-xs text-slate-600">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
