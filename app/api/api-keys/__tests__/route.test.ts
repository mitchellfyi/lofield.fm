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

// Mock api-keys module
vi.mock("@/lib/api-keys", () => ({
  getApiKeyInfo: vi.fn(),
  setApiKey: vi.fn(),
  deleteApiKey: vi.fn(),
}));

// Import route handlers after mocking
import { GET, POST, DELETE } from "../route";
import { getApiKeyInfo, setApiKey, deleteApiKey } from "@/lib/api-keys";

// Get mocked functions
const mockGetApiKeyInfo = vi.mocked(getApiKeyInfo);
const mockSetApiKey = vi.mocked(setApiKey);
const mockDeleteApiKey = vi.mocked(deleteApiKey);

describe("/api/api-keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to authenticated user
    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: MOCK_USER } }),
      },
    };
  });

  describe("GET /api/api-keys", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null } });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockGetApiKeyInfo).not.toHaveBeenCalled();
    });

    it("returns API key info when user has a key", async () => {
      mockGetApiKeyInfo.mockResolvedValue({
        hasKey: true,
        keyLast4: "abcd",
        maskedKey: "sk-...abcd",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        hasKey: true,
        maskedKey: "sk-...abcd",
      });
      expect(mockGetApiKeyInfo).toHaveBeenCalledWith(MOCK_USER.id);
    });

    it("returns empty info when user has no key", async () => {
      mockGetApiKeyInfo.mockResolvedValue({
        hasKey: false,
        keyLast4: null,
        maskedKey: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        hasKey: false,
        maskedKey: null,
      });
    });

    it("returns 500 when getApiKeyInfo throws error", async () => {
      mockGetApiKeyInfo.mockRejectedValue(new Error("Database error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("POST /api/api-keys", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null } });

      const request = createPostRequest("/api/api-keys", { key: "sk-valid-key" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockSetApiKey).not.toHaveBeenCalled();
    });

    it("returns 400 when key is missing", async () => {
      const request = createPostRequest("/api/api-keys", {});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("API key is required");
      expect(mockSetApiKey).not.toHaveBeenCalled();
    });

    it("returns 400 when key is not a string", async () => {
      const request = createPostRequest("/api/api-keys", { key: 123 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("API key is required");
      expect(mockSetApiKey).not.toHaveBeenCalled();
    });

    it("returns 400 when key format is invalid", async () => {
      const request = createPostRequest("/api/api-keys", { key: "invalid-key-format" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid API key format");
      expect(mockSetApiKey).not.toHaveBeenCalled();
    });

    it("successfully saves valid API key", async () => {
      mockSetApiKey.mockResolvedValue(undefined);

      const request = createPostRequest("/api/api-keys", { key: "sk-valid-api-key" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockSetApiKey).toHaveBeenCalledWith(MOCK_USER.id, "sk-valid-api-key");
    });

    it("returns 500 when setApiKey throws error", async () => {
      mockSetApiKey.mockRejectedValue(new Error("Database error"));

      const request = createPostRequest("/api/api-keys", { key: "sk-valid-api-key" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to save API key");
    });
  });

  describe("DELETE /api/api-keys", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null } });

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockDeleteApiKey).not.toHaveBeenCalled();
    });

    it("successfully deletes API key", async () => {
      mockDeleteApiKey.mockResolvedValue(undefined);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockDeleteApiKey).toHaveBeenCalledWith(MOCK_USER.id);
    });

    it("returns 500 when deleteApiKey throws error", async () => {
      mockDeleteApiKey.mockRejectedValue(new Error("Database error"));

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete API key");
    });
  });
});
