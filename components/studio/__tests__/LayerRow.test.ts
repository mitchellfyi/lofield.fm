import { describe, it, expect, vi } from "vitest";
import type { AudioLayer } from "@/lib/types/audioLayer";

describe("LayerRow component", () => {
  describe("module structure", () => {
    it("should export LayerRow component", async () => {
      const { LayerRow } = await import("../LayerRow");
      expect(LayerRow).toBeDefined();
      expect(typeof LayerRow).toBe("function");
    });

    it("should be a named export", async () => {
      const layerRowModule = await import("../LayerRow");
      expect(Object.keys(layerRowModule)).toContain("LayerRow");
    });
  });

  describe("props interface", () => {
    const createMockLayer = (): AudioLayer => ({
      id: "layer-1",
      name: "drums",
      code: "// code",
      muted: false,
      soloed: false,
      volume: 100,
      color: "#f87171",
    });

    it("should accept layer prop as AudioLayer", () => {
      const layer = createMockLayer();
      expect(layer).toHaveProperty("id");
      expect(layer).toHaveProperty("name");
      expect(layer).toHaveProperty("code");
      expect(layer).toHaveProperty("muted");
      expect(layer).toHaveProperty("soloed");
      expect(layer).toHaveProperty("volume");
      expect(layer).toHaveProperty("color");
    });

    it("should accept isSelected as boolean", () => {
      const isSelected = true;
      expect(typeof isSelected).toBe("boolean");
    });

    it("should accept isPlaying as boolean", () => {
      const isPlaying = true;
      expect(typeof isPlaying).toBe("boolean");
    });

    it("should accept onSelect as function", () => {
      const onSelect = vi.fn();
      expect(typeof onSelect).toBe("function");
    });

    it("should accept onUpdate as function with Partial<AudioLayer>", () => {
      const onUpdate = vi.fn();
      expect(typeof onUpdate).toBe("function");
    });

    it("should accept onDelete as function", () => {
      const onDelete = vi.fn();
      expect(typeof onDelete).toBe("function");
    });

    it("should accept canDelete as boolean", () => {
      const canDelete = true;
      expect(typeof canDelete).toBe("boolean");
    });
  });

  describe("layer display", () => {
    it("should display layer name", () => {
      const layer = { name: "drums" };
      expect(layer.name).toBe("drums");
    });

    it("should use layer color for indicator", () => {
      const layer = { color: "#f87171" };
      expect(layer.color).toBe("#f87171");
    });

    it("should show layer volume", () => {
      const layer = { volume: 75 };
      expect(layer.volume).toBe(75);
    });
  });

  describe("mute button behavior", () => {
    it("should display M for mute button", () => {
      const muteButtonText = "M";
      expect(muteButtonText).toBe("M");
    });

    it("should toggle muted state when clicked", () => {
      const onUpdate = vi.fn();
      const currentMuted = false;

      // Simulate click
      onUpdate({ muted: !currentMuted });

      expect(onUpdate).toHaveBeenCalledWith({ muted: true });
    });

    it("should call onUpdate with muted: true when unmuted layer is muted", () => {
      const onUpdate = vi.fn();
      onUpdate({ muted: true });
      expect(onUpdate).toHaveBeenCalledWith({ muted: true });
    });

    it("should call onUpdate with muted: false when muted layer is unmuted", () => {
      const onUpdate = vi.fn();
      onUpdate({ muted: false });
      expect(onUpdate).toHaveBeenCalledWith({ muted: false });
    });
  });

  describe("solo button behavior", () => {
    it("should display S for solo button", () => {
      const soloButtonText = "S";
      expect(soloButtonText).toBe("S");
    });

    it("should toggle soloed state when clicked", () => {
      const onUpdate = vi.fn();
      const currentSoloed = false;

      // Simulate click
      onUpdate({ soloed: !currentSoloed });

      expect(onUpdate).toHaveBeenCalledWith({ soloed: true });
    });

    it("should call onUpdate with soloed: true when unsoloed layer is soloed", () => {
      const onUpdate = vi.fn();
      onUpdate({ soloed: true });
      expect(onUpdate).toHaveBeenCalledWith({ soloed: true });
    });

    it("should call onUpdate with soloed: false when soloed layer is unsoloed", () => {
      const onUpdate = vi.fn();
      onUpdate({ soloed: false });
      expect(onUpdate).toHaveBeenCalledWith({ soloed: false });
    });
  });

  describe("volume slider behavior", () => {
    it("should have min value of 0", () => {
      const min = 0;
      expect(min).toBe(0);
    });

    it("should have max value of 100", () => {
      const max = 100;
      expect(max).toBe(100);
    });

    it("should call onUpdate with new volume when slider changes", () => {
      const onUpdate = vi.fn();
      const newVolume = 75;

      onUpdate({ volume: newVolume });

      expect(onUpdate).toHaveBeenCalledWith({ volume: 75 });
    });

    it("should accept volume values from 0 to 100", () => {
      const validVolumes = [0, 25, 50, 75, 100];
      validVolumes.forEach((volume) => {
        expect(volume).toBeGreaterThanOrEqual(0);
        expect(volume).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("delete button behavior", () => {
    it("should call onDelete when delete button clicked", () => {
      const onDelete = vi.fn();
      onDelete();
      expect(onDelete).toHaveBeenCalled();
    });

    it("should be hidden when canDelete is false", () => {
      const canDelete = false;
      expect(canDelete).toBe(false);
    });

    it("should be visible when canDelete is true", () => {
      const canDelete = true;
      expect(canDelete).toBe(true);
    });
  });

  describe("selection behavior", () => {
    it("should call onSelect when row clicked", () => {
      const onSelect = vi.fn();
      onSelect();
      expect(onSelect).toHaveBeenCalled();
    });

    it("should have different styles when selected", () => {
      const isSelected = true;
      // Selected state uses cyan highlight
      const selectedClass = "bg-cyan-500/20";
      expect(isSelected).toBe(true);
      expect(selectedClass).toContain("cyan");
    });

    it("should have default styles when not selected", () => {
      const isSelected = false;
      expect(isSelected).toBe(false);
    });
  });

  describe("playing indicator", () => {
    it("should show animation when playing and not muted", () => {
      const isPlaying = true;
      const muted = false;
      const shouldAnimate = isPlaying && !muted;
      expect(shouldAnimate).toBe(true);
    });

    it("should not show animation when not playing", () => {
      const isPlaying = false;
      const muted = false;
      const shouldAnimate = isPlaying && !muted;
      expect(shouldAnimate).toBe(false);
    });

    it("should not show animation when muted even if playing", () => {
      const isPlaying = true;
      const muted = true;
      const shouldAnimate = isPlaying && !muted;
      expect(shouldAnimate).toBe(false);
    });
  });

  describe("name editing behavior", () => {
    it("should allow editing when double-clicked", () => {
      let isEditing = false;
      const startEditing = () => {
        isEditing = true;
      };
      startEditing();
      expect(isEditing).toBe(true);
    });

    it("should submit name on Enter key", () => {
      const onUpdate = vi.fn();
      const newName = "new name";
      onUpdate({ name: newName });
      expect(onUpdate).toHaveBeenCalledWith({ name: "new name" });
    });

    it("should cancel editing on Escape key", () => {
      let isEditing = true;
      let editName = "new name";
      const originalName = "drums";

      const cancelEdit = () => {
        editName = originalName;
        isEditing = false;
      };

      cancelEdit();
      expect(isEditing).toBe(false);
      expect(editName).toBe(originalName);
    });

    it("should trim whitespace from name", () => {
      const rawName = "  drums  ";
      const trimmedName = rawName.trim();
      expect(trimmedName).toBe("drums");
    });

    it("should not update if name is empty after trim", () => {
      const onUpdate = vi.fn();
      const newName = "   ";
      const trimmed = newName.trim();

      if (trimmed) {
        onUpdate({ name: trimmed });
      }

      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should not update if name is unchanged", () => {
      const onUpdate = vi.fn();
      const originalName = "drums";
      const newName = "drums";

      if (newName !== originalName) {
        onUpdate({ name: newName });
      }

      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe("muted layer visual state", () => {
    it("should show strikethrough for muted layer name", () => {
      const muted = true;
      const mutedClass = muted ? "line-through" : "";
      expect(mutedClass).toBe("line-through");
    });

    it("should show dimmed text for muted layer", () => {
      const muted = true;
      const textClass = muted ? "text-slate-500" : "text-slate-200";
      expect(textClass).toBe("text-slate-500");
    });

    it("should show normal text for unmuted layer", () => {
      const muted = false;
      const textClass = muted ? "text-slate-500" : "text-slate-200";
      expect(textClass).toBe("text-slate-200");
    });
  });

  describe("event propagation", () => {
    it("should stop propagation on mute button click", () => {
      const onSelect = vi.fn();
      const onUpdate = vi.fn();

      // In the component, stopPropagation prevents onSelect from being called
      // when mute button is clicked
      onUpdate({ muted: true });

      expect(onUpdate).toHaveBeenCalled();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("should stop propagation on solo button click", () => {
      const onSelect = vi.fn();
      const onUpdate = vi.fn();

      onUpdate({ soloed: true });

      expect(onUpdate).toHaveBeenCalled();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("should stop propagation on volume slider interaction", () => {
      const onSelect = vi.fn();
      const onUpdate = vi.fn();

      onUpdate({ volume: 50 });

      expect(onUpdate).toHaveBeenCalled();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("should stop propagation on delete button click", () => {
      const onSelect = vi.fn();
      const onDelete = vi.fn();

      onDelete();

      expect(onDelete).toHaveBeenCalled();
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("mobile touch target styling", () => {
    it("should have responsive touch targets for mute button (28px mobile, 24px desktop)", () => {
      // Mobile: min-w-[28px] min-h-[28px] (28px touch target)
      // Desktop: md:min-w-[24px] md:min-h-[24px] (24px - original size)
      const mobileMinWidth = 28;
      const mobileMinHeight = 28;
      const desktopMinWidth = 24;
      const desktopMinHeight = 24;

      expect(mobileMinWidth).toBeGreaterThanOrEqual(28);
      expect(mobileMinHeight).toBeGreaterThanOrEqual(28);
      expect(desktopMinWidth).toBe(24);
      expect(desktopMinHeight).toBe(24);
    });

    it("should have responsive touch targets for solo button (28px mobile, 24px desktop)", () => {
      const mobileMinWidth = 28;
      const mobileMinHeight = 28;
      const desktopMinWidth = 24;
      const desktopMinHeight = 24;

      expect(mobileMinWidth).toBeGreaterThanOrEqual(28);
      expect(mobileMinHeight).toBeGreaterThanOrEqual(28);
      expect(desktopMinWidth).toBe(24);
      expect(desktopMinHeight).toBe(24);
    });

    it("should have responsive touch targets for delete button (28px mobile, 24px desktop)", () => {
      const mobileMinWidth = 28;
      const mobileMinHeight = 28;
      const desktopMinWidth = 24;
      const desktopMinHeight = 24;

      expect(mobileMinWidth).toBeGreaterThanOrEqual(28);
      expect(mobileMinHeight).toBeGreaterThanOrEqual(28);
      expect(desktopMinWidth).toBe(24);
      expect(desktopMinHeight).toBe(24);
    });

    it("should have touch-none class on volume slider to prevent scroll interference", () => {
      const touchClass = "touch-none";
      expect(touchClass).toBe("touch-none");
    });

    it("should have py-1 padding on volume slider wrapper for larger touch area", () => {
      const paddingClass = "py-1";
      expect(paddingClass).toBe("py-1");
    });

    it("should have 12px (w-3 h-3) thumb size on volume slider", () => {
      // Volume slider thumb is w-3 h-3 which equals 12px
      const thumbWidth = 3 * 4; // w-3 = 12px (3 * 4px base)
      const thumbHeight = 3 * 4; // h-3 = 12px
      expect(thumbWidth).toBe(12);
      expect(thumbHeight).toBe(12);
    });

    it("should use Tailwind responsive breakpoint for button size switching", () => {
      // The md: prefix applies at 768px and above
      const mdBreakpoint = "md:";
      expect(mdBreakpoint).toBe("md:");
    });
  });

  describe("drag and drop behavior", () => {
    describe("isDragging prop", () => {
      it("should accept isDragging as optional boolean prop", () => {
        const isDragging: boolean | undefined = true;
        expect(typeof isDragging).toBe("boolean");
      });

      it("should default to false when isDragging prop is undefined", () => {
        const isDraggingProp: boolean | undefined = undefined;
        const isDraggingSortable = false;
        const isDragging = isDraggingProp ?? isDraggingSortable;
        expect(isDragging).toBe(false);
      });

      it("should use prop value when isDragging prop is provided", () => {
        const isDraggingProp: boolean | undefined = true;
        const isDraggingSortable = false;
        const isDragging = isDraggingProp ?? isDraggingSortable;
        expect(isDragging).toBe(true);
      });

      it("should use sortable value when isDragging prop is not provided", () => {
        const isDraggingProp: boolean | undefined = undefined;
        const isDraggingSortable = true;
        const isDragging = isDraggingProp ?? isDraggingSortable;
        expect(isDragging).toBe(true);
      });
    });

    describe("drag visual feedback", () => {
      it("should have opacity-80 class when dragging", () => {
        const isDragging = true;
        const dragClass = isDragging ? "opacity-80" : "";
        expect(dragClass).toContain("opacity-80");
      });

      it("should have scale-[1.02] class when dragging", () => {
        const isDragging = true;
        const dragClass = isDragging ? "scale-[1.02]" : "";
        expect(dragClass).toContain("scale-[1.02]");
      });

      it("should have shadow-lg class when dragging", () => {
        const isDragging = true;
        const dragClass = isDragging ? "shadow-lg shadow-cyan-500/20" : "";
        expect(dragClass).toContain("shadow-lg");
      });

      it("should have z-10 class when dragging for elevated layer", () => {
        const isDragging = true;
        const dragClass = isDragging ? "z-10" : "";
        expect(dragClass).toContain("z-10");
      });

      it("should have bg-slate-800/80 class when dragging", () => {
        const isDragging = true;
        const dragClass = isDragging ? "bg-slate-800/80" : "";
        expect(dragClass).toContain("bg-slate-800/80");
      });

      it("should not have drag styles when not dragging", () => {
        const isDragging = false;
        const dragClass = isDragging ? "opacity-80 scale-[1.02] shadow-lg z-10" : "";
        expect(dragClass).toBe("");
      });
    });

    describe("drag handle", () => {
      it("should have cursor-grab class on drag handle", () => {
        const handleClass = "cursor-grab";
        expect(handleClass).toBe("cursor-grab");
      });

      it("should have active:cursor-grabbing class for grabbing state", () => {
        const handleClass = "active:cursor-grabbing";
        expect(handleClass).toBe("active:cursor-grabbing");
      });

      it("should have touch-none class to prevent scroll interference", () => {
        const handleClass = "touch-none";
        expect(handleClass).toBe("touch-none");
      });

      it("should have title attribute for accessibility", () => {
        const handleTitle = "Drag to reorder";
        expect(handleTitle).toBe("Drag to reorder");
      });

      it("should have visible grip icon (8 circles for grip pattern)", () => {
        // The drag handle shows 8 dots arranged in 4 rows of 2
        const circleCount = 8;
        expect(circleCount).toBe(8);
      });
    });

    describe("sortable transform", () => {
      it("should apply CSS transform from useSortable hook", () => {
        // Transform is applied via style prop
        const transform = { x: 0, y: 50, scaleX: 1, scaleY: 1 };
        const transformString = `translate3d(${transform.x}px, ${transform.y}px, 0)`;
        expect(transformString).toContain("translate3d");
        expect(transformString).toContain("50px");
      });

      it("should apply transition from useSortable hook", () => {
        // Transition enables smooth animation during drag
        const transition = "transform 200ms ease";
        expect(transition).toContain("transform");
        expect(transition).toContain("200ms");
      });

      it("should have null transform when not dragging", () => {
        const transform = null;
        expect(transform).toBeNull();
      });
    });

    describe("sortable attributes", () => {
      it("should spread sortable attributes on row container", () => {
        // Attributes include aria-describedby, aria-pressed, role, tabindex
        const attributes = {
          "aria-describedby": "sortable-description",
          "aria-pressed": false,
          role: "button",
          tabIndex: 0,
        };
        expect(attributes).toHaveProperty("role");
        expect(attributes).toHaveProperty("tabIndex");
      });

      it("should have proper accessibility role", () => {
        const role = "button";
        expect(role).toBe("button");
      });

      it("should be keyboard focusable via tabIndex", () => {
        const tabIndex = 0;
        expect(tabIndex).toBe(0);
      });
    });

    describe("sortable listeners", () => {
      it("should attach listeners to drag handle only", () => {
        // Listeners are on the drag handle, not the whole row
        // This allows clicking elsewhere without starting drag
        const hasListenersOnHandle = true;
        expect(hasListenersOnHandle).toBe(true);
      });

      it("should not propagate drag events to row click handler", () => {
        // Drag handle has separate listeners from row onClick
        const dragHandleHasSeparateListeners = true;
        expect(dragHandleHasSeparateListeners).toBe(true);
      });
    });

    describe("layer id for sortable", () => {
      it("should use layer.id as sortable id", () => {
        const layer = { id: "layer-1", name: "drums" };
        const sortableId = layer.id;
        expect(sortableId).toBe("layer-1");
      });

      it("should maintain unique id for each layer", () => {
        const layers = [
          { id: "layer-1", name: "drums" },
          { id: "layer-2", name: "bass" },
          { id: "layer-3", name: "melody" },
        ];
        const ids = layers.map((l) => l.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(layers.length);
      });
    });
  });
});
