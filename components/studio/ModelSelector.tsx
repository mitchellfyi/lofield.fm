"use client";

import { useState, useRef, useEffect } from "react";
import { MODELS, getModelById } from "@/lib/models";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentModel = getModelById(selectedModel);

  const handleSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  const getCostBadge = (costTier: "low" | "medium" | "high") => {
    switch (costTier) {
      case "low":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "high":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    }
  };

  return (
    <div className="relative z-[100]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-sm text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all duration-200 backdrop-blur-sm"
        aria-label="Select AI Model"
      >
        <svg
          className="w-5 h-5 sm:w-4 sm:h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <span className="hidden sm:inline">{currentModel?.name || "Model"}</span>
        <svg
          className={`w-4 h-4 hidden sm:block transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1rem)] bg-slate-900/95 border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/10 backdrop-blur-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-cyan-500/20 bg-slate-800/50">
            <h3 className="text-sm font-semibold text-cyan-400">Select AI Model</h3>
            <p className="text-xs text-slate-400 mt-0.5">Choose based on quality vs cost</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => handleSelect(model.id)}
                className={`w-full px-4 py-3 text-left transition-colors border-b border-slate-800 last:border-b-0 ${
                  model.id === selectedModel
                    ? "bg-cyan-500/20"
                    : "hover:bg-cyan-500/10 active:bg-cyan-500/20"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-cyan-100">{model.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${getCostBadge(model.costTier)}`}
                  >
                    {model.costTier} cost
                  </span>
                </div>
                <p className="text-xs text-slate-400">{model.description}</p>
                {model.id === selectedModel && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-cyan-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Currently selected
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
