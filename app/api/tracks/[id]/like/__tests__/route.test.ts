import { describe, it, expect, vi, beforeEach } from "vitest";
import { MOCK_USER } from "@/lib/test-utils/supabase-mock";
import {
  createGetRequest,
  createPostRequest,
  createDeleteRequest,
  createRouteParams,
  parseJsonResponse,
} from "@/lib/test-utils/api-route";

// Mock the Supabase server client
let mockClient: Record<string, unknown>;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockClient)),
}));

// Import route handlers after mocking
import { GET, POST, DELETE } from "../route";

const TRACK_ID = "test-track-00000000-0000-0000-0000-000000000001";

describe("/api/tracks/[id]/like", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/tracks/[id]/like", () => {
    it("returns liked: false for unauthenticated user", async () => {
      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: fromMock,
      };

      const request = createGetRequest(`/api/tracks/${TRACK_ID}/like`);
      const params = createRouteParams({ id: TRACK_ID });
      const response = await GET(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(data).toEqual({ liked: false, like_count: 0 });
    });

    it("returns liked: true when user has liked the track", async () => {
      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: fromMock,
      };

      fromMock.mockImplementation((table: string) => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        if (table === "track_likes") {
          builder.single = vi.fn().mockResolvedValue({
            data: { id: "like-id" },
            error: null,
          });
        } else if (table === "tracks") {
          builder.single = vi.fn().mockResolvedValue({
            data: { like_count: 42 },
            error: null,
          });
        }

        return builder;
      });

      const request = createGetRequest(`/api/tracks/${TRACK_ID}/like`);
      const params = createRouteParams({ id: TRACK_ID });
      const response = await GET(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(data).toEqual({ liked: true, like_count: 42 });
    });

    it("returns liked: false when user has not liked the track", async () => {
      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: fromMock,
      };

      fromMock.mockImplementation((table: string) => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        if (table === "track_likes") {
          builder.single = vi.fn().mockResolvedValue({
            data: null,
            error: null,
          });
        } else if (table === "tracks") {
          builder.single = vi.fn().mockResolvedValue({
            data: { like_count: 10 },
            error: null,
          });
        }

        return builder;
      });

      const request = createGetRequest(`/api/tracks/${TRACK_ID}/like`);
      const params = createRouteParams({ id: TRACK_ID });
      const response = await GET(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(data).toEqual({ liked: false, like_count: 10 });
    });
  });

  describe("POST /api/tracks/[id]/like", () => {
    it("returns 401 for unauthenticated user", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Not authenticated" },
          }),
        },
        from: vi.fn(),
      };

      const request = createPostRequest(`/api/tracks/${TRACK_ID}/like`, {});
      const params = createRouteParams({ id: TRACK_ID });
      const response = await POST(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("returns 404 when track does not exist", async () => {
      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: fromMock,
      };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "insert"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });
        builder.single = vi.fn().mockResolvedValue({
          data: null,
          error: { message: "No rows" },
        });
        return builder;
      });

      const request = createPostRequest(`/api/tracks/${TRACK_ID}/like`, {});
      const params = createRouteParams({ id: TRACK_ID });
      const response = await POST(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(404);
      expect(data).toEqual({ error: "Track not found" });
    });

    it("returns 403 when trying to like private track", async () => {
      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: fromMock,
      };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "insert"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });
        builder.single = vi.fn().mockResolvedValue({
          data: { id: TRACK_ID, privacy: "private" },
          error: null,
        });
        return builder;
      });

      const request = createPostRequest(`/api/tracks/${TRACK_ID}/like`, {});
      const params = createRouteParams({ id: TRACK_ID });
      const response = await POST(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(403);
      expect(data).toEqual({ error: "Cannot like private tracks" });
    });

    it("likes track successfully", async () => {
      const fromMock = vi.fn();
      let callCount = 0;

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: fromMock,
      };

      fromMock.mockImplementation((table: string) => {
        callCount++;
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "insert"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        if (table === "tracks" && callCount === 1) {
          // First check: track exists and is public
          builder.single = vi.fn().mockResolvedValue({
            data: { id: TRACK_ID, privacy: "public" },
            error: null,
          });
        } else if (table === "track_likes") {
          // Insert like
          builder.then = vi.fn((resolve) =>
            Promise.resolve({ data: null, error: null }).then(resolve)
          );
        } else if (table === "tracks") {
          // Get updated like count
          builder.single = vi.fn().mockResolvedValue({
            data: { like_count: 11 },
            error: null,
          });
        }

        return builder;
      });

      const request = createPostRequest(`/api/tracks/${TRACK_ID}/like`, {});
      const params = createRouteParams({ id: TRACK_ID });
      const response = await POST(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(data).toEqual({ liked: true, like_count: 11 });
    });
  });

  describe("DELETE /api/tracks/[id]/like", () => {
    it("returns 401 for unauthenticated user", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Not authenticated" },
          }),
        },
        from: vi.fn(),
      };

      const request = createDeleteRequest(`/api/tracks/${TRACK_ID}/like`);
      const params = createRouteParams({ id: TRACK_ID });
      const response = await DELETE(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("unlikes track successfully", async () => {
      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: fromMock,
      };

      fromMock.mockImplementation((table: string) => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "delete"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        if (table === "track_likes") {
          // Delete like
          builder.then = vi.fn((resolve) =>
            Promise.resolve({ data: null, error: null }).then(resolve)
          );
        } else if (table === "tracks") {
          // Get updated like count
          builder.single = vi.fn().mockResolvedValue({
            data: { like_count: 9 },
            error: null,
          });
        }

        return builder;
      });

      const request = createDeleteRequest(`/api/tracks/${TRACK_ID}/like`);
      const params = createRouteParams({ id: TRACK_ID });
      const response = await DELETE(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(data).toEqual({ liked: false, like_count: 9 });
    });

    it("returns 500 when delete fails", async () => {
      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: fromMock,
      };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "delete"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });
        builder.then = vi.fn((resolve) =>
          Promise.resolve({
            data: null,
            error: { message: "Database error" },
          }).then(resolve)
        );
        return builder;
      });

      const request = createDeleteRequest(`/api/tracks/${TRACK_ID}/like`);
      const params = createRouteParams({ id: TRACK_ID });
      const response = await DELETE(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(500);
      expect(data).toEqual({ error: "Failed to unlike track" });
    });
  });
});
