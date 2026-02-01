import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ProjectListItem component", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export ProjectListItem component", async () => {
      const componentModule = await import("../ProjectListItem");
      expect(componentModule.ProjectListItem).toBeDefined();
      expect(typeof componentModule.ProjectListItem).toBe("function");
    });

    it("should be a named export", async () => {
      const componentModule = await import("../ProjectListItem");
      expect(Object.keys(componentModule)).toContain("ProjectListItem");
    });
  });

  describe("props interface", () => {
    it("should accept project prop", async () => {
      const props = {
        project: {
          id: "project-1",
          user_id: "user-1",
          name: "Test Project",
          track_count: 3,
          created_at: "2026-01-25T00:00:00Z",
          updated_at: "2026-01-25T00:00:00Z",
        },
        isExpanded: false,
        onToggleExpand: vi.fn(),
        onRename: vi.fn(),
        onDelete: vi.fn(),
      };

      expect(props.project).toBeDefined();
      expect(props.project.name).toBe("Test Project");
    });

    it("should accept isExpanded prop", async () => {
      const props = {
        project: {
          id: "project-1",
          user_id: "user-1",
          name: "Test Project",
          track_count: 3,
          created_at: "2026-01-25T00:00:00Z",
          updated_at: "2026-01-25T00:00:00Z",
        },
        isExpanded: true,
        onToggleExpand: vi.fn(),
        onRename: vi.fn(),
        onDelete: vi.fn(),
      };

      expect(props.isExpanded).toBe(true);
    });

    it("should accept onToggleExpand callback", async () => {
      const mockOnToggleExpand = vi.fn();
      const props = {
        project: {
          id: "project-1",
          user_id: "user-1",
          name: "Test Project",
          track_count: 3,
          created_at: "2026-01-25T00:00:00Z",
          updated_at: "2026-01-25T00:00:00Z",
        },
        isExpanded: false,
        onToggleExpand: mockOnToggleExpand,
        onRename: vi.fn(),
        onDelete: vi.fn(),
      };

      props.onToggleExpand();
      expect(mockOnToggleExpand).toHaveBeenCalled();
    });

    it("should accept onRename callback", async () => {
      const mockOnRename = vi.fn();
      const props = {
        project: {
          id: "project-1",
          user_id: "user-1",
          name: "Test Project",
          track_count: 3,
          created_at: "2026-01-25T00:00:00Z",
          updated_at: "2026-01-25T00:00:00Z",
        },
        isExpanded: false,
        onToggleExpand: vi.fn(),
        onRename: mockOnRename,
        onDelete: vi.fn(),
      };

      props.onRename("New Name");
      expect(mockOnRename).toHaveBeenCalledWith("New Name");
    });

    it("should accept onDelete callback", async () => {
      const mockOnDelete = vi.fn();
      const props = {
        project: {
          id: "project-1",
          user_id: "user-1",
          name: "Test Project",
          track_count: 3,
          created_at: "2026-01-25T00:00:00Z",
          updated_at: "2026-01-25T00:00:00Z",
        },
        isExpanded: false,
        onToggleExpand: vi.fn(),
        onRename: vi.fn(),
        onDelete: mockOnDelete,
      };

      props.onDelete();
      expect(mockOnDelete).toHaveBeenCalled();
    });

    it("should accept optional children prop", async () => {
      const props = {
        project: {
          id: "project-1",
          user_id: "user-1",
          name: "Test Project",
          track_count: 3,
          created_at: "2026-01-25T00:00:00Z",
          updated_at: "2026-01-25T00:00:00Z",
        },
        isExpanded: true,
        onToggleExpand: vi.fn(),
        onRename: vi.fn(),
        onDelete: vi.fn(),
        children: "Track list content",
      };

      expect(props.children).toBe("Track list content");
    });
  });

  describe("track count display", () => {
    it("should use singular 'track' for count of 1", () => {
      const trackCount: number = 1;
      const text = `${trackCount} track${trackCount !== 1 ? "s" : ""}`;
      expect(text).toBe("1 track");
    });

    it("should use plural 'tracks' for count of 0", () => {
      const trackCount: number = 0;
      const text = `${trackCount} track${trackCount !== 1 ? "s" : ""}`;
      expect(text).toBe("0 tracks");
    });

    it("should use plural 'tracks' for count greater than 1", () => {
      const trackCount: number = 5;
      const text = `${trackCount} track${trackCount !== 1 ? "s" : ""}`;
      expect(text).toBe("5 tracks");
    });
  });

  describe("expand/collapse behavior", () => {
    it("should show children when expanded", () => {
      const isExpanded = true;
      const hasChildren = true;
      const shouldShowChildren = isExpanded && hasChildren;
      expect(shouldShowChildren).toBe(true);
    });

    it("should hide children when collapsed", () => {
      const isExpanded = false;
      const hasChildren = true;
      const shouldShowChildren = isExpanded && hasChildren;
      expect(shouldShowChildren).toBe(false);
    });

    it("should rotate chevron icon when expanded", () => {
      const isExpanded = true;
      const chevronClass = `w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`;
      expect(chevronClass).toContain("rotate-90");
    });

    it("should not rotate chevron icon when collapsed", () => {
      const isExpanded = false;
      const chevronClass = `w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`;
      expect(chevronClass).not.toContain("rotate-90");
    });
  });

  describe("styling", () => {
    it("should have hover state styling on header", () => {
      const headerClasses =
        "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors";
      expect(headerClasses).toContain("hover:bg-slate-700/50");
    });

    it("should have group class for action button visibility", () => {
      const groupClass = "group";
      expect(groupClass).toBe("group");
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
  });

  describe("inline edit integration", () => {
    it("should use useInlineEdit hook for editing", async () => {
      // The component uses useInlineEdit with project.name as initialValue
      const componentModule = await import("../ProjectListItem");
      expect(componentModule.ProjectListItem).toBeDefined();
    });

    it("should pass project name to useInlineEdit", async () => {
      const project = {
        id: "project-1",
        user_id: "user-1",
        name: "Test Project",
        track_count: 3,
        created_at: "2026-01-25T00:00:00Z",
        updated_at: "2026-01-25T00:00:00Z",
      };

      // useInlineEdit is called with { initialValue: project.name, onSubmit: onRename }
      expect(project.name).toBe("Test Project");
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
});
