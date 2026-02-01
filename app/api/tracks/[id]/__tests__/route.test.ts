import { describe, it, expect, vi, beforeEach } from "vitest";
import { MOCK_USER } from "@/lib/test-utils/supabase-mock";
import {
  createGetRequest,
  createMockRequest,
  createDeleteRequest,
  createRouteParams,
  parseJsonResponse,
} from "@/lib/test-utils/api-route";

// Mock the Supabase clients
let mockClient: Record<string, unknown>;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockClient)),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => Promise.resolve(mockClient)),
}));

// Import route handlers after mocking
import { GET, PUT, DELETE } from "../route";

// Valid v4 UUID format
const TRACK_ID = "550e8400-e29b-41d4-a716-446655440001";

describe("/api/tracks/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/tracks/[id]", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      const request = createGetRequest(`/api/tracks/${TRACK_ID}`);
      const params = createRouteParams({ id: TRACK_ID });
      const response = await GET(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("returns 404 when track is not found", async () => {
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
        const chainMethods = ["select", "eq"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });
        builder.single = vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116" }, // Not found
        });
        return builder;
      });

      const request = createGetRequest(`/api/tracks/${TRACK_ID}`);
      const params = createRouteParams({ id: TRACK_ID });
      const response = await GET(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(404);
      expect(data).toEqual({ error: "Track not found" });
    });
  });

  describe("PUT /api/tracks/[id]", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      const request = createMockRequest(`http://localhost:3000/api/tracks/${TRACK_ID}`, {
        method: "PUT",
        body: { name: "Updated Track" },
      });
      const params = createRouteParams({ id: TRACK_ID });
      const response = await PUT(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("returns 400 when no fields to update", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      const request = createMockRequest(`http://localhost:3000/api/tracks/${TRACK_ID}`, {
        method: "PUT",
        body: {},
      });
      const params = createRouteParams({ id: TRACK_ID });
      const response = await PUT(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toEqual({ error: "No fields to update" });
    });

    it("returns 400 for invalid name", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      const request = createMockRequest(`http://localhost:3000/api/tracks/${TRACK_ID}`, {
        method: "PUT",
        body: { name: "" }, // Empty name
      });
      const params = createRouteParams({ id: TRACK_ID });
      const response = await PUT(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toMatchObject({ error: expect.stringContaining("Track name is required") });
    });
  });

  describe("DELETE /api/tracks/[id]", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      const request = createDeleteRequest(`/api/tracks/${TRACK_ID}`);
      const params = createRouteParams({ id: TRACK_ID });
      const response = await DELETE(request, params);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });
  });
});
