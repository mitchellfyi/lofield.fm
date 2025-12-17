"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  const { setQueue, playTrack, queue: playerQueue } = usePlayer();

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

  // Fetch tracks
  const fetchTracks = useCallback(
    async (cursor?: string) => {
      setLoading(true);
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

          // Update queue with new tracks and auto-play first if no current track
          if (data.items.length > 0) {
            setQueue(data.items, 0);
          }
        }

        setNextCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (error) {
        console.error("Error fetching tracks:", error);
      } finally {
        setLoading(false);
      }
    },
    [buildQueryParams, setQueue]
  );

  // Initial fetch and fetch on filter change
  useEffect(() => {
    fetchTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (nextCursor && !loading) {
      fetchTracks(nextCursor);
    }
  }, [nextCursor, loading, fetchTracks]);

  // Handle track play
  const handleTrackPlay = useCallback(
    (track: PublicTrack, index: number) => {
      // Update queue if it's different from current tracks
      if (
        playerQueue.length !== tracks.length ||
        playerQueue[0]?.id !== tracks[0]?.id
      ) {
        setQueue(tracks, index);
      } else {
        playTrack(track);
      }
    },
    [tracks, playerQueue, setQueue, playTrack]
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
                  >
                    <span>{filter.value}</span>
                    <svg
                      className="h-3 w-3"
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
                ))}
                <button
                  onClick={handleClearAll}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Clear all
                </button>
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
