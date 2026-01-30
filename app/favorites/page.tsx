"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { ExploreTrackCard, ExplorePlayer, markUserInitiatedStop } from "@/components/explore";
import { usePlayQueue } from "@/lib/hooks/usePlayQueue";
import { getAudioRuntime } from "@/lib/audio/runtime";
import type { PublicTrack } from "@/lib/types/explore";

/**
 * User's favorite tracks page
 */
export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const queue = usePlayQueue();
  const [tracks, setTracks] = useState<PublicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  // Get audio runtime state
  const runtime = getAudioRuntime();
  const playerState = useSyncExternalStore(
    (callback) => runtime.subscribe(callback),
    () => runtime.getState(),
    () => "idle" as const
  );
  const isPlaying = playerState === "playing";

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/favorites");

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch favorites");
      }

      const data = await res.json();
      setTracks(data.tracks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, fetchFavorites]);

  // Stop playback when navigating away
  useEffect(() => {
    return () => {
      runtime.stop();
    };
  }, [runtime]);

  // Handle playing/pausing a track
  const handlePlayTrack = useCallback(
    (track: PublicTrack) => {
      if (queue.currentTrack?.id === track.id) {
        if (isPlaying) {
          markUserInitiatedStop();
          runtime.stop();
        } else {
          setLoadingTrackId(track.id);
          runtime.play(track.current_code).catch(console.error);
          setTimeout(() => setLoadingTrackId(null), 500);
        }
        return;
      }

      setLoadingTrackId(track.id);
      queue.playTrack(track, tracks);
      setTimeout(() => setLoadingTrackId(null), 500);
    },
    [queue, tracks, isPlaying, runtime]
  );

  // Handle stopping playback
  const handleStop = useCallback(() => {
    queue.clearQueue();
    setLoadingTrackId(null);
  }, [queue]);

  // Not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-cyan-300 mb-4">Sign in to view favorites</h1>
          <p className="text-slate-400 mb-6">Like tracks to save them to your favorites</p>
          <Link
            href="/auth/sign-in"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-900/10 via-transparent to-transparent opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 pb-32">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Explore
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-cyan-100">My Favorites</h1>
              <p className="text-sm text-slate-400">
                {loading ? "Loading..." : `${tracks.length} track${tracks.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">Failed to load favorites</h3>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button
              onClick={fetchFavorites}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-700/50">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No favorites yet</h3>
            <p className="text-sm text-slate-500 mb-4">
              Explore tracks and click the heart icon to add them to your favorites
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              Explore Tracks
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.map((track) => (
              <ExploreTrackCard
                key={track.id}
                track={track}
                isPlaying={queue.currentTrack?.id === track.id && isPlaying}
                isCurrentTrack={queue.currentTrack?.id === track.id}
                isLoading={loadingTrackId === track.id}
                onPlay={handlePlayTrack}
              />
            ))}
          </div>
        )}
      </div>

      {/* Player bar */}
      <ExplorePlayer
        currentTrack={queue.currentTrack}
        autoPlay={queue.autoPlay}
        shuffle={queue.shuffle}
        hasNext={queue.hasNext}
        hasPrevious={queue.hasPrevious}
        onPlayNext={queue.playNext}
        onPlayPrevious={queue.playPrevious}
        onToggleAutoPlay={queue.toggleAutoPlay}
        onToggleShuffle={queue.toggleShuffle}
        onStop={handleStop}
      />
    </div>
  );
}
