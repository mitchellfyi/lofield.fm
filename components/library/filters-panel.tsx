"use client";

import { useState, useCallback } from "react";

export type FilterState = {
  search: string;
  artist: string;
  genre: string;
  bpmMin: number | null;
  bpmMax: number | null;
  energyMin: number | null;
  energyMax: number | null;
  focusMin: number | null;
  focusMax: number | null;
  chillMin: number | null;
  chillMax: number | null;
  tags: string[];
  instrumentation: string[];
  sort: "newest" | "bpm_asc" | "bpm_desc";
};

type FiltersPanelProps = {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearAll: () => void;
  className?: string;
};

const GENRE_OPTIONS = [
  "lofi",
  "chillhop",
  "ambient",
  "jazz",
  "electronic",
  "classical",
  "beats",
];

const TAG_SUGGESTIONS = [
  "chill",
  "study",
  "focus",
  "relax",
  "sleep",
  "morning",
  "evening",
  "rainy",
  "sunny",
  "night",
];

const INSTRUMENT_OPTIONS = [
  "piano",
  "guitar",
  "bass",
  "drums",
  "synth",
  "strings",
  "brass",
  "woodwind",
];

export function FiltersPanel({
  filters,
  onFiltersChange,
  onClearAll,
  className = "",
}: FiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = useCallback(
    (key: keyof FilterState, value: unknown) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const newTags = filters.tags.includes(tag)
        ? filters.tags.filter((t) => t !== tag)
        : [...filters.tags, tag];
      updateFilter("tags", newTags);
    },
    [filters.tags, updateFilter]
  );

  const toggleInstrumentation = useCallback(
    (instrument: string) => {
      const newInstrumentation = filters.instrumentation.includes(instrument)
        ? filters.instrumentation.filter((i) => i !== instrument)
        : [...filters.instrumentation, instrument];
      updateFilter("instrumentation", newInstrumentation);
    },
    [filters.instrumentation, updateFilter]
  );

  return (
    <div className={`border-r border-slate-200 bg-white ${className}`}>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between border-b border-slate-200 p-4 text-sm font-medium text-slate-700 lg:hidden"
      >
        <span>Filters</span>
        <svg
          className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Filters content */}
      <div
        className={`${isExpanded ? "block" : "hidden"} lg:block overflow-y-auto p-4`}
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
          <button
            onClick={onClearAll}
            className="text-xs text-emerald-600 hover:text-emerald-700"
          >
            Clear all
          </button>
        </div>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Search tracks..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Artist */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Artist
            </label>
            <input
              type="text"
              value={filters.artist}
              onChange={(e) => updateFilter("artist", e.target.value)}
              placeholder="Artist name..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Genre
            </label>
            <select
              value={filters.genre}
              onChange={(e) => updateFilter("genre", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All genres</option>
              {GENRE_OPTIONS.map((genre) => (
                <option key={genre} value={genre}>
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* BPM Range */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              BPM Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filters.bpmMin ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "bpmMin",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Min"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-slate-500">-</span>
              <input
                type="number"
                value={filters.bpmMax ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "bpmMax",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Max"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Mood: Energy */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Energy
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={filters.energyMin ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "energyMin",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Min"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-slate-500">-</span>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.energyMax ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "energyMax",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Max"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Mood: Focus */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Focus
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={filters.focusMin ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "focusMin",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Min"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-slate-500">-</span>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.focusMax ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "focusMax",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Max"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Mood: Chill */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Chill
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={filters.chillMin ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "chillMin",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Min"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-slate-500">-</span>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.chillMax ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "chillMax",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Max"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    filters.tags.includes(tag)
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Instrumentation */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Instrumentation
            </label>
            <div className="flex flex-wrap gap-2">
              {INSTRUMENT_OPTIONS.map((instrument) => (
                <button
                  key={instrument}
                  onClick={() => toggleInstrumentation(instrument)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    filters.instrumentation.includes(instrument)
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {instrument}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
