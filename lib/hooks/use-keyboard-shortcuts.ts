"use client";

import { useEffect } from "react";
import { usePlayer } from "@/lib/contexts/player-context";

/**
 * Custom hook for global keyboard shortcuts
 * - Space: play/pause
 * - Left/Right: seek -5/+5 seconds
 * - N/P: next/previous track
 *
 * Shortcuts are disabled when user is typing in an input/textarea
 */
export function useKeyboardShortcuts() {
  const { togglePlayPause, seek, playNext, playPrevious, currentTime } =
    usePlayer();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Space: play/pause
      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
        return;
      }

      // Left arrow: seek -5 seconds
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        const newTime = Math.max(0, currentTime - 5);
        seek(newTime);
        return;
      }

      // Right arrow: seek +5 seconds
      if (e.code === "ArrowRight") {
        e.preventDefault();
        const newTime = currentTime + 5;
        seek(newTime);
        return;
      }

      // N: next track
      if (e.code === "KeyN" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        playNext();
        return;
      }

      // P: previous track
      if (e.code === "KeyP" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        playPrevious();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [togglePlayPause, seek, playNext, playPrevious, currentTime]);
}
