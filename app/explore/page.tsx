"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useExplore } from "@/lib/hooks/useExplore";
import { usePlayQueue } from "@/lib/hooks/usePlayQueue";
import { ExploreFilters, TrackGrid, ExplorePlayer } from "@/components/explore";
import type { PublicTrack } from "@/lib/types/explore";

/**
 * Public track exploration page
 * Browse and play public tracks with filtering and auto-play
 */
export default function ExplorePage() {
  const explore = useExplore();
  const queue = usePlayQueue();
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  // Handle playing a track
  const handlePlayTrack = useCallback(
    (track: PublicTrack) => {
      setLoadingTrackId(track.id);
      // Play the track and set the queue to all visible tracks
      queue.playTrack(track, explore.tracks);
      // Clear loading state after a short delay
      setTimeout(() => setLoadingTrackId(null), 500);
    },
    [queue, explore.tracks]
  );

  // Handle tag click from card - toggle tag filter
  const handleTagClick = useCallback(
    (tag: string) => {
      explore.toggleTag(tag);
    },
    [explore]
  );

  // Handle genre click from card - set genre filter
  const handleGenreClick = useCallback(
    (genre: string) => {
      explore.setGenre(genre);
    },
    [explore]
  );

  // Handle stopping playback
  const handleStop = useCallback(() => {
    queue.clearQueue();
    setLoadingTrackId(null);
  }, [queue]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-cyan-100">Explore Tracks</h1>
                <p className="text-xs text-slate-400">
                  {explore.total > 0 ? `${explore.total} tracks` : "Loading..."}
                </p>
              </div>
            </div>

            <Link
              href="/studio"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all shadow-lg shadow-cyan-500/20"
            >
              Create Track
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters sidebar */}
          <aside className="lg:col-span-1">
            <ExploreFilters
              filters={explore.filters}
              genres={explore.genres}
              availableTags={explore.availableTags}
              bpmRange={explore.bpmRange}
              onGenreChange={explore.setGenre}
              onTagToggle={explore.toggleTag}
              onBpmChange={explore.setBpmRange}
              onSortChange={explore.setSort}
              onClear={explore.clearFilters}
            />
          </aside>

          {/* Track grid */}
          <div className="lg:col-span-3">
            {explore.error ? (
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
                <h3 className="text-lg font-medium text-slate-300 mb-2">Failed to load tracks</h3>
                <p className="text-sm text-slate-500 mb-4">{explore.error}</p>
                <button
                  onClick={() => explore.refresh()}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <TrackGrid
                tracks={explore.tracks}
                loading={explore.loading}
                hasMore={explore.hasMore}
                currentTrackId={queue.currentTrack?.id || null}
                loadingTrackId={loadingTrackId}
                onLoadMore={explore.loadMore}
                onPlayTrack={handlePlayTrack}
                onTagClick={handleTagClick}
                onGenreClick={handleGenreClick}
              />
            )}
          </div>
        </div>
      </main>

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
