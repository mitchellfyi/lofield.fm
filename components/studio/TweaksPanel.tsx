"use client";

import { useState, useRef } from "react";
import { TweakSlider } from "./TweakSlider";
import { type TweaksConfig, DEFAULT_TWEAKS, TWEAK_PARAMS } from "@/lib/types/tweaks";

interface TweaksPanelProps {
  tweaks: TweaksConfig;
  onTweaksChange: (tweaks: TweaksConfig, saveToHistory?: boolean) => void;
}

export function TweaksPanel({ tweaks, onTweaksChange }: TweaksPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  // Track the value at drag start for history
  const dragStartValueRef = useRef<{ key: keyof TweaksConfig; value: number } | null>(null);

  const handleChange = (key: keyof TweaksConfig, value: number) => {
    // Record the original value when starting to drag
    if (!dragStartValueRef.current) {
      dragStartValueRef.current = { key, value: tweaks[key] };
    }
    // Apply change without saving to history (live update only)
    onTweaksChange({ ...tweaks, [key]: value }, false);
  };

  const handleChangeEnd = (key: keyof TweaksConfig) => {
    // Save to history when drag ends (only if value actually changed)
    if (dragStartValueRef.current && dragStartValueRef.current.key === key) {
      if (dragStartValueRef.current.value !== tweaks[key]) {
        onTweaksChange(tweaks, true);
      }
      dragStartValueRef.current = null;
    }
  };

  const handleReset = () => {
    onTweaksChange(DEFAULT_TWEAKS, true);
  };

  return (
    <div
      className="rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm overflow-hidden"
      data-tutorial="tweaks-panel"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 border-b border-cyan-500/20 bg-slate-900/50 hover:bg-slate-900/70 transition-colors flex items-center justify-between gap-2"
      >
        <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
          Tweaks
        </div>
        <svg
          className={`w-3 h-3 text-cyan-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {TWEAK_PARAMS.map((param) => (
            <TweakSlider
              key={param.key}
              label={param.label}
              value={tweaks[param.key]}
              min={param.min}
              max={param.max}
              step={param.step}
              unit={param.unit}
              onChange={(value) => handleChange(param.key, value)}
              onChangeEnd={() => handleChangeEnd(param.key)}
            />
          ))}

          <button
            onClick={handleReset}
            className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
}
