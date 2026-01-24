"use client";

import { useState, useMemo } from "react";
import { useRevisions } from "@/lib/hooks/useRevisions";
import { DiffView } from "./DiffView";
import type { Revision } from "@/lib/types/tracks";

interface RevisionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string | null;
  currentCode: string;
  onRevert: (code: string) => void;
  onPreview: (code: string) => void;
}

export function RevisionHistory({
  isOpen,
  onClose,
  trackId,
  currentCode,
  onRevert,
  onPreview,
}: RevisionHistoryProps) {
  const { revisions, loading, error, createRevision } = useRevisions(trackId);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [compareRevision, setCompareRevision] = useState<Revision | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [reverting, setReverting] = useState(false);

  // Find which revision matches the current code
  const currentRevisionId = useMemo(() => {
    const matching = revisions.find((r) => r.code === currentCode);
    return matching?.id ?? null;
  }, [revisions, currentCode]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const handleRevert = async (revision: Revision) => {
    if (reverting) return;

    setReverting(true);
    try {
      // Create a new revision with the reverted code
      const message = `Reverted to revision from ${formatDate(revision.created_at)}`;
      await createRevision(revision.code, message);

      // Call the parent's revert handler to update the code
      onRevert(revision.code);
      setSelectedRevision(null);
      setPreviewMode(false);
    } finally {
      setReverting(false);
    }
  };

  const handleSelectForDiff = (revision: Revision) => {
    if (!compareRevision) {
      setCompareRevision(revision);
    } else if (compareRevision.id === revision.id) {
      setCompareRevision(null);
    } else {
      setSelectedRevision(revision);
      setShowDiff(true);
    }
  };

  const closeDiff = () => {
    setShowDiff(false);
    setSelectedRevision(null);
    setCompareRevision(null);
  };

  // Diff view modal
  if (showDiff && selectedRevision && compareRevision) {
    // Determine which is older
    const older =
      new Date(selectedRevision.created_at) < new Date(compareRevision.created_at)
        ? selectedRevision
        : compareRevision;
    const newer = older === selectedRevision ? compareRevision : selectedRevision;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-6xl h-[80vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="flex items-center gap-4">
              <button
                onClick={closeDiff}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-cyan-300">Compare Revisions</h2>
            </div>
            <button
              onClick={closeDiff}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Diff content */}
          <div className="flex-1 overflow-hidden">
            <DiffView
              oldCode={older.code}
              newCode={newer.code}
              oldLabel={`${formatDate(older.created_at)}${older.message ? ` - ${older.message}` : ""}`}
              newLabel={`${formatDate(newer.created_at)}${newer.message ? ` - ${newer.message}` : ""}`}
            />
          </div>
        </div>
      </div>
    );
  }

  // Preview modal
  if (previewMode && selectedRevision) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-4xl h-[80vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setPreviewMode(false);
                  setSelectedRevision(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-cyan-300">Preview Revision</h2>
                <p className="text-sm text-slate-400">
                  {formatDate(selectedRevision.created_at)}
                  {selectedRevision.message && ` - ${selectedRevision.message}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onPreview(selectedRevision.code);
                  setPreviewMode(false);
                  setSelectedRevision(null);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
              >
                Load in Editor
              </button>
              <button
                onClick={() => handleRevert(selectedRevision)}
                disabled={reverting}
                className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-lg transition-all duration-200"
              >
                {reverting ? "Reverting..." : "Revert to This Version"}
              </button>
            </div>
          </div>

          {/* Code preview */}
          <div className="flex-1 overflow-auto p-4">
            <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap">
              {selectedRevision.code}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // Main revision list view
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-cyan-300">Version History</h2>
            <p className="text-xs text-slate-400 mt-1">
              {revisions.length} revision{revisions.length !== 1 ? "s" : ""}
              {compareRevision && " • Select another to compare"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Compare mode toggle */}
        {revisions.length >= 2 && (
          <div className="px-4 py-2 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {compareRevision
                  ? "Click another revision to compare"
                  : "Click to select for comparison"}
              </span>
              {compareRevision && (
                <button
                  onClick={() => setCompareRevision(null)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading revisions...</div>
          ) : error ? (
            <div className="text-center py-8 text-rose-400">{error}</div>
          ) : revisions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No revisions yet</p>
              <p className="text-sm mt-2">
                Revisions are created automatically when you make changes via chat.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {revisions.map((revision) => {
                const isCurrent = revision.id === currentRevisionId;
                const isSelected = compareRevision?.id === revision.id;

                return (
                  <div
                    key={revision.id}
                    className={`group relative p-3 rounded-lg transition-all ${
                      isCurrent
                        ? "bg-cyan-600/20 border border-cyan-500/50"
                        : isSelected
                          ? "bg-purple-600/20 border border-purple-500/50"
                          : "hover:bg-slate-700/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">
                            {formatDate(revision.created_at)}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-500/20 text-cyan-400 rounded-full">
                              Current
                            </span>
                          )}
                          {isSelected && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-400 rounded-full">
                              Selected
                            </span>
                          )}
                        </div>
                        {revision.message && (
                          <p className="text-xs text-slate-400 mt-1 truncate">{revision.message}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 ml-2">
                        {revisions.length >= 2 && (
                          <button
                            onClick={() => handleSelectForDiff(revision)}
                            className={`p-1.5 rounded transition-colors ${
                              isSelected
                                ? "text-purple-400 bg-purple-500/20"
                                : "text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                            }`}
                            title="Compare"
                          >
                            <svg
                              className="w-4 h-4"
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
                        )}
                        <button
                          onClick={() => {
                            setSelectedRevision(revision);
                            setPreviewMode(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors"
                          title="Preview"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => handleRevert(revision)}
                            disabled={reverting}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors disabled:opacity-50"
                            title="Revert to this version"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
