"use client";

import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import type { PublicTrack, ExplorePlayerState } from "@/lib/types/explore";
import { getAudioRuntime, type PlayerState } from "@/lib/audio/runtime";
import { useTransportState } from "@/lib/audio/useVisualization";

interface ExplorePlayerProps {
  currentTrack: PublicTrack | null;
  autoPlay: boolean;
  shuffle: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  onPlayNext: () => PublicTrack | null;
  onPlayPrevious: () => PublicTrack | null;
  onToggleAutoPlay: () => void;
  onToggleShuffle: () => void;
  onStop: () => void;
}

// Module-level flag to track user-initiated stops
// This prevents auto-play from triggering when user manually pauses
let userInitiatedStop = false;

/**
 * Mark the next stop as user-initiated (won't trigger auto-play)
 */
export function markUserInitiatedStop() {
  userInitiatedStop = true;
}

/**
 * Map runtime state to player state
 */
function mapRuntimeState(runtimeState: PlayerState): ExplorePlayerState {
  switch (runtimeState) {
    case "playing":
      return "playing";
    case "loading":
      return "loading";
    default:
      return "stopped";
  }
}

/**
 * Persistent player bar for the explore page
 * Shows current track, playback controls, and progress
 */
export function ExplorePlayer({
  currentTrack,
  autoPlay,
  shuffle,
  hasNext,
  hasPrevious,
  onPlayNext,
  onPlayPrevious,
  onToggleAutoPlay,
  onToggleShuffle,
  onStop,
}: ExplorePlayerProps) {
  const runtimeRef = useRef(getAudioRuntime());
  const lastPlayedTrackRef = useRef<string | null>(null);
  const transportState = useTransportState();

  // Use useSyncExternalStore for runtime state to avoid setState in effects
  const playerState = useSyncExternalStore(
    (callback) => runtimeRef.current.subscribe(callback),
    () => mapRuntimeState(runtimeRef.current.getState()),
    () => "stopped" as ExplorePlayerState
  );

  // Handle track change - play when track changes
  useEffect(() => {
    if (!currentTrack) {
      // Stop playback when no track
      if (lastPlayedTrackRef.current !== null) {
        runtimeRef.current.stop();
      }
      lastPlayedTrackRef.current = null;
      return;
    }

    // Play new track if different from last
    if (currentTrack.id !== lastPlayedTrackRef.current) {
      lastPlayedTrackRef.current = currentTrack.id;
      runtimeRef.current.play(currentTrack.current_code).catch((err) => {
        console.error("Failed to play track:", err);
      });
    }
  }, [currentTrack]);

  // Store latest callback props in refs for use in subscription
  const autoPlayRef = useRef(autoPlay);
  const hasNextRef = useRef(hasNext);
  const onPlayNextRef = useRef(onPlayNext);

  // Update refs when props change (in effect to avoid render-time assignment)
  useEffect(() => {
    autoPlayRef.current = autoPlay;
    hasNextRef.current = hasNext;
    onPlayNextRef.current = onPlayNext;
  }, [autoPlay, hasNext, onPlayNext]);

  // Monitor for track end - using refs to avoid stale closure
  useEffect(() => {
    const runtime = runtimeRef.current;
    let wasPlaying = false;

    const unsubscribe = runtime.subscribe(() => {
      const state = runtime.getState();
      const isPlaying = state === "playing";

      // Detect transition from playing to stopped/idle
      if (wasPlaying && !isPlaying && state !== "loading") {
        // Check if this was a user-initiated stop (pause button clicked)
        // If so, don't auto-play the next track
        const wasUserInitiated = userInitiatedStop;
        userInitiatedStop = false; // Reset the flag

        if (!wasUserInitiated) {
          // Track ended naturally - trigger auto-play on next tick
          setTimeout(() => {
            if (autoPlayRef.current && hasNextRef.current) {
              onPlayNextRef.current();
            }
          }, 0);
        }
      }

      wasPlaying = isPlaying;
    });

    return unsubscribe;
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!currentTrack) return;

    const runtime = runtimeRef.current;
    if (playerState === "playing") {
      userInitiatedStop = true;
      runtime.stop();
    } else {
      runtime.play(currentTrack.current_code).catch((err) => {
        console.error("Failed to play:", err);
      });
    }
  }, [currentTrack, playerState]);

  const handleStop = useCallback(() => {
    runtimeRef.current.stop();
    onStop();
  }, [onStop]);

  const handlePrevious = useCallback(() => {
    const track = onPlayPrevious();
    if (!track && currentTrack) {
      // No previous track, just restart current
      runtimeRef.current.play(currentTrack.current_code).catch(() => {});
    }
  }, [onPlayPrevious, currentTrack]);

  const handleNext = useCallback(() => {
    onPlayNext();
  }, [onPlayNext]);

  // Format time from seconds
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Don't render if no track selected
  if (!currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Track info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-cyan-100 truncate">{currentTrack.name}</h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {currentTrack.genre && <span>{currentTrack.genre}</span>}
              {currentTrack.bpm && <span>{currentTrack.bpm} BPM</span>}
            </div>
          </div>

          {/* Main controls */}
          <div className="flex items-center gap-2">
            {/* Previous */}
            <button
              onClick={handlePrevious}
              disabled={!hasPrevious && !currentTrack}
              className="p-2 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous"
              aria-label="Previous track"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              disabled={playerState === "loading"}
              className="p-3 rounded-full bg-cyan-500 text-white hover:bg-cyan-400 disabled:opacity-50 transition-colors"
              aria-label={playerState === "playing" ? "Pause" : "Play"}
            >
              {playerState === "loading" ? (
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
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
              ) : playerState === "playing" ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={handleNext}
              disabled={!hasNext}
              className="p-2 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next"
              aria-label="Next track"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            {/* Stop */}
            <button
              onClick={handleStop}
              className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
              title="Stop"
              aria-label="Stop playback"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          </div>

          {/* Progress display */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 min-w-[100px]">
            <span>{formatTime(transportState.seconds)}</span>
            <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
              {/* Progress bar - shows progress within current bar */}
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${transportState.progress * 100}%` }}
              />
            </div>
          </div>

          {/* Toggle controls */}
          <div className="flex items-center gap-1">
            {/* Shuffle */}
            <button
              onClick={onToggleShuffle}
              className={`p-2 rounded-full transition-colors ${
                shuffle
                  ? "text-cyan-400 bg-cyan-500/20"
                  : "text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50"
              }`}
              title={shuffle ? "Shuffle on" : "Shuffle off"}
              aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
              aria-pressed={shuffle}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
              </svg>
            </button>

            {/* Auto-play */}
            <button
              onClick={onToggleAutoPlay}
              className={`p-2 rounded-full transition-colors ${
                autoPlay
                  ? "text-cyan-400 bg-cyan-500/20"
                  : "text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50"
              }`}
              title={autoPlay ? "Auto-play on" : "Auto-play off"}
              aria-label={autoPlay ? "Disable auto-play" : "Enable auto-play"}
              aria-pressed={autoPlay}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
