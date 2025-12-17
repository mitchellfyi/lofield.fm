"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

// Type definitions for public track (from API)
export type PublicTrack = {
  id: string;
  is_owner?: boolean; // Server-computed ownership flag
  title: string;
  description: string | null;
  artist_name: string | null;
  genre: string | null;
  bpm: number | null;
  mood_energy: number | null;
  mood_focus: number | null;
  mood_chill: number | null;
  length_ms: number | null;
  instrumental: boolean;
  metadata: Record<string, unknown>;
  visibility?: "public" | "unlisted" | "private";
  created_at: string;
  published_at: string | null;
};

type PlayerState = {
  // Current track
  currentTrack: PublicTrack | null;
  currentTrackUrl: string | null;

  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;

  // Queue
  queue: PublicTrack[];
  currentIndex: number;

  // Settings
  autoplay: boolean;
  repeat: boolean;

  // Error state
  error: string | null;
};

type PlayerContextType = PlayerState & {
  // Playback controls
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;

  // Track controls
  playTrack: (track: PublicTrack) => void;
  playNext: () => void;
  playPrevious: () => void;

  // Queue management
  setQueue: (tracks: PublicTrack[], startIndex?: number) => void;
  clearQueue: () => void;

  // Settings
  toggleAutoplay: () => void;
  toggleRepeat: () => void;

  // Error handling
  clearError: () => void;

  // Audio element ref (for advanced controls)
  audioRef: React.RefObject<HTMLAudioElement | null>;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoplayRef = useRef(true);
  const lastPositionSaveTime = useRef<number>(0);

  // Initialize state with localStorage values
  const [state, setState] = useState<PlayerState>(() => {
    // Check if we're in the browser
    if (typeof window === "undefined") {
      return {
        currentTrack: null,
        currentTrackUrl: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 0.7,
        queue: [],
        currentIndex: -1,
        autoplay: true,
        repeat: false,
        error: null,
      };
    }

    const savedVolume = localStorage.getItem("player-volume");
    const savedAutoplay = localStorage.getItem("player-autoplay");
    const savedRepeat = localStorage.getItem("player-repeat");

    const autoplay = savedAutoplay ? savedAutoplay === "true" : true;

    return {
      currentTrack: null,
      currentTrackUrl: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: savedVolume ? parseFloat(savedVolume) : 0.7,
      queue: [],
      currentIndex: -1,
      autoplay,
      repeat: savedRepeat ? savedRepeat === "true" : false,
      error: null,
    };
  });

  // Sync autoplayRef with state after initial render
  useEffect(() => {
    autoplayRef.current = state.autoplay;
  }, [state.autoplay]);

  // Sync audio element volume with state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
  }, [state.volume]);

  // Fetch signed URL for a track
  const fetchTrackUrl = useCallback(async (trackId: string) => {
    try {
      const response = await fetch(`/api/public/tracks/${trackId}/play`);
      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          error: "Failed to load track. Please try again.",
        }));
        return null;
      }
      const data = await response.json();
      return data.signedUrl as string;
    } catch (error) {
      console.error("Error fetching track URL:", error);
      setState((prev) => ({
        ...prev,
        error: "Network error. Please check your connection.",
      }));
      return null;
    }
  }, []);

  // Play a specific track - Fixed: Combine setState calls
  const playTrack = useCallback(
    async (track: PublicTrack) => {
      const url = await fetchTrackUrl(track.id);
      if (!url) return;

      setState((prev) => {
        const index = prev.queue.findIndex((t) => t.id === track.id);
        return {
          ...prev,
          currentTrack: track,
          currentTrackUrl: url,
          isPlaying: true,
          currentTime: 0,
          currentIndex: index >= 0 ? index : prev.currentIndex,
          error: null, // Clear any previous errors
        };
      });

      // Persist last track ID
      if (typeof window !== "undefined") {
        localStorage.setItem("player-last-track-id", track.id);
      }
    },
    [fetchTrackUrl]
  );

  // Play next track in queue - Fixed: Extract track outside setState, then call playTrack
  const playNext = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentIndex + 1;

      if (nextIndex >= prev.queue.length) {
        // End of queue
        if (prev.repeat && prev.queue.length > 0) {
          // Loop to beginning
          const firstTrack = prev.queue[0];
          // Schedule playTrack to run after state update
          setTimeout(() => playTrack(firstTrack), 0);
          return { ...prev, currentIndex: 0 };
        }
        // Stop playback
        return { ...prev, isPlaying: false };
      }

      // Play next track
      const nextTrack = prev.queue[nextIndex];
      // Schedule playTrack to run after state update
      setTimeout(() => playTrack(nextTrack), 0);
      return { ...prev, currentIndex: nextIndex };
    });
  }, [playTrack]);

  // Play previous track in queue - Fixed: Extract track outside setState, then call playTrack
  const playPrevious = useCallback(() => {
    setState((prev) => {
      // If more than 3 seconds into track, restart current track
      if (prev.currentTime > 3) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
        return { ...prev, currentTime: 0 };
      }

      const prevIndex = prev.currentIndex - 1;

      if (prevIndex < 0) {
        // Beginning of queue - restart current or loop to end
        if (prev.repeat && prev.queue.length > 0) {
          const lastTrack = prev.queue[prev.queue.length - 1];
          // Schedule playTrack to run after state update
          setTimeout(() => playTrack(lastTrack), 0);
          return { ...prev, currentIndex: prev.queue.length - 1 };
        }
        // Restart current track
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
        return { ...prev, currentTime: 0 };
      }

      // Play previous track
      const prevTrack = prev.queue[prevIndex];
      // Schedule playTrack to run after state update
      setTimeout(() => playTrack(prevTrack), 0);
      return { ...prev, currentIndex: prevIndex };
    });
  }, [playTrack]);

  // Playback controls
  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setState((prev) => ({ ...prev, isPlaying: true }));
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState((prev) => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState((prev) => ({ ...prev, volume: clampedVolume }));
    localStorage.setItem("player-volume", clampedVolume.toString());
  }, []);

  // Queue management - Fixed: Extract playTrack call outside setState
  const setQueue = useCallback(
    (tracks: PublicTrack[], startIndex = 0) => {
      setState((prev) => {
        const shouldAutoplay = prev.autoplay && tracks.length > 0;

        // Schedule autoplay after state update
        if (shouldAutoplay) {
          setTimeout(() => playTrack(tracks[startIndex]), 0);
        }

        return {
          ...prev,
          queue: tracks,
          currentIndex: startIndex,
        };
      });
    },
    [playTrack]
  );

  const clearQueue = useCallback(() => {
    setState((prev) => ({
      ...prev,
      queue: [],
      currentIndex: -1,
    }));
  }, []);

  // Settings
  const toggleAutoplay = useCallback(() => {
    setState((prev) => {
      const newAutoplay = !prev.autoplay;
      localStorage.setItem("player-autoplay", newAutoplay.toString());
      return { ...prev, autoplay: newAutoplay };
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((prev) => {
      const newRepeat = !prev.repeat;
      localStorage.setItem("player-repeat", newRepeat.toString());
      return { ...prev, repeat: newRepeat };
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Audio event handlers - Fixed: Use ref to avoid re-registration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const newTime = audio.currentTime;
      setState((prev) => ({
        ...prev,
        currentTime: newTime,
      }));

      // Save position to localStorage every 5 seconds
      const now = Date.now();
      if (
        state.currentTrack &&
        now - lastPositionSaveTime.current > 5000 &&
        typeof window !== "undefined"
      ) {
        lastPositionSaveTime.current = now;
        localStorage.setItem(
          `player-position-${state.currentTrack.id}`,
          newTime.toString()
        );
      }
    };

    const handleDurationChange = () => {
      setState((prev) => ({
        ...prev,
        duration: audio.duration,
      }));
    };

    const handleEnded = () => {
      // Clear saved position when track ends
      if (state.currentTrack && typeof window !== "undefined") {
        localStorage.removeItem(`player-position-${state.currentTrack.id}`);
      }

      // Use ref to get current autoplay value without re-registering listeners
      if (autoplayRef.current) {
        playNext();
      } else {
        setState((prev) => ({ ...prev, isPlaying: false }));
      }
    };

    const handlePlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [playNext, state.currentTrack]); // Add state.currentTrack dependency

  // Load audio when currentTrackUrl changes - Fixed: Remove isPlaying from dependencies
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentTrackUrl) return;

    audio.src = state.currentTrackUrl;

    // Restore saved position if available
    if (state.currentTrack && typeof window !== "undefined") {
      const savedPosition = localStorage.getItem(
        `player-position-${state.currentTrack.id}`
      );
      if (savedPosition) {
        const position = parseFloat(savedPosition);
        // Only restore if position is valid and not too close to the end
        // Set directly on audio element, will trigger timeupdate event
        if (position > 0) {
          audio.currentTime = position;
        }
      }
    }

    // Check current playing state directly from state
    const shouldPlay = state.isPlaying;
    if (shouldPlay) {
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          error: "Playback failed. Please try again.",
        }));
      });
    }
  }, [state.currentTrackUrl, state.isPlaying, state.currentTrack]);

  const value: PlayerContextType = {
    ...state,
    play,
    pause,
    togglePlayPause,
    seek,
    setVolume,
    playTrack,
    playNext,
    playPrevious,
    setQueue,
    clearQueue,
    toggleAutoplay,
    toggleRepeat,
    clearError,
    audioRef,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
