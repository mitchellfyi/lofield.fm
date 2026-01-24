"use client";

import { useState, useEffect, useCallback } from "react";
import type { Revision } from "@/lib/types/tracks";

export interface UseRevisionsResult {
  revisions: Revision[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createRevision: (code: string, message?: string | null) => Promise<Revision | null>;
}

export function useRevisions(trackId: string | null): UseRevisionsResult {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRevisions = useCallback(async () => {
    if (!trackId) {
      setRevisions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/tracks/${trackId}/revisions`);

      if (!res.ok) {
        if (res.status === 401) {
          setRevisions([]);
          return;
        }
        throw new Error("Failed to fetch revisions");
      }

      const data = await res.json();
      setRevisions(data.revisions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setRevisions([]);
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  const createRevision = useCallback(
    async (code: string, message?: string | null): Promise<Revision | null> => {
      if (!trackId) {
        setError("No track selected");
        return null;
      }

      try {
        setError(null);

        const res = await fetch(`/api/tracks/${trackId}/revisions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, message }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create revision");
        }

        const data = await res.json();

        // Add to local state at the beginning (newest first)
        setRevisions((prev) => [data.revision, ...prev]);

        return data.revision;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create revision");
        return null;
      }
    },
    [trackId]
  );

  return {
    revisions,
    loading,
    error,
    refresh: fetchRevisions,
    createRevision,
  };
}
