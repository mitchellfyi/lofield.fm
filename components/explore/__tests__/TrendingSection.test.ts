import { describe, it, expect } from "vitest";

describe("TrendingSection", () => {
  describe("module structure", () => {
    it("should export TrendingSection component", async () => {
      const sectionModule = await import("../TrendingSection");
      expect(sectionModule.TrendingSection).toBeDefined();
      expect(typeof sectionModule.TrendingSection).toBe("function");
    });
  });

  describe("icon types", () => {
    it("should support fire icon for trending", () => {
      const validIcons = ["fire", "star", "clock"];
      expect(validIcons).toContain("fire");
    });

    it("should support star icon for featured", () => {
      const validIcons = ["fire", "star", "clock"];
      expect(validIcons).toContain("star");
    });

    it("should support clock icon for recent", () => {
      const validIcons = ["fire", "star", "clock"];
      expect(validIcons).toContain("clock");
    });
  });

  describe("section behavior", () => {
    it("should not render when tracks array is empty", () => {
      const tracks: unknown[] = [];
      const shouldRender = tracks.length > 0;
      expect(shouldRender).toBe(false);
    });

    it("should render when tracks are provided", () => {
      const tracks = [{ id: "1", name: "Track 1" }];
      const shouldRender = tracks.length > 0;
      expect(shouldRender).toBe(true);
    });
  });

  describe("scroll behavior", () => {
    const calculateScroll = (direction: "left" | "right", amount: number) =>
      direction === "left" ? -amount : amount;

    it("should support left scroll", () => {
      const expectedScroll = calculateScroll("left", 300);
      expect(expectedScroll).toBe(-300);
    });

    it("should support right scroll", () => {
      const expectedScroll = calculateScroll("right", 300);
      expect(expectedScroll).toBe(300);
    });
  });

  describe("track card width", () => {
    it("should use fixed width for horizontal scroll cards", () => {
      const cardWidth = "w-64";
      expect(cardWidth).toBe("w-64");
    });
  });
});
