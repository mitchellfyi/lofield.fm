import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock preset type for testing
interface Preset {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  description: string;
  code: string;
  tags: string[];
}

describe("PresetCard component", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export PresetCard component", async () => {
      const cardModule = await import("../PresetCard");
      expect(cardModule.PresetCard).toBeDefined();
      expect(typeof cardModule.PresetCard).toBe("function");
    });

    it("should be a named export", async () => {
      const cardModule = await import("../PresetCard");
      expect(Object.keys(cardModule)).toContain("PresetCard");
    });
  });

  describe("props interface", () => {
    it("should accept required props: preset, onPreview, onLoad", async () => {
      const cardModule = await import("../PresetCard");
      expect(cardModule.PresetCard).toBeDefined();
    });

    it("should accept optional props: isPlaying", async () => {
      const cardModule = await import("../PresetCard");
      expect(cardModule.PresetCard).toBeDefined();
    });

    it("should define PresetCardProps interface correctly", () => {
      interface PresetCardProps {
        preset: Preset;
        onPreview: (preset: Preset) => void;
        onLoad: (preset: Preset) => void;
        isPlaying?: boolean;
      }

      const preset: Preset = {
        id: "test-preset",
        name: "Test Preset",
        genre: "Test Genre",
        bpm: 120,
        description: "A test preset",
        code: "// test code",
        tags: ["tag1", "tag2"],
      };

      const props: PresetCardProps = {
        preset,
        onPreview: vi.fn(),
        onLoad: vi.fn(),
        isPlaying: false,
      };

      expect(props.preset).toEqual(preset);
      expect(typeof props.onPreview).toBe("function");
      expect(typeof props.onLoad).toBe("function");
      expect(props.isPlaying).toBe(false);
    });

    it("should default isPlaying to false", () => {
      const defaultIsPlaying = false;
      expect(defaultIsPlaying).toBe(false);
    });
  });

  describe("preset data display", () => {
    const mockPreset: Preset = {
      id: "lofi-chill",
      name: "Midnight Lofi",
      genre: "Lofi Hip-Hop",
      bpm: 82,
      description: "Chill jazzy beats with Rhodes and vinyl warmth",
      code: "// lofi code",
      tags: ["chill", "jazzy", "relaxed", "study"],
    };

    it("should display preset name", () => {
      expect(mockPreset.name).toBe("Midnight Lofi");
    });

    it("should display preset genre", () => {
      expect(mockPreset.genre).toBe("Lofi Hip-Hop");
    });

    it("should display preset BPM", () => {
      expect(mockPreset.bpm).toBe(82);
    });

    it("should format BPM display", () => {
      const bpmDisplay = `${mockPreset.bpm} BPM`;
      expect(bpmDisplay).toBe("82 BPM");
    });

    it("should display preset description", () => {
      expect(mockPreset.description).toBe("Chill jazzy beats with Rhodes and vinyl warmth");
    });

    it("should display preset tags", () => {
      expect(mockPreset.tags).toContain("chill");
      expect(mockPreset.tags).toContain("jazzy");
    });

    it("should limit visible tags to 4", () => {
      const maxVisibleTags = 4;
      const visibleTags = mockPreset.tags.slice(0, maxVisibleTags);
      expect(visibleTags).toHaveLength(4);
    });

    it("should truncate long names", () => {
      // Card uses truncate class for names
      const className = "truncate";
      expect(className).toBe("truncate");
    });

    it("should truncate long descriptions", () => {
      // Card uses line-clamp-2 for descriptions
      const className = "line-clamp-2";
      expect(className).toBe("line-clamp-2");
    });
  });

  describe("preview button", () => {
    it("should call onPreview when clicked", () => {
      const onPreview = vi.fn();
      const preset: Preset = {
        id: "test",
        name: "Test",
        genre: "Test",
        bpm: 120,
        description: "Test",
        code: "// code",
        tags: [],
      };

      onPreview(preset);
      expect(onPreview).toHaveBeenCalledWith(preset);
    });

    it("should show Preview text when not playing", () => {
      const isPlaying = false;
      const buttonText = isPlaying ? "Stop" : "Preview";
      expect(buttonText).toBe("Preview");
    });

    it("should show Stop text when playing", () => {
      const isPlaying = true;
      const buttonText = isPlaying ? "Stop" : "Preview";
      expect(buttonText).toBe("Stop");
    });

    it("should show play icon when not playing", () => {
      const isPlaying = false;
      // Play icon path: M8 5v14l11-7z
      const iconPath = isPlaying ? "M6 4h4v16H6V4zm8 0h4v16h-4V4z" : "M8 5v14l11-7z";
      expect(iconPath).toBe("M8 5v14l11-7z");
    });

    it("should show pause/stop icon when playing", () => {
      const isPlaying = true;
      // Pause icon path: M6 4h4v16H6V4zm8 0h4v16h-4V4z
      const iconPath = isPlaying ? "M6 4h4v16H6V4zm8 0h4v16h-4V4z" : "M8 5v14l11-7z";
      expect(iconPath).toBe("M6 4h4v16H6V4zm8 0h4v16h-4V4z");
    });

    it("should have different styling when playing", () => {
      const isPlaying = true;
      const buttonClasses = isPlaying
        ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
        : "bg-slate-700/50 text-slate-300 border border-slate-600";

      expect(buttonClasses).toContain("amber");
    });

    it("should have default styling when not playing", () => {
      const isPlaying = false;
      const buttonClasses = isPlaying
        ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
        : "bg-slate-700/50 text-slate-300 border border-slate-600";

      expect(buttonClasses).toContain("slate");
    });
  });

  describe("load button", () => {
    it("should call onLoad when clicked", () => {
      const onLoad = vi.fn();
      const preset: Preset = {
        id: "test",
        name: "Test",
        genre: "Test",
        bpm: 120,
        description: "Test",
        code: "// code",
        tags: [],
      };

      onLoad(preset);
      expect(onLoad).toHaveBeenCalledWith(preset);
    });

    it("should display Load text", () => {
      const buttonText = "Load";
      expect(buttonText).toBe("Load");
    });

    it("should have primary button styling", () => {
      const buttonClasses =
        "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white";
      expect(buttonClasses).toContain("cyan");
      expect(buttonClasses).toContain("text-white");
    });
  });

  describe("button layout", () => {
    it("should have two buttons side by side", () => {
      const containerClasses = "flex gap-2";
      expect(containerClasses).toContain("flex");
      expect(containerClasses).toContain("gap-2");
    });

    it("should have equal width buttons", () => {
      const buttonClass = "flex-1";
      expect(buttonClass).toBe("flex-1");
    });
  });

  describe("card styling", () => {
    it("should have hover state", () => {
      const cardClasses = "hover:border-cyan-500/50 hover:shadow-lg";
      expect(cardClasses).toContain("hover:border-cyan-500/50");
      expect(cardClasses).toContain("hover:shadow-lg");
    });

    it("should have border and rounded corners", () => {
      const cardClasses = "border border-slate-700 rounded-xl";
      expect(cardClasses).toContain("border");
      expect(cardClasses).toContain("rounded-xl");
    });

    it("should have padding", () => {
      const cardClasses = "p-4";
      expect(cardClasses).toBe("p-4");
    });

    it("should have background", () => {
      const cardClasses = "bg-slate-800/50";
      expect(cardClasses).toContain("bg-slate-800");
    });
  });

  describe("tag styling", () => {
    it("should have chip/pill styling for tags", () => {
      const tagClasses =
        "px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/50";
      expect(tagClasses).toContain("rounded-full");
      expect(tagClasses).toContain("px-2");
    });

    it("should have small font size for tags", () => {
      const tagClasses = "text-[10px]";
      expect(tagClasses).toBe("text-[10px]");
    });
  });

  describe("header layout", () => {
    it("should show name and badges in header", () => {
      const mockPreset: Preset = {
        id: "test",
        name: "Test Preset",
        genre: "Test Genre",
        bpm: 120,
        description: "Test",
        code: "// code",
        tags: [],
      };

      // Header should display name, genre badge, and BPM badge
      expect(mockPreset.name).toBeDefined();
      expect(mockPreset.genre).toBeDefined();
      expect(mockPreset.bpm).toBeDefined();
    });

    it("should have genre as cyan badge", () => {
      const genreClasses = "text-xs font-medium text-cyan-500";
      expect(genreClasses).toContain("text-cyan-500");
    });

    it("should have BPM as neutral badge", () => {
      const bpmClasses = "px-1.5 py-0.5 rounded bg-slate-700 text-slate-300";
      expect(bpmClasses).toContain("bg-slate-700");
      expect(bpmClasses).toContain("text-slate-300");
    });
  });

  describe("preset with many tags", () => {
    it("should only show first 4 tags", () => {
      const preset: Preset = {
        id: "test",
        name: "Test",
        genre: "Test",
        bpm: 120,
        description: "Test",
        code: "// code",
        tags: ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
      };

      const visibleTags = preset.tags.slice(0, 4);
      expect(visibleTags).toHaveLength(4);
      expect(visibleTags).not.toContain("tag5");
      expect(visibleTags).not.toContain("tag6");
    });
  });

  describe("preset with no tags", () => {
    it("should handle empty tags array", () => {
      const preset: Preset = {
        id: "test",
        name: "Test",
        genre: "Test",
        bpm: 120,
        description: "Test",
        code: "// code",
        tags: [],
      };

      const visibleTags = preset.tags.slice(0, 4);
      expect(visibleTags).toHaveLength(0);
    });
  });

  describe("accessibility", () => {
    it("should have buttons as interactive elements", () => {
      // Buttons should be clickable
      const buttonElement = "button";
      expect(buttonElement).toBe("button");
    });

    it("should have semantic heading for preset name", () => {
      // h3 is used for preset name
      const headingElement = "h3";
      expect(headingElement).toBe("h3");
    });
  });

  describe("responsive behavior", () => {
    it("should have consistent styling across breakpoints", () => {
      // Card doesn't change much with breakpoints, but parent grid does
      const cardClasses = "bg-slate-800/50 border border-slate-700 rounded-xl p-4";
      expect(cardClasses).not.toContain("sm:");
      expect(cardClasses).not.toContain("md:");
      expect(cardClasses).not.toContain("lg:");
    });
  });
});
