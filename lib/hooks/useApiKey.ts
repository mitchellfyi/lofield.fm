"use client";

import { useState, useEffect, useCallback } from "react";

export interface ApiKeyStatus {
  hasKey: boolean;
  maskedKey: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage API key status on the client side.
 * Fetches key status from the server and provides refresh functionality.
 */
export function useApiKey(): ApiKeyStatus {
  const [hasKey, setHasKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/api-keys");

      if (!res.ok) {
        if (res.status === 401) {
          // Not authenticated - not an error, just no key
          setHasKey(false);
          setMaskedKey(null);
          return;
        }
        throw new Error("Failed to fetch API key status");
      }

      const data = await res.json();
      setHasKey(data.hasKey ?? false);
      setMaskedKey(data.maskedKey ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setHasKey(false);
      setMaskedKey(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    hasKey,
    maskedKey,
    loading,
    error,
    refresh: fetchStatus,
  };
}
