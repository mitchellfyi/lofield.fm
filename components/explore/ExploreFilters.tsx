"use client";

import { useState } from "react";
import type { ExploreFilterState, ExploreSortOption } from "@/lib/types/explore";

interface ExploreFiltersProps {
  filters: ExploreFilterState;
  genres: string[];
  availableTags: string[];
  bpmRange: { min: number; max: number };
  onGenreChange: (genre: string | null) => void;
  onTagToggle: (tag: string) => void;
  onBpmChange: (min: number, max: number) => void;
  onSortChange: (sort: ExploreSortOption) => void;
  onClear: () => void;
}

const SORT_OPTIONS: { value: ExploreSortOption; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "most_liked", label: "Most Liked" },
  { value: "newest", label: "Newest" },
  { value: "random", label: "Random" },
];

/**
 * Filter controls for the explore page
 */
export function ExploreFilters({
  filters,
  genres,
  availableTags,
  bpmRange,
  onGenreChange,
  onTagToggle,
  onBpmChange,
  onSortChange,
  onClear,
}: ExploreFiltersProps) {
  const [showAllTags, setShowAllTags] = useState(false);
  const [localBpmMin, setLocalBpmMin] = useState(filters.bpmMin);
  const [localBpmMax, setLocalBpmMax] = useState(filters.bpmMax);

  const hasActiveFilters =
    filters.genre !== null ||
    filters.tags.length > 0 ||
    filters.bpmMin > bpmRange.min ||
    filters.bpmMax < bpmRange.max;

  const displayedTags = showAllTags ? availableTags : availableTags.slice(0, 12);

  const handleBpmMinChange = (value: number) => {
    setLocalBpmMin(value);
  };

  const handleBpmMaxChange = (value: number) => {
    setLocalBpmMax(value);
  };

  const handleBpmBlur = () => {
    // Validate and apply BPM changes
    const min = Math.max(bpmRange.min, Math.min(localBpmMin, localBpmMax - 1));
    const max = Math.min(bpmRange.max, Math.max(localBpmMax, localBpmMin + 1));
    setLocalBpmMin(min);
    setLocalBpmMax(max);
    onBpmChange(min, max);
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-4">
      {/* Header with sort and clear */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-sm font-semibold text-cyan-100">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 px-2 py-2 min-h-11 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Sort:</span>
          <select
            value={filters.sort}
            onChange={(e) => onSortChange(e.target.value as ExploreSortOption)}
            className="text-xs bg-slate-700 border border-slate-600 rounded px-3 py-2 min-h-11 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Genre filter */}
      {genres.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-slate-400 mb-2">Genre</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onGenreChange(null)}
              className={`text-xs px-3 py-2 min-h-11 rounded-full transition-colors flex items-center justify-center ${
                filters.genre === null
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                  : "bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:border-cyan-500/30"
              }`}
            >
              All
            </button>
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => onGenreChange(genre)}
                className={`text-xs px-3 py-2 min-h-11 rounded-full transition-colors flex items-center justify-center ${
                  filters.genre === genre
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                    : "bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:border-cyan-500/30"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags filter */}
      {availableTags.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-slate-400 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {displayedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagToggle(tag)}
                className={`text-xs px-3 py-2 min-h-11 rounded-full transition-colors flex items-center justify-center ${
                  filters.tags.includes(tag)
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                    : "bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:border-cyan-500/30"
                }`}
              >
                {tag}
              </button>
            ))}
            {availableTags.length > 12 && (
              <button
                onClick={() => setShowAllTags(!showAllTags)}
                className="text-xs px-3 py-2 min-h-11 text-slate-500 hover:text-cyan-400 transition-colors flex items-center justify-center"
              >
                {showAllTags ? "Show less" : `+${availableTags.length - 12} more`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* BPM range */}
      <div>
        <h3 className="text-xs font-medium text-slate-400 mb-2">
          BPM Range ({bpmRange.min} - {bpmRange.max})
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localBpmMin}
            onChange={(e) => handleBpmMinChange(Number(e.target.value))}
            onBlur={handleBpmBlur}
            min={bpmRange.min}
            max={bpmRange.max}
            className="w-16 sm:w-20 text-sm bg-slate-700 border border-slate-600 rounded px-2 py-2 min-h-11 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <span className="text-slate-500 text-sm">to</span>
          <input
            type="number"
            value={localBpmMax}
            onChange={(e) => handleBpmMaxChange(Number(e.target.value))}
            onBlur={handleBpmBlur}
            min={bpmRange.min}
            max={bpmRange.max}
            className="w-16 sm:w-20 text-sm bg-slate-700 border border-slate-600 rounded px-2 py-2 min-h-11 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>
    </div>
  );
}
