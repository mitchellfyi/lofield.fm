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

  // Audio element ref (for advanced controls)
  audioRef: React.RefObject<HTMLAudioElement | null>;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);

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
      };
    }

    const savedVolume = localStorage.getItem("player-volume");
    const savedAutoplay = localStorage.getItem("player-autoplay");
    const savedRepeat = localStorage.getItem("player-repeat");

    return {
      currentTrack: null,
      currentTrackUrl: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: savedVolume ? parseFloat(savedVolume) : 0.7,
      queue: [],
      currentIndex: -1,
      autoplay: savedAutoplay ? savedAutoplay === "true" : true,
      repeat: savedRepeat ? savedRepeat === "true" : false,
    };
  });

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
        console.error("Failed to fetch track URL");
        return null;
      }
      const data = await response.json();
      return data.signedUrl as string;
    } catch (error) {
      console.error("Error fetching track URL:", error);
      return null;
    }
  }, []);

  // Play a specific track
  const playTrack = useCallback(
    async (track: PublicTrack) => {
      const url = await fetchTrackUrl(track.id);
      if (!url) return;

      setState((prev) => ({
        ...prev,
        currentTrack: track,
        currentTrackUrl: url,
        isPlaying: true,
        currentTime: 0,
      }));

      // Find track in queue and update index
      setState((prev) => {
        const index = prev.queue.findIndex((t) => t.id === track.id);
        return {
          ...prev,
          currentIndex: index >= 0 ? index : prev.currentIndex,
        };
      });
    },
    [fetchTrackUrl]
  );

  // Play next track in queue
  const playNext = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentIndex + 1;

      if (nextIndex >= prev.queue.length) {
        // End of queue
        if (prev.repeat && prev.queue.length > 0) {
          // Loop to beginning
          const firstTrack = prev.queue[0];
          playTrack(firstTrack);
          return { ...prev, currentIndex: 0 };
        }
        // Stop playback
        return { ...prev, isPlaying: false };
      }

      // Play next track
      const nextTrack = prev.queue[nextIndex];
      playTrack(nextTrack);
      return { ...prev, currentIndex: nextIndex };
    });
  }, [playTrack]);

  // Play previous track in queue
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
          playTrack(lastTrack);
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
      playTrack(prevTrack);
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

  // Queue management
  const setQueue = useCallback(
    (tracks: PublicTrack[], startIndex = 0) => {
      setState((prev) => ({
        ...prev,
        queue: tracks,
        currentIndex: startIndex,
      }));

      // Auto-play first track if autoplay is enabled
      if (state.autoplay && tracks.length > 0) {
        playTrack(tracks[startIndex]);
      }
    },
    [state.autoplay, playTrack]
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

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setState((prev) => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };

    const handleDurationChange = () => {
      setState((prev) => ({
        ...prev,
        duration: audio.duration,
      }));
    };

    const handleEnded = () => {
      if (state.autoplay) {
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
  }, [state.autoplay, playNext]);

  // Load audio when currentTrackUrl changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentTrackUrl) return;

    audio.src = state.currentTrackUrl;

    if (state.isPlaying) {
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
        setState((prev) => ({ ...prev, isPlaying: false }));
      });
    }
  }, [state.currentTrackUrl, state.isPlaying]);

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
