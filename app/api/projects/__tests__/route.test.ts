import { describe, it, expect, vi, beforeEach } from "vitest";
import { MOCK_USER } from "@/lib/test-utils/supabase-mock";
import { createPostRequest } from "@/lib/test-utils/api-route";

// Mock the Supabase client
let mockSupabaseClient: {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
  };
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock tracks module functions
vi.mock("@/lib/tracks", () => ({
  getProjects: vi.fn(),
  createProject: vi.fn(),
}));

// Import route handlers after mocking
import { GET, POST } from "../route";
import { getProjects, createProject } from "@/lib/tracks";

// Get mocked functions
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

const MOCK_PROJECTS = [
  {
    id: "project-1",
    user_id: MOCK_USER.id,
    name: "Project One",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    track_count: 5,
  },
  {
    id: "project-2",
    user_id: MOCK_USER.id,
    name: "Project Two",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    track_count: 3,
  },
];

describe("/api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to authenticated user
    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: MOCK_USER } }),
      },
    };
  });

  describe("GET /api/projects", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null } });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockGetProjects).not.toHaveBeenCalled();
    });

    it("returns user's projects successfully", async () => {
      mockGetProjects.mockResolvedValue(MOCK_PROJECTS);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ projects: MOCK_PROJECTS });
      expect(mockGetProjects).toHaveBeenCalledWith(MOCK_USER.id);
    });

    it("returns empty array when user has no projects", async () => {
      mockGetProjects.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ projects: [] });
      expect(mockGetProjects).toHaveBeenCalledWith(MOCK_USER.id);
    });

    it("returns 500 when getProjects throws error", async () => {
      mockGetProjects.mockRejectedValue(new Error("Database error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("POST /api/projects", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null } });

      const request = createPostRequest("/api/projects", { name: "New Project" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    it("returns 400 when name is missing", async () => {
      const request = createPostRequest("/api/projects", {});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    it("returns 400 when name is empty string", async () => {
      const request = createPostRequest("/api/projects", { name: "" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    it("returns 400 when name is not a string", async () => {
      const request = createPostRequest("/api/projects", { name: 123 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    it("successfully creates a new project", async () => {
      const newProject = {
        id: "project-3",
        user_id: MOCK_USER.id,
        name: "New Project",
        created_at: "2024-01-03T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };
      mockCreateProject.mockResolvedValue(newProject);

      const request = createPostRequest("/api/projects", { name: "New Project" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({ project: newProject });
      expect(mockCreateProject).toHaveBeenCalledWith(MOCK_USER.id, "New Project");
    });

    it("accepts project names with whitespace", async () => {
      const newProject = {
        id: "project-3",
        user_id: MOCK_USER.id,
        name: "  Trimmed Project  ",
        created_at: "2024-01-03T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };
      mockCreateProject.mockResolvedValue(newProject);

      const request = createPostRequest("/api/projects", { name: "  Trimmed Project  " });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({ project: newProject });
      // The schema does not trim the name automatically
      expect(mockCreateProject).toHaveBeenCalledWith(MOCK_USER.id, "  Trimmed Project  ");
    });

    it("returns 500 when createProject throws error", async () => {
      mockCreateProject.mockRejectedValue(new Error("Database error"));

      const request = createPostRequest("/api/projects", { name: "New Project" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create project");
    });
  });
});
