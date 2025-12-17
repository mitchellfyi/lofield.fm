"use client";

import { PublicTrack } from "@/lib/contexts/player-context";
import { usePlayer } from "@/lib/contexts/player-context";
import Link from "next/link";
import { formatDuration } from "@/lib/utils/format";

type TrackCardProps = {
  track: PublicTrack;
  onPlay: (track: PublicTrack) => void;
};

export function TrackCard({ track, onPlay }: TrackCardProps) {
  const { currentTrack, isPlaying } = usePlayer();
  const isCurrentTrack = currentTrack?.id === track.id;

  const tags = Array.isArray(track.metadata?.tags)
    ? (track.metadata.tags as string[])
    : [];
  const displayTags = tags.slice(0, 3);

  return (
    <div className="group relative rounded-lg border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Play button */}
        <button
          onClick={() => onPlay(track)}
          className={`flex-shrink-0 rounded-full p-3 transition ${
            isCurrentTrack && isPlaying
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-700 group-hover:bg-emerald-600 group-hover:text-white"
          }`}
          aria-label={isCurrentTrack && isPlaying ? "Pause" : "Play"}
        >
          {isCurrentTrack && isPlaying ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/tracks/${track.id}`}
            className="block hover:text-emerald-600"
          >
            <h3 className="font-medium text-slate-900 truncate">
              {track.title}
            </h3>
          </Link>

          <p className="text-sm text-slate-600 mt-0.5">
            {track.artist_name || "Unknown Artist"}
          </p>

          {track.description && (
            <p className="text-sm text-slate-500 mt-2 line-clamp-2">
              {track.description}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            {track.genre && (
              <span className="rounded bg-slate-100 px-2 py-1">
                {track.genre}
              </span>
            )}
            {track.bpm && <span>{track.bpm} BPM</span>}
            {track.length_ms && <span>{formatDuration(track.length_ms)}</span>}
            {displayTags.length > 0 && (
              <div className="flex gap-1">
                {displayTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className="text-slate-500">+{tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type TrackListProps = {
  tracks: PublicTrack[];
  onTrackPlay: (track: PublicTrack, index: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
};

export function TrackList({
  tracks,
  onTrackPlay,
  onLoadMore,
  hasMore = false,
  loading = false,
}: TrackListProps) {
  if (tracks.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="h-16 w-16 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
        <p className="mt-4 text-lg font-medium text-slate-700">
          No tracks found
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your filters or search query
        </p>
        <Link
          href="/app"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create a Track in Studio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tracks.map((track, index) => (
        <TrackCard
          key={track.id}
          track={track}
          onPlay={() => onTrackPlay(track, index)}
        />
      ))}

      {/* Load more button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center py-6">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="rounded-lg border border-emerald-600 px-6 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"></div>
        </div>
      )}
    </div>
  );
}
