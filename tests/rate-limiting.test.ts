import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, incrementRateLimit } from "@/lib/rate-limiting";

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/admin", () => ({
  getServiceRoleClient: () => mockSupabase,
}));

describe("rate-limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkRateLimit", () => {
    it("returns allowed=true if usage below limit", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { refine_count: 5, generate_count: 2 },
          error: null,
        }),
      });

      const res = await checkRateLimit("user-1", "refine");
      expect(res.allowed).toBe(true);
      expect(res.current).toBe(5);
    });

    it("returns allowed=false if usage exceeds limit", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { refine_count: 200, generate_count: 50 },
          error: null,
        }),
      });

      const res = await checkRateLimit("user-1", "refine");
      expect(res.allowed).toBe(false);
      expect(res.current).toBe(200);
    });

    it("defaults to 0 if no counter found", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const res = await checkRateLimit("user-1", "refine");
      expect(res.allowed).toBe(true);
      expect(res.current).toBe(0);
    });

    it("fails open (allowed=true) on error", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "db error" },
        }),
      });

      const res = await checkRateLimit("user-1", "refine");
      expect(res.allowed).toBe(true);
    });
  });

  describe("incrementRateLimit", () => {
    it("updates existing counter", async () => {
      // Mock existing counter check
      const updateMock = vi.fn().mockReturnThis();
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { refine_count: 5 },
          error: null,
        }),
        update: updateMock,
      });

      await incrementRateLimit("user-1", "refine");

      // Verify update called
      expect(updateMock).toHaveBeenCalledWith({ refine_count: 6 });
    });

    it("inserts new counter if none exists", async () => {
      // Mock existing counter check -> null
      const insertMock = vi.fn().mockReturnThis();
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: insertMock,
      });

      await incrementRateLimit("user-1", "generate");

      // Verify insert called
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          generate_count: 1,
        })
      );
    });
  });
});
