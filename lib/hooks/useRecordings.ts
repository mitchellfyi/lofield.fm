"use client";

import { useState, useEffect, useCallback } from "react";
import type { Recording, RecordingEvent } from "@/lib/types/recording";

export interface UseRecordingsResult {
  recordings: Recording[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createRecording: (
    durationMs: number,
    events: RecordingEvent[],
    name?: string
  ) => Promise<Recording | null>;
  updateRecording: (
    recordingId: string,
    updates: { name?: string; events?: RecordingEvent[] }
  ) => Promise<Recording | null>;
  deleteRecording: (recordingId: string) => Promise<boolean>;
}

/**
 * Hook for managing recordings CRUD operations for a track
 */
export function useRecordings(trackId: string | null): UseRecordingsResult {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecordings = useCallback(async () => {
    if (!trackId) {
      setRecordings([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/tracks/${trackId}/recordings`);

      if (!res.ok) {
        if (res.status === 401) {
          setRecordings([]);
          return;
        }
        throw new Error("Failed to fetch recordings");
      }

      const data = await res.json();
      setRecordings(data.recordings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const createRecording = useCallback(
    async (
      durationMs: number,
      events: RecordingEvent[],
      name?: string
    ): Promise<Recording | null> => {
      if (!trackId) {
        setError("No track selected");
        return null;
      }

      try {
        setError(null);

        const res = await fetch(`/api/tracks/${trackId}/recordings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            duration_ms: durationMs,
            events,
            name,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create recording");
        }

        const data = await res.json();

        // Add to local state
        setRecordings((prev) => [data.recording, ...prev]);

        return data.recording;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create recording");
        return null;
      }
    },
    [trackId]
  );

  const updateRecording = useCallback(
    async (
      recordingId: string,
      updates: { name?: string; events?: RecordingEvent[] }
    ): Promise<Recording | null> => {
      if (!trackId) {
        setError("No track selected");
        return null;
      }

      try {
        setError(null);

        const res = await fetch(`/api/tracks/${trackId}/recordings/${recordingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update recording");
        }

        const data = await res.json();

        // Update in local state
        setRecordings((prev) =>
          prev.map((r) => (r.id === recordingId ? { ...r, ...data.recording } : r))
        );

        return data.recording;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update recording");
        return null;
      }
    },
    [trackId]
  );

  const deleteRecording = useCallback(
    async (recordingId: string): Promise<boolean> => {
      if (!trackId) {
        setError("No track selected");
        return false;
      }

      try {
        setError(null);

        const res = await fetch(`/api/tracks/${trackId}/recordings/${recordingId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete recording");
        }

        // Remove from local state
        setRecordings((prev) => prev.filter((r) => r.id !== recordingId));

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete recording");
        return false;
      }
    },
    [trackId]
  );

  return {
    recordings,
    loading,
    error,
    refresh: fetchRecordings,
    createRecording,
    updateRecording,
    deleteRecording,
  };
}
