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
          metadata: { tags: ["chill", "lofi"] },
          created_at: "2024-01-01T00:00:00Z",
          published_at: "2024-01-01T00:00:00Z",
        },
      ];

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: mockTracks,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        limit: limitMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.items).toHaveLength(1);
      expect(json.items[0].title).toBe("Lofi Beats");
      expect(json.nextCursor).toBeNull();

      // Verify correct filters applied
      expect(mockSupabase.from).toHaveBeenCalledWith("tracks");
      expect(eqMock).toHaveBeenCalledWith("visibility", "public");
      expect(eqMock).toHaveBeenCalledWith("status", "ready");
    });

    it("supports pagination with cursor", async () => {
      const mockTracks = [
        {
          id: "t1",
          title: "Track 1",
          published_at: "2024-01-01T00:00:00Z",
          metadata: {},
        },
      ];

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: mockTracks,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        limit: limitMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?limit=10"
      );
      const res = await GET(req);
      await res.json();

      expect(res.status).toBe(200);
      expect(limitMock).toHaveBeenCalledWith(11); // limit + 1
    });

    it("supports search query with q parameter", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const textSearchMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        textSearch: textSearchMock,
        order: orderMock,
        limit: limitMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?q=lofi beats"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(textSearchMock).toHaveBeenCalledWith("search_tsv", "lofi beats", {
        type: "websearch",
        config: "english",
      });
    });

    it("supports filtering by artist with partial match", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const ilikeMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        ilike: ilikeMock,
        order: orderMock,
        limit: limitMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?artist=Artist%201"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(ilikeMock).toHaveBeenCalledWith("artist_name", "%Artist 1%");
    });

    it("supports filtering by genre", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        limit: limitMock,
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
      const limitMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        gte: gteMock,
        lte: lteMock,
        order: orderMock,
        limit: limitMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?bpm_min=80&bpm_max=120"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(gteMock).toHaveBeenCalledWith("bpm", 80);
      expect(lteMock).toHaveBeenCalledWith("bpm", 120);
    });

    it("supports mood range filtering", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const gteMock = vi.fn().mockReturnThis();
      const lteMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        gte: gteMock,
        lte: lteMock,
        order: orderMock,
        limit: limitMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?energy_min=50&energy_max=100&focus_min=30&chill_max=70"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(gteMock).toHaveBeenCalledWith("mood_energy", 50);
      expect(lteMock).toHaveBeenCalledWith("mood_energy", 100);
      expect(gteMock).toHaveBeenCalledWith("mood_focus", 30);
      expect(lteMock).toHaveBeenCalledWith("mood_chill", 70);
    });

    it("supports tags filtering", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const containsMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        contains: containsMock,
        order: orderMock,
        limit: limitMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?tags=chill,lofi"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(containsMock).toHaveBeenCalledWith("metadata", {
        tags: ["chill", "lofi"],
      });
    });

    it("supports instrumentation filtering", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const containsMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        contains: containsMock,
        order: orderMock,
        limit: limitMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?instrumentation=piano,guitar"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(containsMock).toHaveBeenCalledWith("metadata", {
        instrumentation: ["piano", "guitar"],
      });
    });

    it("supports sorting by bpm ascending", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        limit: limitMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?sort=bpm_asc"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(orderMock).toHaveBeenCalledWith("bpm", {
        ascending: true,
        nullsFirst: false,
      });
    });

    it("supports sorting by bpm descending", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        limit: limitMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?sort=bpm_desc"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(orderMock).toHaveBeenCalledWith("bpm", {
        ascending: false,
        nullsFirst: false,
      });
    });

    it("validates sort parameter", async () => {
      const req = new NextRequest(
        "http://localhost/api/public/tracks?sort=invalid"
      );
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("Invalid sort parameter");
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

    it("enforces maximum limit of 100", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        limit: limitMock,
      });

      const req = new NextRequest(
        "http://localhost/api/public/tracks?limit=200"
      );
      const res = await GET(req);
      await res.json();

      expect(res.status).toBe(200);
      expect(limitMock).toHaveBeenCalledWith(101); // max 100 + 1
    });

    it("handles database errors gracefully", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        limit: limitMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe("Failed to fetch tracks");
    });

    it("generates nextCursor when more results available", async () => {
      const mockTracks = new Array(31).fill(null).map((_, i) => ({
        id: `t${i}`,
        title: `Track ${i}`,
        published_at: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
        metadata: {},
      }));

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: mockTracks,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        limit: limitMock,
      });

      const req = new NextRequest("http://localhost/api/public/tracks");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.items).toHaveLength(30); // Default limit
      expect(json.nextCursor).not.toBeNull();
      expect(typeof json.nextCursor).toBe("string");
    });
  });
});
