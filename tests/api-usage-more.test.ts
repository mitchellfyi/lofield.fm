import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as GETChats } from "@/app/api/usage/chats/route";
import { GET as GETDaily } from "@/app/api/usage/daily/route";
import { GET as GETTracks } from "@/app/api/usage/tracks/route";
import { GET as GETSubscription } from "@/app/api/usage/elevenlabs/subscription/route";
import { NextRequest } from "next/server";

// Mock Supabase
const mockSupabase = {
  auth: { getSession: vi.fn(), getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => Promise.resolve(mockSupabase),
}));

// Mock secrets/elevenlabs/cache
vi.mock("@/lib/secrets", () => ({
  getElevenLabsKeyForUser: vi.fn().mockResolvedValue("k"),
}));

vi.mock("@/lib/elevenlabs", () => ({
  getSubscription: vi.fn().mockResolvedValue({
    creditsRemaining: 100,
    creditsLimitCurrentPeriod: 1000,
    creditsUsedCurrentPeriod: 900,
    tier: "starter",
    status: "active",
    nextResetUnix: 123,
  }),
}));

vi.mock("@/lib/cache", () => ({
  elevenLabsCache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
  },
  getSubscriptionCacheKey: vi.fn().mockReturnValue("key"),
  CACHE_TTL: { SUBSCRIPTION: 100 },
}));

vi.mock("crypto", () => ({
  default: { randomUUID: () => "uuid" },
  randomUUID: () => "uuid",
}));

// Mock logUsageEvent
vi.mock("@/lib/usage-tracking", () => ({
  logUsageEvent: vi.fn(),
}));

describe("More Usage APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
    });
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
    });
  });

  describe("chats", () => {
    it("returns chat usage", async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === "usage_events") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            not: vi.fn().mockResolvedValue({
              data: [
                {
                  chat_id: "c1",
                  provider: "openai",
                  total_tokens: 100,
                  cost_usd: 0.01,
                  occurred_at: "2023-01-01T12:00:00Z",
                },
              ],
              error: null,
            }),
          };
        }
        if (table === "chats") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [{ id: "c1", title: "C1" }],
              error: null,
            }),
          };
        }
        return {};
      });

      const req = new NextRequest(
        "http://localhost/api/usage/chats?start=2023-01-01&end=2023-01-02"
      );
      const res = await GETChats(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.chats).toHaveLength(1);
      expect(json.chats[0].openaiTokens).toBe(100);
    });
  });

  describe("daily", () => {
    it("returns daily usage", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              provider: "openai",
              occurred_at: "2023-01-01T10:00:00Z",
              input_tokens: 10,
              output_tokens: 20,
              total_tokens: 30,
              cost_usd: 0.001,
            },
          ],
          error: null,
        }),
      });

      const req = new NextRequest(
        "http://localhost/api/usage/daily?start=2023-01-01&end=2023-01-02&groupBy=provider"
      );
      const res = await GETDaily(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.daily).toHaveLength(1);
      expect(json.daily[0].totalTokens).toBe(30);
    });
  });

  describe("tracks", () => {
    it("returns track usage", async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === "usage_events") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockResolvedValue({
              data: [
                {
                  track_id: "t1",
                  provider: "elevenlabs",
                  audio_seconds: 5,
                  credits_used: 50,
                  cost_usd: 0.05,
                },
              ],
              error: null,
            }),
          };
        }
        if (table === "tracks") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [{ id: "t1", title: "T1", length_ms: 5000 }],
              error: null,
            }),
          };
        }
        return {};
      });

      const req = new NextRequest(
        "http://localhost/api/usage/tracks?start=2023-01-01&end=2023-01-02"
      );
      const res = await GETTracks(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.tracks).toHaveLength(1);
      expect(json.tracks[0].elevenCredits).toBe(50);
    });
  });

  describe("subscription", () => {
    it("returns subscription info", async () => {
      const res = await GETSubscription();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.subscription.creditsRemaining).toBe(100);
    });
  });
});

