import { describe, it, expect } from "vitest";
import {
  toPublicTrack,
  DEFAULT_EXPLORE_FILTERS,
  DEFAULT_PLAY_QUEUE_STATE,
  type ExploreQuery,
  type ExploreSortOption,
  type ExploreFilterState,
  type PlayQueueState,
} from "../explore";

describe("explore types", () => {
  describe("DEFAULT_EXPLORE_FILTERS", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_EXPLORE_FILTERS.genre).toBeNull();
      expect(DEFAULT_EXPLORE_FILTERS.tags).toEqual([]);
      expect(DEFAULT_EXPLORE_FILTERS.bpmMin).toBe(40);
      expect(DEFAULT_EXPLORE_FILTERS.bpmMax).toBe(200);
      expect(DEFAULT_EXPLORE_FILTERS.sort).toBe("popular");
    });
  });

  describe("DEFAULT_PLAY_QUEUE_STATE", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_PLAY_QUEUE_STATE.queue).toEqual([]);
      expect(DEFAULT_PLAY_QUEUE_STATE.currentIndex).toBe(-1);
      expect(DEFAULT_PLAY_QUEUE_STATE.autoPlay).toBe(false);
      expect(DEFAULT_PLAY_QUEUE_STATE.shuffle).toBe(false);
      expect(DEFAULT_PLAY_QUEUE_STATE.history).toEqual([]);
    });
  });

  describe("toPublicTrack", () => {
    it("should convert database row to PublicTrack", () => {
      const row = {
        id: "test-id",
        name: "Test Track",
        current_code: "// code",
        bpm: 120,
        genre: "Electronic",
        tags: ["tag1", "tag2"],
        ai_tags: ["ai-tag"],
        plays: 100,
        is_featured: true,
        is_system: false,
        created_at: "2024-01-01T00:00:00Z",
      };

      const track = toPublicTrack(row);

      expect(track.id).toBe("test-id");
      expect(track.name).toBe("Test Track");
      expect(track.current_code).toBe("// code");
      expect(track.bpm).toBe(120);
      expect(track.genre).toBe("Electronic");
      expect(track.tags).toEqual(["tag1", "tag2"]);
      expect(track.ai_tags).toEqual(["ai-tag"]);
      expect(track.plays).toBe(100);
      expect(track.is_featured).toBe(true);
      expect(track.is_system).toBe(false);
      expect(track.created_at).toBe("2024-01-01T00:00:00Z");
    });

    it("should handle null values correctly", () => {
      const row = {
        id: "test-id",
        name: "Test Track",
        current_code: "// code",
        bpm: null,
        genre: null,
        tags: null,
        ai_tags: null,
        plays: null,
        is_featured: null,
        is_system: null,
        created_at: "2024-01-01T00:00:00Z",
      };

      const track = toPublicTrack(row);

      expect(track.bpm).toBeNull();
      expect(track.genre).toBeNull();
      expect(track.tags).toEqual([]);
      expect(track.ai_tags).toEqual([]);
      expect(track.plays).toBe(0);
      expect(track.is_featured).toBe(false);
      expect(track.is_system).toBe(false);
    });
  });

  describe("type guards", () => {
    it("should allow valid ExploreSortOption values", () => {
      const validOptions: ExploreSortOption[] = ["newest", "popular", "random"];
      validOptions.forEach((option) => {
        expect(["newest", "popular", "random"]).toContain(option);
      });
    });

    it("should allow valid ExploreQuery structure", () => {
      const query: ExploreQuery = {
        genre: "Electronic",
        tags: ["chill", "ambient"],
        bpm_min: 80,
        bpm_max: 140,
        sort: "newest",
        limit: 20,
        offset: 0,
      };

      expect(query.genre).toBe("Electronic");
      expect(query.tags).toHaveLength(2);
      expect(query.sort).toBe("newest");
    });

    it("should allow valid ExploreFilterState structure", () => {
      const filters: ExploreFilterState = {
        genre: "Lofi",
        tags: ["jazzy"],
        bpmMin: 60,
        bpmMax: 100,
        sort: "popular",
      };

      expect(filters.genre).toBe("Lofi");
      expect(filters.bpmMin).toBeLessThan(filters.bpmMax);
    });

    it("should allow valid PlayQueueState structure", () => {
      const state: PlayQueueState = {
        queue: [],
        currentIndex: 0,
        autoPlay: true,
        shuffle: true,
        history: ["track-1", "track-2"],
      };

      expect(state.autoPlay).toBe(true);
      expect(state.history).toHaveLength(2);
    });
  });
});
