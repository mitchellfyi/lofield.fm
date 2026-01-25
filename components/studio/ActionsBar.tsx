"use client";

import { ModelSelector } from "./ModelSelector";

interface ActionsBarProps {
  // Undo/Redo
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  // Save
  onSave?: () => void;
  onSaveAs?: () => void;
  hasUnsavedChanges?: boolean;
  saving?: boolean;
  // Export
  onExport?: () => void;
  // Share
  onShare?: () => void;
  canShare?: boolean;
  // Revert
  onRevert?: () => void;
  // Copy
  onCopy?: () => void;
  // Model
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  // History
  onOpenHistory?: () => void;
  hasRevisions?: boolean;
}

export function ActionsBar({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onSave,
  onSaveAs,
  hasUnsavedChanges = false,
  saving = false,
  onExport,
  onShare,
  canShare = false,
  onRevert,
  onCopy,
  selectedModel,
  onModelChange,
  onOpenHistory,
  hasRevisions = false,
}: ActionsBarProps) {
  const buttonBase =
    "flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 shrink-0";
  const buttonDefault =
    "text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30";
  const buttonDisabled = "text-slate-500 cursor-not-allowed";
  const buttonActive = "text-cyan-300 bg-cyan-500/10 border border-cyan-500/30";

  return (
    <div className="border-b border-cyan-950/50 bg-slate-900/50 backdrop-blur-sm">
      <div className="flex items-center gap-1 px-2 sm:px-4 py-1.5 overflow-x-auto scrollbar-none">
        {/* Undo/Redo Group */}
        <div className="flex items-center border-r border-cyan-500/20 pr-2 mr-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`${buttonBase} ${canUndo ? buttonDefault : buttonDisabled}`}
            title="Undo (Cmd/Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a5 5 0 015 5v2M3 10l5-5M3 10l5 5"
              />
            </svg>
            <span className="hidden sm:inline">Undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`${buttonBase} ${canRedo ? buttonDefault : buttonDisabled}`}
            title="Redo (Cmd/Ctrl+Shift+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 10H11a5 5 0 00-5 5v2m15-7l-5-5m5 5l-5 5"
              />
            </svg>
            <span className="hidden sm:inline">Redo</span>
          </button>
        </div>

        {/* Save Group */}
        <div className="flex items-center border-r border-cyan-500/20 pr-2 mr-1">
          <button
            onClick={onSave}
            disabled={saving}
            className={`${buttonBase} ${hasUnsavedChanges ? buttonActive : buttonDefault} ${saving ? buttonDisabled : ""}`}
            title="Save (Cmd/Ctrl+S)"
          >
            {saving ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
            )}
            <span className="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
            {hasUnsavedChanges && !saving && (
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            )}
          </button>
          {onSaveAs && (
            <button
              onClick={onSaveAs}
              className={`${buttonBase} ${buttonDefault}`}
              title="Save As..."
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Save As</span>
            </button>
          )}
        </div>

        {/* History */}
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className={`${buttonBase} ${buttonDefault} relative border-r border-cyan-500/20 pr-2 mr-1`}
            title="Version History"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="hidden sm:inline">History</span>
            {hasRevisions && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full" />
            )}
          </button>
        )}

        {/* Edit Actions Group */}
        <div className="flex items-center border-r border-cyan-500/20 pr-2 mr-1">
          {onCopy && (
            <button onClick={onCopy} className={`${buttonBase} ${buttonDefault}`} title="Copy Code">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden sm:inline">Copy</span>
            </button>
          )}
          {onRevert && (
            <button
              onClick={onRevert}
              className={`${buttonBase} ${buttonDefault}`}
              title="Revert to Default"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">Revert</span>
            </button>
          )}
        </div>

        {/* Export/Share Group */}
        <div className="flex items-center border-r border-cyan-500/20 pr-2 mr-1">
          {onExport && (
            <button
              onClick={onExport}
              className={`${buttonBase} ${buttonDefault}`}
              title="Export Audio"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              disabled={!canShare}
              className={`${buttonBase} ${canShare ? buttonDefault : buttonDisabled}`}
              title={canShare ? "Share Track" : "Save track first to share"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
        </div>

        {/* Model Selector - pushed to end */}
        <div className="flex-1" />
        {selectedModel && onModelChange && (
          <div className="shrink-0">
            <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} compact />
          </div>
        )}
      </div>
    </div>
  );
}
