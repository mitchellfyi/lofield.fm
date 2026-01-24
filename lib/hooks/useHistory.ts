"use client";

import { useState, useCallback, useRef } from "react";

const MAX_HISTORY_SIZE = 50;

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * Deep equality check for JSON-serializable values
 */
function deepEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Hook to manage undo/redo history for any state type.
 *
 * @param initialState - The initial state value
 * @returns Object with:
 *   - state: current state value
 *   - push: record a new state (adds to history)
 *   - undo: restore previous state
 *   - redo: restore next state
 *   - canUndo: boolean flag if undo is available
 *   - canRedo: boolean flag if redo is available
 *   - clear: reset history (keep current state)
 */
export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Debounce ref for push operations
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStateRef = useRef<T | null>(null);

  /**
   * Push a new state to history.
   * Does nothing if the new state equals the current state.
   * Clears the redo stack (future states).
   * Limits history to MAX_HISTORY_SIZE entries.
   */
  const push = useCallback((newState: T) => {
    setHistory((prev) => {
      // Skip if new state equals current state (no-op)
      if (deepEqual(prev.present, newState)) {
        return prev;
      }

      // Add current state to past, limit size
      const newPast = [...prev.past, prev.present].slice(-MAX_HISTORY_SIZE);

      return {
        past: newPast,
        present: newState,
        future: [], // Clear redo stack on new action
      };
    });
  }, []);

  /**
   * Push a new state with debouncing.
   * Useful for rapid changes like typing.
   *
   * @param newState - The new state value
   * @param debounceMs - Debounce time in milliseconds (default: 150)
   */
  const pushDebounced = useCallback(
    (newState: T, debounceMs = 150) => {
      pendingStateRef.current = newState;

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        if (pendingStateRef.current !== null) {
          push(pendingStateRef.current);
          pendingStateRef.current = null;
        }
      }, debounceMs);
    },
    [push]
  );

  /**
   * Undo: restore previous state.
   * Does nothing if there's no history (past is empty).
   */
  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) {
        return prev; // Nothing to undo
      }

      const newPast = prev.past.slice(0, -1);
      const previousState = prev.past[prev.past.length - 1];

      return {
        past: newPast,
        present: previousState,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  /**
   * Redo: restore next state.
   * Does nothing if there's no future (future is empty).
   */
  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) {
        return prev; // Nothing to redo
      }

      const nextState = prev.future[0];
      const newFuture = prev.future.slice(1);

      return {
        past: [...prev.past, prev.present],
        present: nextState,
        future: newFuture,
      };
    });
  }, []);

  /**
   * Clear history, keeping only the current state.
   * Useful when switching contexts (e.g., loading a different track).
   */
  const clear = useCallback(() => {
    // Cancel any pending debounced push
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    pendingStateRef.current = null;

    setHistory((prev) => ({
      past: [],
      present: prev.present,
      future: [],
    }));
  }, []);

  /**
   * Reset history with a new initial state.
   * Useful when loading a completely different track.
   */
  const reset = useCallback((newState: T) => {
    // Cancel any pending debounced push
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    pendingStateRef.current = null;

    setHistory({
      past: [],
      present: newState,
      future: [],
    });
  }, []);

  return {
    state: history.present,
    push,
    pushDebounced,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clear,
    reset,
  };
}
