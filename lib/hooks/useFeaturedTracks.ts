"use client";

import { useState, useEffect, useCallback } from "react";
import type { PublicTrack } from "@/lib/types/explore";

export interface FeaturedTracksData {
  featured: PublicTrack[];
  trending: PublicTrack[];
  recent: PublicTrack[];
}

export interface UseFeaturedTracksResult {
  data: FeaturedTracksData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch featured, trending, and recent tracks
 * for the explore page header sections
 */
export function useFeaturedTracks(): UseFeaturedTracksResult {
  const [data, setData] = useState<FeaturedTracksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/explore/featured");

      if (!res.ok) {
        throw new Error("Failed to fetch featured tracks");
      }

      const responseData: FeaturedTracksData = await res.json();
      setData(responseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load featured tracks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}
