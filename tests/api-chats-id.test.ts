import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "@/app/api/chats/[id]/route";
import { NextRequest } from "next/server";
import { mockSupabase } from "@/lib/supabase/__mocks__/server";

vi.mock("@/lib/supabase/server");

const mockUser = { id: "user-123", email: "test@example.com" };
const mockChat = { id: "chat-1", user_id: "user-123", title: "My Chat" };
const mockOtherUserChat = {
  id: "chat-2",
  user_id: "other-user",
  title: "Other Chat",
};

describe("/api/chats/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });
    mockSupabase.from.mockReturnThis();
  });

  describe("GET", () => {
    it("returns chat if owned by user", async () => {
      mockSupabase.single.mockResolvedValue({ data: mockChat, error: null });

      const req = new NextRequest(`http://localhost/api/chats/${mockChat.id}`);
      const res = await GET(req, {
        params: Promise.resolve({ id: mockChat.id }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.chat.id).toBe(mockChat.id);
    });

    it("returns 404 if chat not found", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const req = new NextRequest("http://localhost/api/chats/missing");
      const res = await GET(req, {
        params: Promise.resolve({ id: "missing" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH", () => {
    it("updates chat if owned by user", async () => {
      // First call checks ownership, second updates
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockChat, error: null }) // ownership check
        .mockResolvedValueOnce({
          data: { ...mockChat, title: "Updated" },
          error: null,
        }); // update result

      const req = new NextRequest(`http://localhost/api/chats/${mockChat.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: mockChat.id }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.chat.title).toBe("Updated");
    });

    it("returns 403 if chat owned by another user", async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockOtherUserChat,
        error: null,
      });

      const req = new NextRequest(
        `http://localhost/api/chats/${mockOtherUserChat.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: "Hacked" }),
        }
      );
      const res = await PATCH(req, {
        params: Promise.resolve({ id: mockOtherUserChat.id }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE", () => {
    it("deletes chat if owned by user", async () => {
      mockSupabase.single.mockResolvedValue({ data: mockChat, error: null });

      const req = new NextRequest(`http://localhost/api/chats/${mockChat.id}`, {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ id: mockChat.id }),
      });
      expect(res.status).toBe(200);
    });

    it("returns 403 if chat owned by another user", async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockOtherUserChat,
        error: null,
      });

      const req = new NextRequest(
        `http://localhost/api/chats/${mockOtherUserChat.id}`,
        {
          method: "DELETE",
        }
      );
      const res = await DELETE(req, {
        params: Promise.resolve({ id: mockOtherUserChat.id }),
      });
      expect(res.status).toBe(403);
    });
  });
});
