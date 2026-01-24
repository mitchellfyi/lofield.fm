"use client";

import { useState, useRef, useEffect } from "react";
import { copyToClipboard, downloadAsJS } from "@/lib/export/codeExport";
import type { ToastType } from "@/lib/export/types";

interface ExportButtonProps {
  code: string;
  trackName?: string;
  disabled?: boolean;
  onExportAudio: () => void;
  onToast: (message: string, type: ToastType) => void;
}

export function ExportButton({
  code,
  trackName,
  disabled = false,
  onExportAudio,
  onToast,
}: ExportButtonProps) {
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

  const handleCopyCode = async () => {
    const result = await copyToClipboard(code);
    if (result.success) {
      onToast("Code copied to clipboard", "success");
    } else {
      onToast(result.error || "Failed to copy", "error");
    }
    setShowDropdown(false);
  };

  const handleDownloadJS = () => {
    const filename = trackName
      ? `${trackName.toLowerCase().replace(/\s+/g, "-")}.js`
      : undefined;
    downloadAsJS(code, filename);
    onToast("Downloaded as JS file", "success");
    setShowDropdown(false);
  };

  const handleExportAudio = () => {
    onExportAudio();
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-sm text-[10px] sm:text-xs font-medium transition-all duration-200 text-slate-300 hover:text-cyan-300 border border-slate-600 hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export options"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        <span className="hidden sm:inline">Export</span>
        <svg
          className={`w-3 h-3 transition-transform ${showDropdown ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-xl shadow-cyan-500/10 backdrop-blur-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1">
            {/* Copy Code */}
            <button
              onClick={handleCopyCode}
              disabled={disabled}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              Copy Code
              <span className="ml-auto text-xs text-slate-500">Ctrl+C</span>
            </button>

            {/* Download JS */}
            <button
              onClick={handleDownloadJS}
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
              Download as JS
            </button>

            {/* Divider */}
            <div className="my-1 border-t border-slate-700" />

            {/* Export Audio */}
            <button
              onClick={handleExportAudio}
              disabled={disabled}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              Export Audio...
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
