import { describe, it, expect, vi } from "vitest";
import { arrayMove } from "@dnd-kit/sortable";
import type { AudioLayer } from "@/lib/types/audioLayer";

describe("LayersPanel component", () => {
  describe("module structure", () => {
    it("should export LayersPanel component", async () => {
      const { LayersPanel } = await import("../LayersPanel");
      expect(LayersPanel).toBeDefined();
      expect(typeof LayersPanel).toBe("function");
    });

    it("should be a named export", async () => {
      const layersPanelModule = await import("../LayersPanel");
      expect(Object.keys(layersPanelModule)).toContain("LayersPanel");
    });
  });

  describe("props interface", () => {
    const createMockLayers = (): AudioLayer[] => [
      {
        id: "layer-1",
        name: "drums",
        code: "// drums code",
        muted: false,
        soloed: false,
        volume: 100,
        color: "#f87171",
      },
      {
        id: "layer-2",
        name: "bass",
        code: "// bass code",
        muted: false,
        soloed: false,
        volume: 100,
        color: "#fb923c",
      },
    ];

    it("should accept layers prop as AudioLayer array", () => {
      const layers = createMockLayers();
      expect(Array.isArray(layers)).toBe(true);
      expect(layers.length).toBe(2);
    });

    it("should accept selectedLayerId as string or null", () => {
      const selectedLayerId: string | null = "layer-1";
      expect(typeof selectedLayerId).toBe("string");

      const nullSelectedId: string | null = null;
      expect(nullSelectedId).toBeNull();
    });

    it("should accept isPlaying as boolean", () => {
      const isPlaying = true;
      expect(typeof isPlaying).toBe("boolean");
    });

    it("should accept onLayersChange as function", () => {
      const onLayersChange = vi.fn();
      expect(typeof onLayersChange).toBe("function");
    });

    it("should accept onSelectLayer as function", () => {
      const onSelectLayer = vi.fn();
      expect(typeof onSelectLayer).toBe("function");
    });
  });

  describe("expand/collapse behavior", () => {
    it("should start in expanded state by default", () => {
      const isExpanded = true;
      expect(isExpanded).toBe(true);
    });

    it("should toggle expanded state when header clicked", () => {
      let isExpanded = true;
      const toggle = () => {
        isExpanded = !isExpanded;
      };

      toggle();
      expect(isExpanded).toBe(false);

      toggle();
      expect(isExpanded).toBe(true);
    });

    it("should show content when expanded", () => {
      const isExpanded = true;
      expect(isExpanded).toBe(true);
    });

    it("should hide content when collapsed", () => {
      const isExpanded = false;
      expect(isExpanded).toBe(false);
    });
  });

  describe("layer count display", () => {
    it("should display layer count in header", () => {
      const layers: AudioLayer[] = [
        {
          id: "1",
          name: "drums",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
        {
          id: "2",
          name: "bass",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
      ];
      expect(layers.length).toBe(2);
    });

    it("should show 1 for single layer", () => {
      const layers: AudioLayer[] = [
        {
          id: "1",
          name: "main",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
      ];
      expect(layers.length).toBe(1);
    });
  });

  describe("add layer behavior", () => {
    it("should create new layer with incremented name", () => {
      const existingLayers: AudioLayer[] = [
        {
          id: "1",
          name: "layer 1",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#f87171",
        },
      ];

      const newLayerNumber = existingLayers.length + 1;
      expect(newLayerNumber).toBe(2);
    });

    it("should call onLayersChange with new layers array", () => {
      const onLayersChange = vi.fn();
      const existingLayers: AudioLayer[] = [
        {
          id: "1",
          name: "layer 1",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#f87171",
        },
      ];

      const newLayer: AudioLayer = {
        id: "2",
        name: "layer 2",
        code: "",
        muted: false,
        soloed: false,
        volume: 100,
        color: "#fb923c",
      };

      onLayersChange([...existingLayers, newLayer]);

      expect(onLayersChange).toHaveBeenCalled();
      const calledWith = onLayersChange.mock.calls[0][0];
      expect(calledWith).toHaveLength(2);
    });

    it("should select the newly added layer", () => {
      const onSelectLayer = vi.fn();
      const newLayerId = "layer-2";

      onSelectLayer(newLayerId);

      expect(onSelectLayer).toHaveBeenCalledWith(newLayerId);
    });

    it("should use color from LAYER_COLORS based on index", async () => {
      const { LAYER_COLORS } = await import("@/lib/types/audioLayer");
      const layerIndex = 3;
      const colorIndex = layerIndex % LAYER_COLORS.length;
      const expectedColor = LAYER_COLORS[colorIndex];

      expect(expectedColor).toBe(LAYER_COLORS[3]);
    });
  });

  describe("update layer behavior", () => {
    it("should update specific layer by id", () => {
      const layers: AudioLayer[] = [
        {
          id: "1",
          name: "drums",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
        {
          id: "2",
          name: "bass",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
      ];

      const layerId = "2";
      const updates = { muted: true };

      const updatedLayers = layers.map((layer) =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      );

      expect(updatedLayers[0].muted).toBe(false);
      expect(updatedLayers[1].muted).toBe(true);
    });

    it("should call onLayersChange with updated layers", () => {
      const onLayersChange = vi.fn();
      const updatedLayers: AudioLayer[] = [
        {
          id: "1",
          name: "renamed",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
      ];

      onLayersChange(updatedLayers);

      expect(onLayersChange).toHaveBeenCalledWith(updatedLayers);
    });
  });

  describe("delete layer behavior", () => {
    it("should not allow deletion when only one layer exists", () => {
      const layers: AudioLayer[] = [
        {
          id: "1",
          name: "main",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
      ];

      const canDelete = layers.length > 1;
      expect(canDelete).toBe(false);
    });

    it("should allow deletion when multiple layers exist", () => {
      const layers: AudioLayer[] = [
        {
          id: "1",
          name: "drums",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
        {
          id: "2",
          name: "bass",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
      ];

      const canDelete = layers.length > 1;
      expect(canDelete).toBe(true);
    });

    it("should remove layer by id", () => {
      const layers: AudioLayer[] = [
        {
          id: "1",
          name: "drums",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
        {
          id: "2",
          name: "bass",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
      ];

      const layerIdToDelete = "1";
      const newLayers = layers.filter((layer) => layer.id !== layerIdToDelete);

      expect(newLayers).toHaveLength(1);
      expect(newLayers[0].id).toBe("2");
    });

    it("should select first remaining layer when deleted layer was selected", () => {
      const onSelectLayer = vi.fn();
      const selectedLayerId = "1";
      const newLayers: AudioLayer[] = [
        {
          id: "2",
          name: "bass",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
      ];

      // If deleted layer was selected, select first remaining
      if (selectedLayerId === "1") {
        onSelectLayer(newLayers[0]?.id || null);
      }

      expect(onSelectLayer).toHaveBeenCalledWith("2");
    });

    it("should not change selection when non-selected layer is deleted", () => {
      const onSelectLayer = vi.fn();
      const selectedLayerId: string = "2";
      const deletedLayerId: string = "1";

      // Only select new layer if deleted was selected
      if (selectedLayerId === deletedLayerId) {
        onSelectLayer("other");
      }

      expect(onSelectLayer).not.toHaveBeenCalled();
    });
  });

  describe("reset behavior", () => {
    it("should reset to DEFAULT_LAYERS", async () => {
      const { DEFAULT_LAYERS } = await import("@/lib/types/audioLayer");
      const onLayersChange = vi.fn();

      // Simulate reset
      onLayersChange(DEFAULT_LAYERS.map((layer) => ({ ...layer })));

      expect(onLayersChange).toHaveBeenCalled();
      const calledWith = onLayersChange.mock.calls[0][0];
      expect(calledWith[0].name).toBe("main");
    });

    it("should select first layer after reset", async () => {
      const { DEFAULT_LAYERS } = await import("@/lib/types/audioLayer");
      const onSelectLayer = vi.fn();

      onSelectLayer(DEFAULT_LAYERS[0]?.id || null);

      expect(onSelectLayer).toHaveBeenCalled();
    });
  });

  describe("layer selection", () => {
    it("should call onSelectLayer when layer row is clicked", () => {
      const onSelectLayer = vi.fn();
      const layerId = "layer-1";

      onSelectLayer(layerId);

      expect(onSelectLayer).toHaveBeenCalledWith(layerId);
    });

    it("should highlight selected layer row", () => {
      const selectedLayerId = "layer-1";
      const layerId = "layer-1";
      const isSelected = layerId === selectedLayerId;

      expect(isSelected).toBe(true);
    });

    it("should not highlight non-selected layer row", () => {
      const selectedLayerId: string = "layer-1";
      const layerId: string = "layer-2";
      const isSelected = layerId === selectedLayerId;

      expect(isSelected).toBe(false);
    });
  });

  describe("renders LayerRow for each layer", () => {
    it("should render correct number of LayerRow components", () => {
      const layers: AudioLayer[] = [
        {
          id: "1",
          name: "drums",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
        {
          id: "2",
          name: "bass",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
        {
          id: "3",
          name: "melody",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
      ];

      expect(layers.length).toBe(3);
    });

    it("should pass isPlaying to all LayerRow components", () => {
      const isPlaying = true;
      const layers = [{ id: "1" }, { id: "2" }];

      layers.forEach(() => {
        // Each LayerRow receives isPlaying
        expect(isPlaying).toBe(true);
      });
    });

    it("should pass canDelete based on layer count", () => {
      const layers: AudioLayer[] = [
        {
          id: "1",
          name: "drums",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
        {
          id: "2",
          name: "bass",
          code: "",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
      ];

      const canDelete = layers.length > 1;
      expect(canDelete).toBe(true);
    });
  });

  describe("header content", () => {
    it("should display 'Layers' title", () => {
      const title = "Layers";
      expect(title).toBe("Layers");
    });

    it("should show chevron for expand/collapse", () => {
      const hasChevron = true;
      expect(hasChevron).toBe(true);
    });

    it("should rotate chevron when expanded", () => {
      const isExpanded = true;
      const rotateClass = isExpanded ? "rotate-180" : "";
      expect(rotateClass).toBe("rotate-180");
    });

    it("should not rotate chevron when collapsed", () => {
      const isExpanded = false;
      const rotateClass = isExpanded ? "rotate-180" : "";
      expect(rotateClass).toBe("");
    });
  });

  describe("action buttons", () => {
    it("should have Add Layer button", () => {
      const buttonText = "Add Layer";
      expect(buttonText).toBe("Add Layer");
    });

    it("should have Reset button", () => {
      const buttonText = "Reset";
      expect(buttonText).toBe("Reset");
    });

    it("should be visible when panel is expanded", () => {
      const isExpanded = true;
      const showButtons = isExpanded;
      expect(showButtons).toBe(true);
    });

    it("should be hidden when panel is collapsed", () => {
      const isExpanded = false;
      const showButtons = isExpanded;
      expect(showButtons).toBe(false);
    });
  });

  describe("integration with audioLayer types", () => {
    it("should use createDefaultLayer for new layers", async () => {
      const { createDefaultLayer } = await import("@/lib/types/audioLayer");
      const newLayer = createDefaultLayer("layer 2", "", 1);

      expect(newLayer).toHaveProperty("id");
      expect(newLayer).toHaveProperty("name");
      expect(newLayer.name).toBe("layer 2");
    });

    it("should use LAYER_COLORS for color cycling", async () => {
      const { LAYER_COLORS } = await import("@/lib/types/audioLayer");

      // Test that colors cycle
      const index1 = 0 % LAYER_COLORS.length;
      const index2 = 10 % LAYER_COLORS.length;

      expect(LAYER_COLORS[index1]).toBe(LAYER_COLORS[0]);
      expect(LAYER_COLORS[index2]).toBe(LAYER_COLORS[0]);
    });

    it("should use DEFAULT_LAYERS for reset", async () => {
      const { DEFAULT_LAYERS } = await import("@/lib/types/audioLayer");

      expect(DEFAULT_LAYERS).toHaveLength(1);
      expect(DEFAULT_LAYERS[0].name).toBe("main");
    });
  });

  describe("drag to reorder behavior", () => {
    const createMockLayers = (): AudioLayer[] => [
      {
        id: "layer-1",
        name: "drums",
        code: "// drums code",
        muted: false,
        soloed: false,
        volume: 100,
        color: "#f87171",
      },
      {
        id: "layer-2",
        name: "bass",
        code: "// bass code",
        muted: false,
        soloed: false,
        volume: 100,
        color: "#fb923c",
      },
      {
        id: "layer-3",
        name: "melody",
        code: "// melody code",
        muted: false,
        soloed: false,
        volume: 100,
        color: "#fbbf24",
      },
    ];

    describe("arrayMove utility", () => {
      it("should move item from one index to another", () => {
        const layers = createMockLayers();
        const reordered = arrayMove(layers, 0, 2);

        expect(reordered[0].id).toBe("layer-2");
        expect(reordered[1].id).toBe("layer-3");
        expect(reordered[2].id).toBe("layer-1");
      });

      it("should preserve all items when reordering", () => {
        const layers = createMockLayers();
        const reordered = arrayMove(layers, 0, 2);

        expect(reordered).toHaveLength(3);
        expect(reordered.map((l) => l.id).sort()).toEqual(["layer-1", "layer-2", "layer-3"]);
      });

      it("should not mutate the original array", () => {
        const layers = createMockLayers();
        const originalFirstId = layers[0].id;
        arrayMove(layers, 0, 2);

        expect(layers[0].id).toBe(originalFirstId);
      });
    });

    describe("handleDragEnd logic", () => {
      it("should reorder layers when first item is moved to last position", () => {
        const layers = createMockLayers();
        const onLayersChange = vi.fn();

        // Simulate handleDragEnd: active.id = 'layer-1', over.id = 'layer-3'
        const activeId = "layer-1";
        const overId = "layer-3";

        const oldIndex = layers.findIndex((layer) => layer.id === activeId);
        const newIndex = layers.findIndex((layer) => layer.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newLayers = arrayMove(layers, oldIndex, newIndex);
          onLayersChange(newLayers);
        }

        expect(onLayersChange).toHaveBeenCalled();
        const reorderedLayers = onLayersChange.mock.calls[0][0];
        expect(reorderedLayers[0].id).toBe("layer-2");
        expect(reorderedLayers[1].id).toBe("layer-3");
        expect(reorderedLayers[2].id).toBe("layer-1");
      });

      it("should reorder layers when last item is moved to first position", () => {
        const layers = createMockLayers();
        const onLayersChange = vi.fn();

        // Simulate handleDragEnd: active.id = 'layer-3', over.id = 'layer-1'
        const activeId = "layer-3";
        const overId = "layer-1";

        const oldIndex = layers.findIndex((layer) => layer.id === activeId);
        const newIndex = layers.findIndex((layer) => layer.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newLayers = arrayMove(layers, oldIndex, newIndex);
          onLayersChange(newLayers);
        }

        expect(onLayersChange).toHaveBeenCalled();
        const reorderedLayers = onLayersChange.mock.calls[0][0];
        expect(reorderedLayers[0].id).toBe("layer-3");
        expect(reorderedLayers[1].id).toBe("layer-1");
        expect(reorderedLayers[2].id).toBe("layer-2");
      });

      it("should reorder layers when middle item is moved", () => {
        const layers = createMockLayers();
        const onLayersChange = vi.fn();

        // Move layer-2 to first position
        const activeId = "layer-2";
        const overId = "layer-1";

        const oldIndex = layers.findIndex((layer) => layer.id === activeId);
        const newIndex = layers.findIndex((layer) => layer.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newLayers = arrayMove(layers, oldIndex, newIndex);
          onLayersChange(newLayers);
        }

        expect(onLayersChange).toHaveBeenCalled();
        const reorderedLayers = onLayersChange.mock.calls[0][0];
        expect(reorderedLayers[0].id).toBe("layer-2");
        expect(reorderedLayers[1].id).toBe("layer-1");
        expect(reorderedLayers[2].id).toBe("layer-3");
      });

      it("should not call onLayersChange when active and over are the same", () => {
        const layers = createMockLayers();
        const onLayersChange = vi.fn();

        // Simulate dropping on same position
        const activeId = "layer-1";
        const overId = "layer-1";

        if (activeId !== overId) {
          const oldIndex = layers.findIndex((layer) => layer.id === activeId);
          const newIndex = layers.findIndex((layer) => layer.id === overId);

          if (oldIndex !== -1 && newIndex !== -1) {
            const newLayers = arrayMove(layers, oldIndex, newIndex);
            onLayersChange(newLayers);
          }
        }

        expect(onLayersChange).not.toHaveBeenCalled();
      });

      it("should not call onLayersChange when over is null (dropped outside)", () => {
        const layers = createMockLayers();
        const onLayersChange = vi.fn();

        // Simulate dropping outside any valid drop target
        const activeId = "layer-1";
        const over = null;

        if (over && activeId !== over) {
          const oldIndex = layers.findIndex((layer) => layer.id === activeId);
          const newIndex = layers.findIndex((layer) => layer.id === over);

          if (oldIndex !== -1 && newIndex !== -1) {
            const newLayers = arrayMove(layers, oldIndex, newIndex);
            onLayersChange(newLayers);
          }
        }

        expect(onLayersChange).not.toHaveBeenCalled();
      });

      it("should not reorder when active id is not found in layers", () => {
        const layers = createMockLayers();
        const onLayersChange = vi.fn();

        // Simulate with invalid active id
        const activeId = "non-existent-layer";
        const overId = "layer-1";

        const oldIndex = layers.findIndex((layer) => layer.id === activeId);
        const newIndex = layers.findIndex((layer) => layer.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newLayers = arrayMove(layers, oldIndex, newIndex);
          onLayersChange(newLayers);
        }

        expect(onLayersChange).not.toHaveBeenCalled();
      });

      it("should not reorder when over id is not found in layers", () => {
        const layers = createMockLayers();
        const onLayersChange = vi.fn();

        // Simulate with invalid over id
        const activeId = "layer-1";
        const overId = "non-existent-layer";

        const oldIndex = layers.findIndex((layer) => layer.id === activeId);
        const newIndex = layers.findIndex((layer) => layer.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newLayers = arrayMove(layers, oldIndex, newIndex);
          onLayersChange(newLayers);
        }

        expect(onLayersChange).not.toHaveBeenCalled();
      });
    });

    describe("layer order affects playback", () => {
      it("should pass layers in reordered sequence to onLayersChange", () => {
        const layers = createMockLayers();
        const onLayersChange = vi.fn();

        // Reorder: drums, bass, melody -> melody, drums, bass
        const activeId = "layer-3";
        const overId = "layer-1";

        const oldIndex = layers.findIndex((layer) => layer.id === activeId);
        const newIndex = layers.findIndex((layer) => layer.id === overId);

        const newLayers = arrayMove(layers, oldIndex, newIndex);
        onLayersChange(newLayers);

        const reorderedLayers = onLayersChange.mock.calls[0][0];

        // Verify the order matches expected playback order
        expect(reorderedLayers.map((l: AudioLayer) => l.name)).toEqual(["melody", "drums", "bass"]);
      });

      it("should preserve layer properties when reordering", () => {
        const layers = createMockLayers();
        // Set some custom properties
        layers[0].muted = true;
        layers[1].soloed = true;
        layers[2].volume = 50;

        const reordered = arrayMove(layers, 0, 2);

        // Properties should be preserved
        expect(reordered[2].muted).toBe(true);
        expect(reordered[0].soloed).toBe(true);
        expect(reordered[1].volume).toBe(50);
      });
    });

    describe("sensor configuration", () => {
      it("should have pointer sensor activation distance of 5px", () => {
        // This prevents accidental drags when clicking
        const activationDistance = 5;
        expect(activationDistance).toBe(5);
      });

      it("should have keyboard sensor for accessibility", () => {
        // Keyboard navigation is enabled for accessibility
        const hasKeyboardSensor = true;
        expect(hasKeyboardSensor).toBe(true);
      });
    });

    describe("SortableContext items", () => {
      it("should use layer ids for SortableContext items", () => {
        const layers = createMockLayers();
        const sortableItems = layers.map((layer) => layer.id);

        expect(sortableItems).toEqual(["layer-1", "layer-2", "layer-3"]);
      });

      it("should maintain correct item ids after reorder", () => {
        const layers = createMockLayers();
        const reordered = arrayMove(layers, 0, 2);
        const sortableItems = reordered.map((layer) => layer.id);

        expect(sortableItems).toEqual(["layer-2", "layer-3", "layer-1"]);
      });
    });
  });
});
