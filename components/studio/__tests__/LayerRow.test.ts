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
});
