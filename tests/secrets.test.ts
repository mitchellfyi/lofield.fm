import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOpenAIKeyForUser,
  getElevenLabsKeyForUser,
  getUserSecretStatus,
  storeSecretsForUser,
  deleteSecretForUser,
} from "@/lib/secrets";

const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock("@/lib/supabase/admin", () => ({
  getServiceRoleClient: () => mockSupabase,
}));

describe("secrets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "env-openai";
    process.env.ELEVENLABS_API_KEY = "env-eleven";
  });

  describe("getOpenAIKeyForUser", () => {
    it("returns decrypted key if present", async () => {
      // Mock finding secret ID
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: { openai_secret_id: "sec-1" } }),
      });

      // Mock decryption RPC
      mockSupabase.rpc.mockResolvedValue({
        data: "decrypted-key",
        error: null,
      });

      const key = await getOpenAIKeyForUser("user-1");
      expect(key).toBe("decrypted-key");
    });

    it("falls back to env var if no secret ID", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      });

      const key = await getOpenAIKeyForUser("user-1");
      expect(key).toBe("env-openai");
    });

    it("falls back to env var if decryption fails", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: { openai_secret_id: "sec-1" } }),
      });

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "error" },
      });

      const key = await getOpenAIKeyForUser("user-1");
      expect(key).toBe("env-openai");
    });
  });

  describe("getElevenLabsKeyForUser", () => {
    it("returns decrypted key if present", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: { elevenlabs_secret_id: "sec-2" } }),
      });

      mockSupabase.rpc.mockResolvedValue({ data: "el-key", error: null });

      const key = await getElevenLabsKeyForUser("user-1");
      expect(key).toBe("el-key");
    });
  });

  describe("getUserSecretStatus", () => {
    it("returns boolean flags", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            openai_secret_id: "s1",
            elevenlabs_secret_id: null,
          },
        }),
      });

      const status = await getUserSecretStatus("user-1");
      expect(status.hasOpenAIKey).toBe(true);
      expect(status.hasElevenLabsKey).toBe(false);
    });
  });

  describe("storeSecretsForUser", () => {
    it("upserts profile and stores secrets", async () => {
      const upsertMock = vi.fn().mockReturnThis();
      mockSupabase.from.mockReturnValue({
        upsert: upsertMock,
      });

      mockSupabase.rpc.mockResolvedValue({ data: "id", error: null });

      await storeSecretsForUser("user-1", {
        openaiApiKey: "nk-1",
        elevenlabsApiKey: "nk-2",
      });

      expect(upsertMock).toHaveBeenCalled();
      expect(mockSupabase.rpc).toHaveBeenCalledWith("store_user_secret", {
        p_user_id: "user-1",
        p_provider: "openai",
        p_secret: "nk-1",
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith("store_user_secret", {
        p_user_id: "user-1",
        p_provider: "elevenlabs",
        p_secret: "nk-2",
      });
    });

    it("throws if storage fails", async () => {
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
      });

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "fail" },
      });

      await expect(
        storeSecretsForUser("user-1", { openaiApiKey: "k" })
      ).rejects.toEqual({ message: "fail" });
    });
  });

  describe("deleteSecretForUser", () => {
    it("calls delete rpc", async () => {
      mockSupabase.rpc.mockResolvedValue({ error: null });
      await deleteSecretForUser("user-1", "openai");
      expect(mockSupabase.rpc).toHaveBeenCalledWith("delete_user_secret", {
        p_user_id: "user-1",
        p_provider: "openai",
      });
    });

    it("throws on error", async () => {
      mockSupabase.rpc.mockResolvedValue({ error: { message: "fail" } });
      await expect(deleteSecretForUser("u", "openai")).rejects.toEqual({
        message: "fail",
      });
    });
  });
});
