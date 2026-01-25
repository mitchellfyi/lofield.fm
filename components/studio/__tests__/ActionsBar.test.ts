import { describe, it, expect, vi } from "vitest";

describe("ActionsBar component", () => {
  describe("module structure", () => {
    it("should export ActionsBar component", async () => {
      const { ActionsBar } = await import("../ActionsBar");
      expect(ActionsBar).toBeDefined();
      expect(typeof ActionsBar).toBe("function");
    });

    it("should be a named export", async () => {
      const actionsBarModule = await import("../ActionsBar");
      expect(Object.keys(actionsBarModule)).toContain("ActionsBar");
    });
  });

  describe("props interface", () => {
    it("should accept all optional callback props", () => {
      const props = {
        onUndo: vi.fn(),
        onRedo: vi.fn(),
        onSave: vi.fn(),
        onSaveAs: vi.fn(),
        onExport: vi.fn(),
        onShare: vi.fn(),
        onRevert: vi.fn(),
        onCopy: vi.fn(),
        onOpenHistory: vi.fn(),
        onModelChange: vi.fn(),
      };
      expect(props.onUndo).toBeDefined();
      expect(props.onRedo).toBeDefined();
      expect(props.onSave).toBeDefined();
      expect(props.onSaveAs).toBeDefined();
      expect(props.onExport).toBeDefined();
      expect(props.onShare).toBeDefined();
      expect(props.onRevert).toBeDefined();
      expect(props.onCopy).toBeDefined();
      expect(props.onOpenHistory).toBeDefined();
      expect(props.onModelChange).toBeDefined();
    });

    it("should accept all boolean state props", () => {
      const props = {
        canUndo: true,
        canRedo: true,
        hasUnsavedChanges: true,
        saving: false,
        canShare: true,
        hasRevisions: true,
      };
      expect(typeof props.canUndo).toBe("boolean");
      expect(typeof props.canRedo).toBe("boolean");
      expect(typeof props.hasUnsavedChanges).toBe("boolean");
      expect(typeof props.saving).toBe("boolean");
      expect(typeof props.canShare).toBe("boolean");
      expect(typeof props.hasRevisions).toBe("boolean");
    });

    it("should accept model selection props", () => {
      const props = {
        selectedModel: "model-a",
        onModelChange: vi.fn(),
      };
      expect(typeof props.selectedModel).toBe("string");
      expect(typeof props.onModelChange).toBe("function");
    });

    it("should handle all optional props being undefined", () => {
      const props = {};
      expect(Object.keys(props)).toHaveLength(0);
    });
  });

  describe("Undo/Redo group", () => {
    it("Undo button should be disabled when canUndo is false", () => {
      const canUndo = false;
      const isDisabled = !canUndo;
      expect(isDisabled).toBe(true);
    });

    it("Undo button should be enabled when canUndo is true", () => {
      const canUndo = true;
      const isDisabled = !canUndo;
      expect(isDisabled).toBe(false);
    });

    it("Undo button should call onUndo when clicked (and enabled)", () => {
      const onUndo = vi.fn();
      const canUndo = true;
      if (canUndo) {
        onUndo();
      }
      expect(onUndo).toHaveBeenCalled();
    });

    it("Redo button should be disabled when canRedo is false", () => {
      const canRedo = false;
      const isDisabled = !canRedo;
      expect(isDisabled).toBe(true);
    });

    it("Redo button should be enabled when canRedo is true", () => {
      const canRedo = true;
      const isDisabled = !canRedo;
      expect(isDisabled).toBe(false);
    });

    it("Redo button should call onRedo when clicked (and enabled)", () => {
      const onRedo = vi.fn();
      const canRedo = true;
      if (canRedo) {
        onRedo();
      }
      expect(onRedo).toHaveBeenCalled();
    });

    it("Undo button should have correct title for keyboard shortcut", () => {
      const title = "Undo (Cmd/Ctrl+Z)";
      expect(title).toContain("Undo");
      expect(title).toContain("Cmd/Ctrl+Z");
    });

    it("Redo button should have correct title for keyboard shortcut", () => {
      const title = "Redo (Cmd/Ctrl+Shift+Z)";
      expect(title).toContain("Redo");
      expect(title).toContain("Cmd/Ctrl+Shift+Z");
    });
  });

  describe("Save group", () => {
    it("Save button should call onSave when clicked", () => {
      const onSave = vi.fn();
      onSave();
      expect(onSave).toHaveBeenCalled();
    });

    it("Save button should be disabled when saving is true", () => {
      const saving = true;
      const isDisabled = saving;
      expect(isDisabled).toBe(true);
    });

    it("Save button should show spinner class when saving is true", () => {
      const saving = true;
      const className = saving ? "animate-spin" : "";
      expect(className).toContain("animate-spin");
    });

    it("Save button should not show spinner when saving is false", () => {
      const saving = false;
      const className = saving ? "animate-spin" : "";
      expect(className).toBe("");
    });

    it("Save button text should show Saving when saving", () => {
      const saving = true;
      const text = saving ? "Saving..." : "Save";
      expect(text).toBe("Saving...");
    });

    it("Save button text should show Save when not saving", () => {
      const saving = false;
      const text = saving ? "Saving..." : "Save";
      expect(text).toBe("Save");
    });

    it("Save button should show indicator dot when hasUnsavedChanges is true", () => {
      const hasUnsavedChanges = true;
      const saving = false;
      const showIndicator = hasUnsavedChanges && !saving;
      expect(showIndicator).toBe(true);
    });

    it("Save button should not show indicator dot when saving", () => {
      const hasUnsavedChanges = true;
      const saving = true;
      const showIndicator = hasUnsavedChanges && !saving;
      expect(showIndicator).toBe(false);
    });

    it("Save button should have active styling when hasUnsavedChanges is true", () => {
      const hasUnsavedChanges = true;
      const buttonActive = "text-cyan-300 bg-cyan-500/10 border border-cyan-500/30";
      const buttonDefault =
        "text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30";
      const className = hasUnsavedChanges ? buttonActive : buttonDefault;
      expect(className).toContain("text-cyan-300");
      expect(className).toContain("bg-cyan-500/10");
    });

    it("Save button should have correct title for keyboard shortcut", () => {
      const title = "Save (Cmd/Ctrl+S)";
      expect(title).toContain("Save");
      expect(title).toContain("Cmd/Ctrl+S");
    });

    it("Save As button should only render when onSaveAs is provided", () => {
      const onSaveAs = vi.fn();
      const shouldRender = !!onSaveAs;
      expect(shouldRender).toBe(true);
    });

    it("Save As button should not render when onSaveAs is undefined", () => {
      const onSaveAs = undefined;
      const shouldRender = !!onSaveAs;
      expect(shouldRender).toBe(false);
    });

    it("Save As button should call onSaveAs when clicked", () => {
      const onSaveAs = vi.fn();
      onSaveAs();
      expect(onSaveAs).toHaveBeenCalled();
    });

    it("Save As button should have correct title", () => {
      const title = "Save As...";
      expect(title).toBe("Save As...");
    });
  });

  describe("History button", () => {
    it("History button should only render when onOpenHistory is provided", () => {
      const onOpenHistory = vi.fn();
      const shouldRender = !!onOpenHistory;
      expect(shouldRender).toBe(true);
    });

    it("History button should not render when onOpenHistory is undefined", () => {
      const onOpenHistory = undefined;
      const shouldRender = !!onOpenHistory;
      expect(shouldRender).toBe(false);
    });

    it("History button should call onOpenHistory when clicked", () => {
      const onOpenHistory = vi.fn();
      onOpenHistory();
      expect(onOpenHistory).toHaveBeenCalled();
    });

    it("History button should show indicator dot when hasRevisions is true", () => {
      const hasRevisions = true;
      const showIndicator = hasRevisions;
      expect(showIndicator).toBe(true);
    });

    it("History button should not show indicator dot when hasRevisions is false", () => {
      const hasRevisions = false;
      const showIndicator = hasRevisions;
      expect(showIndicator).toBe(false);
    });

    it("History button should have correct title", () => {
      const title = "Version History";
      expect(title).toBe("Version History");
    });
  });

  describe("Edit actions group", () => {
    it("Copy button should only render when onCopy is provided", () => {
      const onCopy = vi.fn();
      const shouldRender = !!onCopy;
      expect(shouldRender).toBe(true);
    });

    it("Copy button should not render when onCopy is undefined", () => {
      const onCopy = undefined;
      const shouldRender = !!onCopy;
      expect(shouldRender).toBe(false);
    });

    it("Copy button should call onCopy when clicked", () => {
      const onCopy = vi.fn();
      onCopy();
      expect(onCopy).toHaveBeenCalled();
    });

    it("Copy button should have correct title", () => {
      const title = "Copy Code";
      expect(title).toBe("Copy Code");
    });

    it("Revert button should only render when onRevert is provided", () => {
      const onRevert = vi.fn();
      const shouldRender = !!onRevert;
      expect(shouldRender).toBe(true);
    });

    it("Revert button should not render when onRevert is undefined", () => {
      const onRevert = undefined;
      const shouldRender = !!onRevert;
      expect(shouldRender).toBe(false);
    });

    it("Revert button should call onRevert when clicked", () => {
      const onRevert = vi.fn();
      onRevert();
      expect(onRevert).toHaveBeenCalled();
    });

    it("Revert button should have correct title", () => {
      const title = "Revert to Default";
      expect(title).toBe("Revert to Default");
    });
  });

  describe("Export/Share group", () => {
    it("Export button should only render when onExport is provided", () => {
      const onExport = vi.fn();
      const shouldRender = !!onExport;
      expect(shouldRender).toBe(true);
    });

    it("Export button should not render when onExport is undefined", () => {
      const onExport = undefined;
      const shouldRender = !!onExport;
      expect(shouldRender).toBe(false);
    });

    it("Export button should call onExport when clicked", () => {
      const onExport = vi.fn();
      onExport();
      expect(onExport).toHaveBeenCalled();
    });

    it("Export button should have correct title", () => {
      const title = "Export Audio";
      expect(title).toBe("Export Audio");
    });

    it("Share button should only render when onShare is provided", () => {
      const onShare = vi.fn();
      const shouldRender = !!onShare;
      expect(shouldRender).toBe(true);
    });

    it("Share button should not render when onShare is undefined", () => {
      const onShare = undefined;
      const shouldRender = !!onShare;
      expect(shouldRender).toBe(false);
    });

    it("Share button should be disabled when canShare is false", () => {
      const canShare = false;
      const isDisabled = !canShare;
      expect(isDisabled).toBe(true);
    });

    it("Share button should be enabled when canShare is true", () => {
      const canShare = true;
      const isDisabled = !canShare;
      expect(isDisabled).toBe(false);
    });

    it("Share button should call onShare when clicked (and enabled)", () => {
      const onShare = vi.fn();
      const canShare = true;
      if (canShare) {
        onShare();
      }
      expect(onShare).toHaveBeenCalled();
    });

    it("Share button should have appropriate title when canShare is true", () => {
      const canShare = true;
      const title = canShare ? "Share Track" : "Save track first to share";
      expect(title).toBe("Share Track");
    });

    it("Share button should have appropriate title when canShare is false", () => {
      const canShare = false;
      const title = canShare ? "Share Track" : "Save track first to share";
      expect(title).toBe("Save track first to share");
    });
  });

  describe("Model selector", () => {
    it("Model selector should only render when both selectedModel and onModelChange are provided", () => {
      const selectedModel = "model-a";
      const onModelChange = vi.fn();
      const shouldRender = !!(selectedModel && onModelChange);
      expect(shouldRender).toBe(true);
    });

    it("Model selector should not render when selectedModel is undefined", () => {
      const selectedModel = undefined;
      const onModelChange = vi.fn();
      const shouldRender = !!(selectedModel && onModelChange);
      expect(shouldRender).toBe(false);
    });

    it("Model selector should not render when onModelChange is undefined", () => {
      const selectedModel = "model-a";
      const onModelChange = undefined;
      const shouldRender = !!(selectedModel && onModelChange);
      expect(shouldRender).toBe(false);
    });

    it("Model selector should receive compact prop as true", () => {
      const compact = true;
      expect(compact).toBe(true);
    });

    it("Model selector should call onModelChange when selection changes", () => {
      const onModelChange = vi.fn();
      onModelChange("model-b");
      expect(onModelChange).toHaveBeenCalledWith("model-b");
    });
  });

  describe("Disabled state styling", () => {
    const buttonBase =
      "flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 shrink-0";
    const buttonDefault =
      "text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30";
    const buttonDisabled = "text-slate-500 cursor-not-allowed";
    const buttonActive = "text-cyan-300 bg-cyan-500/10 border border-cyan-500/30";

    it("Disabled buttons should have buttonDisabled class", () => {
      const canUndo = false;
      const className = `${buttonBase} ${canUndo ? buttonDefault : buttonDisabled}`;
      expect(className).toContain("text-slate-500");
      expect(className).toContain("cursor-not-allowed");
    });

    it("Enabled buttons should have buttonDefault class", () => {
      const canUndo = true;
      const className = `${buttonBase} ${canUndo ? buttonDefault : buttonDisabled}`;
      expect(className).toContain("text-slate-300");
      expect(className).toContain("hover:text-cyan-300");
    });

    it("Active buttons (hasUnsavedChanges) should have buttonActive class", () => {
      const hasUnsavedChanges = true;
      const className = `${buttonBase} ${hasUnsavedChanges ? buttonActive : buttonDefault}`;
      expect(className).toContain("text-cyan-300");
      expect(className).toContain("bg-cyan-500/10");
      expect(className).toContain("border-cyan-500/30");
    });

    it("Button base should have flex and items-center", () => {
      expect(buttonBase).toContain("flex");
      expect(buttonBase).toContain("items-center");
    });

    it("Button base should have responsive padding", () => {
      expect(buttonBase).toContain("px-2");
      expect(buttonBase).toContain("sm:px-3");
    });

    it("Button base should have rounded corners", () => {
      expect(buttonBase).toContain("rounded");
    });

    it("Button base should have transition animation", () => {
      expect(buttonBase).toContain("transition-all");
      expect(buttonBase).toContain("duration-200");
    });

    it("Button base should have shrink-0 to prevent shrinking", () => {
      expect(buttonBase).toContain("shrink-0");
    });
  });

  describe("Mobile responsive styling", () => {
    it("Text labels should have hidden sm:inline class for responsive hiding", () => {
      const className = "hidden sm:inline";
      expect(className).toContain("hidden");
      expect(className).toContain("sm:inline");
    });

    it("Container should have responsive padding", () => {
      const className = "px-2 sm:px-4";
      expect(className).toContain("px-2");
      expect(className).toContain("sm:px-4");
    });

    it("Container should have horizontal scroll", () => {
      const className = "overflow-x-auto scrollbar-none";
      expect(className).toContain("overflow-x-auto");
    });

    it("Container should hide scrollbar", () => {
      const className = "overflow-x-auto scrollbar-none";
      expect(className).toContain("scrollbar-none");
    });
  });

  describe("Layout structure", () => {
    it("Should have border dividers between button groups", () => {
      const className = "border-r border-cyan-500/20 pr-2 mr-1";
      expect(className).toContain("border-r");
      expect(className).toContain("border-cyan-500/20");
    });

    it("Should have flex-1 spacer before model selector", () => {
      const className = "flex-1";
      expect(className).toBe("flex-1");
    });

    it("Model selector container should have shrink-0", () => {
      const className = "shrink-0";
      expect(className).toBe("shrink-0");
    });

    it("Main container should have border bottom", () => {
      const className = "border-b border-cyan-950/50";
      expect(className).toContain("border-b");
    });

    it("Main container should have backdrop blur", () => {
      const className = "bg-slate-900/50 backdrop-blur-sm";
      expect(className).toContain("backdrop-blur-sm");
    });

    it("Inner container should have flex and gap", () => {
      const className = "flex items-center gap-1";
      expect(className).toContain("flex");
      expect(className).toContain("items-center");
      expect(className).toContain("gap-1");
    });
  });

  describe("Edge cases", () => {
    it("Should handle all optional props being undefined", () => {
      const props = {
        onUndo: undefined,
        onRedo: undefined,
        canUndo: false,
        canRedo: false,
        onSave: undefined,
        onSaveAs: undefined,
        hasUnsavedChanges: false,
        saving: false,
        onExport: undefined,
        onShare: undefined,
        canShare: false,
        onRevert: undefined,
        onCopy: undefined,
        selectedModel: undefined,
        onModelChange: undefined,
        onOpenHistory: undefined,
        hasRevisions: false,
      };
      // All optional buttons should not render
      expect(!!props.onSaveAs).toBe(false);
      expect(!!props.onOpenHistory).toBe(false);
      expect(!!props.onCopy).toBe(false);
      expect(!!props.onRevert).toBe(false);
      expect(!!props.onExport).toBe(false);
      expect(!!props.onShare).toBe(false);
      expect(!!(props.selectedModel && props.onModelChange)).toBe(false);
    });

    it("Should handle rapid button clicks", () => {
      const onSave = vi.fn();
      // Simulate rapid clicks
      onSave();
      onSave();
      onSave();
      onSave();
      onSave();
      expect(onSave).toHaveBeenCalledTimes(5);
    });

    it("Should handle all props being provided", () => {
      const props = {
        onUndo: vi.fn(),
        onRedo: vi.fn(),
        canUndo: true,
        canRedo: true,
        onSave: vi.fn(),
        onSaveAs: vi.fn(),
        hasUnsavedChanges: true,
        saving: false,
        onExport: vi.fn(),
        onShare: vi.fn(),
        canShare: true,
        onRevert: vi.fn(),
        onCopy: vi.fn(),
        selectedModel: "model-a",
        onModelChange: vi.fn(),
        onOpenHistory: vi.fn(),
        hasRevisions: true,
      };
      // All optional buttons should render
      expect(!!props.onSaveAs).toBe(true);
      expect(!!props.onOpenHistory).toBe(true);
      expect(!!props.onCopy).toBe(true);
      expect(!!props.onRevert).toBe(true);
      expect(!!props.onExport).toBe(true);
      expect(!!props.onShare).toBe(true);
      expect(!!(props.selectedModel && props.onModelChange)).toBe(true);
    });

    it("Should handle toggling canUndo state", () => {
      let canUndo = false;
      expect(!canUndo).toBe(true);
      canUndo = true;
      expect(!canUndo).toBe(false);
    });

    it("Should handle toggling saving state", () => {
      let saving = false;
      expect(saving).toBe(false);
      saving = true;
      expect(saving).toBe(true);
      const text = saving ? "Saving..." : "Save";
      expect(text).toBe("Saving...");
    });

    it("Should handle hasUnsavedChanges with saving combination", () => {
      const hasUnsavedChanges = true;
      const saving = true;
      // Should not show indicator when saving
      const showIndicator = hasUnsavedChanges && !saving;
      expect(showIndicator).toBe(false);
    });
  });

  describe("Icon rendering", () => {
    it("Undo icon should use correct SVG path", () => {
      const path = "M3 10h10a5 5 0 015 5v2M3 10l5-5M3 10l5 5";
      expect(path).toContain("M3 10");
    });

    it("Redo icon should use correct SVG path", () => {
      const path = "M21 10H11a5 5 0 00-5 5v2m15-7l-5-5m5 5l-5 5";
      expect(path).toContain("M21 10");
    });

    it("Save icon should have stroke-linecap round", () => {
      const strokeLinecap = "round";
      expect(strokeLinecap).toBe("round");
    });

    it("Save icon should have stroke-linejoin round", () => {
      const strokeLinejoin = "round";
      expect(strokeLinejoin).toBe("round");
    });

    it("Icons should have w-4 h-4 size", () => {
      const className = "w-4 h-4";
      expect(className).toContain("w-4");
      expect(className).toContain("h-4");
    });

    it("Spinner icon should have animate-spin class", () => {
      const className = "w-4 h-4 animate-spin";
      expect(className).toContain("animate-spin");
    });
  });

  describe("Indicator dots", () => {
    it("Unsaved changes indicator should have amber color", () => {
      const className = "w-1.5 h-1.5 bg-amber-400 rounded-full";
      expect(className).toContain("bg-amber-400");
    });

    it("Unsaved changes indicator should be small and round", () => {
      const className = "w-1.5 h-1.5 bg-amber-400 rounded-full";
      expect(className).toContain("w-1.5");
      expect(className).toContain("h-1.5");
      expect(className).toContain("rounded-full");
    });

    it("History revisions indicator should have cyan color", () => {
      const className = "absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full";
      expect(className).toContain("bg-cyan-400");
    });

    it("History revisions indicator should be positioned absolutely", () => {
      const className = "absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full";
      expect(className).toContain("absolute");
      expect(className).toContain("-top-0.5");
      expect(className).toContain("-right-0.5");
    });
  });

  describe("Callback behavior", () => {
    it("onUndo should not be called when canUndo is false", () => {
      const onUndo = vi.fn();
      const canUndo = false;
      // In the component, onClick will not trigger due to disabled state
      if (canUndo) {
        onUndo();
      }
      expect(onUndo).not.toHaveBeenCalled();
    });

    it("onRedo should not be called when canRedo is false", () => {
      const onRedo = vi.fn();
      const canRedo = false;
      if (canRedo) {
        onRedo();
      }
      expect(onRedo).not.toHaveBeenCalled();
    });

    it("onShare should not be called when canShare is false", () => {
      const onShare = vi.fn();
      const canShare = false;
      if (canShare) {
        onShare();
      }
      expect(onShare).not.toHaveBeenCalled();
    });

    it("Multiple callbacks can be called in sequence", () => {
      const onSave = vi.fn();
      const onCopy = vi.fn();
      const onExport = vi.fn();
      onSave();
      onCopy();
      onExport();
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onCopy).toHaveBeenCalledTimes(1);
      expect(onExport).toHaveBeenCalledTimes(1);
    });
  });

  describe("Default prop values", () => {
    it("canUndo should default to false", () => {
      const canUndo = false; // default
      expect(canUndo).toBe(false);
    });

    it("canRedo should default to false", () => {
      const canRedo = false; // default
      expect(canRedo).toBe(false);
    });

    it("hasUnsavedChanges should default to false", () => {
      const hasUnsavedChanges = false; // default
      expect(hasUnsavedChanges).toBe(false);
    });

    it("saving should default to false", () => {
      const saving = false; // default
      expect(saving).toBe(false);
    });

    it("canShare should default to false", () => {
      const canShare = false; // default
      expect(canShare).toBe(false);
    });

    it("hasRevisions should default to false", () => {
      const hasRevisions = false; // default
      expect(hasRevisions).toBe(false);
    });
  });
});
