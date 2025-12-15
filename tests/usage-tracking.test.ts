import { describe, it, expect, vi, beforeEach } from "vitest";
import { logUsageEvent, calculateOpenAICost } from "@/lib/usage-tracking";

const mockSupabaseAdmin = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/admin", () => ({
  getServiceRoleClient: () => mockSupabaseAdmin,
}));

describe("usage-tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logUsageEvent", () => {
    it("inserts event to db", async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      mockSupabaseAdmin.from.mockReturnValue({ insert: insertMock });

      await logUsageEvent({
        userId: "u1",
        actionGroupId: "ag1",
        actionType: "test",
        provider: "openai",
        providerOperation: "op",
        status: "ok",
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "u1",
          action_group_id: "ag1",
          status: "ok",
        })
      );
    });

    it("logs error to console if insert fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockSupabaseAdmin.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { code: "fail" } }),
      });

      await logUsageEvent({
        userId: "u1",
        actionGroupId: "ag1",
        actionType: "test",
        provider: "openai",
        providerOperation: "op",
        status: "ok",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to log usage event",
        expect.anything()
      );
    });
  });

  describe("calculateOpenAICost", () => {
    it("returns calculated cost", async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            price_input_per_1k: 0.01,
            price_output_per_1k: 0.02,
            effective_from: "2023-01-01",
          },
          error: null,
        }),
      });

      const cost = await calculateOpenAICost({
        model: "gpt-4",
        inputTokens: 1000,
        outputTokens: 1000,
      });

      expect(cost?.costUsd).toBe(0.03); // 0.01 + 0.02
    });

    it("returns null if no pricing found", async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      });

      const cost = await calculateOpenAICost({
        model: "gpt-4",
        inputTokens: 1000,
        outputTokens: 1000,
      });

      expect(cost).toBeNull();
    });
  });
});

