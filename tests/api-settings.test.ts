import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/settings/route";
import { POST as POSTSecrets } from "@/app/api/settings/secrets/route";
import { NextRequest } from "next/server";
import { mockSupabase, mockSupabaseAdmin } from "@/lib/supabase/__mocks__/server"; // Re-export admin from server mock? No, separate file.
import { mockSupabaseAdmin as adminClient } from "@/lib/supabase/__mocks__/admin";
import * as secrets from "@/lib/secrets";

// Mock Supabase
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/supabase/admin");

// Mock lib/secrets
vi.mock("@/lib/secrets");

describe("/api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
    adminClient.from.mockReturnThis();
    
    // Reset secrets default
    vi.mocked(secrets.getUserSecretStatus).mockResolvedValue({
      hasOpenAIKey: true,
      hasElevenLabsKey: false,
    });
  });

  describe("GET", () => {
    it("returns 401 if unauthorized", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns settings", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "u1" } },
        error: null,
      });

      adminClient.maybeSingle
        .mockResolvedValueOnce({ data: { artist_name: "Artist" }, error: null }) // profile
        .mockResolvedValueOnce({ data: { openai_model: "gpt-4" }, error: null }); // settings

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
        error: null,
      });

      adminClient.upsert.mockResolvedValue({ error: null });

      const req = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({
          artist_name: "New Name",
          openai_model: "gpt-5",
        }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
    });

    it("handles db error", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "u1" } },
        error: null,
      });

      adminClient.upsert.mockResolvedValue({ error: { message: "err" } });

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
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
  });

  it("stores secrets", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    const req = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ openaiApiKey: "k1" }),
    });
    const res = await POSTSecrets(req);
    expect(res.status).toBe(200);
    expect(secrets.storeSecretsForUser).toHaveBeenCalled();
  });

  it("requires at least one key", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    const req = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POSTSecrets(req);
    expect(res.status).toBe(400);
  });
});
