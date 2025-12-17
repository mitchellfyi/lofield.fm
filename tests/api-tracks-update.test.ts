import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "@/app/api/tracks/[id]/route";
import { NextRequest } from "next/server";

// Hoist mocks
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
      auth: {
        getUser: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => Promise.resolve(mockSupabase),
}));

// Helper function to create params
const createParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("PATCH /api/tracks/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows owner to update track visibility to public", async () => {
    const userId = "user-1";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
    });

    // Mock track fetch
    const selectMock1 = vi.fn().mockReturnThis();
    const eqMock1 = vi.fn().mockReturnThis();
    const singleMock1 = vi.fn().mockResolvedValue({
      data: {
        id: "track-1",
        user_id: userId,
        visibility: "private",
      },
      error: null,
    });

    // Mock update
    const updateMock = vi.fn().mockReturnThis();
    const selectMock2 = vi.fn().mockReturnThis();
    const eqMock2 = vi.fn().mockReturnThis();
    const singleMock2 = vi.fn().mockResolvedValue({
      data: {
        id: "track-1",
        visibility: "public",
        published_at: expect.any(String),
      },
      error: null,
    });

    mockSupabase.from
      .mockReturnValueOnce({
        select: selectMock1,
        eq: eqMock1,
        single: singleMock1,
      })
      .mockReturnValueOnce({
        update: updateMock,
        eq: eqMock2,
        select: selectMock2,
        single: singleMock2,
      });

    const req = new NextRequest("http://localhost/api/tracks/track-1", {
      method: "PATCH",
      body: JSON.stringify({ visibility: "public" }),
    });
    const params = createParams("track-1");
    const res = await PATCH(req, params);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.visibility).toBe("public");
    expect(json.published_at).toBeDefined();
  });

  it("allows owner to update track visibility to unlisted", async () => {
    const userId = "user-1";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
    });

    const selectMock1 = vi.fn().mockReturnThis();
    const eqMock1 = vi.fn().mockReturnThis();
    const singleMock1 = vi.fn().mockResolvedValue({
      data: {
        id: "track-1",
        user_id: userId,
        visibility: "private",
      },
      error: null,
    });

    const updateMock = vi.fn().mockReturnThis();
    const selectMock2 = vi.fn().mockReturnThis();
    const eqMock2 = vi.fn().mockReturnThis();
    const singleMock2 = vi.fn().mockResolvedValue({
      data: {
        id: "track-1",
        visibility: "unlisted",
        published_at: expect.any(String),
      },
      error: null,
    });

    mockSupabase.from
      .mockReturnValueOnce({
        select: selectMock1,
        eq: eqMock1,
        single: singleMock1,
      })
      .mockReturnValueOnce({
        update: updateMock,
        eq: eqMock2,
        select: selectMock2,
        single: singleMock2,
      });

    const req = new NextRequest("http://localhost/api/tracks/track-1", {
      method: "PATCH",
      body: JSON.stringify({ visibility: "unlisted" }),
    });
    const params = createParams("track-1");
    const res = await PATCH(req, params);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.visibility).toBe("unlisted");
    expect(json.published_at).toBeDefined();
  });

  it("clears published_at when changing to private", async () => {
    const userId = "user-1";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
    });

    const selectMock1 = vi.fn().mockReturnThis();
    const eqMock1 = vi.fn().mockReturnThis();
    const singleMock1 = vi.fn().mockResolvedValue({
      data: {
        id: "track-1",
        user_id: userId,
        visibility: "public",
      },
      error: null,
    });

    const updateMock = vi.fn().mockReturnThis();
    const selectMock2 = vi.fn().mockReturnThis();
    const eqMock2 = vi.fn().mockReturnThis();
    const singleMock2 = vi.fn().mockResolvedValue({
      data: {
        id: "track-1",
        visibility: "private",
        published_at: null,
      },
      error: null,
    });

    mockSupabase.from
      .mockReturnValueOnce({
        select: selectMock1,
        eq: eqMock1,
        single: singleMock1,
      })
      .mockReturnValueOnce({
        update: updateMock,
        eq: eqMock2,
        select: selectMock2,
        single: singleMock2,
      });

    const req = new NextRequest("http://localhost/api/tracks/track-1", {
      method: "PATCH",
      body: JSON.stringify({ visibility: "private" }),
    });
    const params = createParams("track-1");
    const res = await PATCH(req, params);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.visibility).toBe("private");
    expect(json.published_at).toBeNull();
  });

  it("allows owner to update track title and description", async () => {
    const userId = "user-1";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
    });

    const selectMock1 = vi.fn().mockReturnThis();
    const eqMock1 = vi.fn().mockReturnThis();
    const singleMock1 = vi.fn().mockResolvedValue({
      data: {
        id: "track-1",
        user_id: userId,
        visibility: "public",
      },
      error: null,
    });

    const updateMock = vi.fn().mockReturnThis();
    const selectMock2 = vi.fn().mockReturnThis();
    const eqMock2 = vi.fn().mockReturnThis();
    const singleMock2 = vi.fn().mockResolvedValue({
      data: {
        id: "track-1",
        title: "Updated Title",
        description: "Updated description",
      },
      error: null,
    });

    mockSupabase.from
      .mockReturnValueOnce({
        select: selectMock1,
        eq: eqMock1,
        single: singleMock1,
      })
      .mockReturnValueOnce({
        update: updateMock,
        eq: eqMock2,
        select: selectMock2,
        single: singleMock2,
      });

    const req = new NextRequest("http://localhost/api/tracks/track-1", {
      method: "PATCH",
      body: JSON.stringify({
        title: "Updated Title",
        description: "Updated description",
      }),
    });
    const params = createParams("track-1");
    const res = await PATCH(req, params);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.title).toBe("Updated Title");
    expect(json.description).toBe("Updated description");
  });

  it("allows owner to update metadata fields", async () => {
    const userId = "user-1";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
    });

    const selectMock1 = vi.fn().mockReturnThis();
    const eqMock1 = vi.fn().mockReturnThis();
    const singleMock1 = vi.fn().mockResolvedValue({
      data: {
        id: "track-1",
        user_id: userId,
        visibility: "public",
      },
      error: null,
    });

    const updateMock = vi.fn().mockReturnThis();
    const selectMock2 = vi.fn().mockReturnThis();
    const eqMock2 = vi.fn().mockReturnThis();
    const singleMock2 = vi.fn().mockResolvedValue({
      data: {
        id: "track-1",
        genre: "ambient",
        bpm: 90,
        metadata: { tags: ["chill", "relaxing"] },
      },
      error: null,
    });

    mockSupabase.from
      .mockReturnValueOnce({
        select: selectMock1,
        eq: eqMock1,
        single: singleMock1,
      })
      .mockReturnValueOnce({
        update: updateMock,
        eq: eqMock2,
        select: selectMock2,
        single: singleMock2,
      });

    const req = new NextRequest("http://localhost/api/tracks/track-1", {
      method: "PATCH",
      body: JSON.stringify({
        genre: "ambient",
        bpm: 90,
        metadata: { tags: ["chill", "relaxing"] },
      }),
    });
    const params = createParams("track-1");
    const res = await PATCH(req, params);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.genre).toBe("ambient");
    expect(json.bpm).toBe(90);
  });

  it("returns 401 for unauthenticated users", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    const req = new NextRequest("http://localhost/api/tracks/track-1", {
      method: "PATCH",
      body: JSON.stringify({ visibility: "public" }),
    });
    const params = createParams("track-1");
    const res = await PATCH(req, params);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 for non-existent track", async () => {
    const userId = "user-1";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
    });

    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    mockSupabase.from.mockReturnValue({
      select: selectMock,
      eq: eqMock,
      single: singleMock,
    });

    const req = new NextRequest("http://localhost/api/tracks/track-999", {
      method: "PATCH",
      body: JSON.stringify({ visibility: "public" }),
    });
    const params = createParams("track-999");
    const res = await PATCH(req, params);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Track not found");
  });

  it("returns 403 when non-owner tries to update track", async () => {
    const userId = "user-1";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
    });

    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const singleMock = vi.fn().mockResolvedValue({
      data: {
        id: "track-1",
        user_id: "user-2", // Different user
        visibility: "public",
      },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: selectMock,
      eq: eqMock,
      single: singleMock,
    });

    const req = new NextRequest("http://localhost/api/tracks/track-1", {
      method: "PATCH",
      body: JSON.stringify({ visibility: "private" }),
    });
    const params = createParams("track-1");
    const res = await PATCH(req, params);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe("Forbidden");
  });

  it("validates input and rejects invalid data", async () => {
    const userId = "user-1";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
    });

    const req = new NextRequest("http://localhost/api/tracks/track-1", {
      method: "PATCH",
      body: JSON.stringify({ visibility: "invalid" }),
    });
    const params = createParams("track-1");
    const res = await PATCH(req, params);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid input");
  });

  it("rejects title that is too long", async () => {
    const userId = "user-1";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
    });

    const req = new NextRequest("http://localhost/api/tracks/track-1", {
      method: "PATCH",
      body: JSON.stringify({ title: "a".repeat(201) }),
    });
    const params = createParams("track-1");
    const res = await PATCH(req, params);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid input");
  });

  it("rejects invalid BPM values", async () => {
    const userId = "user-1";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
    });

    const req = new NextRequest("http://localhost/api/tracks/track-1", {
      method: "PATCH",
      body: JSON.stringify({ bpm: 1000 }),
    });
    const params = createParams("track-1");
    const res = await PATCH(req, params);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid input");
  });
});
