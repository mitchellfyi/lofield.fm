import { describe, it, expect, vi, beforeEach } from "vitest";
import { MOCK_USER } from "@/lib/test-utils/supabase-mock";
import { createGetRequest, createPostRequest, parseJsonResponse } from "@/lib/test-utils/api-route";

// Mock the Supabase clients
let mockClient: Record<string, unknown>;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockClient)),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => Promise.resolve(mockClient)),
}));

// Import route handlers after mocking
import { GET, POST } from "../route";

// Valid v4 UUID format required by zod schema
const PROJECT_ID = "550e8400-e29b-41d4-a716-446655440000";

const mockTracks = [
  {
    id: "track-1",
    project_id: PROJECT_ID,
    user_id: MOCK_USER.id,
    name: "Track One",
    current_code: "// code 1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "track-2",
    project_id: PROJECT_ID,
    user_id: MOCK_USER.id,
    name: "Track Two",
    current_code: "// code 2",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
];

describe("/api/tracks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/tracks", () => {
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

      const request = createGetRequest("/api/tracks", { project_id: PROJECT_ID });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("returns 400 when project_id is missing", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      const request = createGetRequest("/api/tracks");
      const response = await GET(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toEqual({ error: "project_id is required" });
    });

    it("returns tracks for authenticated user", async () => {
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
        const chainMethods = ["select", "eq", "order"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        if (table === "projects") {
          // getProject check
          builder.single = vi.fn().mockResolvedValue({
            data: { id: PROJECT_ID, user_id: MOCK_USER.id },
            error: null,
          });
        } else if (table === "tracks") {
          // getTracks query
          builder.then = vi.fn((resolve) =>
            Promise.resolve({ data: mockTracks, error: null }).then(resolve)
          );
        }

        return builder;
      });

      const request = createGetRequest("/api/tracks", { project_id: PROJECT_ID });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse<{ tracks: unknown[] }>(response);

      expect(status).toBe(200);
      expect(data.tracks).toHaveLength(2);
      expect(data.tracks[0]).toMatchObject({
        id: "track-1",
        name: "Track One",
      });
    });

    it("returns 500 when database error occurs", async () => {
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
        const chainMethods = ["select", "eq", "order"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        if (table === "projects") {
          // getProject check passes
          builder.single = vi.fn().mockResolvedValue({
            data: { id: PROJECT_ID, user_id: MOCK_USER.id },
            error: null,
          });
        } else if (table === "tracks") {
          // getTracks fails
          builder.then = vi.fn((resolve) =>
            Promise.resolve({
              data: null,
              error: { message: "Database error" },
            }).then(resolve)
          );
        }

        return builder;
      });

      const request = createGetRequest("/api/tracks", { project_id: PROJECT_ID });
      const response = await GET(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(500);
      expect(data).toMatchObject({ error: expect.stringContaining("Failed to fetch tracks") });
    });
  });

  describe("POST /api/tracks", () => {
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

      const request = createPostRequest("/api/tracks", {
        project_id: PROJECT_ID,
        name: "New Track",
        current_code: "// new code",
      });
      const response = await POST(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("returns 400 when project_id is missing", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      const request = createPostRequest("/api/tracks", {
        name: "New Track",
        current_code: "// new code",
      });
      const response = await POST(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toMatchObject({ error: expect.stringContaining("Invalid") });
    });

    it("returns 400 when project_id is not a valid UUID", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      const request = createPostRequest("/api/tracks", {
        project_id: "not-a-uuid",
        name: "New Track",
        current_code: "// new code",
      });
      const response = await POST(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toMatchObject({ error: expect.stringContaining("Invalid project ID") });
    });

    it("returns 400 when track name is empty", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      // Use valid v4 UUID for project_id so it passes UUID validation and fails on name
      const request = createPostRequest("/api/tracks", {
        project_id: "550e8400-e29b-41d4-a716-446655440001",
        name: "",
        current_code: "// new code",
      });
      const response = await POST(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toMatchObject({ error: expect.stringContaining("Track name is required") });
    });

    it("creates track successfully", async () => {
      const fromMock = vi.fn();
      const newTrack = {
        id: "new-track-id",
        project_id: PROJECT_ID,
        user_id: MOCK_USER.id,
        name: "New Track",
        current_code: "// new code",
        created_at: "2024-01-03T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };

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
        const chainMethods = ["select", "eq", "insert", "order"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        if (table === "projects") {
          // Check if project exists and belongs to user
          builder.single = vi.fn().mockResolvedValue({
            data: { id: PROJECT_ID, user_id: MOCK_USER.id },
            error: null,
          });
        } else if (table === "tracks") {
          // For insert query
          builder.single = vi.fn().mockResolvedValue({
            data: newTrack,
            error: null,
          });
        }

        return builder;
      });

      const request = createPostRequest("/api/tracks", {
        project_id: PROJECT_ID,
        name: "New Track",
        current_code: "// new code",
      });
      const response = await POST(request);
      const { status, data } = await parseJsonResponse<{ track: typeof newTrack }>(response);

      expect(status).toBe(201);
      expect(data.track).toMatchObject({
        id: "new-track-id",
        name: "New Track",
      });
    });

    it("returns 500 when creation fails", async () => {
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
        const chainMethods = ["select", "eq", "insert", "order"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        if (table === "projects") {
          builder.single = vi.fn().mockResolvedValue({
            data: { id: PROJECT_ID, user_id: MOCK_USER.id },
            error: null,
          });
        } else if (table === "tracks") {
          builder.single = vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Insert failed" },
          });
        }

        return builder;
      });

      const request = createPostRequest("/api/tracks", {
        project_id: PROJECT_ID,
        name: "New Track",
        current_code: "// new code",
      });
      const response = await POST(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(500);
      expect(data).toMatchObject({ error: expect.stringContaining("create track") });
    });
  });
});
