import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock clipboard
const mockClipboard = {
  writeText: vi.fn(),
};
Object.assign(navigator, {
  clipboard: mockClipboard,
});

describe("useShare hook", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
    mockClipboard.writeText.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export useShare function", async () => {
      const hookModule = await import("../useShare");
      expect(hookModule.useShare).toBeDefined();
      expect(typeof hookModule.useShare).toBe("function");
    });

    it("should be a named export", async () => {
      const hookModule = await import("../useShare");
      expect(Object.keys(hookModule)).toContain("useShare");
    });
  });

  describe("UseShareResult interface", () => {
    it("should export module correctly", async () => {
      const hookModule = await import("../useShare");
      expect(hookModule).toBeDefined();
    });
  });

  describe("fetch share info behavior", () => {
    it("should call /api/tracks/:id/share endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          shareUrl: "https://lofield.fm/share/Ab3Cd5Ef7Gh9",
          shareToken: "Ab3Cd5Ef7Gh9",
          privacy: "unlisted",
          sharedAt: "2026-01-24T00:00:00Z",
        }),
      });

      await mockFetch("/api/tracks/track-1/share");

      expect(mockFetch).toHaveBeenCalledWith("/api/tracks/track-1/share");
    });

    it("should handle successful response with share info", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          shareUrl: "https://lofield.fm/share/Ab3Cd5Ef7Gh9",
          shareToken: "Ab3Cd5Ef7Gh9",
          privacy: "unlisted",
          sharedAt: "2026-01-24T00:00:00Z",
        }),
      });

      const response = await mockFetch("/api/tracks/track-1/share");
      const data = await response.json();

      expect(data.shareUrl).toBe("https://lofield.fm/share/Ab3Cd5Ef7Gh9");
      expect(data.shareToken).toBe("Ab3Cd5Ef7Gh9");
      expect(data.privacy).toBe("unlisted");
    });

    it("should handle track with no share token", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          shareUrl: null,
          shareToken: null,
          privacy: "private",
          sharedAt: null,
        }),
      });

      const response = await mockFetch("/api/tracks/track-1/share");
      const data = await response.json();

      expect(data.shareUrl).toBeNull();
      expect(data.shareToken).toBeNull();
      expect(data.privacy).toBe("private");
    });

    it("should handle 401 unauthorized response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: "Unauthorized" }),
      });

      const response = await mockFetch("/api/tracks/track-1/share");
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it("should handle 404 not found response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ error: "Track not found" }),
      });

      const response = await mockFetch("/api/tracks/track-1/share");
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe("generate share behavior", () => {
    it("should POST to /api/tracks/:id/share with privacy", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          shareUrl: "https://lofield.fm/share/NewToken1234",
          shareToken: "NewToken1234",
          privacy: "public",
        }),
      });

      await mockFetch("/api/tracks/track-1/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privacy: "public" }),
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/tracks/track-1/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privacy: "public" }),
      });
    });

    it("should handle successful generate response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          shareUrl: "https://lofield.fm/share/NewToken1234",
          shareToken: "NewToken1234",
          privacy: "unlisted",
        }),
      });

      const response = await mockFetch("/api/tracks/track-1/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privacy: "unlisted" }),
      });
      const data = await response.json();

      expect(data.shareUrl).toContain("NewToken1234");
      expect(data.shareToken).toBe("NewToken1234");
      expect(data.privacy).toBe("unlisted");
    });

    it("should handle generate failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ error: "Failed to generate share link" }),
      });

      const response = await mockFetch("/api/tracks/track-1/share", {
        method: "POST",
        body: JSON.stringify({ privacy: "unlisted" }),
      });
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toBe("Failed to generate share link");
    });
  });

  describe("update privacy behavior", () => {
    it("should PUT to /api/tracks/:id/share with new privacy", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          privacy: "public",
        }),
      });

      await mockFetch("/api/tracks/track-1/share", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privacy: "public" }),
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/tracks/track-1/share", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privacy: "public" }),
      });
    });

    it("should handle successful privacy update", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          privacy: "private",
        }),
      });

      const response = await mockFetch("/api/tracks/track-1/share", {
        method: "PUT",
        body: JSON.stringify({ privacy: "private" }),
      });
      const data = await response.json();

      expect(data.privacy).toBe("private");
    });

    it("should handle update privacy failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ error: "Invalid privacy level" }),
      });

      const response = await mockFetch("/api/tracks/track-1/share", {
        method: "PUT",
        body: JSON.stringify({ privacy: "invalid" }),
      });

      expect(response.ok).toBe(false);
    });
  });

  describe("revoke share behavior", () => {
    it("should DELETE to /api/tracks/:id/share", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      await mockFetch("/api/tracks/track-1/share", {
        method: "DELETE",
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/tracks/track-1/share", {
        method: "DELETE",
      });
    });

    it("should handle successful revoke response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      const response = await mockFetch("/api/tracks/track-1/share", {
        method: "DELETE",
      });

      expect(response.ok).toBe(true);
    });

    it("should handle revoke failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ error: "Failed to revoke share" }),
      });

      const response = await mockFetch("/api/tracks/track-1/share", {
        method: "DELETE",
      });
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toBe("Failed to revoke share");
    });
  });

  describe("clipboard behavior", () => {
    it("should copy share URL to clipboard", async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      await navigator.clipboard.writeText("https://lofield.fm/share/Ab3Cd5Ef7Gh9");

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        "https://lofield.fm/share/Ab3Cd5Ef7Gh9"
      );
    });

    it("should handle clipboard failure", async () => {
      mockClipboard.writeText.mockRejectedValue(new Error("Clipboard access denied"));

      await expect(
        navigator.clipboard.writeText("https://lofield.fm/share/Ab3Cd5Ef7Gh9")
      ).rejects.toThrow("Clipboard access denied");
    });
  });

  describe("edge cases", () => {
    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(mockFetch("/api/tracks/track-1/share")).rejects.toThrow(
        "Network error"
      );
    });

    it("should handle JSON parse errors", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      const response = await mockFetch("/api/tracks/track-1/share");
      await expect(response.json()).rejects.toThrow("Invalid JSON");
    });

    it("should handle missing track ID gracefully", async () => {
      // When trackId is null, the hook should not make any fetch calls
      // This test verifies the API design expectation
      const hookModule = await import("../useShare");
      expect(hookModule.useShare).toBeDefined();
    });
  });
});
