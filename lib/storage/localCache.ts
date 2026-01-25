"use client";

const CACHE_PREFIX = "lofield_";
const DEFAULT_TTL_MS = 1000 * 60 * 60; // 1 hour default TTL

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Get a cached value from localStorage
 * Returns null if not found, expired, or localStorage is unavailable
 */
export function getCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    const now = Date.now();

    // Check if expired
    if (entry.ttl > 0 && now - entry.timestamp > entry.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Set a value in localStorage cache
 * @param key Cache key
 * @param value Value to cache
 * @param ttlMs Time-to-live in milliseconds (0 = no expiry)
 */
export function setCache<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): boolean {
  if (typeof window === "undefined") return false;

  try {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    return true;
  } catch {
    // localStorage might be full or disabled
    return false;
  }
}

/**
 * Remove a value from the cache
 */
export function clearCache(key: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    // Ignore errors
  }
}

/**
 * Clear all lofield cache entries
 */
export function clearAllCache(): void {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore errors
  }
}
