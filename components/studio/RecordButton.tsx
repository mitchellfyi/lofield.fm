"use client";

import { formatRecordingTime } from "@/lib/types/recording";

interface RecordButtonProps {
  /** Whether recording is currently active */
  isRecording: boolean;
  /** Callback to start recording */
  onStartRecording: () => void;
  /** Callback to stop recording */
  onStopRecording: () => void;
  /** Elapsed time in milliseconds */
  elapsedMs: number;
  /** Whether the button is disabled (e.g., not playing) */
  disabled?: boolean;
  /** Tooltip when disabled */
  disabledReason?: string;
}

export function RecordButton({
  isRecording,
  onStartRecording,
  onStopRecording,
  elapsedMs,
  disabled = false,
  disabledReason,
}: RecordButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={disabled && !isRecording}
        title={
          disabled && !isRecording
            ? disabledReason
            : isRecording
              ? "Stop recording"
              : "Start recording"
        }
        className={`
          relative px-4 py-4 rounded-sm font-bold text-base transition-all duration-200
          border backdrop-blur-sm overflow-hidden group
          ${
            isRecording
              ? "bg-gradient-to-r from-red-600/90 via-red-500/90 to-red-600/90 hover:from-red-500/90 hover:via-red-400/90 hover:to-red-500/90 border-red-500/50 hover:border-red-400/60 shadow-lg shadow-red-500/30 text-white"
              : disabled
                ? "bg-gradient-to-r from-slate-700 via-slate-700 to-slate-700 border-slate-600 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-slate-800/90 via-slate-700/90 to-slate-800/90 hover:from-slate-700/90 hover:via-slate-600/90 hover:to-slate-700/90 border-cyan-500/30 hover:border-red-500/50 text-cyan-100 hover:text-red-300 shadow-lg shadow-cyan-500/10 hover:shadow-red-500/20"
          }
        `}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {/* Recording indicator dot */}
          <span
            className={`
              w-3 h-3 rounded-full transition-all duration-200
              ${
                isRecording
                  ? "bg-white animate-pulse"
                  : disabled
                    ? "bg-slate-500"
                    : "bg-red-500 group-hover:bg-red-400"
              }
            `}
          />
          {isRecording ? "Stop" : "Rec"}
        </span>

        {/* Pulse animation when recording */}
        {isRecording && (
          <span className="absolute inset-0 rounded-sm animate-ping bg-red-500/20 pointer-events-none" />
        )}

        {/* Hover effect */}
        {!disabled && (
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        )}
      </button>

      {/* Recording timer display */}
      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-sm text-red-400 tabular-nums">
            {formatRecordingTime(elapsedMs)}
          </span>
        </div>
      )}
    </div>
  );
}
