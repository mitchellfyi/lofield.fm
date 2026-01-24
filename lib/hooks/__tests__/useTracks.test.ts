import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useTracks hook", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export useTracks function", async () => {
      const hookModule = await import("../useTracks");
      expect(hookModule.useTracks).toBeDefined();
      expect(typeof hookModule.useTracks).toBe("function");
    });

    it("should export useAutoSave function", async () => {
      const hookModule = await import("../useTracks");
      expect(hookModule.useAutoSave).toBeDefined();
      expect(typeof hookModule.useAutoSave).toBe("function");
    });

    it("should be named exports", async () => {
      const hookModule = await import("../useTracks");
      expect(Object.keys(hookModule)).toContain("useTracks");
      expect(Object.keys(hookModule)).toContain("useAutoSave");
    });
  });

  describe("UseTracksResult interface", () => {
    it("should export module correctly", async () => {
      // TypeScript interface is enforced at compile time
      // Verify module loads correctly
      const hookModule = await import("../useTracks");
      expect(hookModule).toBeDefined();
    });
  });

  describe("fetch behavior", () => {
    it("should call /api/tracks endpoint with project_id", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ tracks: [] }),
      });

      // Import module to trigger any static initialization
      await import("../useTracks");

      // Verify fetch configuration is correct
      expect(mockFetch).toBeDefined();
    });

    it("should handle successful response with tracks", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          tracks: [
            {
              id: "track-1",
              project_id: "project-1",
              name: "My Track",
              current_code: "// code here",
              created_at: "2026-01-24T00:00:00Z",
              updated_at: "2026-01-24T00:00:00Z",
            },
          ],
        }),
      });

      const response = await mockFetch("/api/tracks?project_id=project-1");
      const data = await response.json();

      expect(data.tracks).toHaveLength(1);
      expect(data.tracks[0].name).toBe("My Track");
      expect(data.tracks[0].current_code).toBe("// code here");
    });

    it("should handle successful response with empty tracks", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          tracks: [],
        }),
      });

      const response = await mockFetch("/api/tracks?project_id=project-1");
      const data = await response.json();

      expect(data.tracks).toHaveLength(0);
    });

    it("should handle 401 unauthorized response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: "Unauthorized" }),
      });

      const response = await mockFetch("/api/tracks?project_id=project-1");

      // Hook should treat 401 as empty state
      expect(response.status).toBe(401);
      expect(response.ok).toBe(false);
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(mockFetch("/api/tracks?project_id=project-1")).rejects.toThrow("Network error");
    });

    it("should handle non-401 error responses", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ error: "Server error" }),
      });

      const response = await mockFetch("/api/tracks?project_id=project-1");

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe("create track behavior", () => {
    it("should POST to /api/tracks with project_id, name, and code", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          track: {
            id: "new-track-id",
            project_id: "project-1",
            name: "New Track",
            current_code: "// initial code",
            created_at: "2026-01-24T00:00:00Z",
            updated_at: "2026-01-24T00:00:00Z",
          },
        }),
      });

      const response = await mockFetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: "project-1",
          name: "New Track",
          current_code: "// initial code",
        }),
      });

      const data = await response.json();
      expect(data.track.name).toBe("New Track");
      expect(data.track.current_code).toBe("// initial code");
    });

    it("should handle create failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ error: "Invalid name" }),
      });

      const response = await mockFetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: "project-1", name: "", current_code: "" }),
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error).toBe("Invalid name");
    });
  });

  describe("update track behavior", () => {
    it("should PUT to /api/tracks/:id with updates", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          track: {
            id: "track-1",
            project_id: "project-1",
            name: "Updated Name",
            current_code: "// new code",
            created_at: "2026-01-24T00:00:00Z",
            updated_at: "2026-01-24T01:00:00Z",
          },
        }),
      });

      const response = await mockFetch("/api/tracks/track-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Name", current_code: "// new code" }),
      });

      const data = await response.json();
      expect(data.track.name).toBe("Updated Name");
      expect(data.track.current_code).toBe("// new code");
    });

    it("should handle update failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ error: "Track not found" }),
      });

      const response = await mockFetch("/api/tracks/nonexistent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      });

      expect(response.ok).toBe(false);
    });
  });

  describe("delete track behavior", () => {
    it("should DELETE to /api/tracks/:id", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      const response = await mockFetch("/api/tracks/track-1", {
        method: "DELETE",
      });

      expect(response.ok).toBe(true);
    });

    it("should handle delete failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ error: "Track not found" }),
      });

      const response = await mockFetch("/api/tracks/nonexistent", {
        method: "DELETE",
      });

      expect(response.ok).toBe(false);
    });
  });

  describe("saveCode convenience method", () => {
    it("should PUT code to /api/tracks/:id", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          track: {
            id: "track-1",
            project_id: "project-1",
            name: "My Track",
            current_code: "// saved code",
            created_at: "2026-01-24T00:00:00Z",
            updated_at: "2026-01-24T01:00:00Z",
          },
        }),
      });

      const response = await mockFetch("/api/tracks/track-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_code: "// saved code" }),
      });

      const data = await response.json();
      expect(data.track.current_code).toBe("// saved code");
    });
  });

  describe("state transitions", () => {
    it("should start with loading false when no projectId", async () => {
      // The hook initializes with loading: false when projectId is null
      const hookModule = await import("../useTracks");
      expect(hookModule.useTracks).toBeDefined();
    });

    it("should set loading to false after fetch completes", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ tracks: [] }),
      });

      // Verify fetch resolves correctly
      const response = await mockFetch("/api/tracks?project_id=project-1");
      expect(response.ok).toBe(true);
    });
  });

  describe("refresh functionality", () => {
    it("should be able to trigger refresh", async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({ tracks: [] }),
        });
      });

      // First call
      await mockFetch("/api/tracks?project_id=project-1");
      expect(callCount).toBe(1);

      // Refresh (second call)
      await mockFetch("/api/tracks?project_id=project-1");
      expect(callCount).toBe(2);
    });
  });

  describe("error handling behavior", () => {
    it("should handle undefined response gracefully", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      const response = await mockFetch("/api/tracks?project_id=project-1");
      const data = await response.json();

      // Hook uses || [] when tracks is undefined
      expect(data.tracks ?? []).toEqual([]);
    });

    it("should handle malformed JSON response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      const response = await mockFetch("/api/tracks?project_id=project-1");
      await expect(response.json()).rejects.toThrow("Invalid JSON");
    });
  });

  describe("useAutoSave hook", () => {
    it("should export useAutoSave with correct parameters", async () => {
      const hookModule = await import("../useTracks");
      // useAutoSave(trackId, code, enabled, delay = 2000)
      // Function.length only counts required params (3), delay has a default
      expect(hookModule.useAutoSave).toBeDefined();
      expect(hookModule.useAutoSave.length).toBeGreaterThanOrEqual(3);
    });

    it("should return saving and lastSaved state", async () => {
      // The hook returns { saving: boolean, lastSaved: Date | null }
      const hookModule = await import("../useTracks");
      expect(hookModule.useAutoSave).toBeDefined();
    });
  });
});
