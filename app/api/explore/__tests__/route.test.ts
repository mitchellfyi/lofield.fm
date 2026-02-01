import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createGetRequest, parseJsonResponse } from "@/lib/test-utils/api-route";

// Mock the Supabase service client
let mockClient: Record<string, unknown>;

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => Promise.resolve(mockClient)),
}));

// Import route handler after mocking
import { GET } from "../route";

const mockTracks = [
  {
    id: "track-1",
    name: "Track One",
    current_code: "code1",
    bpm: 120,
    genre: "lofi",
    tags: ["chill", "study"],
    ai_tags: [],
    plays: 100,
    like_count: 10,
    is_featured: true,
    is_system: false,
    created_at: "2024-01-01T00:00:00Z",
    privacy: "public",
  },
  {
    id: "track-2",
    name: "Track Two",
    current_code: "code2",
    bpm: 90,
    genre: "ambient",
    tags: ["relax"],
    ai_tags: ["peaceful"],
    plays: 50,
    like_count: 5,
    is_featured: false,
    is_system: false,
    created_at: "2024-01-02T00:00:00Z",
    privacy: "public",
  },
];

describe("/api/explore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("GET /api/explore", () => {
    it("returns public tracks with filter options", async () => {
      const fromMock = vi.fn();

      mockClient = { from: fromMock };

      // Mock queries for tracks and filter options
      fromMock.mockImplementation((table: string) => {
        const builder: Record<string, unknown> = {};
        const chainMethods = [
          "select",
          "eq",
          "overlaps",
          "gte",
          "lte",
          "order",
          "range",
          "not",
          "is",
        ];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        // Main tracks query
        builder.then = vi.fn((resolve) => {
          if (table === "tracks") {
            return Promise.resolve({
              data: mockTracks,
              error: null,
              count: 2,
            }).then(resolve);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve);
        });

        return builder;
      });

      const request = createGetRequest("/api/explore");
      const response = await GET(request);
      const { status, data } = await parseJsonResponse<{
        tracks: unknown[];
        total: number;
        genres: string[];
        tags: string[];
        bpm_range: { min: number; max: number };
      }>(response);

      expect(status).toBe(200);
      expect(data.tracks).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.tracks[0]).toMatchObject({
        id: "track-1",
        name: "Track One",
      });
    });

    it("applies genre filter correctly", async () => {
      const fromMock = vi.fn();
      let genreFilterApplied = false;

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "overlaps", "gte", "lte", "order", "range", "not", "is"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.eq = vi.fn((col: string, value: string) => {
          if (col === "genre" && value === "lofi") {
            genreFilterApplied = true;
          }
          return builder;
        });

        builder.then = vi.fn((resolve) => {
          const filteredTracks = mockTracks.filter((t) => t.genre === "lofi");
          return Promise.resolve({
            data: filteredTracks,
            error: null,
            count: filteredTracks.length,
          }).then(resolve);
        });

        return builder;
      });

      const request = createGetRequest("/api/explore", { genre: "lofi" });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse<{
        tracks: unknown[];
        total: number;
      }>(response);

      expect(status).toBe(200);
      expect(genreFilterApplied).toBe(true);
      expect(data.tracks).toHaveLength(1);
    });

    it("applies BPM range filters correctly", async () => {
      const fromMock = vi.fn();
      let bpmMinApplied = false;
      let bpmMaxApplied = false;

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "overlaps", "order", "range", "not", "is"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.gte = vi.fn((col: string, value: number) => {
          if (col === "bpm" && value === 100) {
            bpmMinApplied = true;
          }
          return builder;
        });

        builder.lte = vi.fn((col: string, value: number) => {
          if (col === "bpm" && value === 130) {
            bpmMaxApplied = true;
          }
          return builder;
        });

        builder.then = vi.fn((resolve) => {
          const filteredTracks = mockTracks.filter((t) => t.bpm && t.bpm >= 100 && t.bpm <= 130);
          return Promise.resolve({
            data: filteredTracks,
            error: null,
            count: filteredTracks.length,
          }).then(resolve);
        });

        return builder;
      });

      const request = createGetRequest("/api/explore", {
        bpm_min: "100",
        bpm_max: "130",
      });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse<{
        tracks: unknown[];
        total: number;
      }>(response);

      expect(status).toBe(200);
      expect(bpmMinApplied).toBe(true);
      expect(bpmMaxApplied).toBe(true);
      expect(data.tracks).toHaveLength(1);
    });

    it("applies sorting correctly", async () => {
      const fromMock = vi.fn();
      let sortApplied = "";

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "overlaps", "gte", "lte", "range", "not", "is"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.order = vi.fn((col: string, options: { ascending: boolean }) => {
          if (col === "created_at" && !options.ascending) {
            sortApplied = "newest";
          }
          return builder;
        });

        builder.then = vi.fn((resolve) => {
          return Promise.resolve({
            data: mockTracks,
            error: null,
            count: mockTracks.length,
          }).then(resolve);
        });

        return builder;
      });

      const request = createGetRequest("/api/explore", { sort: "newest" });
      const response = await GET(request);
      const { status } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(sortApplied).toBe("newest");
    });

    it("applies pagination correctly", async () => {
      const fromMock = vi.fn();
      let rangeStart = -1;
      let rangeEnd = -1;

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "overlaps", "gte", "lte", "order", "not", "is"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.range = vi.fn((start: number, end: number) => {
          rangeStart = start;
          rangeEnd = end;
          return builder;
        });

        builder.then = vi.fn((resolve) => {
          return Promise.resolve({
            data: mockTracks.slice(0, 1),
            error: null,
            count: mockTracks.length,
          }).then(resolve);
        });

        return builder;
      });

      const request = createGetRequest("/api/explore", {
        limit: "10",
        offset: "20",
      });
      const response = await GET(request);
      const { status } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(rangeStart).toBe(20);
      expect(rangeEnd).toBe(29); // offset + limit - 1
    });

    it("limits results to maximum of 100", async () => {
      const fromMock = vi.fn();
      let rangeEnd = -1;

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "overlaps", "gte", "lte", "order", "not", "is"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.range = vi.fn((start: number, end: number) => {
          rangeEnd = end;
          return builder;
        });

        builder.then = vi.fn((resolve) => {
          return Promise.resolve({
            data: mockTracks,
            error: null,
            count: mockTracks.length,
          }).then(resolve);
        });

        return builder;
      });

      const request = createGetRequest("/api/explore", { limit: "500" });
      const response = await GET(request);
      const { status } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(rangeEnd).toBe(99); // 0 + 100 - 1, capped at 100
    });

    it("returns 500 when database error occurs", async () => {
      const fromMock = vi.fn();

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = [
          "select",
          "eq",
          "overlaps",
          "gte",
          "lte",
          "order",
          "range",
          "not",
          "is",
        ];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.then = vi.fn((resolve) => {
          return Promise.resolve({
            data: null,
            error: { message: "Database error" },
          }).then(resolve);
        });

        return builder;
      });

      const request = createGetRequest("/api/explore");
      const response = await GET(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch tracks" });
    });
  });
});
