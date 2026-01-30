"use client";

import { useState, useCallback } from "react";

export interface UseLikeResult {
  liked: boolean;
  likeCount: number;
  loading: boolean;
  toggle: () => Promise<void>;
}

/**
 * Hook for managing track likes with optimistic updates
 */
export function useLike(trackId: string, initialLiked = false, initialCount = 0): UseLikeResult {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    // Optimistic update
    const wasLiked = liked;
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    setLoading(true);

    try {
      const method = wasLiked ? "DELETE" : "POST";
      const res = await fetch(`/api/tracks/${trackId}/like`, { method });

      if (!res.ok) {
        // Revert on error
        setLiked(wasLiked);
        setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1));

        // If unauthorized, could show login prompt
        if (res.status === 401) {
          console.warn("User not authenticated for like action");
        }
        return;
      }

      const data = await res.json();
      // Sync with server state
      setLiked(data.liked);
      setLikeCount(data.like_count);
    } catch (error) {
      // Revert on error
      setLiked(wasLiked);
      setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1));
      console.error("Error toggling like:", error);
    } finally {
      setLoading(false);
    }
  }, [trackId, liked]);

  return { liked, likeCount, loading, toggle };
}
