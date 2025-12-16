import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/public/tracks/route";
import { NextRequest } from "next/server";

// Hoist mocks
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => Promise.resolve(mockSupabase),
}));

describe("Public Tracks API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/public/tracks", () => {
    it("returns public tracks without authentication", async () => {
      const mockTracks = [
        {
          id: "t1",
          title: "Lofi Beats",
          description: "Chill lofi track",
          artist_name: "Artist 1",
          genre: "lofi",
          bpm: 80,
          mood_energy: 30,
          mood_focus: 70,
          mood_chill: 80,
          length_ms: 120000,
          instrumental: true,
          created_at: "2024-01-01T00:00:00Z",
          published_at: "2024-01-01T00:00:00Z",
        },
      ];

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockResolvedValue({
        data: mockTracks,
        error: null,
        count: 1,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        range: rangeMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.tracks).toHaveLength(1);
      expect(json.tracks[0].title).toBe("Lofi Beats");
      expect(json.total).toBe(1);
      expect(json.limit).toBe(20);
      expect(json.offset).toBe(0);

      // Verify correct filters applied
      expect(mockSupabase.from).toHaveBeenCalledWith("tracks");
      expect(eqMock).toHaveBeenCalledWith("visibility", "public");
      expect(eqMock).toHaveBeenCalledWith("status", "ready");
    });

    it("supports pagination parameters", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        range: rangeMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?limit=10&offset=20"
      );
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.limit).toBe(10);
      expect(json.offset).toBe(20);
      expect(rangeMock).toHaveBeenCalledWith(20, 29);
    });

    it("supports search query", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const textSearchMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        textSearch: textSearchMock,
        order: orderMock,
        range: rangeMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?search=lofi beats"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(textSearchMock).toHaveBeenCalledWith(
        "search_tsv",
        "lofi beats",
        {
          type: "websearch",
          config: "english",
        }
      );
    });

    it("supports filtering by artist", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        range: rangeMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?artist=Artist%201"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(eqMock).toHaveBeenCalledWith("artist_name", "Artist 1");
    });

    it("supports filtering by genre", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        range: rangeMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?genre=lofi"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(eqMock).toHaveBeenCalledWith("genre", "lofi");
    });

    it("supports BPM range filtering", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const gteMock = vi.fn().mockReturnThis();
      const lteMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        gte: gteMock,
        lte: lteMock,
        order: orderMock,
        range: rangeMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?bpmMin=80&bpmMax=120"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(gteMock).toHaveBeenCalledWith("bpm", 80);
      expect(lteMock).toHaveBeenCalledWith("bpm", 120);
    });

    it("validates limit parameter", async () => {
      const req = new NextRequest(
        "http://localhost/api/public/tracks?limit=invalid"
      );
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("Invalid limit parameter");
    });

    it("validates offset parameter", async () => {
      const req = new NextRequest(
        "http://localhost/api/public/tracks?offset=-1"
      );
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("Invalid offset parameter");
    });

    it("enforces maximum limit of 100", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        range: rangeMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?limit=200"
      );
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.limit).toBe(100); // Should be capped at 100
      expect(rangeMock).toHaveBeenCalledWith(0, 99);
    });

    it("handles database errors gracefully", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
        count: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        range: rangeMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe("Failed to fetch tracks");
    });
  });
});
