"use client";

import { useState, useRef, useCallback } from "react";
import { renderAudio, estimateFileSize, formatFileSize } from "@/lib/export/audioExport";
import { downloadBlob } from "@/lib/export/codeExport";
import type { ExportFormat, ExportProgress } from "@/lib/export/types";
import type { Recording } from "@/lib/types/recording";

interface ExportModalProps {
  isOpen: boolean;
  code: string;
  trackName?: string;
  onClose: () => void;
  onSuccess?: () => void;
  /** Optional recording with automation events to bake into export */
  recording?: Recording | null;
}

const DURATION_PRESETS = [
  { label: "30s", value: 30 },
  { label: "1 min", value: 60 },
  { label: "2 min", value: 120 },
  { label: "4 min", value: 240 },
  { label: "Custom", value: 0 },
];

type ExportState = "idle" | "rendering" | "complete" | "error";

export function ExportModal({
  isOpen,
  code,
  trackName,
  onClose,
  onSuccess,
  recording,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("wav");
  const [duration, setDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState("60");
  const [useCustom, setUseCustom] = useState(false);
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [includeAutomation, setIncludeAutomation] = useState(false);

  const abortRef = useRef(false);

  // Check if recording has events to include
  const hasRecordingEvents = recording && recording.events.length > 0;

  const handleDurationPreset = (preset: (typeof DURATION_PRESETS)[number]) => {
    if (preset.value === 0) {
      setUseCustom(true);
    } else {
      setUseCustom(false);
      setDuration(preset.value);
    }
  };

  const handleCustomDurationChange = (value: string) => {
    setCustomDuration(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setDuration(parsed);
    }
  };

  const effectiveDuration = useCustom ? parseInt(customDuration, 10) || 60 : duration;
  const estimatedSize = estimateFileSize(effectiveDuration, format);

  const handleExport = useCallback(async () => {
    if (exportState === "rendering") return;

    abortRef.current = false;
    setExportState("rendering");
    setError(null);
    setProgress({ phase: "preparing", percent: 0 });
    setExportedBlob(null);

    try {
      const blob = await renderAudio(code, {
        format,
        duration: effectiveDuration,
        onProgress: (p) => {
          if (!abortRef.current) {
            setProgress(p);
          }
        },
        // Include recording automation if user opted in and recording exists
        recording: includeAutomation && recording ? recording : undefined,
      });

      if (abortRef.current) {
        return;
      }

      setExportedBlob(blob);
      setExportState("complete");
      setProgress({ phase: "complete", percent: 100 });
    } catch (err) {
      if (abortRef.current) return;

      const errorMsg = err instanceof Error ? err.message : "Export failed";
      setError(errorMsg);
      setExportState("error");
    }
  }, [code, format, effectiveDuration, exportState, includeAutomation, recording]);

  const handleDownload = () => {
    if (!exportedBlob) return;

    const extension = format === "wav" ? "wav" : "mp3";
    const filename = trackName
      ? `${trackName.toLowerCase().replace(/\s+/g, "-")}.${extension}`
      : `track-${Date.now()}.${extension}`;

    downloadBlob(exportedBlob, filename);
    onSuccess?.();
  };

  const handleCancel = () => {
    if (exportState === "rendering") {
      abortRef.current = true;
    }
    handleClose();
  };

  const handleClose = () => {
    setExportState("idle");
    setProgress(null);
    setError(null);
    setExportedBlob(null);
    onClose();
  };

  if (!isOpen) return null;

  const phaseMessages: Record<ExportProgress["phase"], string> = {
    preparing: "Preparing...",
    rendering: "Rendering audio...",
    encoding: "Encoding file...",
    complete: "Export complete!",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800">
          <h2 className="text-xl font-bold text-cyan-300">Export Audio</h2>
          <p className="text-sm text-slate-400 mt-1">Render your track to an audio file</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormat("wav")}
                disabled={exportState === "rendering"}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  format === "wav"
                    ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
                    : "bg-slate-800/50 text-slate-400 border border-slate-600 hover:border-cyan-500/30"
                } ${exportState === "rendering" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                WAV
                <span className="block text-xs text-slate-500 mt-0.5">Lossless quality</span>
              </button>
              <button
                disabled
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-slate-800/30 text-slate-600 border border-slate-700 cursor-not-allowed"
              >
                MP3
                <span className="block text-xs text-slate-600 mt-0.5">Coming soon</span>
              </button>
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleDurationPreset(preset)}
                  disabled={exportState === "rendering"}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    (preset.value === 0 && useCustom) || (!useCustom && preset.value === duration)
                      ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
                      : "bg-slate-800/50 text-slate-400 border border-slate-600 hover:border-cyan-500/30"
                  } ${exportState === "rendering" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Duration Input */}
            {useCustom && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  value={customDuration}
                  onChange={(e) => handleCustomDurationChange(e.target.value)}
                  disabled={exportState === "rendering"}
                  min={1}
                  max={600}
                  className="w-24 px-3 py-2 rounded-lg bg-slate-800/50 border border-cyan-500/30 text-white text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50"
                />
                <span className="text-sm text-slate-400">seconds</span>
              </div>
            )}
          </div>

          {/* Automation Toggle - only shown when recording exists */}
          {hasRecordingEvents && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
              <div>
                <label className="text-sm font-medium text-violet-300">
                  Include Automation
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bake {recording!.events.length} parameter changes into the audio
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={includeAutomation}
                onClick={() => setIncludeAutomation(!includeAutomation)}
                disabled={exportState === "rendering"}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  includeAutomation ? "bg-violet-600" : "bg-slate-700"
                } ${exportState === "rendering" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    includeAutomation ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Estimated Size */}
          <div className="text-sm text-slate-500">
            Estimated file size:{" "}
            <span className="text-slate-300">{formatFileSize(estimatedSize)}</span>
          </div>

          {/* Progress Bar */}
          {exportState !== "idle" && progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{phaseMessages[progress.phase]}</span>
                <span className="text-cyan-400">{Math.round(progress.percent)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    exportState === "error"
                      ? "bg-rose-500"
                      : exportState === "complete"
                        ? "bg-emerald-500"
                        : "bg-gradient-to-r from-cyan-600 to-cyan-400"
                  }`}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              {progress.message && <p className="text-xs text-slate-500">{progress.message}</p>}
            </div>
          )}

          {/* Success message */}
          {exportState === "complete" && (
            <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm">
              Audio rendered successfully! Click download to save.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800 flex gap-3">
          <button
            onClick={handleCancel}
            disabled={false}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-300 border border-slate-600 hover:bg-slate-700 transition-colors"
          >
            {exportState === "rendering" ? "Cancel" : "Close"}
          </button>

          {exportState === "complete" ? (
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white transition-all duration-200 shadow-lg shadow-emerald-500/20"
            >
              Download
            </button>
          ) : (
            <button
              onClick={handleExport}
              disabled={exportState === "rendering"}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportState === "rendering" ? "Exporting..." : "Export"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
