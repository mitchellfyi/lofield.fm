import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as GETEvents } from "@/app/api/usage/events/route";
import { GET as GETSummary } from "@/app/api/usage/summary/route";
import { NextRequest } from "next/server";

// Mock Supabase
const mockSupabase = {
  auth: { getSession: vi.fn(), getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => Promise.resolve(mockSupabase),
}));

describe("Usage APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
    });
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
    });
  });

  describe("/api/usage/events", () => {
    it("fetches events with filters", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [{ id: "e1", provider: "openai" }],
          error: null,
          count: 1,
        }),
      });

      const req = new NextRequest(
        "http://localhost/api/usage/events?start=2023-01-01&end=2023-01-02&provider=openai"
      );
      const res = await GETEvents(req);
      const json = await res.json();

      if (res.status !== 200) {
        console.error("API Usage Events Error:", json);
      }

      expect(res.status).toBe(200);
      expect(json.events).toHaveLength(1);
      expect(json.pagination.totalCount).toBe(1);
    });

    it("validates query params", async () => {
      const req = new NextRequest(
        "http://localhost/api/usage/events?start=invalid"
      );
      const res = await GETEvents(req);
      expect(res.status).toBe(400);
    });
  });

  describe("/api/usage/summary", () => {
    it("aggregates summary", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          data: [
            {
              provider: "openai",
              model: "gpt-4",
              cost_usd: 0.1,
              status: "ok",
              action_type: "refine_prompt",
            },
          ],
          error: null,
        }),
      });

      const req = new NextRequest(
        "http://localhost/api/usage/summary?start=2023-01-01&end=2023-01-02"
      );
      const res = await GETSummary(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.byProvider[0].costUsd).toBe(0.1);
      expect(json.counts.refineActions).toBe(1);
    });
  });
});

