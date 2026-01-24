"use client";

import { useState } from "react";
import { TweakSlider } from "./TweakSlider";
import { type TweaksConfig, DEFAULT_TWEAKS, TWEAK_PARAMS } from "@/lib/types/tweaks";

interface TweaksPanelProps {
  tweaks: TweaksConfig;
  onTweaksChange: (tweaks: TweaksConfig) => void;
}

export function TweaksPanel({ tweaks, onTweaksChange }: TweaksPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (key: keyof TweaksConfig, value: number) => {
    onTweaksChange({ ...tweaks, [key]: value });
  };

  const handleReset = () => {
    onTweaksChange(DEFAULT_TWEAKS);
  };

  return (
    <div className="rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm overflow-hidden">
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
