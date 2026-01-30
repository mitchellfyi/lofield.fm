"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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

/**
 * Parse filters from URL search params
 */
function parseFiltersFromURL(searchParams: URLSearchParams): ExploreFilterState {
  const genre = searchParams.get("genre") || null;
  const tagsParam = searchParams.get("tags");
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  const bpmMinParam = searchParams.get("bpm_min");
  const bpmMaxParam = searchParams.get("bpm_max");
  const bpmMin = bpmMinParam ? parseInt(bpmMinParam, 10) : DEFAULT_EXPLORE_FILTERS.bpmMin;
  const bpmMax = bpmMaxParam ? parseInt(bpmMaxParam, 10) : DEFAULT_EXPLORE_FILTERS.bpmMax;
  const sortParam = searchParams.get("sort");
  const sort: ExploreSortOption =
    sortParam === "newest" ||
    sortParam === "popular" ||
    sortParam === "most_liked" ||
    sortParam === "random"
      ? sortParam
      : DEFAULT_EXPLORE_FILTERS.sort;

  return {
    genre,
    tags,
    bpmMin: isNaN(bpmMin) ? DEFAULT_EXPLORE_FILTERS.bpmMin : bpmMin,
    bpmMax: isNaN(bpmMax) ? DEFAULT_EXPLORE_FILTERS.bpmMax : bpmMax,
    sort,
  };
}

/**
 * Build URL search params from filters
 */
function buildURLFromFilters(filters: ExploreFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.genre) {
    params.set("genre", filters.genre);
  }
  if (filters.tags.length > 0) {
    params.set("tags", filters.tags.join(","));
  }
  if (filters.bpmMin !== DEFAULT_EXPLORE_FILTERS.bpmMin) {
    params.set("bpm_min", filters.bpmMin.toString());
  }
  if (filters.bpmMax !== DEFAULT_EXPLORE_FILTERS.bpmMax) {
    params.set("bpm_max", filters.bpmMax.toString());
  }
  if (filters.sort !== DEFAULT_EXPLORE_FILTERS.sort) {
    params.set("sort", filters.sort);
  }

  return params;
}

export function useExplore(): UseExploreResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse initial filters from URL
  const initialFilters = useMemo(
    () => parseFiltersFromURL(searchParams),
    // Only run once on mount - we manage state after that
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [tracks, setTracks] = useState<PublicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [genres, setGenres] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [bpmRange, setBpmRangeState] = useState({ min: 40, max: 200 });
  const [filters, setFilters] = useState<ExploreFilterState>(initialFilters);
  const [offset, setOffset] = useState(0);

  // Sync filters to URL
  useEffect(() => {
    const params = buildURLFromFilters(filters);
    const newURL = params.toString() ? `${pathname}?${params.toString()}` : pathname;

    // Use replace to avoid polluting browser history with every filter change
    router.replace(newURL, { scroll: false });
  }, [filters, pathname, router]);

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
