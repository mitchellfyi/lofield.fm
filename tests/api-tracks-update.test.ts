import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "@/app/api/tracks/[id]/route";
import { NextRequest } from "next/server";
import { mockSupabase } from "@/lib/supabase/__mocks__/server";

vi.mock("@/lib/supabase/server");

// Helper function to create params
const createParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("PATCH /api/tracks/[id]", () => {
  const mockUser = { id: "user-1", email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.update.mockReturnThis();
  });

  it("allows owner to update track visibility to public", async () => {
    // Mock track fetch for ownership check
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "track-1",
        user_id: mockUser.id,
        visibility: "private",
        published_at: null,
      },
      error: null,
    });

    // Mock update response
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "track-1",
        visibility: "public",
        published_at: expect.any(String),
      },
      error: null,
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
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "track-1",
        user_id: mockUser.id,
        visibility: "private",
        published_at: null,
      },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "track-1",
        visibility: "unlisted",
        published_at: expect.any(String),
      },
      error: null,
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
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "track-1",
        user_id: mockUser.id,
        visibility: "public",
        published_at: "2024-01-01T00:00:00Z",
      },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "track-1",
        visibility: "private",
        published_at: null,
      },
      error: null,
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

  it("preserves published_at when changing from public to unlisted", async () => {
    const existingPublishedAt = "2024-01-01T00:00:00Z";
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "track-1",
        user_id: mockUser.id,
        visibility: "public",
        published_at: existingPublishedAt,
      },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "track-1",
        visibility: "unlisted",
        published_at: existingPublishedAt,
      },
      error: null,
    });

    const req = new NextRequest("http://localhost/api/tracks/track-1", {
      method: "PATCH",
      body: JSON.stringify({ visibility: "unlisted" }),
    });
    const params = createParams("track-1");
    const res = await PATCH(req, params);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.published_at).toBe(existingPublishedAt);
  });

  it("allows owner to update track title and description", async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "track-1",
        user_id: mockUser.id,
        visibility: "public",
        published_at: null,
      },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "track-1",
        title: "Updated Title",
        description: "Updated description",
      },
      error: null,
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
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "track-1",
        user_id: mockUser.id,
        visibility: "public",
        published_at: null,
      },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "track-1",
        genre: "ambient",
        bpm: 90,
        metadata: { tags: ["chill", "relaxing"] },
      },
      error: null,
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
      error: null,
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
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
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
    mockSupabase.single.mockResolvedValue({
      data: {
        id: "track-1",
        user_id: "user-2", // Different user
        visibility: "public",
        published_at: null,
      },
      error: null,
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
    const req = new NextRequest("http://localhost/api/tracks/track-1", {
      method: "PATCH",
      body: JSON.stringify({ visibility: "invalid" }),
    });
    const params = createParams("track-1");
    const res = await PATCH(req, params);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid input");
    expect(json.fields).toBeDefined();
  });

  it("rejects title that is too long", async () => {
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
