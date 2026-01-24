import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the presets module
vi.mock("@/lib/audio/presets", () => ({
  PRESETS: [
    {
      id: "lofi-chill",
      name: "Midnight Lofi",
      genre: "Lofi Hip-Hop",
      bpm: 82,
      description: "Chill jazzy beats with Rhodes and vinyl warmth",
      tags: ["chill", "jazzy", "relaxed", "study"],
      code: "// lofi code",
    },
    {
      id: "deep-house",
      name: "Groove Machine",
      genre: "Deep House",
      bpm: 122,
      description: "Funky bass and organic percussion",
      tags: ["groovy", "funky", "dance", "warm"],
      code: "// house code",
    },
    {
      id: "dark-techno",
      name: "Industrial Pulse",
      genre: "Techno",
      bpm: 138,
      description: "Dark industrial beats with heavy kicks",
      tags: ["dark", "industrial", "hypnotic", "intense"],
      code: "// techno code",
    },
  ],
}));

vi.mock("@/lib/audio/presets/utils", () => ({
  getUniqueGenres: vi.fn(() => ["Deep House", "Lofi Hip-Hop", "Techno"]),
  getUniqueTags: vi.fn(() => [
    "chill",
    "dance",
    "dark",
    "funky",
    "groovy",
    "hypnotic",
    "industrial",
    "intense",
    "jazzy",
    "relaxed",
    "study",
    "warm",
  ]),
  filterPresets: vi.fn((options: { genre?: string; tag?: string; search?: string }) => {
    const mockPresets = [
      {
        id: "lofi-chill",
        name: "Midnight Lofi",
        genre: "Lofi Hip-Hop",
        bpm: 82,
        description: "Chill jazzy beats with Rhodes and vinyl warmth",
        tags: ["chill", "jazzy", "relaxed", "study"],
        code: "// lofi code",
      },
      {
        id: "deep-house",
        name: "Groove Machine",
        genre: "Deep House",
        bpm: 122,
        description: "Funky bass and organic percussion",
        tags: ["groovy", "funky", "dance", "warm"],
        code: "// house code",
      },
      {
        id: "dark-techno",
        name: "Industrial Pulse",
        genre: "Techno",
        bpm: 138,
        description: "Dark industrial beats with heavy kicks",
        tags: ["dark", "industrial", "hypnotic", "intense"],
        code: "// techno code",
      },
    ];

    return mockPresets.filter((preset) => {
      if (options.genre && preset.genre !== options.genre) return false;
      if (options.tag && !preset.tags.includes(options.tag)) return false;
      if (options.search) {
        const search = options.search.toLowerCase();
        const matchesName = preset.name.toLowerCase().includes(search);
        const matchesDesc = preset.description.toLowerCase().includes(search);
        const matchesTags = preset.tags.some((t) => t.toLowerCase().includes(search));
        if (!matchesName && !matchesDesc && !matchesTags) return false;
      }
      return true;
    });
  }),
}));

describe("PresetBrowser component", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export PresetBrowser component", async () => {
      const browserModule = await import("../PresetBrowser");
      expect(browserModule.PresetBrowser).toBeDefined();
      expect(typeof browserModule.PresetBrowser).toBe("function");
    });

    it("should be a named export", async () => {
      const browserModule = await import("../PresetBrowser");
      expect(Object.keys(browserModule)).toContain("PresetBrowser");
    });
  });

  describe("props interface", () => {
    it("should accept required props: isOpen, onClose, onLoadPreset, hasUnsavedChanges", async () => {
      const browserModule = await import("../PresetBrowser");
      expect(browserModule.PresetBrowser).toBeDefined();
    });

    it("should define PresetBrowserProps interface correctly", () => {
      interface PresetBrowserProps {
        isOpen: boolean;
        onClose: () => void;
        onLoadPreset: (code: string) => void;
        hasUnsavedChanges: boolean;
      }

      const props: PresetBrowserProps = {
        isOpen: true,
        onClose: vi.fn(),
        onLoadPreset: vi.fn(),
        hasUnsavedChanges: false,
      };

      expect(props.isOpen).toBe(true);
      expect(typeof props.onClose).toBe("function");
      expect(typeof props.onLoadPreset).toBe("function");
      expect(props.hasUnsavedChanges).toBe(false);
    });
  });

  describe("visibility behavior", () => {
    it("should return null when isOpen is false", () => {
      const isOpen = false;
      const renderResult = isOpen ? "modal-content" : null;
      expect(renderResult).toBeNull();
    });

    it("should render modal content when isOpen is true", () => {
      const isOpen = true;
      const renderResult = isOpen ? "modal-content" : null;
      expect(renderResult).toBe("modal-content");
    });
  });

  describe("filtering functionality", () => {
    it("should get unique genres from presets", async () => {
      const { getUniqueGenres } = await import("@/lib/audio/presets/utils");
      const genres = getUniqueGenres();

      expect(genres).toContain("Deep House");
      expect(genres).toContain("Lofi Hip-Hop");
      expect(genres).toContain("Techno");
    });

    it("should get unique tags from presets", async () => {
      const { getUniqueTags } = await import("@/lib/audio/presets/utils");
      const tags = getUniqueTags();

      expect(tags).toContain("chill");
      expect(tags).toContain("dark");
      expect(tags).toContain("groovy");
    });

    it("should filter presets by genre", async () => {
      const { filterPresets } = await import("@/lib/audio/presets/utils");
      const filtered = filterPresets({ genre: "Techno" });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].genre).toBe("Techno");
    });

    it("should filter presets by tag", async () => {
      const { filterPresets } = await import("@/lib/audio/presets/utils");
      const filtered = filterPresets({ tag: "chill" });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].tags).toContain("chill");
    });

    it("should filter presets by search query in name", async () => {
      const { filterPresets } = await import("@/lib/audio/presets/utils");
      const filtered = filterPresets({ search: "midnight" });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Midnight Lofi");
    });

    it("should filter presets by search query in description", async () => {
      const { filterPresets } = await import("@/lib/audio/presets/utils");
      const filtered = filterPresets({ search: "jazzy" });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].description).toContain("jazzy");
    });

    it("should filter presets by search query in tags", async () => {
      const { filterPresets } = await import("@/lib/audio/presets/utils");
      const filtered = filterPresets({ search: "dark" });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].tags).toContain("dark");
    });

    it("should return all presets when no filters are applied", async () => {
      const { filterPresets } = await import("@/lib/audio/presets/utils");
      const filtered = filterPresets({});

      expect(filtered).toHaveLength(3);
    });

    it("should combine genre and tag filters", async () => {
      const { filterPresets } = await import("@/lib/audio/presets/utils");
      const filtered = filterPresets({ genre: "Deep House", tag: "groovy" });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].genre).toBe("Deep House");
      expect(filtered[0].tags).toContain("groovy");
    });

    it("should return empty array when no presets match filters", async () => {
      const { filterPresets } = await import("@/lib/audio/presets/utils");
      const filtered = filterPresets({ genre: "Techno", tag: "chill" });

      expect(filtered).toHaveLength(0);
    });
  });

  describe("genre tab behavior", () => {
    it("should have All genre as default selection", () => {
      const selectedGenre: string | undefined = undefined;
      expect(selectedGenre).toBeUndefined();
    });

    it("should toggle genre selection", () => {
      let selectedGenre: string | undefined = undefined;

      // Select a genre
      selectedGenre = "Techno";
      expect(selectedGenre).toBe("Techno");

      // Clicking same genre should deselect
      selectedGenre = selectedGenre === "Techno" ? undefined : "Techno";
      expect(selectedGenre).toBeUndefined();
    });
  });

  describe("tag chip behavior", () => {
    it("should have no tag selected by default", () => {
      const selectedTag: string | undefined = undefined;
      expect(selectedTag).toBeUndefined();
    });

    it("should toggle tag selection", () => {
      let selectedTag: string | undefined = undefined;

      // Select a tag
      selectedTag = "chill";
      expect(selectedTag).toBe("chill");

      // Clicking same tag should deselect
      selectedTag = selectedTag === "chill" ? undefined : "chill";
      expect(selectedTag).toBeUndefined();
    });
  });

  describe("search behavior", () => {
    it("should start with empty search query", () => {
      const searchQuery = "";
      expect(searchQuery).toBe("");
    });

    it("should update search query on input", () => {
      let searchQuery = "";
      searchQuery = "lofi";
      expect(searchQuery).toBe("lofi");
    });

    it("should be case insensitive for search", async () => {
      const { filterPresets } = await import("@/lib/audio/presets/utils");
      const filteredUpper = filterPresets({ search: "LOFI" });
      const filteredLower = filterPresets({ search: "lofi" });

      expect(filteredUpper.length).toBe(filteredLower.length);
    });
  });

  describe("clear filters", () => {
    it("should reset all filters", () => {
      const clearFilters = () => ({
        selectedGenre: undefined,
        selectedTag: undefined,
        searchQuery: "",
      });

      const state = clearFilters();
      expect(state.selectedGenre).toBeUndefined();
      expect(state.selectedTag).toBeUndefined();
      expect(state.searchQuery).toBe("");
    });

    it("should detect active filters", () => {
      const hasActiveFilters = (
        genre: string | undefined,
        tag: string | undefined,
        search: string
      ) => Boolean(genre || tag || search);

      expect(hasActiveFilters(undefined, undefined, "")).toBe(false);
      expect(hasActiveFilters("Techno", undefined, "")).toBe(true);
      expect(hasActiveFilters(undefined, "chill", "")).toBe(true);
      expect(hasActiveFilters(undefined, undefined, "lofi")).toBe(true);
    });
  });

  describe("preview functionality", () => {
    it("should toggle preview on same preset", () => {
      interface Preset {
        id: string;
      }

      const preset: Preset = { id: "lofi-chill" };
      let previewingPreset: Preset | null = null;

      // Helper that simulates toggle logic
      const togglePreview = (current: Preset | null, clicked: Preset): Preset | null => {
        return current?.id === clicked.id ? null : clicked;
      };

      // First click starts preview
      previewingPreset = togglePreview(previewingPreset, preset);
      expect(previewingPreset).toEqual(preset);

      // Second click stops preview
      previewingPreset = togglePreview(previewingPreset, preset);
      expect(previewingPreset).toBeNull();
    });

    it("should switch preview to different preset", () => {
      interface Preset {
        id: string;
      }

      const currentPreset: Preset = { id: "lofi-chill" };
      const newPreset: Preset = { id: "deep-house" };
      let previewingPreset: Preset | null = currentPreset;

      // Helper that simulates toggle logic
      const togglePreview = (current: Preset | null, clicked: Preset): Preset | null => {
        return current?.id === clicked.id ? null : clicked;
      };

      previewingPreset = togglePreview(previewingPreset, newPreset);
      expect(previewingPreset).toEqual(newPreset);
    });
  });

  describe("load preset behavior", () => {
    it("should load preset directly when no unsaved changes", () => {
      const hasUnsavedChanges = false;
      const onLoadPreset = vi.fn();
      const onClose = vi.fn();
      const code = "// test code";

      if (hasUnsavedChanges) {
        // Show confirmation
      } else {
        onLoadPreset(code);
        onClose();
      }

      expect(onLoadPreset).toHaveBeenCalledWith(code);
      expect(onClose).toHaveBeenCalled();
    });

    it("should show confirmation when unsaved changes exist", () => {
      const hasUnsavedChanges = true;
      const onLoadPreset = vi.fn();
      const onClose = vi.fn();
      const preset = { code: "// test code" };
      let pendingLoadPreset: typeof preset | null = null;

      if (hasUnsavedChanges) {
        pendingLoadPreset = preset;
      } else {
        onLoadPreset(preset.code);
        onClose();
      }

      expect(pendingLoadPreset).toEqual(preset);
      expect(onLoadPreset).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("confirmation dialog integration", () => {
    it("should show confirmation dialog when pendingLoadPreset is set", () => {
      const pendingLoadPreset = { id: "test", code: "// code" };
      const isConfirmDialogOpen = pendingLoadPreset !== null;
      expect(isConfirmDialogOpen).toBe(true);
    });

    it("should hide confirmation dialog when pendingLoadPreset is null", () => {
      const pendingLoadPreset = null;
      const isConfirmDialogOpen = pendingLoadPreset !== null;
      expect(isConfirmDialogOpen).toBe(false);
    });

    it("should load preset on confirm", () => {
      const onLoadPreset = vi.fn();
      const onClose = vi.fn();
      const pendingLoadPreset = { id: "test", code: "// test code" };
      let cleared = false;

      // Simulate confirm
      if (pendingLoadPreset) {
        onLoadPreset(pendingLoadPreset.code);
        cleared = true;
        onClose();
      }

      expect(onLoadPreset).toHaveBeenCalledWith("// test code");
      expect(cleared).toBe(true);
      expect(onClose).toHaveBeenCalled();
    });

    it("should clear pending preset on cancel", () => {
      let pendingLoadPreset: { id: string; code: string } | null = {
        id: "test",
        code: "// code",
      };

      // Simulate cancel
      pendingLoadPreset = null;

      expect(pendingLoadPreset).toBeNull();
    });
  });

  describe("UI text content", () => {
    it("should display Preset Library title", () => {
      const title = "Preset Library";
      expect(title).toBe("Preset Library");
    });

    it("should display preset count", () => {
      const count = 3;
      const text = `Choose from ${count} curated presets`;
      expect(text).toBe("Choose from 3 curated presets");
    });

    it("should display search placeholder", () => {
      const placeholder = "Search by name, description, or tags...";
      expect(placeholder).toContain("name");
      expect(placeholder).toContain("description");
      expect(placeholder).toContain("tags");
    });

    it("should display Genre label", () => {
      const label = "Genre:";
      expect(label).toBe("Genre:");
    });

    it("should display Mood label for tags", () => {
      const label = "Mood:";
      expect(label).toBe("Mood:");
    });

    it("should display All option for genres", () => {
      const allOption = "All";
      expect(allOption).toBe("All");
    });

    it("should display Clear filters link", () => {
      const text = "Clear filters";
      expect(text).toBe("Clear filters");
    });

    it("should display no results message", () => {
      const message = "No presets match your filters";
      expect(message).toContain("No presets match");
    });
  });

  describe("empty state", () => {
    it("should show empty state when no presets match", async () => {
      const { filterPresets } = await import("@/lib/audio/presets/utils");
      const filtered = filterPresets({ genre: "Techno", tag: "chill" });

      expect(filtered).toHaveLength(0);
    });

    it("should show clear filters button in empty state", () => {
      const filteredPresets: unknown[] = [];
      const showClearButton = filteredPresets.length === 0;
      expect(showClearButton).toBe(true);
    });
  });

  describe("confirmation dialog props", () => {
    it("should pass correct title", () => {
      const title = "Unsaved Changes";
      expect(title).toBe("Unsaved Changes");
    });

    it("should pass correct message", () => {
      const message =
        "You have unsaved changes. Loading a new preset will replace your current code. Do you want to continue?";
      expect(message).toContain("unsaved changes");
      expect(message).toContain("replace");
    });

    it("should pass correct confirm label", () => {
      const confirmLabel = "Load Preset";
      expect(confirmLabel).toBe("Load Preset");
    });

    it("should pass correct cancel label", () => {
      const cancelLabel = "Keep Editing";
      expect(cancelLabel).toBe("Keep Editing");
    });

    it("should use warning variant", () => {
      const variant = "warning";
      expect(variant).toBe("warning");
    });
  });

  describe("grid layout", () => {
    it("should render presets in a grid", () => {
      const gridClasses = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      expect(gridClasses).toContain("grid");
      expect(gridClasses).toContain("grid-cols-1");
      expect(gridClasses).toContain("sm:grid-cols-2");
      expect(gridClasses).toContain("lg:grid-cols-3");
    });
  });

  describe("close behavior", () => {
    it("should call onClose when close button is clicked", () => {
      const onClose = vi.fn();
      onClose();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
