import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPostRequest, parseJsonResponse } from "@/lib/test-utils/api-route";

// Mock next/headers
const mockHeaders = new Map<string, string>();

vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: (name: string) => mockHeaders.get(name) ?? null,
    })
  ),
}));

// Mock the Supabase service client
let mockClient: Record<string, unknown>;

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => Promise.resolve(mockClient)),
}));

// Import route handler after mocking
import { POST } from "../route";

describe("/api/explore/play", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.clear();
    mockHeaders.set("x-forwarded-for", "192.168.1.1");
    mockHeaders.set("user-agent", "TestBrowser/1.0");
  });

  describe("POST /api/explore/play", () => {
    it("returns 400 when trackId is missing", async () => {
      const request = createPostRequest("/api/explore/play", {});
      const response = await POST(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toEqual({ error: "Track ID is required" });
    });

    it("returns 400 when trackId is not a string", async () => {
      const request = createPostRequest("/api/explore/play", { trackId: 123 });
      const response = await POST(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(400);
      expect(data).toEqual({ error: "Track ID is required" });
    });

    it("increments play count for valid track", async () => {
      const fromMock = vi.fn();

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "update"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.single = vi.fn().mockResolvedValue({
          data: { plays: 10 },
          error: null,
        });

        builder.then = vi.fn((resolve) => {
          return Promise.resolve({ data: null, error: null }).then(resolve);
        });

        return builder;
      });

      // Use unique IP to avoid rate limiting from previous tests
      mockHeaders.set("x-forwarded-for", `192.168.1.${Math.floor(Math.random() * 255)}`);

      const request = createPostRequest("/api/explore/play", {
        trackId: `unique-track-${Date.now()}`,
      });
      const response = await POST(request);
      const { status, data } = await parseJsonResponse<{
        success: boolean;
        counted: boolean;
      }>(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.counted).toBe(true);
    });

    it("handles non-existent track gracefully", async () => {
      const fromMock = vi.fn();

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "update"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.single = vi.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        return builder;
      });

      // Use unique IP
      mockHeaders.set("x-forwarded-for", `10.0.0.${Math.floor(Math.random() * 255)}`);

      const request = createPostRequest("/api/explore/play", {
        trackId: `non-existent-${Date.now()}`,
      });
      const response = await POST(request);
      const { status, data } = await parseJsonResponse<{
        success: boolean;
        counted: boolean;
      }>(response);

      // Should still return success (silently skip non-existent tracks)
      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("uses x-real-ip header when x-forwarded-for is not available", async () => {
      const fromMock = vi.fn();

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "update"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.single = vi.fn().mockResolvedValue({
          data: { plays: 5 },
          error: null,
        });

        builder.then = vi.fn((resolve) => {
          return Promise.resolve({ data: null, error: null }).then(resolve);
        });

        return builder;
      });

      mockHeaders.clear();
      mockHeaders.set("x-real-ip", `172.16.0.${Math.floor(Math.random() * 255)}`);
      mockHeaders.set("user-agent", "AnotherBrowser/2.0");

      const request = createPostRequest("/api/explore/play", {
        trackId: `track-${Date.now()}`,
      });
      const response = await POST(request);
      const { status, data } = await parseJsonResponse<{
        success: boolean;
        counted: boolean;
      }>(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("returns 500 when database error occurs", async () => {
      const fromMock = vi.fn();

      mockClient = { from: fromMock };

      fromMock.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      mockHeaders.set("x-forwarded-for", `192.168.2.${Math.floor(Math.random() * 255)}`);

      const request = createPostRequest("/api/explore/play", {
        trackId: `track-error-${Date.now()}`,
      });
      const response = await POST(request);
      const { status, data } = await parseJsonResponse(response);

      expect(status).toBe(500);
      expect(data).toEqual({ error: "Internal server error" });
    });
  });
});
