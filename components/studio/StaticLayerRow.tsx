"use client";

import { useState, useRef, useEffect } from "react";
import { type AudioLayer } from "@/lib/types/audioLayer";

interface StaticLayerRowProps {
  layer: AudioLayer;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<AudioLayer>) => void;
  onDelete: () => void;
  canDelete: boolean;
}

/**
 * Static version of LayerRow without DnD functionality.
 * Used during SSR and initial hydration to prevent hydration mismatches
 * caused by @dnd-kit's auto-generated accessibility IDs.
 */
export function StaticLayerRow({
  layer,
  isSelected,
  isPlaying,
  onSelect,
  onUpdate,
  onDelete,
  canDelete,
}: StaticLayerRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameSubmit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== layer.name) {
      onUpdate({ name: trimmed });
    } else {
      setEditName(layer.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      setEditName(layer.name);
      setIsEditing(false);
    }
  };

  const volumePercentage = layer.volume;

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors cursor-pointer ${
        isSelected
          ? "bg-cyan-500/20 border border-cyan-500/40"
          : "hover:bg-slate-800/50 border border-transparent"
      }`}
      onClick={onSelect}
    >
      {/* Drag handle placeholder (non-functional during SSR) */}
      <div className="text-slate-500 hover:text-slate-300 touch-none">
        <svg className="w-3 h-4" fill="currentColor" viewBox="0 0 6 16">
          <circle cx="1.5" cy="2" r="1" />
          <circle cx="4.5" cy="2" r="1" />
          <circle cx="1.5" cy="6" r="1" />
          <circle cx="4.5" cy="6" r="1" />
          <circle cx="1.5" cy="10" r="1" />
          <circle cx="4.5" cy="10" r="1" />
          <circle cx="1.5" cy="14" r="1" />
          <circle cx="4.5" cy="14" r="1" />
        </svg>
      </div>

      {/* Color indicator with playing animation */}
      <div
        className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
          isPlaying && !layer.muted ? "animate-pulse scale-125" : ""
        }`}
        style={{ backgroundColor: layer.color }}
      />

      {/* Layer name */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-slate-900 border border-cyan-500/50 rounded px-1 py-0.5 text-xs text-slate-200 outline-none focus:border-cyan-400"
          />
        ) : (
          <span
            className={`text-xs font-medium truncate block ${
              layer.muted ? "text-slate-500 line-through" : "text-slate-200"
            }`}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Double-click to rename"
          >
            {layer.name}
          </span>
        )}
      </div>

      {/* Mute button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onUpdate({ muted: !layer.muted });
        }}
        className={`min-w-[28px] min-h-[28px] md:min-w-[24px] md:min-h-[24px] flex items-center justify-center rounded text-[10px] font-bold transition-colors ${
          layer.muted
            ? "bg-cyan-500/30 text-cyan-300"
            : "bg-slate-700/50 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
        }`}
        title={layer.muted ? "Unmute" : "Mute"}
      >
        M
      </button>

      {/* Solo button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onUpdate({ soloed: !layer.soloed });
        }}
        className={`min-w-[28px] min-h-[28px] md:min-w-[24px] md:min-h-[24px] flex items-center justify-center rounded text-[10px] font-bold transition-colors ${
          layer.soloed
            ? "bg-amber-500/30 text-amber-300"
            : "bg-slate-700/50 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
        }`}
        title={layer.soloed ? "Unsolo" : "Solo"}
      >
        S
      </button>

      {/* Volume slider */}
      <div className="w-16 relative py-1" onClick={(e) => e.stopPropagation()}>
        <input
          type="range"
          min={0}
          max={100}
          value={layer.volume}
          onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
          className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer touch-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:border-none"
          style={{
            background: `linear-gradient(to right, rgb(34 211 238) 0%, rgb(34 211 238) ${volumePercentage}%, rgb(51 65 85) ${volumePercentage}%, rgb(51 65 85) 100%)`,
          }}
          title={`Volume: ${layer.volume}%`}
        />
      </div>

      {/* Delete button */}
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="min-w-[28px] min-h-[28px] md:min-w-[24px] md:min-h-[24px] flex items-center justify-center rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete layer"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
