import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockSupabaseClient,
  MOCK_USER,
  type MockSupabaseClient,
} from "@/lib/test-utils/supabase-mock";
import { createPatchRequest, parseJsonResponse } from "@/lib/test-utils/api-route";

// Mock the Supabase server client
let mockClient: MockSupabaseClient;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockClient)),
}));

// Import route handlers after mocking
import { GET, PATCH } from "../route";

describe("/api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/profile", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockClient = createMockSupabaseClient({
        auth: { user: null },
      });

      const response = await GET();
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("returns profile data for authenticated user", async () => {
      const mockProfile = {
        id: MOCK_USER.id,
        username: "testuser",
        display_name: "Test User",
        bio: "Hello world",
        avatar_url: null,
        created_at: "2024-01-01T00:00:00Z",
      };

      mockClient = createMockSupabaseClient({
        auth: { user: MOCK_USER },
        tables: {
          profiles: {
            singleResponse: { data: mockProfile, error: null },
          },
        },
      });

      const response = await GET();
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(data).toEqual(mockProfile);
    });

    it("returns 500 when database error occurs", async () => {
      mockClient = createMockSupabaseClient({
        auth: { user: MOCK_USER },
        tables: {
          profiles: {
            singleResponse: { data: null, error: { message: "Database error" } },
          },
        },
      });

      const response = await GET();
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch profile" });
    });
  });

  describe("PATCH /api/profile", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockClient = createMockSupabaseClient({
        auth: { user: null },
      });

      const request = createPatchRequest("/api/profile", { username: "newuser" });
      const response = await PATCH(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("updates profile successfully without username change", async () => {
      const updatedProfile = {
        id: MOCK_USER.id,
        username: "existinguser",
        display_name: "New Display Name",
        bio: "Updated bio",
        avatar_url: null,
        created_at: "2024-01-01T00:00:00Z",
      };

      mockClient = createMockSupabaseClient({
        auth: { user: MOCK_USER },
        tables: {
          profiles: {
            singleResponse: { data: updatedProfile, error: null },
          },
        },
      });

      const request = createPatchRequest("/api/profile", {
        display_name: "New Display Name",
        bio: "Updated bio",
      });
      const response = await PATCH(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(data).toEqual(updatedProfile);
    });

    it("updates profile with username successfully", async () => {
      const updatedProfile = {
        id: MOCK_USER.id,
        username: "newuser",
        display_name: "Test User",
        bio: "Test bio",
        avatar_url: null,
        created_at: "2024-01-01T00:00:00Z",
      };

      // Need to handle two queries: username check and update
      const fromMock = vi.fn();
      let callCount = 0;

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
        callCount++;
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "update", "eq", "neq"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        if (callCount === 1) {
          // Username check - not taken
          builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
        } else {
          // Update call - success
          builder.single = vi.fn().mockResolvedValue({
            data: updatedProfile,
            error: null,
          });
        }

        return builder;
      });

      const request = createPatchRequest("/api/profile", { username: "newuser" });
      const response = await PATCH(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(data).toEqual(updatedProfile);
    });

    it("returns 400 for invalid username - too short", async () => {
      mockClient = createMockSupabaseClient({
        auth: { user: MOCK_USER },
      });

      const request = createPatchRequest("/api/profile", { username: "ab" });
      const response = await PATCH(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toEqual({ error: "Username must be at least 3 characters" });
    });

    it("returns 400 for invalid username - too long", async () => {
      mockClient = createMockSupabaseClient({
        auth: { user: MOCK_USER },
      });

      const request = createPatchRequest("/api/profile", {
        username: "a".repeat(31),
      });
      const response = await PATCH(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toEqual({ error: "Username must be at most 30 characters" });
    });

    it("returns 400 for invalid username - invalid characters", async () => {
      mockClient = createMockSupabaseClient({
        auth: { user: MOCK_USER },
      });

      const request = createPatchRequest("/api/profile", {
        username: "user@name",
      });
      const response = await PATCH(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toEqual({
        error: "Username can only contain letters, numbers, and underscores",
      });
    });

    it("returns 400 for reserved username", async () => {
      mockClient = createMockSupabaseClient({
        auth: { user: MOCK_USER },
      });

      const request = createPatchRequest("/api/profile", { username: "admin" });
      const response = await PATCH(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toEqual({ error: "This username is reserved" });
    });

    it("returns 400 when username is already taken", async () => {
      mockClient = createMockSupabaseClient({
        auth: { user: MOCK_USER },
        tables: {
          profiles: {
            singleResponse: {
              data: { id: "other-user-id" },
              error: null,
            },
          },
        },
      });

      const request = createPatchRequest("/api/profile", { username: "takenuser" });
      const response = await PATCH(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toEqual({ error: "Username is already taken" });
    });

    it("returns 400 for bio that is too long", async () => {
      mockClient = createMockSupabaseClient({
        auth: { user: MOCK_USER },
      });

      const request = createPatchRequest("/api/profile", {
        bio: "a".repeat(501),
      });
      const response = await PATCH(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toEqual({ error: "Bio must be at most 500 characters" });
    });

    it("returns 500 when update fails", async () => {
      // First call for username check returns null (username available)
      // Second call for update returns error
      const fromMock = vi.fn();
      let callCount = 0;

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
        callCount++;
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "update", "eq", "neq"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        if (callCount === 1) {
          // Username check - not taken
          builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
        } else {
          // Update call - error
          builder.single = vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Update failed" },
          });
        }

        return builder;
      });

      const request = createPatchRequest("/api/profile", { username: "validuser" });
      const response = await PATCH(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(500);
      expect(data).toEqual({ error: "Failed to update profile" });
    });
  });
});
