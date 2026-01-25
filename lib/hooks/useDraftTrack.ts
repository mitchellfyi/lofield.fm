"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getCache, setCache, clearCache } from "@/lib/storage/localCache";

const DRAFT_PREFIX = "draft_";
const DRAFT_TTL_MS = 0; // No expiry for drafts

export interface DraftData {
  code: string;
  savedAt: number;
  trackName?: string;
}

export interface UseDraftTrackResult {
  draftCode: string | null;
  hasDraft: boolean;
  saveDraft: (code: string, trackName?: string) => void;
  clearDraft: () => void;
  getDraftAge: () => string | null;
}

/**
 * Hook to manage local draft state for a track
 * Persists current work to localStorage for recovery if page is closed
 */
export function useDraftTrack(trackId: string | null): UseDraftTrackResult {
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load draft on mount or track change - intentional synchronization with external storage
  useEffect(() => {
    if (!trackId) {
      // This is intentional state reset when track changes
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraftData(null);
      return;
    }

    const cached = getCache<DraftData>(DRAFT_PREFIX + trackId);
    // This is intentional initialization from localStorage
     
    setDraftData(cached);
  }, [trackId]);

  // Save draft to localStorage with debounce
  const saveDraft = useCallback(
    (code: string, trackName?: string) => {
      if (!trackId) return;

      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce saves to avoid excessive localStorage writes
      saveTimeoutRef.current = setTimeout(() => {
        const draft: DraftData = {
          code,
          savedAt: Date.now(),
          trackName,
        };
        setCache(DRAFT_PREFIX + trackId, draft, DRAFT_TTL_MS);
        setDraftData(draft);
      }, 500);
    },
    [trackId]
  );

  // Clear draft (call after successful server save)
  const clearDraft = useCallback(() => {
    if (!trackId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    clearCache(DRAFT_PREFIX + trackId);
    setDraftData(null);
  }, [trackId]);

  // Get human-readable age of draft
  const getDraftAge = useCallback((): string | null => {
    if (!draftData) return null;

    const ageMs = Date.now() - draftData.savedAt;
    const seconds = Math.floor(ageMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ago`;
    }
    if (minutes > 0) {
      return `${minutes}m ago`;
    }
    return "just now";
  }, [draftData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    draftCode: draftData?.code ?? null,
    hasDraft: draftData !== null && draftData.code.length > 0,
    saveDraft,
    clearDraft,
    getDraftAge,
  };
}
