import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/settings/route";
import { POST as POSTSecrets } from "@/app/api/settings/secrets/route";
import { NextRequest } from "next/server";

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
};

const mockSupabaseAdmin = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => Promise.resolve(mockSupabase),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getServiceRoleClient: () => mockSupabaseAdmin,
}));

// Mock lib/secrets
vi.mock("@/lib/secrets", () => ({
  getUserSecretStatus: vi.fn().mockResolvedValue({
    hasOpenAIKey: true,
    hasElevenLabsKey: false,
  }),
  storeSecretsForUser: vi.fn().mockResolvedValue(undefined),
}));

describe("/api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 if unauthorized", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });
      // Also mock getSession just in case
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns settings", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "u1" } },
      });
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: "u1" } } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn()
          .mockResolvedValueOnce({ data: { artist_name: "Artist" } }) // profile
          .mockResolvedValueOnce({ data: { openai_model: "gpt-4" } }), // settings
      });

      const res = await GET();
      const json = await res.json();
      expect(json.artist_name).toBe("Artist");
      expect(json.openai_model).toBe("gpt-4");
      expect(json.hasOpenAIKey).toBe(true);
    });
  });

  describe("PATCH", () => {
    it("updates settings", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "u1" } },
      });
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: "u1" } } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      const req = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ artist_name: "New Name", openai_model: "gpt-5" }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
    });

    it("handles db error", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "u1" } },
      });
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: "u1" } } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: { message: "err" } }),
      });

      const req = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ artist_name: "New Name" }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(500);
    });
  });
});

describe("/api/settings/secrets", () => {
  it("stores secrets", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
    });
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
    });

    const req = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ openaiApiKey: "k1" }),
    });
    const res = await POSTSecrets(req);
    expect(res.status).toBe(200);
  });

  it("requires at least one key", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
    });
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
    });

    const req = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POSTSecrets(req);
    expect(res.status).toBe(400);
  });
});

