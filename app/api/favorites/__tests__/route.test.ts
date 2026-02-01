import { describe, it, expect, vi, beforeEach } from "vitest";
import { MOCK_USER, type MockSupabaseClient } from "@/lib/test-utils/supabase-mock";
import { parseJsonResponse } from "@/lib/test-utils/api-route";

// Mock the Supabase server client
let mockClient: MockSupabaseClient;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockClient)),
}));

// Import route handlers after mocking
import { GET } from "../route";

describe("/api/favorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/favorites", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
          getSession: vi.fn(),
          signOut: vi.fn(),
        },
        from: vi.fn(),
      };

      const response = await GET();
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("returns empty list when user has no favorites", async () => {
      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
          getSession: vi.fn(),
          signOut: vi.fn(),
        },
        from: fromMock,
      };

      // Mock track_likes query returning empty
      fromMock.mockImplementation((table: string) => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "in", "order"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });
        builder.then = vi.fn((resolve) => {
          if (table === "track_likes") {
            return Promise.resolve({ data: [], error: null }).then(resolve);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve);
        });
        return builder;
      });

      const response = await GET();
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(data).toEqual({ tracks: [], total: 0 });
    });

    it("returns user favorites with track details", async () => {
      const mockLikes = [{ track_id: "track-1" }, { track_id: "track-2" }];

      const mockTracks = [
        {
          id: "track-1",
          name: "Track One",
          current_code: "code1",
          bpm: 120,
          genre: "lofi",
          tags: ["chill"],
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

      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
          getSession: vi.fn(),
          signOut: vi.fn(),
        },
        from: fromMock,
      };

      fromMock.mockImplementation((table: string) => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "in", "order"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });
        builder.then = vi.fn((resolve) => {
          if (table === "track_likes") {
            return Promise.resolve({ data: mockLikes, error: null }).then(resolve);
          }
          if (table === "tracks") {
            return Promise.resolve({ data: mockTracks, error: null }).then(resolve);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve);
        });
        return builder;
      });

      const response = await GET();
      const { status, data } = await parseJsonResponse<{ tracks: unknown[]; total: number }>(
        response
      );

      expect(status).toBe(200);
      expect(data.total).toBe(2);
      expect(data.tracks).toHaveLength(2);
      expect(data.tracks[0]).toMatchObject({
        id: "track-1",
        name: "Track One",
      });
    });

    it("returns 500 when likes query fails", async () => {
      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
          getSession: vi.fn(),
          signOut: vi.fn(),
        },
        from: fromMock,
      };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "order"];
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

      const response = await GET();
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch favorites" });
    });

    it("returns 500 when tracks query fails", async () => {
      const mockLikes = [{ track_id: "track-1" }];
      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
          getSession: vi.fn(),
          signOut: vi.fn(),
        },
        from: fromMock,
      };

      fromMock.mockImplementation((table: string) => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "in", "order"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });
        builder.then = vi.fn((resolve) => {
          if (table === "track_likes") {
            return Promise.resolve({ data: mockLikes, error: null }).then(resolve);
          }
          if (table === "tracks") {
            return Promise.resolve({
              data: null,
              error: { message: "Database error" },
            }).then(resolve);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve);
        });
        return builder;
      });

      const response = await GET();
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch tracks" });
    });
  });
});
