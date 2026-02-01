import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseJsonResponse } from "@/lib/test-utils/api-route";

// Mock the Supabase service client
let mockClient: Record<string, unknown>;

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => Promise.resolve(mockClient)),
}));

// Import route handler after mocking
import { GET } from "../route";

const mockFeaturedTracks = [
  {
    id: "featured-1",
    name: "Featured Track",
    current_code: "code1",
    bpm: 120,
    genre: "lofi",
    tags: ["chill"],
    ai_tags: [],
    plays: 1000,
    like_count: 100,
    is_featured: true,
    is_system: false,
    created_at: "2024-01-01T00:00:00Z",
    privacy: "public",
  },
];

const mockTrendingTracks = [
  {
    id: "trending-1",
    name: "Trending Track",
    current_code: "code2",
    bpm: 90,
    genre: "ambient",
    tags: ["relax"],
    ai_tags: [],
    plays: 500,
    like_count: 50,
    is_featured: false,
    is_system: false,
    created_at: "2024-01-15T00:00:00Z",
    privacy: "public",
  },
];

const mockRecentTracks = [
  {
    id: "recent-1",
    name: "Recent Track",
    current_code: "code3",
    bpm: 100,
    genre: "electronic",
    tags: ["new"],
    ai_tags: [],
    plays: 10,
    like_count: 5,
    is_featured: false,
    is_system: false,
    created_at: "2024-01-20T00:00:00Z",
    privacy: "public",
  },
];

describe("/api/explore/featured", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/explore/featured", () => {
    it("returns featured, trending, and recent tracks", async () => {
      const fromMock = vi.fn();
      let callCount = 0;

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        callCount++;
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "gte", "gt", "order", "limit"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.then = vi.fn((resolve) => {
          if (callCount === 1) {
            // Featured query
            return Promise.resolve({
              data: mockFeaturedTracks,
              error: null,
            }).then(resolve);
          } else if (callCount === 2) {
            // Trending query
            return Promise.resolve({
              data: mockTrendingTracks,
              error: null,
            }).then(resolve);
          } else {
            // Recent query
            return Promise.resolve({
              data: mockRecentTracks,
              error: null,
            }).then(resolve);
          }
        });

        return builder;
      });

      const response = await GET();
      const { status, data } = await parseJsonResponse<{
        featured: unknown[];
        trending: unknown[];
        recent: unknown[];
      }>(response);

      expect(status).toBe(200);
      expect(data.featured).toHaveLength(1);
      expect(data.trending).toHaveLength(1);
      expect(data.recent).toHaveLength(1);
      expect(data.featured[0]).toMatchObject({
        id: "featured-1",
        name: "Featured Track",
        is_featured: true,
      });
      expect(data.trending[0]).toMatchObject({
        id: "trending-1",
        name: "Trending Track",
      });
      expect(data.recent[0]).toMatchObject({
        id: "recent-1",
        name: "Recent Track",
      });
    });

    it("returns empty arrays when no tracks exist", async () => {
      const fromMock = vi.fn();

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "gte", "gt", "order", "limit"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.then = vi.fn((resolve) => {
          return Promise.resolve({ data: [], error: null }).then(resolve);
        });

        return builder;
      });

      const response = await GET();
      const { status, data } = await parseJsonResponse<{
        featured: unknown[];
        trending: unknown[];
        recent: unknown[];
      }>(response);

      expect(status).toBe(200);
      expect(data.featured).toEqual([]);
      expect(data.trending).toEqual([]);
      expect(data.recent).toEqual([]);
    });

    it("filters out trending tracks from recent list", async () => {
      const fromMock = vi.fn();
      let callCount = 0;

      // Track that's both trending and recent
      const overlappingTrack = {
        id: "overlap-1",
        name: "Overlapping Track",
        current_code: "code",
        bpm: 100,
        genre: "lofi",
        tags: [],
        ai_tags: [],
        plays: 500,
        like_count: 50,
        is_featured: false,
        is_system: false,
        created_at: "2024-01-15T00:00:00Z",
        privacy: "public",
      };

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        callCount++;
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "gte", "gt", "order", "limit"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.then = vi.fn((resolve) => {
          if (callCount === 1) {
            // Featured - empty
            return Promise.resolve({ data: [], error: null }).then(resolve);
          } else if (callCount === 2) {
            // Trending includes the overlapping track
            return Promise.resolve({
              data: [overlappingTrack],
              error: null,
            }).then(resolve);
          } else {
            // Recent also includes the overlapping track + another
            return Promise.resolve({
              data: [overlappingTrack, mockRecentTracks[0]],
              error: null,
            }).then(resolve);
          }
        });

        return builder;
      });

      const response = await GET();
      const { status, data } = await parseJsonResponse<{
        featured: unknown[];
        trending: unknown[];
        recent: unknown[];
      }>(response);

      expect(status).toBe(200);
      expect(data.trending).toHaveLength(1);
      expect(data.trending[0]).toMatchObject({ id: "overlap-1" });
      // Recent should not include the overlapping track
      expect(data.recent).toHaveLength(1);
      expect(data.recent[0]).toMatchObject({ id: "recent-1" });
    });

    it("includes cache headers in response", async () => {
      const fromMock = vi.fn();

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "gte", "gt", "order", "limit"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.then = vi.fn((resolve) => {
          return Promise.resolve({ data: [], error: null }).then(resolve);
        });

        return builder;
      });

      const response = await GET();

      expect(response.headers.get("Cache-Control")).toBe(
        "public, s-maxage=300, stale-while-revalidate=600"
      );
    });
  });
});
