"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Track } from "@/lib/types/tracks";
import { getCache, setCache } from "@/lib/storage/localCache";

const TRACKS_CACHE_PREFIX = "tracks_";
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Get a user-friendly error message for tracks
 */
function getFriendlyErrorMessage(error: unknown, status?: number): string {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return "Unable to connect. Check your internet connection.";
  }

  if (status) {
    switch (status) {
      case 401:
        return "Please sign in to view your tracks.";
      case 403:
        return "You don't have permission to view these tracks.";
      case 404:
        return "Could not find your tracks.";
      case 500:
      case 502:
      case 503:
        return "Server error. Please try again later.";
      default:
        if (status >= 400 && status < 500) {
          return "There was a problem with your request.";
        }
        if (status >= 500) {
          return "Server error. Please try again later.";
        }
    }
  }

  return "Unable to load tracks. Please try again.";
}

export interface UseTracksResult {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTrack: (projectId: string, name: string, code?: string) => Promise<Track | null>;
  updateTrack: (
    id: string,
    updates: { name?: string; current_code?: string }
  ) => Promise<Track | null>;
  deleteTrack: (id: string) => Promise<boolean>;
  saveCode: (id: string, code: string) => Promise<Track | null>;
}

export function useTracks(projectId: string | null): UseTracksResult {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracks = useCallback(async () => {
    if (!projectId) {
      setTracks([]);
      return;
    }

    const cacheKey = TRACKS_CACHE_PREFIX + projectId;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/tracks?project_id=${projectId}`);

      if (!res.ok) {
        if (res.status === 401) {
          setTracks([]);
          return;
        }
        // Try cached tracks on error
        const cached = getCache<Track[]>(cacheKey);
        if (cached && cached.length > 0) {
          setTracks(cached);
          setError(getFriendlyErrorMessage(null, res.status));
          return;
        }
        throw { status: res.status };
      }

      const data = await res.json();
      const fetchedTracks = data.tracks || [];
      setTracks(fetchedTracks);

      // Cache successful response
      if (fetchedTracks.length > 0) {
        setCache(cacheKey, fetchedTracks, CACHE_TTL_MS);
      }
    } catch (err) {
      // Try cached tracks on error
      const cached = getCache<Track[]>(cacheKey);
      if (cached && cached.length > 0) {
        setTracks(cached);
        const status = (err as { status?: number })?.status;
        setError(getFriendlyErrorMessage(err, status));
        return;
      }

      const status = (err as { status?: number })?.status;
      setError(getFriendlyErrorMessage(err, status));
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const createTrack = useCallback(
    async (targetProjectId: string, name: string, code: string = ""): Promise<Track | null> => {
      try {
        setError(null);

        const res = await fetch("/api/tracks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: targetProjectId,
            name,
            current_code: code,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create track");
        }

        const data = await res.json();

        // Add to local state if same project
        if (targetProjectId === projectId) {
          setTracks((prev) => [data.track, ...prev]);
        }

        return data.track;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create track");
        return null;
      }
    },
    [projectId]
  );

  const updateTrack = useCallback(
    async (
      id: string,
      updates: { name?: string; current_code?: string }
    ): Promise<Track | null> => {
      try {
        setError(null);

        const res = await fetch(`/api/tracks/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update track");
        }

        const data = await res.json();

        // Update in local state
        setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data.track } : t)));

        return data.track;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update track");
        return null;
      }
    },
    []
  );

  const deleteTrack = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const res = await fetch(`/api/tracks/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete track");
      }

      // Remove from local state
      setTracks((prev) => prev.filter((t) => t.id !== id));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete track");
      return false;
    }
  }, []);

  // Convenience method for saving just code
  const saveCode = useCallback(
    async (id: string, code: string): Promise<Track | null> => {
      return updateTrack(id, { current_code: code });
    },
    [updateTrack]
  );

  return {
    tracks,
    loading,
    error,
    refresh: fetchTracks,
    createTrack,
    updateTrack,
    deleteTrack,
    saveCode,
  };
}

/**
 * Hook for auto-save functionality with debouncing
 */
export function useAutoSave(
  trackId: string | null,
  code: string,
  enabled: boolean,
  delay: number = 2000
): { saving: boolean; lastSaved: Date | null } {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCodeRef = useRef<string>("");

  useEffect(() => {
    // Skip if not enabled, no track, or code hasn't changed
    if (!enabled || !trackId || code === lastCodeRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up debounced save
    timeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);

        const res = await fetch(`/api/tracks/${trackId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ current_code: code }),
        });

        if (res.ok) {
          lastCodeRef.current = code;
          setLastSaved(new Date());
        }
      } catch {
        // Silently fail on auto-save errors
      } finally {
        setSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [trackId, code, enabled, delay]);

  // Reset last code ref when track changes
  useEffect(() => {
    lastCodeRef.current = "";
    setLastSaved(null);
  }, [trackId]);

  return { saving, lastSaved };
}
