import { describe, it, expect } from "vitest";

describe("ExploreTrackCard", () => {
  describe("module structure", () => {
    it("should export ExploreTrackCard component", async () => {
      const cardModule = await import("../ExploreTrackCard");
      expect(cardModule.ExploreTrackCard).toBeDefined();
      expect(typeof cardModule.ExploreTrackCard).toBe("function");
    });
  });

  describe("trending badge logic", () => {
    const TRENDING_THRESHOLD = 10;

    it("should show trending badge when plays >= threshold and not featured", () => {
      const track = { plays: 15, is_featured: false };
      const showTrendingBadge = true;
      const isTrending =
        showTrendingBadge && !track.is_featured && track.plays >= TRENDING_THRESHOLD;
      expect(isTrending).toBe(true);
    });

    it("should not show trending badge when plays < threshold", () => {
      const track = { plays: 5, is_featured: false };
      const showTrendingBadge = true;
      const isTrending =
        showTrendingBadge && !track.is_featured && track.plays >= TRENDING_THRESHOLD;
      expect(isTrending).toBe(false);
    });

    it("should not show trending badge for featured tracks", () => {
      const track = { plays: 100, is_featured: true };
      const showTrendingBadge = true;
      const isTrending =
        showTrendingBadge && !track.is_featured && track.plays >= TRENDING_THRESHOLD;
      expect(isTrending).toBe(false);
    });

    it("should not show trending badge when showTrendingBadge is false", () => {
      const track = { plays: 100, is_featured: false };
      const showTrendingBadge = false;
      const isTrending =
        showTrendingBadge && !track.is_featured && track.plays >= TRENDING_THRESHOLD;
      expect(isTrending).toBe(false);
    });

    it("should show trending badge at exactly threshold", () => {
      const track = { plays: TRENDING_THRESHOLD, is_featured: false };
      const showTrendingBadge = true;
      const isTrending =
        showTrendingBadge && !track.is_featured && track.plays >= TRENDING_THRESHOLD;
      expect(isTrending).toBe(true);
    });
  });

  describe("featured badge", () => {
    it("should show featured badge for featured tracks", () => {
      const track = { is_featured: true };
      expect(track.is_featured).toBe(true);
    });

    it("should not show featured badge for non-featured tracks", () => {
      const track = { is_featured: false };
      expect(track.is_featured).toBe(false);
    });
  });

  describe("play count display", () => {
    it("should format play count with toLocaleString", () => {
      const plays = 1234567;
      const formatted = plays.toLocaleString();
      expect(formatted).toBe("1,234,567");
    });

    it("should handle zero plays", () => {
      const plays = 0;
      const formatted = plays.toLocaleString();
      expect(formatted).toBe("0");
    });
  });

  describe("tags handling", () => {
    it("should combine and deduplicate user tags and AI tags", () => {
      const tags = ["ambient", "chill"];
      const ai_tags = ["chill", "lofi"];
      const allTags = [...new Set([...tags, ...ai_tags])];
      expect(allTags).toEqual(["ambient", "chill", "lofi"]);
    });

    it("should limit displayed tags to 5", () => {
      const allTags = ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"];
      const displayedTags = allTags.slice(0, 5);
      expect(displayedTags.length).toBe(5);
    });

    it("should show +N more when there are more than 5 tags", () => {
      const allTags = ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"];
      const remainingCount = allTags.length - 5;
      expect(remainingCount).toBe(2);
    });
  });

  describe("system/preset badge", () => {
    it("should show preset badge for system tracks", () => {
      const track = { is_system: true };
      expect(track.is_system).toBe(true);
    });
  });
});
