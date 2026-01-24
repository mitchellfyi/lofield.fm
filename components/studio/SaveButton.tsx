"use client";

import { useState, useRef, useEffect } from "react";

interface SaveButtonProps {
  onSave: () => Promise<void>;
  onSaveAs: () => void;
  disabled?: boolean;
  hasUnsavedChanges?: boolean;
  saving?: boolean;
  autoSaveEnabled?: boolean;
  onAutoSaveToggle?: (enabled: boolean) => void;
  lastSaved?: Date | null;
}

export function SaveButton({
  onSave,
  onSaveAs,
  disabled = false,
  hasUnsavedChanges = false,
  saving = false,
  autoSaveEnabled = false,
  onAutoSaveToggle,
  lastSaved,
}: SaveButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (disabled || saving) return;
    await onSave();
    setShowDropdown(false);
  };

  const formatLastSaved = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center">
        {/* Main Save Button */}
        <button
          onClick={handleSave}
          disabled={disabled || saving}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-l-sm text-[10px] sm:text-xs font-medium transition-all duration-200 ${
            hasUnsavedChanges
              ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-600/30"
              : "text-slate-300 hover:text-cyan-300 border border-slate-600 hover:border-cyan-500/50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          title={hasUnsavedChanges ? "Save changes" : "No unsaved changes"}
        >
          {saving ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
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
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
          )}
          <span className="hidden sm:inline">Save</span>
          {hasUnsavedChanges && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>

        {/* Dropdown Toggle */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`px-1.5 py-1.5 rounded-r-sm text-slate-300 border border-l-0 border-slate-600 hover:border-cyan-500/50 hover:text-cyan-300 transition-all duration-200 ${
            hasUnsavedChanges ? "border-cyan-500/50" : ""
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${showDropdown ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-xl shadow-cyan-500/10 backdrop-blur-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1">
            {/* Save */}
            <button
              onClick={handleSave}
              disabled={disabled || saving}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Save
              <span className="ml-auto text-xs text-slate-500">Ctrl+S</span>
            </button>

            {/* Save As */}
            <button
              onClick={() => {
                onSaveAs();
                setShowDropdown(false);
              }}
              disabled={disabled}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Save As New Track...
            </button>

            {/* Divider */}
            <div className="my-1 border-t border-slate-700" />

            {/* Auto-save Toggle */}
            {onAutoSaveToggle && (
              <button
                onClick={() => {
                  onAutoSaveToggle(!autoSaveEnabled);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-cyan-500/10"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    autoSaveEnabled ? "bg-cyan-500 border-cyan-500" : "border-slate-500"
                  }`}
                >
                  {autoSaveEnabled && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                Auto-save
              </button>
            )}

            {/* Last Saved Info */}
            {lastSaved && (
              <div className="px-4 py-2 text-xs text-slate-500">
                Last saved: {formatLastSaved(lastSaved)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
