"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  PublicTrack,
  ExploreResponse,
  ExploreFilterState,
  ExploreSortOption,
} from "@/lib/types/explore";
import { DEFAULT_EXPLORE_FILTERS } from "@/lib/types/explore";

export interface UseExploreResult {
  tracks: PublicTrack[];
  loading: boolean;
  error: string | null;
  total: number;
  genres: string[];
  availableTags: string[];
  bpmRange: { min: number; max: number };
  filters: ExploreFilterState;
  hasMore: boolean;
  setGenre: (genre: string | null) => void;
  toggleTag: (tag: string) => void;
  setBpmRange: (min: number, max: number) => void;
  setSort: (sort: ExploreSortOption) => void;
  clearFilters: () => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PAGE_SIZE = 20;

export function useExplore(): UseExploreResult {
  const [tracks, setTracks] = useState<PublicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [genres, setGenres] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [bpmRange, setBpmRangeState] = useState({ min: 40, max: 200 });
  const [filters, setFilters] = useState<ExploreFilterState>(DEFAULT_EXPLORE_FILTERS);
  const [offset, setOffset] = useState(0);

  const fetchTracks = useCallback(
    async (reset: boolean = false) => {
      try {
        setLoading(true);
        setError(null);

        const currentOffset = reset ? 0 : offset;

        const params = new URLSearchParams();
        if (filters.genre) params.set("genre", filters.genre);
        if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
        if (filters.bpmMin > 40) params.set("bpm_min", filters.bpmMin.toString());
        if (filters.bpmMax < 200) params.set("bpm_max", filters.bpmMax.toString());
        params.set("sort", filters.sort);
        params.set("limit", PAGE_SIZE.toString());
        params.set("offset", currentOffset.toString());

        const res = await fetch(`/api/explore?${params.toString()}`);

        if (!res.ok) {
          throw new Error("Failed to fetch tracks");
        }

        const data: ExploreResponse = await res.json();

        if (reset) {
          setTracks(data.tracks);
          setOffset(PAGE_SIZE);
        } else {
          setTracks((prev) => [...prev, ...data.tracks]);
          setOffset((prev) => prev + PAGE_SIZE);
        }

        setTotal(data.total);
        setGenres(data.genres);
        setAvailableTags(data.tags);
        setBpmRangeState(data.bpm_range);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tracks");
      } finally {
        setLoading(false);
      }
    },
    [filters, offset]
  );

  // Initial fetch
  useEffect(() => {
    fetchTracks(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const setGenre = useCallback((genre: string | null) => {
    setFilters((prev) => ({ ...prev, genre }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  }, []);

  const setBpmRange = useCallback((min: number, max: number) => {
    setFilters((prev) => ({ ...prev, bpmMin: min, bpmMax: max }));
  }, []);

  const setSort = useCallback((sort: ExploreSortOption) => {
    setFilters((prev) => ({ ...prev, sort }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_EXPLORE_FILTERS);
  }, []);

  const loadMore = useCallback(async () => {
    if (!loading && tracks.length < total) {
      await fetchTracks(false);
    }
  }, [loading, tracks.length, total, fetchTracks]);

  const refresh = useCallback(async () => {
    await fetchTracks(true);
  }, [fetchTracks]);

  const hasMore = tracks.length < total;

  return {
    tracks,
    loading,
    error,
    total,
    genres,
    availableTags,
    bpmRange,
    filters,
    hasMore,
    setGenre,
    toggleTag,
    setBpmRange,
    setSort,
    clearFilters,
    loadMore,
    refresh,
  };
}
