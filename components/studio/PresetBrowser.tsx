"use client";

import { useState, useCallback } from "react";
import { PRESETS, type Preset } from "@/lib/audio/presets";
import { filterPresets, getUniqueGenres, getUniqueTags } from "@/lib/audio/presets/utils";
import { PresetCard } from "./PresetCard";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface PresetBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPreset: (code: string) => void;
  hasUnsavedChanges: boolean;
}

export function PresetBrowser({
  isOpen,
  onClose,
  onLoadPreset,
  hasUnsavedChanges,
}: PresetBrowserProps) {
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingLoadPreset, setPendingLoadPreset] = useState<Preset | null>(null);

  const genres = getUniqueGenres();
  const tags = getUniqueTags();

  const filteredPresets = filterPresets({
    genre: selectedGenre,
    tag: selectedTag,
    search: searchQuery,
  });

  const handleLoad = useCallback(
    (preset: Preset) => {
      if (hasUnsavedChanges) {
        setPendingLoadPreset(preset);
      } else {
        onLoadPreset(preset.code);
        onClose();
      }
    },
    [hasUnsavedChanges, onLoadPreset, onClose]
  );

  const handleConfirmLoad = useCallback(() => {
    if (pendingLoadPreset) {
      onLoadPreset(pendingLoadPreset.code);
      setPendingLoadPreset(null);
      onClose();
    }
  }, [pendingLoadPreset, onLoadPreset, onClose]);

  const handleCancelLoad = useCallback(() => {
    setPendingLoadPreset(null);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedGenre(undefined);
    setSelectedTag(undefined);
    setSearchQuery("");
  }, []);

  const hasActiveFilters = selectedGenre || selectedTag || searchQuery;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-4xl max-h-[85vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-cyan-300">Preset Library</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Choose from {PRESETS.length} curated presets
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="mt-4 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-cyan-500/30 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 border-b border-slate-700/50 flex-shrink-0 space-y-3">
            {/* Genre Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-medium text-slate-500 mr-1 flex-shrink-0">Genre:</span>
              <button
                onClick={() => setSelectedGenre(undefined)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                  !selectedGenre
                    ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
                    : "bg-slate-800/50 text-slate-400 border border-slate-600 hover:border-cyan-500/30"
                }`}
              >
                All
              </button>
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre((g) => (g === genre ? undefined : genre))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                    selectedGenre === genre
                      ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
                      : "bg-slate-800/50 text-slate-400 border border-slate-600 hover:border-cyan-500/30"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Tag Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-medium text-slate-500 mr-1 flex-shrink-0">Mood:</span>
              {tags.slice(0, 12).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag((t) => (t === tag ? undefined : tag))}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 flex-shrink-0 ${
                    selectedTag === tag
                      ? "bg-amber-600/30 text-amber-300 border border-amber-500/50"
                      : "bg-slate-800/50 text-slate-400 border border-slate-600 hover:border-amber-500/30"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Active Filters / Clear */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">
                  Showing {filteredPresets.length} of {PRESETS.length} presets
                </span>
                <button
                  onClick={clearFilters}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredPresets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPresets.map((preset) => (
                  <PresetCard key={preset.id} preset={preset} onLoad={handleLoad} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <svg
                  className="w-12 h-12 text-slate-600 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-slate-400 text-sm">No presets match your filters</p>
                <button
                  onClick={clearFilters}
                  className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={pendingLoadPreset !== null}
        title="Unsaved Changes"
        message="You have unsaved changes. Loading a new preset will replace your current code. Do you want to continue?"
        confirmLabel="Load Preset"
        cancelLabel="Keep Editing"
        variant="warning"
        onConfirm={handleConfirmLoad}
        onCancel={handleCancelLoad}
      />
    </>
  );
}
