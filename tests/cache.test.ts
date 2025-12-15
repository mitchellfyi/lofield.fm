import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { elevenLabsCache } from "@/lib/cache";

describe("SimpleCache", () => {
  beforeEach(() => {
    elevenLabsCache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets and gets values", () => {
    elevenLabsCache.set("key", "value", 1000);
    expect(elevenLabsCache.get("key")).toBe("value");
  });

  it("expires values after ttl", () => {
    elevenLabsCache.set("key", "value", 1000);
    expect(elevenLabsCache.get("key")).toBe("value");

    vi.advanceTimersByTime(1001);
    expect(elevenLabsCache.get("key")).toBeNull();
  });

  it("cleans up expired entries", () => {
    elevenLabsCache.set("key1", "val1", 100);
    elevenLabsCache.set("key2", "val2", 5000);

    vi.advanceTimersByTime(200);
    elevenLabsCache.cleanup();

    expect(elevenLabsCache.get("key1")).toBeNull();
    expect(elevenLabsCache.get("key2")).toBe("val2");
  });
});
