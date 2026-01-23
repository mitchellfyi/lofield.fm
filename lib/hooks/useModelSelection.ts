"use client";

import { useState, useCallback } from "react";
import { DEFAULT_MODEL, isValidModel } from "@/lib/models";

const STORAGE_KEY = "lofield-selected-model";

/**
 * Get the initial model from localStorage (or default)
 */
function getInitialModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidModel(stored)) {
      return stored;
    }
  } catch {
    // localStorage may be unavailable
  }
  return DEFAULT_MODEL;
}

/**
 * Hook to manage AI model selection with localStorage persistence
 */
export function useModelSelection(): [string, (model: string) => void] {
  const [selectedModel, setSelectedModel] = useState<string>(getInitialModel);

  const updateModel = useCallback((model: string) => {
    if (!isValidModel(model)) return;
    setSelectedModel(model);
    try {
      localStorage.setItem(STORAGE_KEY, model);
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  return [selectedModel, updateModel];
}
