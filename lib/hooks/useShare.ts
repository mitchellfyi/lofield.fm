"use client";

import { useState, useCallback, useEffect } from "react";
import type { PrivacyLevel, ShareInfo } from "@/lib/types/share";

export interface UseShareResult {
  shareInfo: ShareInfo | null;
  loading: boolean;
  error: string | null;
  fetchShareInfo: () => Promise<void>;
  generateShare: (privacy?: PrivacyLevel) => Promise<boolean>;
  updatePrivacy: (privacy: PrivacyLevel) => Promise<boolean>;
  revokeShare: () => Promise<boolean>;
  copyShareUrl: () => Promise<boolean>;
}

export function useShare(trackId: string | null): UseShareResult {
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShareInfo = useCallback(async () => {
    if (!trackId) {
      setShareInfo(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/tracks/${trackId}/share`);

      if (!res.ok) {
        if (res.status === 401) {
          setShareInfo(null);
          return;
        }
        if (res.status === 404) {
          setShareInfo(null);
          return;
        }
        throw new Error("Failed to fetch share info");
      }

      const data = await res.json();
      setShareInfo({
        shareUrl: data.shareUrl,
        privacy: data.privacy || "private",
        shareToken: data.shareToken,
        sharedAt: data.sharedAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setShareInfo(null);
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  // Fetch share info when trackId changes
  useEffect(() => {
    fetchShareInfo();
  }, [fetchShareInfo]);

  const generateShare = useCallback(
    async (privacy: PrivacyLevel = "unlisted"): Promise<boolean> => {
      if (!trackId) return false;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/tracks/${trackId}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ privacy }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to generate share link");
        }

        const data = await res.json();
        setShareInfo({
          shareUrl: data.shareUrl,
          privacy: data.privacy,
          shareToken: data.shareToken,
          sharedAt: new Date().toISOString(),
        });

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate share link");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [trackId]
  );

  const updatePrivacy = useCallback(
    async (privacy: PrivacyLevel): Promise<boolean> => {
      if (!trackId) return false;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/tracks/${trackId}/share`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ privacy }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update privacy");
        }

        setShareInfo((prev) =>
          prev
            ? { ...prev, privacy }
            : {
                shareUrl: null,
                privacy,
                shareToken: null,
                sharedAt: null,
              }
        );

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update privacy");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [trackId]
  );

  const revokeShare = useCallback(async (): Promise<boolean> => {
    if (!trackId) return false;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/tracks/${trackId}/share`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke share");
      }

      setShareInfo({
        shareUrl: null,
        privacy: "private",
        shareToken: null,
        sharedAt: null,
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke share");
      return false;
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  const copyShareUrl = useCallback(async (): Promise<boolean> => {
    if (!shareInfo?.shareUrl) return false;

    try {
      await navigator.clipboard.writeText(shareInfo.shareUrl);
      return true;
    } catch {
      setError("Failed to copy to clipboard");
      return false;
    }
  }, [shareInfo?.shareUrl]);

  return {
    shareInfo,
    loading,
    error,
    fetchShareInfo,
    generateShare,
    updatePrivacy,
    revokeShare,
    copyShareUrl,
  };
}
