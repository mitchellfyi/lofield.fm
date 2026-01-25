"use client";

import { useState, useCallback } from "react";
import type { PublicTrack } from "@/lib/types/explore";

export interface UsePlayQueueResult {
  currentTrack: PublicTrack | null;
  queue: PublicTrack[];
  currentIndex: number;
  autoPlay: boolean;
  shuffle: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  playTrack: (track: PublicTrack, newQueue?: PublicTrack[]) => void;
  playNext: () => PublicTrack | null;
  playPrevious: () => PublicTrack | null;
  toggleAutoPlay: () => void;
  toggleShuffle: () => void;
  setQueue: (tracks: PublicTrack[]) => void;
  clearQueue: () => void;
  addToQueue: (track: PublicTrack) => void;
  removeFromQueue: (trackId: string) => void;
}

const MAX_HISTORY = 50;

export function usePlayQueue(): UsePlayQueueResult {
  const [queue, setQueue] = useState<PublicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [autoPlay, setAutoPlay] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const currentTrack =
    currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  const hasNext = currentIndex < queue.length - 1;
  const hasPrevious = history.length > 0;

  const playTrack = useCallback(
    (track: PublicTrack, newQueue?: PublicTrack[]) => {
      // Add current track to history before switching
      if (currentTrack) {
        setHistory((prev) => [currentTrack.id, ...prev.slice(0, MAX_HISTORY - 1)]);
      }

      if (newQueue) {
        setQueue(newQueue);
        const index = newQueue.findIndex((t) => t.id === track.id);
        setCurrentIndex(index >= 0 ? index : 0);
      } else {
        // Find track in current queue
        const index = queue.findIndex((t) => t.id === track.id);
        if (index >= 0) {
          setCurrentIndex(index);
        } else {
          // Add to end of queue and play
          setQueue((prev) => [...prev, track]);
          setCurrentIndex(queue.length);
        }
      }

      // Record play count (fire and forget)
      fetch("/api/explore/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id }),
      }).catch(() => {
        // Silently ignore play count errors
      });
    },
    [currentTrack, queue]
  );

  const playNext = useCallback((): PublicTrack | null => {
    if (queue.length === 0) return null;

    // Add current to history
    if (currentTrack) {
      setHistory((prev) => [currentTrack.id, ...prev.slice(0, MAX_HISTORY - 1)]);
    }

    let nextIndex: number;

    if (shuffle) {
      // Pick random track (not current)
      const availableIndices = queue.map((_, i) => i).filter((i) => i !== currentIndex);
      if (availableIndices.length === 0) {
        nextIndex = 0;
      } else {
        nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      }
    } else {
      // Sequential next
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        // Loop back to start if autoplay
        nextIndex = autoPlay ? 0 : currentIndex;
      }
    }

    setCurrentIndex(nextIndex);
    const nextTrack = queue[nextIndex];

    // Record play count
    if (nextTrack) {
      fetch("/api/explore/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: nextTrack.id }),
      }).catch(() => {});
    }

    return nextTrack || null;
  }, [queue, currentIndex, currentTrack, shuffle, autoPlay]);

  const playPrevious = useCallback((): PublicTrack | null => {
    if (history.length === 0) {
      // Go to previous in queue
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        return queue[currentIndex - 1];
      }
      return null;
    }

    // Pop from history
    const prevTrackId = history[0];
    setHistory((prev) => prev.slice(1));

    // Find track in queue
    const prevIndex = queue.findIndex((t) => t.id === prevTrackId);
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
      return queue[prevIndex];
    }

    return null;
  }, [queue, currentIndex, history]);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => !prev);
  }, []);

  const setQueueTracks = useCallback(
    (tracks: PublicTrack[]) => {
      setQueue(tracks);
      if (tracks.length > 0 && currentIndex < 0) {
        setCurrentIndex(0);
      }
    },
    [currentIndex]
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(-1);
    setHistory([]);
  }, []);

  const addToQueue = useCallback((track: PublicTrack) => {
    setQueue((prev) => {
      // Don't add duplicates
      if (prev.some((t) => t.id === track.id)) return prev;
      return [...prev, track];
    });
  }, []);

  const removeFromQueue = useCallback(
    (trackId: string) => {
      setQueue((prev) => {
        const index = prev.findIndex((t) => t.id === trackId);
        if (index < 0) return prev;

        const newQueue = prev.filter((t) => t.id !== trackId);

        // Adjust current index if needed
        if (index < currentIndex) {
          setCurrentIndex((i) => i - 1);
        } else if (index === currentIndex) {
          // Current track removed, stay at same index (will play next)
          if (currentIndex >= newQueue.length) {
            setCurrentIndex(Math.max(0, newQueue.length - 1));
          }
        }

        return newQueue;
      });
    },
    [currentIndex]
  );

  return {
    currentTrack,
    queue,
    currentIndex,
    autoPlay,
    shuffle,
    hasNext,
    hasPrevious,
    playTrack,
    playNext,
    playPrevious,
    toggleAutoPlay,
    toggleShuffle,
    setQueue: setQueueTracks,
    clearQueue,
    addToQueue,
    removeFromQueue,
  };
}
