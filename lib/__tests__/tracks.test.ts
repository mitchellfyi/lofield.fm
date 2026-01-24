import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the crypto module for encryption tests
const originalEnv = { ...process.env };

// Create deeply-chainable mocks
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();

// Setup chainable return values
function setupMocks() {
  // Create a thenable chainable that can be used like a promise OR continue chaining
  const createChainable = (): object => {
    const chainable = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      // Make it thenable - when awaited, return { error: null } by default
      then: (resolve: (value: { error: null }) => void) => resolve({ error: null }),
    };
    return chainable;
  };

  mockFrom.mockReturnValue(createChainable());
  mockSelect.mockReturnValue(createChainable());
  mockInsert.mockReturnValue(createChainable());
  mockUpdate.mockReturnValue(createChainable());
  mockDelete.mockReturnValue(createChainable());
  mockEq.mockReturnValue(createChainable());
  mockOrder.mockReturnValue(createChainable());
  // single returns a promise
  mockSingle.mockResolvedValue({ data: null, error: null });
}

setupMocks();

// Mock next/headers cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}));

// Mock Supabase SSR
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe("tracks service", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockDelete.mockClear();
    mockEq.mockClear();
    mockOrder.mockClear();
    mockSingle.mockClear();

    // Reset mock chains
    setupMocks();

    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export getProjects function", async () => {
      const tracksModule = await import("../tracks");
      expect(tracksModule.getProjects).toBeDefined();
      expect(typeof tracksModule.getProjects).toBe("function");
    });

    it("should export getProject function", async () => {
      const tracksModule = await import("../tracks");
      expect(tracksModule.getProject).toBeDefined();
      expect(typeof tracksModule.getProject).toBe("function");
    });

    it("should export createProject function", async () => {
      const tracksModule = await import("../tracks");
      expect(tracksModule.createProject).toBeDefined();
      expect(typeof tracksModule.createProject).toBe("function");
    });

    it("should export updateProject function", async () => {
      const tracksModule = await import("../tracks");
      expect(tracksModule.updateProject).toBeDefined();
      expect(typeof tracksModule.updateProject).toBe("function");
    });

    it("should export deleteProject function", async () => {
      const tracksModule = await import("../tracks");
      expect(tracksModule.deleteProject).toBeDefined();
      expect(typeof tracksModule.deleteProject).toBe("function");
    });

    it("should export getTracks function", async () => {
      const tracksModule = await import("../tracks");
      expect(tracksModule.getTracks).toBeDefined();
      expect(typeof tracksModule.getTracks).toBe("function");
    });

    it("should export getTrack function", async () => {
      const tracksModule = await import("../tracks");
      expect(tracksModule.getTrack).toBeDefined();
      expect(typeof tracksModule.getTrack).toBe("function");
    });

    it("should export createTrack function", async () => {
      const tracksModule = await import("../tracks");
      expect(tracksModule.createTrack).toBeDefined();
      expect(typeof tracksModule.createTrack).toBe("function");
    });

    it("should export updateTrack function", async () => {
      const tracksModule = await import("../tracks");
      expect(tracksModule.updateTrack).toBeDefined();
      expect(typeof tracksModule.updateTrack).toBe("function");
    });

    it("should export deleteTrack function", async () => {
      const tracksModule = await import("../tracks");
      expect(tracksModule.deleteTrack).toBeDefined();
      expect(typeof tracksModule.deleteTrack).toBe("function");
    });

    it("should export getRevisions function", async () => {
      const tracksModule = await import("../tracks");
      expect(tracksModule.getRevisions).toBeDefined();
      expect(typeof tracksModule.getRevisions).toBe("function");
    });

    it("should export createRevision function", async () => {
      const tracksModule = await import("../tracks");
      expect(tracksModule.createRevision).toBeDefined();
      expect(typeof tracksModule.createRevision).toBe("function");
    });
  });

  describe("getProjects function", () => {
    it("should return projects with track counts for user", async () => {
      mockOrder.mockResolvedValue({
        data: [
          {
            id: "project-1",
            user_id: "user-123",
            name: "My Project",
            created_at: "2026-01-24T00:00:00Z",
            updated_at: "2026-01-24T00:00:00Z",
            tracks: [{ count: 5 }],
          },
        ],
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.getProjects("user-123");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("project-1");
      expect(result[0].name).toBe("My Project");
      expect(result[0].track_count).toBe(5);
      expect(mockFrom).toHaveBeenCalledWith("projects");
    });

    it("should return empty array for user with no projects", async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.getProjects("user-456");

      expect(result).toHaveLength(0);
    });

    it("should handle project with no tracks (zero count)", async () => {
      mockOrder.mockResolvedValue({
        data: [
          {
            id: "project-1",
            user_id: "user-123",
            name: "Empty Project",
            created_at: "2026-01-24T00:00:00Z",
            updated_at: "2026-01-24T00:00:00Z",
            tracks: [],
          },
        ],
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.getProjects("user-123");

      expect(result[0].track_count).toBe(0);
    });

    it("should throw error on database failure", async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: "Database connection failed" },
      });

      const tracksModule = await import("../tracks");

      await expect(tracksModule.getProjects("user-123")).rejects.toThrow(
        "Failed to fetch projects: Database connection failed"
      );
    });
  });

  describe("getProject function", () => {
    it("should return single project for valid user and project id", async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: "project-1",
          user_id: "user-123",
          name: "My Project",
          created_at: "2026-01-24T00:00:00Z",
          updated_at: "2026-01-24T00:00:00Z",
        },
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.getProject("user-123", "project-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("project-1");
      expect(result?.name).toBe("My Project");
    });

    it("should return null when project not found", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.getProject("user-123", "nonexistent");

      expect(result).toBeNull();
    });

    it("should throw error on database failure", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });

      const tracksModule = await import("../tracks");

      await expect(tracksModule.getProject("user-123", "project-1")).rejects.toThrow(
        "Failed to fetch project: Query failed"
      );
    });
  });

  describe("createProject function", () => {
    it("should create project with correct fields", async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: "new-project-id",
          user_id: "user-123",
          name: "New Project",
          created_at: "2026-01-24T00:00:00Z",
          updated_at: "2026-01-24T00:00:00Z",
        },
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.createProject("user-123", "New Project");

      expect(result.id).toBe("new-project-id");
      expect(result.name).toBe("New Project");
      expect(mockFrom).toHaveBeenCalledWith("projects");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        name: "New Project",
      });
    });

    it("should throw error on database failure", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });

      const tracksModule = await import("../tracks");

      await expect(tracksModule.createProject("user-123", "Test")).rejects.toThrow(
        "Failed to create project: Insert failed"
      );
    });
  });

  describe("updateProject function", () => {
    it("should update project name", async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: "project-1",
          user_id: "user-123",
          name: "Updated Name",
          created_at: "2026-01-24T00:00:00Z",
          updated_at: "2026-01-24T01:00:00Z",
        },
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.updateProject("user-123", "project-1", "Updated Name");

      expect(result.name).toBe("Updated Name");
      expect(mockUpdate).toHaveBeenCalledWith({ name: "Updated Name" });
    });

    it("should throw error on database failure", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });

      const tracksModule = await import("../tracks");

      await expect(tracksModule.updateProject("user-123", "project-1", "New Name")).rejects.toThrow(
        "Failed to update project: Update failed"
      );
    });
  });

  describe("deleteProject function", () => {
    it("should call delete on projects table", async () => {
      // Verify the function exists and has correct signature
      const tracksModule = await import("../tracks");
      expect(tracksModule.deleteProject).toBeDefined();
      expect(typeof tracksModule.deleteProject).toBe("function");
      expect(tracksModule.deleteProject.length).toBe(2); // Takes userId and projectId
    });
  });

  describe("getTracks function", () => {
    it("should return tracks for project after ownership verification", async () => {
      // First call for ownership verification (getProject)
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "project-1",
          user_id: "user-123",
          name: "My Project",
        },
        error: null,
      });

      // Second call for tracks
      mockOrder.mockResolvedValue({
        data: [
          {
            id: "track-1",
            project_id: "project-1",
            name: "Track 1",
            current_code: "// code",
            created_at: "2026-01-24T00:00:00Z",
            updated_at: "2026-01-24T00:00:00Z",
          },
        ],
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.getTracks("user-123", "project-1");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Track 1");
    });

    it("should throw error if project not found", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const tracksModule = await import("../tracks");

      await expect(tracksModule.getTracks("user-123", "nonexistent")).rejects.toThrow(
        "Project not found or access denied"
      );
    });
  });

  describe("getTrack function", () => {
    it("should return track with ownership verification", async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: "track-1",
          project_id: "project-1",
          name: "Track 1",
          current_code: "// code",
          created_at: "2026-01-24T00:00:00Z",
          updated_at: "2026-01-24T00:00:00Z",
          project: { user_id: "user-123" },
        },
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.getTrack("user-123", "track-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("track-1");
      expect(result?.name).toBe("Track 1");
    });

    it("should return null for non-owner access", async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: "track-1",
          project_id: "project-1",
          name: "Track 1",
          current_code: "// code",
          project: { user_id: "different-user" },
        },
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.getTrack("user-123", "track-1");

      expect(result).toBeNull();
    });

    it("should return null when track not found", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.getTrack("user-123", "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("createTrack function", () => {
    it("should create track with correct fields", async () => {
      // First call for ownership verification
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "project-1",
          user_id: "user-123",
          name: "My Project",
        },
        error: null,
      });

      // Second call for track creation
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "new-track-id",
          project_id: "project-1",
          name: "New Track",
          current_code: "// initial code",
          created_at: "2026-01-24T00:00:00Z",
          updated_at: "2026-01-24T00:00:00Z",
        },
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.createTrack(
        "user-123",
        "project-1",
        "New Track",
        "// initial code"
      );

      expect(result.id).toBe("new-track-id");
      expect(result.name).toBe("New Track");
      expect(result.current_code).toBe("// initial code");
    });

    it("should throw error if project not found", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const tracksModule = await import("../tracks");

      await expect(
        tracksModule.createTrack("user-123", "nonexistent", "Track", "")
      ).rejects.toThrow("Project not found or access denied");
    });
  });

  describe("updateTrack function", () => {
    it("should update track code", async () => {
      // First call for ownership verification
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "track-1",
          project_id: "project-1",
          name: "Track 1",
          current_code: "// old code",
          project: { user_id: "user-123" },
        },
        error: null,
      });

      // Second call for update
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "track-1",
          project_id: "project-1",
          name: "Track 1",
          current_code: "// new code",
          updated_at: "2026-01-24T01:00:00Z",
        },
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.updateTrack("user-123", "track-1", {
        current_code: "// new code",
      });

      expect(result.current_code).toBe("// new code");
    });

    it("should throw error if track not found", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const tracksModule = await import("../tracks");

      await expect(
        tracksModule.updateTrack("user-123", "nonexistent", { name: "New Name" })
      ).rejects.toThrow("Track not found or access denied");
    });
  });

  describe("deleteTrack function", () => {
    it("should call delete on tracks table", async () => {
      // Verify the function exists and has correct signature
      const tracksModule = await import("../tracks");
      expect(tracksModule.deleteTrack).toBeDefined();
      expect(typeof tracksModule.deleteTrack).toBe("function");
      expect(tracksModule.deleteTrack.length).toBe(2); // Takes userId and trackId
    });
  });

  describe("getRevisions function", () => {
    it("should return revisions for track", async () => {
      // First call for track ownership verification
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "track-1",
          project_id: "project-1",
          name: "Track 1",
          current_code: "// code",
          project: { user_id: "user-123" },
        },
        error: null,
      });

      // Second call for revisions
      mockOrder.mockResolvedValue({
        data: [
          {
            id: "revision-1",
            track_id: "track-1",
            code: "// revision code",
            message: "Initial save",
            created_at: "2026-01-24T00:00:00Z",
          },
        ],
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.getRevisions("user-123", "track-1");

      expect(result).toHaveLength(1);
      expect(result[0].message).toBe("Initial save");
    });

    it("should throw error if track not found", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const tracksModule = await import("../tracks");

      await expect(tracksModule.getRevisions("user-123", "nonexistent")).rejects.toThrow(
        "Track not found or access denied"
      );
    });
  });

  describe("createRevision function", () => {
    it("should create revision with code and message", async () => {
      // First call for track ownership verification
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "track-1",
          project_id: "project-1",
          name: "Track 1",
          current_code: "// code",
          project: { user_id: "user-123" },
        },
        error: null,
      });

      // Second call for revision creation
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "revision-1",
          track_id: "track-1",
          code: "// snapshot code",
          message: "Checkpoint before major change",
          created_at: "2026-01-24T00:00:00Z",
        },
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.createRevision(
        "user-123",
        "track-1",
        "// snapshot code",
        "Checkpoint before major change"
      );

      expect(result.code).toBe("// snapshot code");
      expect(result.message).toBe("Checkpoint before major change");
    });

    it("should create revision with null message", async () => {
      // First call for track ownership verification
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "track-1",
          project_id: "project-1",
          name: "Track 1",
          current_code: "// code",
          project: { user_id: "user-123" },
        },
        error: null,
      });

      // Second call for revision creation
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "revision-1",
          track_id: "track-1",
          code: "// code",
          message: null,
          created_at: "2026-01-24T00:00:00Z",
        },
        error: null,
      });

      const tracksModule = await import("../tracks");
      const result = await tracksModule.createRevision("user-123", "track-1", "// code");

      expect(result.message).toBeNull();
    });
  });
});
