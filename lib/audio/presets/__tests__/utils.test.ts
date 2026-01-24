import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

describe("preset utility functions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module exports", () => {
    it("should export getUniqueGenres function", async () => {
      const utilsModule = await import("../utils");
      expect(utilsModule.getUniqueGenres).toBeDefined();
      expect(typeof utilsModule.getUniqueGenres).toBe("function");
    });

    it("should export getUniqueTags function", async () => {
      const utilsModule = await import("../utils");
      expect(utilsModule.getUniqueTags).toBeDefined();
      expect(typeof utilsModule.getUniqueTags).toBe("function");
    });

    it("should export filterPresets function", async () => {
      const utilsModule = await import("../utils");
      expect(utilsModule.filterPresets).toBeDefined();
      expect(typeof utilsModule.filterPresets).toBe("function");
    });

    it("should export searchPresets function", async () => {
      const utilsModule = await import("../utils");
      expect(utilsModule.searchPresets).toBeDefined();
      expect(typeof utilsModule.searchPresets).toBe("function");
    });
  });

  describe("getUniqueGenres", () => {
    it("should return an array", async () => {
      const { getUniqueGenres } = await import("../utils");
      const genres = getUniqueGenres();
      expect(Array.isArray(genres)).toBe(true);
    });

    it("should return sorted genres", async () => {
      const { getUniqueGenres } = await import("../utils");
      const genres = getUniqueGenres();
      const sortedGenres = [...genres].sort();
      expect(genres).toEqual(sortedGenres);
    });

    it("should return unique values only", async () => {
      const { getUniqueGenres } = await import("../utils");
      const genres = getUniqueGenres();
      const uniqueGenres = [...new Set(genres)];
      expect(genres).toEqual(uniqueGenres);
    });

    it("should return non-empty array from 10 presets", async () => {
      const { getUniqueGenres } = await import("../utils");
      const genres = getUniqueGenres();
      expect(genres.length).toBeGreaterThan(0);
    });

    it("should contain expected genres", async () => {
      const { getUniqueGenres } = await import("../utils");
      const genres = getUniqueGenres();
      // Based on the 10 presets
      expect(genres).toContain("Lofi Hip-Hop");
      expect(genres).toContain("Deep House");
      expect(genres).toContain("Dark Techno");
    });
  });

  describe("getUniqueTags", () => {
    it("should return an array", async () => {
      const { getUniqueTags } = await import("../utils");
      const tags = getUniqueTags();
      expect(Array.isArray(tags)).toBe(true);
    });

    it("should return sorted tags", async () => {
      const { getUniqueTags } = await import("../utils");
      const tags = getUniqueTags();
      const sortedTags = [...tags].sort();
      expect(tags).toEqual(sortedTags);
    });

    it("should return unique values only", async () => {
      const { getUniqueTags } = await import("../utils");
      const tags = getUniqueTags();
      const uniqueTags = [...new Set(tags)];
      expect(tags).toEqual(uniqueTags);
    });

    it("should return non-empty array from 10 presets", async () => {
      const { getUniqueTags } = await import("../utils");
      const tags = getUniqueTags();
      expect(tags.length).toBeGreaterThan(0);
    });

    it("should contain expected tags", async () => {
      const { getUniqueTags } = await import("../utils");
      const tags = getUniqueTags();
      // Based on the tags defined in plan
      expect(tags).toContain("chill");
      expect(tags).toContain("groovy");
      expect(tags).toContain("dark");
    });

    it("should have multiple tags per preset combined", async () => {
      const { getUniqueTags } = await import("../utils");
      const tags = getUniqueTags();
      // 10 presets with 4 tags each = ~40, but unique so less
      expect(tags.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe("filterPresets", () => {
    it("should return all presets when no filters applied", async () => {
      const { filterPresets } = await import("../utils");
      const presets = filterPresets({});
      expect(presets.length).toBe(10);
    });

    describe("genre filtering", () => {
      it("should filter by genre", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ genre: "Lofi Hip-Hop" });
        expect(presets.length).toBeGreaterThan(0);
        expect(presets.every((p) => p.genre === "Lofi Hip-Hop")).toBe(true);
      });

      it("should return empty array for non-existent genre", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ genre: "NonExistentGenre" });
        expect(presets.length).toBe(0);
      });
    });

    describe("tag filtering", () => {
      it("should filter by tag", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ tag: "chill" });
        expect(presets.length).toBeGreaterThan(0);
        expect(presets.every((p) => p.tags.includes("chill"))).toBe(true);
      });

      it("should return empty array for non-existent tag", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ tag: "nonexistenttag" });
        expect(presets.length).toBe(0);
      });
    });

    describe("search filtering", () => {
      it("should search by name", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ search: "Midnight" });
        expect(presets.length).toBeGreaterThan(0);
        expect(presets.some((p) => p.name.includes("Midnight"))).toBe(true);
      });

      it("should search by description", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ search: "jazzy" });
        expect(presets.length).toBeGreaterThan(0);
        expect(presets.some((p) => p.description.toLowerCase().includes("jazzy"))).toBe(true);
      });

      it("should search by tags", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ search: "hypnotic" });
        expect(presets.length).toBeGreaterThan(0);
        expect(presets.some((p) => p.tags.includes("hypnotic"))).toBe(true);
      });

      it("should search by genre", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ search: "house" });
        expect(presets.length).toBeGreaterThan(0);
        expect(presets.some((p) => p.genre.toLowerCase().includes("house"))).toBe(true);
      });

      it("should be case insensitive", async () => {
        const { filterPresets } = await import("../utils");
        const presetsUpper = filterPresets({ search: "LOFI" });
        const presetsLower = filterPresets({ search: "lofi" });
        const presetsMixed = filterPresets({ search: "LoFi" });

        expect(presetsUpper.length).toBe(presetsLower.length);
        expect(presetsUpper.length).toBe(presetsMixed.length);
      });

      it("should trim whitespace from search query", async () => {
        const { filterPresets } = await import("../utils");
        const presetsTrimmed = filterPresets({ search: "lofi" });
        const presetsWithSpaces = filterPresets({ search: "  lofi  " });

        expect(presetsTrimmed.length).toBe(presetsWithSpaces.length);
      });

      it("should return all presets for empty search string", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ search: "" });
        expect(presets.length).toBe(10);
      });

      it("should return empty array for no matches", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ search: "xyznonexistent" });
        expect(presets.length).toBe(0);
      });
    });

    describe("combined filters", () => {
      it("should combine genre and tag filters", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ genre: "Lofi Hip-Hop", tag: "chill" });
        expect(presets.length).toBeGreaterThan(0);
        expect(presets.every((p) => p.genre === "Lofi Hip-Hop")).toBe(true);
        expect(presets.every((p) => p.tags.includes("chill"))).toBe(true);
      });

      it("should combine genre and search filters", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ genre: "Lofi Hip-Hop", search: "jazzy" });
        expect(presets.length).toBeGreaterThan(0);
        expect(presets.every((p) => p.genre === "Lofi Hip-Hop")).toBe(true);
      });

      it("should combine tag and search filters", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ tag: "chill", search: "lofi" });
        expect(presets.length).toBeGreaterThan(0);
        expect(presets.every((p) => p.tags.includes("chill"))).toBe(true);
      });

      it("should combine all three filters", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({
          genre: "Lofi Hip-Hop",
          tag: "chill",
          search: "lofi",
        });
        expect(presets.length).toBeGreaterThan(0);
        expect(presets.every((p) => p.genre === "Lofi Hip-Hop")).toBe(true);
        expect(presets.every((p) => p.tags.includes("chill"))).toBe(true);
      });

      it("should return empty array when combined filters have no matches", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({ genre: "Dark Techno", tag: "chill" });
        // Dark Techno preset doesn't have "chill" tag
        expect(presets.length).toBe(0);
      });
    });

    describe("return value structure", () => {
      it("should return presets with all required fields", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({});

        presets.forEach((preset) => {
          expect(preset).toHaveProperty("id");
          expect(preset).toHaveProperty("name");
          expect(preset).toHaveProperty("genre");
          expect(preset).toHaveProperty("bpm");
          expect(preset).toHaveProperty("description");
          expect(preset).toHaveProperty("code");
          expect(preset).toHaveProperty("tags");
        });
      });

      it("should return presets with correct types", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({});

        presets.forEach((preset) => {
          expect(typeof preset.id).toBe("string");
          expect(typeof preset.name).toBe("string");
          expect(typeof preset.genre).toBe("string");
          expect(typeof preset.bpm).toBe("number");
          expect(typeof preset.description).toBe("string");
          expect(typeof preset.code).toBe("string");
          expect(Array.isArray(preset.tags)).toBe(true);
        });
      });

      it("should return presets with tags as string array", async () => {
        const { filterPresets } = await import("../utils");
        const presets = filterPresets({});

        presets.forEach((preset) => {
          preset.tags.forEach((tag) => {
            expect(typeof tag).toBe("string");
          });
        });
      });
    });
  });

  describe("searchPresets", () => {
    it("should delegate to filterPresets with search option", async () => {
      const { searchPresets, filterPresets } = await import("../utils");
      const searchResult = searchPresets("lofi");
      const filterResult = filterPresets({ search: "lofi" });

      expect(searchResult.length).toBe(filterResult.length);
      expect(searchResult.map((p) => p.id)).toEqual(filterResult.map((p) => p.id));
    });

    it("should return array of presets", async () => {
      const { searchPresets } = await import("../utils");
      const presets = searchPresets("house");
      expect(Array.isArray(presets)).toBe(true);
    });

    it("should return empty array for no matches", async () => {
      const { searchPresets } = await import("../utils");
      const presets = searchPresets("xyznonexistent");
      expect(presets.length).toBe(0);
    });

    it("should find presets by partial match", async () => {
      const { searchPresets } = await import("../utils");
      const presets = searchPresets("tech");
      expect(presets.length).toBeGreaterThan(0);
    });
  });

  describe("all 10 presets have valid tags", () => {
    it("should have tags array on each preset", async () => {
      const { filterPresets } = await import("../utils");
      const presets = filterPresets({});

      expect(presets.length).toBe(10);
      presets.forEach((preset) => {
        expect(Array.isArray(preset.tags)).toBe(true);
        expect(preset.tags.length).toBeGreaterThan(0);
      });
    });

    it("should have at least 4 tags per preset", async () => {
      const { filterPresets } = await import("../utils");
      const presets = filterPresets({});

      presets.forEach((preset) => {
        expect(preset.tags.length).toBeGreaterThanOrEqual(4);
      });
    });

    it("should have no empty string tags", async () => {
      const { filterPresets } = await import("../utils");
      const presets = filterPresets({});

      presets.forEach((preset) => {
        preset.tags.forEach((tag) => {
          expect(tag.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("preset data integrity", () => {
    it("should have unique preset IDs", async () => {
      const { filterPresets } = await import("../utils");
      const presets = filterPresets({});
      const ids = presets.map((p) => p.id);
      const uniqueIds = [...new Set(ids)];

      expect(ids.length).toBe(uniqueIds.length);
    });

    it("should have non-empty names", async () => {
      const { filterPresets } = await import("../utils");
      const presets = filterPresets({});

      presets.forEach((preset) => {
        expect(preset.name.length).toBeGreaterThan(0);
      });
    });

    it("should have valid BPM values", async () => {
      const { filterPresets } = await import("../utils");
      const presets = filterPresets({});

      presets.forEach((preset) => {
        expect(preset.bpm).toBeGreaterThan(0);
        expect(preset.bpm).toBeLessThan(300);
      });
    });

    it("should have non-empty code", async () => {
      const { filterPresets } = await import("../utils");
      const presets = filterPresets({});

      presets.forEach((preset) => {
        expect(preset.code.length).toBeGreaterThan(0);
      });
    });
  });
});
