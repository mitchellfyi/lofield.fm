"use client";

import { RecordingTimeline } from "@/components/studio/RecordingTimeline";
import type { Recording, RecordingEvent } from "@/lib/types/recording";
import type { PlayerState } from "@/lib/audio/runtime";

export interface RecordingControlsProps {
  /** The active recording to display */
  recording: Recording;
  /** Current player state */
  playerState: PlayerState;
  /** Whether automation playback is active */
  isPlaybackActive: boolean;
  /** Current playback time in milliseconds */
  playbackTimeMs: number;
  /** Callback to start automation playback */
  onStartPlayback: () => void;
  /** Callback to pause automation playback */
  onPausePlayback: () => void;
  /** Callback to reset automation playback */
  onResetPlayback: () => void;
  /** Callback to close the recording */
  onClose: () => void;
  /** Callback to delete an event from the recording */
  onDeleteEvent: (eventId: string) => void;
  /** Callback to update an event in the recording */
  onUpdateEvent: (event: RecordingEvent) => void;
}

/**
 * Recording timeline controls component
 *
 * Displays the active recording with playback controls for automation.
 * Extracted from the studio page desktop layout.
 */
export function RecordingControls({
  recording,
  playerState,
  isPlaybackActive,
  playbackTimeMs,
  onStartPlayback,
  onPausePlayback,
  onResetPlayback,
  onClose,
  onDeleteEvent,
  onUpdateEvent,
}: RecordingControlsProps) {
  return (
    <div className="rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm p-3 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
          Recording: {recording.name || "Untitled"}
        </div>
        {/* Playback controls for recorded automation */}
        <div className="flex items-center gap-2">
          {isPlaybackActive ? (
            <button
              onClick={onPausePlayback}
              className="p-1 rounded hover:bg-cyan-500/20 text-cyan-400 transition-colors"
              title="Pause automation playback"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onStartPlayback}
              disabled={playerState !== "playing"}
              className="p-1 rounded hover:bg-cyan-500/20 text-cyan-400 disabled:text-slate-600 disabled:hover:bg-transparent transition-colors"
              title={playerState === "playing" ? "Play automation" : "Start audio playback first"}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
          <button
            onClick={onResetPlayback}
            className="p-1 rounded hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Reset automation to start"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
            title="Close recording"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
      <RecordingTimeline
        recording={recording}
        currentTimeMs={isPlaybackActive ? playbackTimeMs : undefined}
        onDeleteEvent={onDeleteEvent}
        onUpdateEvent={onUpdateEvent}
      />
    </div>
  );
}
