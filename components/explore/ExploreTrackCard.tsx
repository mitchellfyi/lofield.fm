"use client";

import type { PublicTrack } from "@/lib/types/explore";
import { WaveformPreview } from "./WaveformPreview";

interface ExploreTrackCardProps {
  track: PublicTrack;
  isPlaying: boolean;
  isCurrentTrack?: boolean;
  isLoading: boolean;
  onPlay: (track: PublicTrack) => void;
  onTagClick?: (tag: string) => void;
  onGenreClick?: (genre: string) => void;
  /** Show trending badge for high-play tracks */
  showTrendingBadge?: boolean;
}

/** Threshold for showing trending badge (plays count) */
const TRENDING_THRESHOLD = 10;

/**
 * Card component for displaying a public track in the explore grid
 */
export function ExploreTrackCard({
  track,
  isPlaying,
  isCurrentTrack = false,
  isLoading,
  onPlay,
  onTagClick,
  onGenreClick,
  showTrendingBadge = true,
}: ExploreTrackCardProps) {
  const isTrending = showTrendingBadge && !track.is_featured && track.plays >= TRENDING_THRESHOLD;
  const handlePlay = () => {
    onPlay(track);
  };

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    onTagClick?.(tag);
  };

  const handleGenreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (track.genre) {
      onGenreClick?.(track.genre);
    }
  };

  // Combine user tags and AI tags, deduplicate
  const allTags = [...new Set([...track.tags, ...track.ai_tags])];

  return (
    <div
      className={`group relative bg-slate-800/50 border rounded-xl p-4 transition-all duration-200 hover:shadow-lg cursor-pointer ${
        isPlaying
          ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
          : isCurrentTrack
            ? "border-cyan-500/50 shadow-md shadow-cyan-500/10"
            : "border-slate-700 hover:border-cyan-500/50 hover:shadow-cyan-500/5"
      }`}
      onClick={handlePlay}
    >
      {/* Featured badge */}
      {track.is_featured && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-bold text-white shadow-lg flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          Featured
        </div>
      )}

      {/* Trending badge */}
      {isTrending && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-[10px] font-bold text-white shadow-lg flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.58 5-8.05V4c0-.55.45-1 1-1s1 .45 1 1v1.95c2.96 1.47 5 4.52 5 8.05 0 4.97-4.03 9-9 9zm-1-16.12c-2.51 1.19-4 3.65-4 6.12 0 3.86 3.14 7 7 7s7-3.14 7-7c0-2.47-1.49-4.93-4-6.12V8c0 .55-.45 1-1 1s-1-.45-1-1V6.88z" />
          </svg>
          Trending
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-cyan-100 truncate">{track.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {track.genre && (
              <button
                onClick={handleGenreClick}
                className="text-xs font-medium text-cyan-500 hover:text-cyan-400 transition-colors"
              >
                {track.genre}
              </button>
            )}
            {track.bpm && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                {track.bpm} BPM
              </span>
            )}
          </div>
        </div>

        {/* Play indicator */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            isPlaying
              ? "bg-cyan-500 text-white"
              : isLoading
                ? "bg-slate-700 text-slate-400"
                : "bg-slate-700/50 text-slate-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-400"
          }`}
        >
          {isLoading ? (
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
          ) : isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
      </div>

      {/* Waveform Preview */}
      <div className="my-3 px-1">
        <WaveformPreview
          code={track.current_code}
          isPlaying={isPlaying}
          height={28}
          barCount={32}
        />
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {allTags.slice(0, 5).map((tag) => (
            <button
              key={tag}
              onClick={(e) => handleTagClick(e, tag)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
            >
              {tag}
            </button>
          ))}
          {allTags.length > 5 && (
            <span className="text-[10px] px-2 py-0.5 text-slate-500">
              +{allTags.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {track.plays.toLocaleString()}
        </span>
        {track.is_system && (
          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px]">
            Preset
          </span>
        )}
      </div>
    </div>
  );
}
