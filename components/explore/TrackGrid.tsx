"use client";

import { useEffect, useRef, useCallback } from "react";
import type { PublicTrack } from "@/lib/types/explore";
import { ExploreTrackCard } from "./ExploreTrackCard";

interface TrackGridProps {
  tracks: PublicTrack[];
  loading: boolean;
  hasMore: boolean;
  currentTrackId: string | null;
  loadingTrackId: string | null;
  isAudioPlaying: boolean;
  onLoadMore: () => Promise<void>;
  onPlayTrack: (track: PublicTrack) => void;
  onTagClick?: (tag: string) => void;
  onGenreClick?: (genre: string) => void;
}

/**
 * Grid of track cards with infinite scroll support
 */
export function TrackGrid({
  tracks,
  loading,
  hasMore,
  currentTrackId,
  loadingTrackId,
  isAudioPlaying,
  onLoadMore,
  onPlayTrack,
  onTagClick,
  onGenreClick,
}: TrackGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // Empty state
  if (!loading && tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-300 mb-2">No tracks found</h3>
        <p className="text-sm text-slate-500">Try adjusting your filters to find more tracks</p>
      </div>
    );
  }

  return (
    <div>
      {/* Track grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tracks.map((track) => (
          <ExploreTrackCard
            key={track.id}
            track={track}
            isPlaying={currentTrackId === track.id && isAudioPlaying}
            isCurrentTrack={currentTrackId === track.id}
            isLoading={loadingTrackId === track.id}
            onPlay={onPlayTrack}
            onTagClick={onTagClick}
            onGenreClick={onGenreClick}
          />
        ))}
      </div>

      {/* Loading indicator / Load more trigger */}
      <div ref={loadMoreRef} className="py-8 flex items-center justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-slate-400">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm">Loading tracks...</span>
          </div>
        )}
        {!loading && !hasMore && tracks.length > 0 && (
          <p className="text-sm text-slate-500">Showing all {tracks.length} tracks</p>
        )}
      </div>
    </div>
  );
}
