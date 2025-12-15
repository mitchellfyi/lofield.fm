import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/chats/route";
import { NextRequest } from "next/server";
import { mockSupabase } from "@/lib/supabase/__mocks__/server";
import { mockSupabaseAdmin } from "@/lib/supabase/__mocks__/admin";

// Enable auto-mocking
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/supabase/admin");

describe("/api/chats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default behaviors
    mockSupabase.from.mockReturnThis();
    mockSupabaseAdmin.from.mockReturnThis();
    mockSupabaseAdmin.upsert.mockReturnThis();
  });

  describe("GET", () => {
    it("returns 401 if unauthorized", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns chats list", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      
      // Override for specific return
      mockSupabase.order.mockResolvedValue({
        data: [{ id: "c1", title: "Chat 1" }],
        error: null,
      });

      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.chats).toHaveLength(1);
      expect(json.chats[0].title).toBe("Chat 1");
    });

    it("handles db error", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: "err" },
      });

      const res = await GET();
      expect(res.status).toBe(500);
    });
  });

  describe("POST", () => {
    it("returns 401 if unauthorized", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const req = new NextRequest("http://localhost", { method: "POST" });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("provisions user and creates chat", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });

      // Provisioning mocks
      mockSupabaseAdmin.upsert.mockResolvedValue({ error: null });

      // Create chat mock
      mockSupabase.single.mockResolvedValue({
        data: { id: "new-chat", title: "My Chat" },
        error: null,
      });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ title: "My Chat" }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.chat.title).toBe("My Chat");
      expect(mockSupabaseAdmin.upsert).toHaveBeenCalledTimes(3); // profiles, settings, secrets
    });

    it("handles invalid body", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      // Provisioning succeeds
      mockSupabaseAdmin.upsert.mockResolvedValue({ error: null });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ title: 123 }), // Invalid type
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("fails if provisioning fails", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      // Provisioning fails
      mockSupabaseAdmin.upsert.mockResolvedValue({ error: { message: "fail" } });

      const req = new NextRequest("http://localhost", { method: "POST" });
      const res = await POST(req);
      expect(res.status).toBe(500);
    });
  });
});
