"use client";

import { useState, useSyncExternalStore } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { LayerRow } from "./LayerRow";
import { StaticLayerRow } from "./StaticLayerRow";
import {
  type AudioLayer,
  createDefaultLayer,
  DEFAULT_LAYERS,
  LAYER_COLORS,
} from "@/lib/types/audioLayer";

// Subscribe function that does nothing (we never need to re-subscribe)
const emptySubscribe = () => () => {};
// Return true on client, false on server
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Hook to detect if we're on the client after hydration.
 * Uses useSyncExternalStore for hydration-safe detection.
 */
function useIsClient() {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}

interface LayersPanelProps {
  layers: AudioLayer[];
  selectedLayerId: string | null;
  isPlaying: boolean;
  onLayersChange: (layers: AudioLayer[]) => void;
  onSelectLayer: (layerId: string | null) => void;
}

export function LayersPanel({
  layers,
  selectedLayerId,
  isPlaying,
  onLayersChange,
  onSelectLayer,
}: LayersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  // Detect if we're on the client after hydration to prevent DnD hydration mismatches
  const isClient = useIsClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts to prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layers.findIndex((layer) => layer.id === active.id);
      const newIndex = layers.findIndex((layer) => layer.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newLayers = arrayMove(layers, oldIndex, newIndex);
        onLayersChange(newLayers);
      }
    }
  };

  const handleAddLayer = () => {
    const newLayerNumber = layers.length + 1;
    const colorIndex = layers.length % LAYER_COLORS.length;
    const newLayer = createDefaultLayer(`layer ${newLayerNumber}`, "", colorIndex);
    onLayersChange([...layers, newLayer]);
    onSelectLayer(newLayer.id);
  };

  const handleUpdateLayer = (layerId: string, updates: Partial<AudioLayer>) => {
    onLayersChange(
      layers.map((layer) => (layer.id === layerId ? { ...layer, ...updates } : layer))
    );
  };

  const handleDeleteLayer = (layerId: string) => {
    if (layers.length <= 1) return;

    const newLayers = layers.filter((layer) => layer.id !== layerId);
    onLayersChange(newLayers);

    // If deleted layer was selected, select first remaining layer
    if (selectedLayerId === layerId) {
      onSelectLayer(newLayers[0]?.id || null);
    }
  };

  const handleReset = () => {
    onLayersChange(DEFAULT_LAYERS.map((layer) => ({ ...layer })));
    onSelectLayer(DEFAULT_LAYERS[0]?.id || null);
  };

  return (
    <div className="rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 border-b border-cyan-500/20 bg-slate-900/50 hover:bg-slate-900/70 transition-colors flex items-center justify-between gap-2"
      >
        <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
          Layers
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">{layers.length}</span>
          <svg
            className={`w-3 h-3 text-cyan-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="p-2 space-y-1">
          {/* Render static rows during SSR/hydration, DnD-enabled rows after */}
          {isClient ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={layers.map((layer) => layer.id)}
                strategy={verticalListSortingStrategy}
              >
                {layers.map((layer) => (
                  <LayerRow
                    key={layer.id}
                    layer={layer}
                    isSelected={layer.id === selectedLayerId}
                    isPlaying={isPlaying}
                    onSelect={() => onSelectLayer(layer.id)}
                    onUpdate={(updates) => handleUpdateLayer(layer.id, updates)}
                    onDelete={() => handleDeleteLayer(layer.id)}
                    canDelete={layers.length > 1}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            // Static rows without DnD during SSR to prevent hydration mismatch
            layers.map((layer) => (
              <StaticLayerRow
                key={layer.id}
                layer={layer}
                isSelected={layer.id === selectedLayerId}
                isPlaying={isPlaying}
                onSelect={() => onSelectLayer(layer.id)}
                onUpdate={(updates) => handleUpdateLayer(layer.id, updates)}
                onDelete={() => handleDeleteLayer(layer.id)}
                canDelete={layers.length > 1}
              />
            ))
          )}

          <div className="flex gap-2 mt-2 pt-2 border-t border-cyan-500/10">
            <button
              onClick={handleAddLayer}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Layer
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded transition-colors"
              title="Reset to defaults"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
