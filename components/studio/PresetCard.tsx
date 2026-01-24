"use client";

import type { Preset } from "@/lib/audio/presets";

interface PresetCardProps {
  preset: Preset;
  onPreview: (preset: Preset) => void;
  onLoad: (preset: Preset) => void;
  isPlaying?: boolean;
}

export function PresetCard({
  preset,
  onPreview,
  onLoad,
  isPlaying = false,
}: PresetCardProps) {
  return (
    <div className="group relative bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/5">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-cyan-100 truncate">{preset.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium text-cyan-500">{preset.genre}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
              {preset.bpm} BPM
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 mb-3 line-clamp-2">{preset.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {preset.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/50"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onPreview(preset)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
            isPlaying
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
              : "bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-cyan-500/30 hover:text-cyan-300"
          }`}
        >
          {isPlaying ? (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              Stop
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Preview
            </>
          )}
        </button>
        <button
          onClick={() => onLoad(preset)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200 shadow-sm shadow-cyan-500/20"
        >
          Load
        </button>
      </div>
    </div>
  );
}
