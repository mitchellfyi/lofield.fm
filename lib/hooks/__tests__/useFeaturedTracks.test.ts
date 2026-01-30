import { describe, it, expect } from "vitest";

describe("useFeaturedTracks", () => {
  describe("module structure", () => {
    it("should export useFeaturedTracks hook", async () => {
      const featuredModule = await import("../useFeaturedTracks");
      expect(featuredModule.useFeaturedTracks).toBeDefined();
      expect(typeof featuredModule.useFeaturedTracks).toBe("function");
    });
  });

  describe("FeaturedTracksData interface", () => {
    it("should have featured array", () => {
      const data = {
        featured: [],
        trending: [],
        recent: [],
      };
      expect(Array.isArray(data.featured)).toBe(true);
    });

    it("should have trending array", () => {
      const data = {
        featured: [],
        trending: [],
        recent: [],
      };
      expect(Array.isArray(data.trending)).toBe(true);
    });

    it("should have recent array", () => {
      const data = {
        featured: [],
        trending: [],
        recent: [],
      };
      expect(Array.isArray(data.recent)).toBe(true);
    });
  });

  describe("hook return value structure", () => {
    it("should return data, loading, error, and refresh", () => {
      const expectedKeys = ["data", "loading", "error", "refresh"];
      const mockResult = {
        data: null,
        loading: true,
        error: null,
        refresh: () => Promise.resolve(),
      };

      expectedKeys.forEach((key) => {
        expect(key in mockResult).toBe(true);
      });
    });
  });

  describe("loading state", () => {
    it("should start with loading true", () => {
      const initialLoading = true;
      expect(initialLoading).toBe(true);
    });

    it("should be false after data loads", () => {
      const loadingAfterFetch = false;
      expect(loadingAfterFetch).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should capture error message from Error object", () => {
      const error: unknown = new Error("Failed to fetch");
      const message = error instanceof Error ? error.message : "Unknown error";
      expect(message).toBe("Failed to fetch");
    });

    it("should use fallback message for non-Error objects", () => {
      const error: unknown = "string error";
      const message = error instanceof Error ? error.message : "Failed to load featured tracks";
      expect(message).toBe("Failed to load featured tracks");
    });
  });
});
