/**
 * Simple in-memory cache with expiry for ElevenLabs API responses
 * This helps avoid hammering the ElevenLabs API for frequently accessed data
 */

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Periodically clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton cache instance
const elevenLabsCache = new SimpleCache();

/**
 * Cache TTLs (in milliseconds)
 */
export const CACHE_TTL = {
  SUBSCRIPTION: 10 * 60 * 1000, // 10 minutes
  USAGE_STATS: 3 * 60 * 60 * 1000, // 3 hours
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
} as const;

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => elevenLabsCache.cleanup(), CACHE_TTL.CLEANUP_INTERVAL);
}

/**
 * Cache keys for ElevenLabs data
 */
export function getSubscriptionCacheKey(userId: string): string {
  return `elevenlabs:subscription:${userId}`;
}

export function getUsageStatsCacheKey(
  userId: string,
  startDate: string,
  endDate: string
): string {
  return `elevenlabs:usage:${userId}:${startDate}:${endDate}`;
}

export { elevenLabsCache };
