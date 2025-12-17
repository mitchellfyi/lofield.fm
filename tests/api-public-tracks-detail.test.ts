import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getTrackDetail } from "@/app/api/public/tracks/[id]/route";
import { GET as getTrackPlay } from "@/app/api/public/tracks/[id]/play/route";
import { NextRequest } from "next/server";

// Hoist mocks
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
      auth: {
        getUser: vi.fn(),
      },
      storage: {
        from: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => Promise.resolve(mockSupabase),
}));

describe("Public Track Detail and Play APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock auth.getUser to return null (anonymous user) by default
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
  });

  describe("GET /api/public/tracks/[id]", () => {
    it("returns public track details", async () => {
      const mockTrack = {
        id: "t1",
        user_id: "user-1",
        title: "Public Track",
        description: "A public track",
        artist_name: "Artist",
        genre: "lofi",
        bpm: 80,
        mood_energy: 50,
        mood_focus: 60,
        mood_chill: 70,
        length_ms: 120000,
        instrumental: true,
        final_prompt: "Create a lofi track",
        metadata: { tags: ["chill"] },
        visibility: "public",
        status: "ready",
        created_at: "2024-01-01T00:00:00Z",
        published_at: "2024-01-01T00:00:00Z",
      };

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValue({
        data: mockTrack,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks/t1");
      const params = { params: Promise.resolve({ id: "t1" }) };
      const res = await getTrackDetail(req, params);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.id).toBe("t1");
      expect(json.title).toBe("Public Track");
      expect(json.final_prompt).toBe("Create a lofi track");
      expect(json.is_owner).toBe(false); // Anonymous user is not owner
      expect(json.user_id).toBeUndefined(); // user_id should not be exposed
    });

    it("returns unlisted track details", async () => {
      const mockTrack = {
        id: "t2",
        user_id: "user-1",
        title: "Unlisted Track",
        visibility: "unlisted",
        status: "ready",
      };

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValue({
        data: mockTrack,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks/t2");
      const params = { params: Promise.resolve({ id: "t2" }) };
      const res = await getTrackDetail(req, params);

      expect(res.status).toBe(200);
    });

    it("returns 404 for private tracks", async () => {
      const mockTrack = {
        id: "t3",
        user_id: "user-1",
        visibility: "private",
      };

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValue({
        data: mockTrack,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks/t3");
      const params = { params: Promise.resolve({ id: "t3" }) };
      const res = await getTrackDetail(req, params);
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe("Track not found");
    });

    it("returns 404 for non-existent tracks", async () => {
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

      const req = new NextRequest("http://localhost/api/public/tracks/t999");
      const params = { params: Promise.resolve({ id: "t999" }) };
      const res = await getTrackDetail(req, params);
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe("Track not found");
    });
  });

  describe("GET /api/public/tracks/[id]/play", () => {
    it("returns signed URL for public track (anonymous user)", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const mockTrack = {
        id: "t1",
        user_id: "user-1",
        storage_path: "user-1/t1.mp3",
        status: "ready",
        visibility: "public",
      };

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValue({
        data: mockTrack,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      });

      const createSignedUrlMock = vi.fn().mockResolvedValue({
        data: { signedUrl: "https://storage.example.com/signed-url" },
        error: null,
      });

      mockSupabase.storage.from.mockReturnValue({
        createSignedUrl: createSignedUrlMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks/t1/play");
      const params = { params: Promise.resolve({ id: "t1" }) };
      const res = await getTrackPlay(req, params);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.signedUrl).toBe("https://storage.example.com/signed-url");
      expect(json.expiresAt).toBeDefined();
      expect(createSignedUrlMock).toHaveBeenCalledWith("user-1/t1.mp3", 3600);
    });

    it("returns signed URL for unlisted track", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const mockTrack = {
        id: "t2",
        user_id: "user-1",
        storage_path: "user-1/t2.mp3",
        status: "ready",
        visibility: "unlisted",
      };

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValue({
        data: mockTrack,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      });

      const createSignedUrlMock = vi.fn().mockResolvedValue({
        data: { signedUrl: "https://storage.example.com/signed-url" },
        error: null,
      });

      mockSupabase.storage.from.mockReturnValue({
        createSignedUrl: createSignedUrlMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks/t2/play");
      const params = { params: Promise.resolve({ id: "t2" }) };
      const res = await getTrackPlay(req, params);

      expect(res.status).toBe(200);
    });

    it("returns 404 for private track (anonymous user)", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const mockTrack = {
        id: "t3",
        user_id: "user-1",
        visibility: "private",
      };

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValue({
        data: mockTrack,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks/t3/play");
      const params = { params: Promise.resolve({ id: "t3" }) };
      const res = await getTrackPlay(req, params);
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe("Track not found");
    });

    it("allows owner to access private track", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });

      const mockTrack = {
        id: "t4",
        user_id: "user-1",
        storage_path: "user-1/t4.mp3",
        status: "ready",
        visibility: "private",
      };

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValue({
        data: mockTrack,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      });

      const createSignedUrlMock = vi.fn().mockResolvedValue({
        data: { signedUrl: "https://storage.example.com/signed-url" },
        error: null,
      });

      mockSupabase.storage.from.mockReturnValue({
        createSignedUrl: createSignedUrlMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks/t4/play");
      const params = { params: Promise.resolve({ id: "t4" }) };
      const res = await getTrackPlay(req, params);

      expect(res.status).toBe(200);
    });

    it("returns 400 if track is not ready", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const mockTrack = {
        id: "t5",
        user_id: "user-1",
        storage_path: "user-1/t5.mp3",
        status: "generating",
        visibility: "public",
      };

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValue({
        data: mockTrack,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks/t5/play");
      const params = { params: Promise.resolve({ id: "t5" }) };
      const res = await getTrackPlay(req, params);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("Track is not ready for playback");
    });

    it("returns 404 if storage path is missing", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const mockTrack = {
        id: "t6",
        user_id: "user-1",
        storage_path: null,
        status: "ready",
        visibility: "public",
      };

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValue({
        data: mockTrack,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks/t6/play");
      const params = { params: Promise.resolve({ id: "t6" }) };
      const res = await getTrackPlay(req, params);
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe("Track file not found");
    });
  });
});
