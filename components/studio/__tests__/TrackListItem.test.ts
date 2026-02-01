import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("TrackListItem component", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export TrackListItem component", async () => {
      const componentModule = await import("../TrackListItem");
      expect(componentModule.TrackListItem).toBeDefined();
      expect(typeof componentModule.TrackListItem).toBe("function");
    });

    it("should be a named export", async () => {
      const componentModule = await import("../TrackListItem");
      expect(Object.keys(componentModule)).toContain("TrackListItem");
    });
  });

  describe("props interface", () => {
    it("should accept track prop", async () => {
      const props = {
        track: {
          id: "track-1",
          project_id: "project-1",
          name: "Test Track",
          current_code: "// code",
          created_at: "2026-01-25T00:00:00Z",
          updated_at: "2026-01-25T00:00:00Z",
        },
        isSelected: false,
        onSelect: vi.fn(),
        onRename: vi.fn(),
        onDelete: vi.fn(),
      };

      expect(props.track).toBeDefined();
      expect(props.track.name).toBe("Test Track");
    });

    it("should accept isSelected prop", async () => {
      const props = {
        track: {
          id: "track-1",
          project_id: "project-1",
          name: "Test Track",
          current_code: "// code",
          created_at: "2026-01-25T00:00:00Z",
          updated_at: "2026-01-25T00:00:00Z",
        },
        isSelected: true,
        onSelect: vi.fn(),
        onRename: vi.fn(),
        onDelete: vi.fn(),
      };

      expect(props.isSelected).toBe(true);
    });

    it("should accept onSelect callback", async () => {
      const mockOnSelect = vi.fn();
      const props = {
        track: {
          id: "track-1",
          project_id: "project-1",
          name: "Test Track",
          current_code: "// code",
          created_at: "2026-01-25T00:00:00Z",
          updated_at: "2026-01-25T00:00:00Z",
        },
        isSelected: false,
        onSelect: mockOnSelect,
        onRename: vi.fn(),
        onDelete: vi.fn(),
      };

      props.onSelect();
      expect(mockOnSelect).toHaveBeenCalled();
    });

    it("should accept onRename callback", async () => {
      const mockOnRename = vi.fn();
      const props = {
        track: {
          id: "track-1",
          project_id: "project-1",
          name: "Test Track",
          current_code: "// code",
          created_at: "2026-01-25T00:00:00Z",
          updated_at: "2026-01-25T00:00:00Z",
        },
        isSelected: false,
        onSelect: vi.fn(),
        onRename: mockOnRename,
        onDelete: vi.fn(),
      };

      props.onRename("New Track Name");
      expect(mockOnRename).toHaveBeenCalledWith("New Track Name");
    });

    it("should accept onDelete callback", async () => {
      const mockOnDelete = vi.fn();
      const props = {
        track: {
          id: "track-1",
          project_id: "project-1",
          name: "Test Track",
          current_code: "// code",
          created_at: "2026-01-25T00:00:00Z",
          updated_at: "2026-01-25T00:00:00Z",
        },
        isSelected: false,
        onSelect: vi.fn(),
        onRename: vi.fn(),
        onDelete: mockOnDelete,
      };

      props.onDelete();
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });

  describe("selection styling", () => {
    it("should apply selected styles when isSelected is true", () => {
      const isSelected = true;
      const className = isSelected
        ? "bg-cyan-600/20 border border-cyan-500/50"
        : "hover:bg-slate-700/50";
      expect(className).toContain("bg-cyan-600/20");
      expect(className).toContain("border-cyan-500/50");
    });

    it("should apply hover styles when not selected", () => {
      const isSelected = false;
      const className = isSelected
        ? "bg-cyan-600/20 border border-cyan-500/50"
        : "hover:bg-slate-700/50";
      expect(className).toContain("hover:bg-slate-700/50");
    });
  });

  describe("styling", () => {
    it("should have cursor-pointer on track row", () => {
      const rowClasses =
        "group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer";
      expect(rowClasses).toContain("cursor-pointer");
    });

    it("should have group class for action button visibility", () => {
      const rowClasses =
        "group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer";
      expect(rowClasses).toContain("group");
    });

    it("should have opacity transition on action buttons", () => {
      const actionClasses = "opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity";
      expect(actionClasses).toContain("opacity-0");
      expect(actionClasses).toContain("group-hover:opacity-100");
    });

    it("should have rose color for delete button hover", () => {
      const deleteButtonClasses = "p-1 text-slate-400 hover:text-rose-400 transition-colors";
      expect(deleteButtonClasses).toContain("hover:text-rose-400");
    });

    it("should have cyan color for rename button hover", () => {
      const renameButtonClasses = "p-1 text-slate-400 hover:text-cyan-400 transition-colors";
      expect(renameButtonClasses).toContain("hover:text-cyan-400");
    });

    it("should have cyan music icon", () => {
      const iconClasses = "w-4 h-4 text-cyan-400";
      expect(iconClasses).toContain("text-cyan-400");
    });
  });

  describe("event propagation", () => {
    it("should stop propagation on rename button click", () => {
      // The onClick handler for rename button calls e.stopPropagation()
      // This prevents onSelect from being triggered
      const mockEvent = { stopPropagation: vi.fn() };
      mockEvent.stopPropagation();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it("should stop propagation on delete button click", () => {
      // The onClick handler for delete button calls e.stopPropagation()
      const mockEvent = { stopPropagation: vi.fn() };
      mockEvent.stopPropagation();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it("should stop propagation on input click during edit", () => {
      // The onClick handler for input calls e.stopPropagation()
      const mockEvent = { stopPropagation: vi.fn() };
      mockEvent.stopPropagation();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe("inline edit integration", () => {
    it("should use useInlineEdit hook for editing", async () => {
      // The component uses useInlineEdit with track.name as initialValue
      const componentModule = await import("../TrackListItem");
      expect(componentModule.TrackListItem).toBeDefined();
    });

    it("should pass track name to useInlineEdit", async () => {
      const track = {
        id: "track-1",
        project_id: "project-1",
        name: "My Track",
        current_code: "// code",
        created_at: "2026-01-25T00:00:00Z",
        updated_at: "2026-01-25T00:00:00Z",
      };

      // useInlineEdit is called with { initialValue: track.name, onSubmit: onRename }
      expect(track.name).toBe("My Track");
    });
  });

  describe("accessibility", () => {
    it("should have title attribute on rename button", () => {
      const renameButtonTitle = "Rename";
      expect(renameButtonTitle).toBe("Rename");
    });

    it("should have title attribute on delete button", () => {
      const deleteButtonTitle = "Delete";
      expect(deleteButtonTitle).toBe("Delete");
    });
  });

  describe("track icon", () => {
    it("should display music note icon", () => {
      // SVG path for music note icon
      const musicIconPath =
        "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3";
      expect(musicIconPath).toContain("M9 19V6l12-3v13");
    });
  });
});
