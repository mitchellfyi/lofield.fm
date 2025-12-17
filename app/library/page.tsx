"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { usePlayer, type PublicTrack } from "@/lib/contexts/player-context";
import {
  FiltersPanel,
  type FilterState,
} from "@/components/library/filters-panel";
import { TrackList } from "@/components/library/track-list";
import { PlayerBar } from "@/components/library/player-bar";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function LibraryPage() {
  const { setQueue, playTrack } = usePlayer();

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    artist: "",
    genre: "",
    bpmMin: null,
    bpmMax: null,
    energyMin: null,
    energyMax: null,
    focusMin: null,
    focusMax: null,
    chillMin: null,
    chillMax: null,
    tags: [],
    instrumentation: [],
    sort: "newest",
  });

  const [tracks, setTracks] = useState<PublicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 300);

  // Build query params from filters
  const buildQueryParams = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();

      if (debouncedSearch) params.set("q", debouncedSearch);
      if (filters.artist) params.set("artist", filters.artist);
      if (filters.genre) params.set("genre", filters.genre);
      if (filters.bpmMin !== null)
        params.set("bpm_min", filters.bpmMin.toString());
      if (filters.bpmMax !== null)
        params.set("bpm_max", filters.bpmMax.toString());
      if (filters.energyMin !== null)
        params.set("energy_min", filters.energyMin.toString());
      if (filters.energyMax !== null)
        params.set("energy_max", filters.energyMax.toString());
      if (filters.focusMin !== null)
        params.set("focus_min", filters.focusMin.toString());
      if (filters.focusMax !== null)
        params.set("focus_max", filters.focusMax.toString());
      if (filters.chillMin !== null)
        params.set("chill_min", filters.chillMin.toString());
      if (filters.chillMax !== null)
        params.set("chill_max", filters.chillMax.toString());
      if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
      if (filters.instrumentation.length > 0)
        params.set("instrumentation", filters.instrumentation.join(","));
      if (filters.sort) params.set("sort", filters.sort);
      if (cursor) params.set("cursor", cursor);

      return params;
    },
    [
      debouncedSearch,
      filters.artist,
      filters.genre,
      filters.bpmMin,
      filters.bpmMax,
      filters.energyMin,
      filters.energyMax,
      filters.focusMin,
      filters.focusMax,
      filters.chillMin,
      filters.chillMax,
      filters.tags,
      filters.instrumentation,
      filters.sort,
    ]
  );

  // Fetch tracks - properly memoized
  const fetchTracks = useCallback(
    async (cursor?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = buildQueryParams(cursor);
        const response = await fetch(`/api/public/tracks?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch tracks");
        }

        const data = await response.json();

        if (cursor) {
          // Append to existing tracks (load more)
          setTracks((prev) => [...prev, ...data.items]);
        } else {
          // Replace tracks (new search/filter)
          setTracks(data.items);

          // Update queue only for new searches (not for load more)
          // Only auto-play if queue changes significantly
          if (data.items.length > 0) {
            setQueue(data.items, 0);
          }
        }

        setNextCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (err) {
        console.error("Error fetching tracks:", err);
        setError(
          "Failed to load tracks. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [buildQueryParams, setQueue]
  );

  // Initial fetch and fetch on filter change - properly managed dependencies
  useEffect(() => {
    fetchTracks();
  }, [
    debouncedSearch,
    filters.artist,
    filters.genre,
    filters.bpmMin,
    filters.bpmMax,
    filters.energyMin,
    filters.energyMax,
    filters.focusMin,
    filters.focusMax,
    filters.chillMin,
    filters.chillMax,
    filters.tags,
    filters.instrumentation,
    filters.sort,
    fetchTracks, // Now stable because it's memoized with useCallback
  ]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (nextCursor && !loading) {
      fetchTracks(nextCursor);
    }
  }, [nextCursor, loading, fetchTracks]);

  // Handle track play - Improved queue comparison using filter fingerprint
  const filterFingerprint = useMemo(() => {
    return JSON.stringify({
      search: debouncedSearch,
      artist: filters.artist,
      genre: filters.genre,
      bpmMin: filters.bpmMin,
      bpmMax: filters.bpmMax,
      energyMin: filters.energyMin,
      energyMax: filters.energyMax,
      focusMin: filters.focusMin,
      focusMax: filters.focusMax,
      chillMin: filters.chillMin,
      chillMax: filters.chillMax,
      tags: filters.tags.sort(),
      instrumentation: filters.instrumentation.sort(),
      sort: filters.sort,
    });
  }, [
    debouncedSearch,
    filters.artist,
    filters.genre,
    filters.bpmMin,
    filters.bpmMax,
    filters.energyMin,
    filters.energyMax,
    filters.focusMin,
    filters.focusMax,
    filters.chillMin,
    filters.chillMax,
    filters.tags,
    filters.instrumentation,
    filters.sort,
  ]);

  const lastFilterFingerprint = useRef<string | null>(null);

  const handleTrackPlay = useCallback(
    (track: PublicTrack, index: number) => {
      // Check if filters have changed since last queue update
      if (lastFilterFingerprint.current !== filterFingerprint) {
        // Filters changed, update queue
        setQueue(tracks, index);
        lastFilterFingerprint.current = filterFingerprint;
      } else {
        // Same filter state, just play the track
        playTrack(track);
      }
    },
    [tracks, filterFingerprint, setQueue, playTrack]
  );

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setFilters({
      search: "",
      artist: "",
      genre: "",
      bpmMin: null,
      bpmMax: null,
      energyMin: null,
      energyMax: null,
      focusMin: null,
      focusMax: null,
      chillMin: null,
      chillMax: null,
      tags: [],
      instrumentation: [],
      sort: "newest",
    });
  }, []);

  // Active filters for chips display
  const activeFilters = useMemo(() => {
    const active: Array<{ key: string; label: string; value: string }> = [];

    if (filters.search)
      active.push({ key: "search", label: "Search", value: filters.search });
    if (filters.artist)
      active.push({ key: "artist", label: "Artist", value: filters.artist });
    if (filters.genre)
      active.push({ key: "genre", label: "Genre", value: filters.genre });
    if (filters.bpmMin !== null || filters.bpmMax !== null) {
      const bpmLabel = `${filters.bpmMin ?? "0"}-${filters.bpmMax ?? "∞"} BPM`;
      active.push({ key: "bpm", label: "BPM", value: bpmLabel });
    }
    if (filters.energyMin !== null || filters.energyMax !== null) {
      const energyLabel = `Energy ${filters.energyMin ?? "0"}-${filters.energyMax ?? "100"}`;
      active.push({ key: "energy", label: "Energy", value: energyLabel });
    }
    if (filters.focusMin !== null || filters.focusMax !== null) {
      const focusLabel = `Focus ${filters.focusMin ?? "0"}-${filters.focusMax ?? "100"}`;
      active.push({ key: "focus", label: "Focus", value: focusLabel });
    }
    if (filters.chillMin !== null || filters.chillMax !== null) {
      const chillLabel = `Chill ${filters.chillMin ?? "0"}-${filters.chillMax ?? "100"}`;
      active.push({ key: "chill", label: "Chill", value: chillLabel });
    }
    filters.tags.forEach((tag) => {
      active.push({ key: `tag-${tag}`, label: "Tag", value: tag });
    });
    filters.instrumentation.forEach((instrument) => {
      active.push({
        key: `inst-${instrument}`,
        label: "Instrument",
        value: instrument,
      });
    });

    return active;
  }, [filters]);

  // Remove individual filter
  const handleRemoveFilter = useCallback((key: string) => {
    if (key === "search") {
      setFilters((prev) => ({ ...prev, search: "" }));
    } else if (key === "artist") {
      setFilters((prev) => ({ ...prev, artist: "" }));
    } else if (key === "genre") {
      setFilters((prev) => ({ ...prev, genre: "" }));
    } else if (key === "bpm") {
      setFilters((prev) => ({ ...prev, bpmMin: null, bpmMax: null }));
    } else if (key === "energy") {
      setFilters((prev) => ({ ...prev, energyMin: null, energyMax: null }));
    } else if (key === "focus") {
      setFilters((prev) => ({ ...prev, focusMin: null, focusMax: null }));
    } else if (key === "chill") {
      setFilters((prev) => ({ ...prev, chillMin: null, chillMax: null }));
    } else if (key.startsWith("tag-")) {
      const tag = key.substring(4);
      setFilters((prev) => ({
        ...prev,
        tags: prev.tags.filter((t) => t !== tag),
      }));
    } else if (key.startsWith("inst-")) {
      const instrument = key.substring(5);
      setFilters((prev) => ({
        ...prev,
        instrumentation: prev.instrumentation.filter((i) => i !== instrument),
      }));
    }
  }, []);

  return (
    <div className="flex h-screen flex-col">
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Filters sidebar */}
        <FiltersPanel
          filters={filters}
          onFiltersChange={setFilters}
          onClearAll={handleClearAll}
          className="w-full lg:w-64 flex-shrink-0"
        />

        {/* Results area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 pb-32">
          <div className="mx-auto max-w-4xl p-4">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900">Library</h1>
              <p className="mt-1 text-sm text-slate-600">
                Browse and play public tracks
              </p>
            </div>

            {/* Active filters chips */}
            {activeFilters.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-600">
                  Active filters:
                </span>
                {activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => handleRemoveFilter(filter.key)}
                    className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700 transition hover:bg-emerald-200"
                    aria-label={`Remove ${filter.value} filter`}
                  >
                    <span>{filter.value}</span>
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                ))}
                <button
                  onClick={handleClearAll}
                  className="text-xs text-slate-500 hover:text-slate-700"
                  aria-label="Clear all filters"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                    <button
                      onClick={() => fetchTracks()}
                      className="mt-2 text-sm font-medium text-red-800 underline hover:text-red-900"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results count and sort */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-600">
                {loading
                  ? "Loading..."
                  : `${tracks.length} track${tracks.length !== 1 ? "s" : ""}`}
              </span>
              <select
                value={filters.sort}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sort: e.target.value as FilterState["sort"],
                  }))
                }
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="newest">Newest first</option>
                <option value="bpm_asc">BPM (Low to High)</option>
                <option value="bpm_desc">BPM (High to Low)</option>
              </select>
            </div>

            {/* Track list */}
            <TrackList
              tracks={tracks}
              onTrackPlay={handleTrackPlay}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Bottom player bar */}
      <PlayerBar />
    </div>
  );
}
