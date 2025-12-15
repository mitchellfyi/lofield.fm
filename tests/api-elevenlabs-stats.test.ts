import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/usage/elevenlabs/stats/route";
import { NextRequest } from "next/server";

// Mock Libs
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () =>
    Promise.resolve({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-123" } } },
          error: null,
        }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    }),
}));

vi.mock("@/lib/secrets", () => ({
  getElevenLabsKeyForUser: vi.fn().mockResolvedValue("fake-key"),
}));

vi.mock("@/lib/elevenlabs", () => ({
  getUsageStats: vi.fn().mockResolvedValue({ dailyUsage: [] }),
}));

vi.mock("@/lib/usage-tracking", () => ({
  logUsageEvent: vi.fn(),
}));

vi.mock("@/lib/cache", () => ({
  elevenLabsCache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
  },
  getUsageStatsCacheKey: vi.fn().mockReturnValue("cache-key"),
  CACHE_TTL: { USAGE_STATS: 1000 },
}));

// Mock crypto.randomUUID
vi.mock("crypto", () => {
  return {
    randomUUID: () => "uuid-123",
    default: {
      randomUUID: () => "uuid-123",
    },
  };
});

describe("/api/usage/elevenlabs/stats", () => {
  it("validates date format", async () => {
    const req = new NextRequest(
      "http://localhost/api/usage/elevenlabs/stats?startDate=bad&endDate=2023-01-01"
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid date format");
  });

  it("validates start date <= end date", async () => {
    const req = new NextRequest(
      "http://localhost/api/usage/elevenlabs/stats?startDate=2023-01-02&endDate=2023-01-01"
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("End date must not be before start date");
  });

  it("returns 200 for valid request", async () => {
    const req = new NextRequest(
      "http://localhost/api/usage/elevenlabs/stats?startDate=2023-01-01&endDate=2023-01-02"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
