"use client";

import { useState } from "react";
import type { Recording } from "@/lib/types/recording";
import { formatRecordingTime, getRecordingStats } from "@/lib/types/recording";
import {
  exportRecordingToJson,
  exportRecordingToCsv,
  downloadBlob,
  generateRecordingFilename,
} from "@/lib/export/recordingExport";

interface RecordingPanelProps {
  /** List of recordings for the current track */
  recordings: Recording[];
  /** Currently active recording for playback */
  activeRecording: Recording | null;
  /** Whether recordings are loading */
  loading?: boolean;
  /** Callback to load a recording for playback */
  onLoadRecording: (recording: Recording) => void;
  /** Callback to delete a recording */
  onDeleteRecording: (recordingId: string) => void;
  /** Callback to rename a recording */
  onRenameRecording?: (recordingId: string, newName: string) => void;
}

export function RecordingPanel({
  recordings,
  activeRecording,
  loading = false,
  onLoadRecording,
  onDeleteRecording,
  onRenameRecording,
}: RecordingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [expandedStatsId, setExpandedStatsId] = useState<string | null>(null);

  const handleStartEdit = (recording: Recording) => {
    setEditingId(recording.id);
    setEditName(recording.name || "");
  };

  const handleSaveEdit = (recordingId: string) => {
    if (onRenameRecording && editName.trim()) {
      onRenameRecording(recordingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleExportJson = (recording: Recording) => {
    const blob = exportRecordingToJson(recording);
    const filename = generateRecordingFilename(recording, "json");
    downloadBlob(blob, filename);
  };

  const handleExportCsv = (recording: Recording) => {
    const blob = exportRecordingToCsv(recording);
    const filename = generateRecordingFilename(recording, "csv");
    downloadBlob(blob, filename);
  };

  const handleToggleStats = (recordingId: string) => {
    setExpandedStatsId(expandedStatsId === recordingId ? null : recordingId);
  };

  if (recordings.length === 0 && !loading) {
    return null; // Don't show panel when there are no recordings
  }

  return (
    <div className="rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 border-b border-cyan-500/20 bg-slate-900/50 hover:bg-slate-900/70 transition-colors flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
            Recordings
          </div>
          <span className="text-[10px] text-slate-500">({recordings.length})</span>
        </div>
        <svg
          className={`w-3 h-3 text-cyan-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-2 space-y-2 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="text-center text-xs text-slate-500 py-4">Loading recordings...</div>
          ) : (
            recordings.map((recording) => {
              const isActive = activeRecording?.id === recording.id;
              const isEditing = editingId === recording.id;
              const showStats = expandedStatsId === recording.id;
              const stats = showStats ? getRecordingStats(recording) : null;

              return (
                <div
                  key={recording.id}
                  className={`
                    rounded-lg border transition-colors
                    ${isActive ? "bg-cyan-500/10 border-cyan-500/40" : "bg-slate-800/30 border-slate-700/30 hover:border-cyan-500/20"}
                  `}
                >
                  <div className="p-2 flex items-center gap-2">
                    {/* Play/Load Button */}
                    <button
                      onClick={() => onLoadRecording(recording)}
                      className={`
                        p-1.5 rounded transition-colors
                        ${isActive ? "text-cyan-400 bg-cyan-500/20" : "text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50"}
                      `}
                      title={isActive ? "Currently loaded" : "Load recording"}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        {isActive ? (
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        ) : (
                          <path d="M8 5v14l11-7z" />
                        )}
                      </svg>
                    </button>

                    {/* Name / Edit */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(recording.id);
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          className="w-full px-2 py-0.5 text-xs bg-slate-700 border border-cyan-500/30 rounded focus:outline-none focus:border-cyan-500"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => handleStartEdit(recording)}
                          className="text-xs text-slate-200 truncate w-full text-left hover:text-cyan-400 transition-colors"
                          title="Click to rename"
                        >
                          {recording.name || "Untitled"}
                        </button>
                      )}
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>{formatRecordingTime(recording.duration_ms)}</span>
                        <span>•</span>
                        <span>{recording.events.length} events</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(recording.id)}
                            className="p-1 text-green-400 hover:bg-green-500/20 rounded transition-colors"
                            title="Save"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-slate-400 hover:bg-slate-700/50 rounded transition-colors"
                            title="Cancel"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Stats Toggle */}
                          <button
                            onClick={() => handleToggleStats(recording.id)}
                            className={`p-1 rounded transition-colors ${showStats ? "text-cyan-400 bg-cyan-500/20" : "text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50"}`}
                            title="View stats"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                          </button>

                          {/* Export JSON */}
                          <button
                            onClick={() => handleExportJson(recording)}
                            className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded transition-colors"
                            title="Export JSON"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </button>

                          {/* Export CSV */}
                          <button
                            onClick={() => handleExportCsv(recording)}
                            className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded transition-colors"
                            title="Export CSV"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteRecording(recording.id)}
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            title="Delete"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded Stats */}
                  {showStats && stats && (
                    <div className="px-3 pb-2 pt-1 border-t border-slate-700/30 text-[10px]">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="text-slate-500">Events/sec:</div>
                        <div className="text-slate-300">
                          {stats.averageEventsPerSecond.toFixed(2)}
                        </div>
                        {Object.entries(stats.eventsByType).map(([type, count]) => (
                          <div key={type} className="contents">
                            <div className="text-slate-500 capitalize">{type}:</div>
                            <div className="text-slate-300">{count}</div>
                          </div>
                        ))}
                        {Object.entries(stats.eventsByParam).map(([param, count]) => (
                          <div key={param} className="contents">
                            <div className="text-slate-500 capitalize">{param}:</div>
                            <div className="text-slate-300">{count}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
