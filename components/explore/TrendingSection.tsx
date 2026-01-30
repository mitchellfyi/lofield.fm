"use client";

import { useRef } from "react";
import type { PublicTrack } from "@/lib/types/explore";
import { ExploreTrackCard } from "./ExploreTrackCard";

interface TrendingSectionProps {
  title: string;
  icon: "fire" | "star" | "clock";
  tracks: PublicTrack[];
  currentTrackId: string | null;
  loadingTrackId: string | null;
  isAudioPlaying: boolean;
  onPlayTrack: (track: PublicTrack) => void;
  onTagClick?: (tag: string) => void;
  onGenreClick?: (genre: string) => void;
}

const ICONS = {
  fire: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.58 5-8.05V4c0-.55.45-1 1-1s1 .45 1 1v1.95c2.96 1.47 5 4.52 5 8.05 0 4.97-4.03 9-9 9zm-1-16.12c-2.51 1.19-4 3.65-4 6.12 0 3.86 3.14 7 7 7s7-3.14 7-7c0-2.47-1.49-4.93-4-6.12V8c0 .55-.45 1-1 1s-1-.45-1-1V6.88zM12 18c-2.21 0-4-1.79-4-4 0-1.95 1.4-3.57 3.25-3.92.5-.1.97.31.97.82v2.1c0 .55.45 1 1 1h2.1c.51 0 .92.47.82.97-.35 1.85-1.97 3.25-3.92 3.25-.1 0-.15-.02-.22-.02z" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </svg>
  ),
};

const COLORS = {
  fire: "text-orange-400",
  star: "text-amber-400",
  clock: "text-cyan-400",
};

/**
 * Horizontal scrolling section for trending/featured/new tracks
 */
export function TrendingSection({
  title,
  icon,
  tracks,
  currentTrackId,
  loadingTrackId,
  isAudioPlaying,
  onPlayTrack,
  onTagClick,
  onGenreClick,
}: TrendingSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (tracks.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={COLORS[icon]}>{ICONS[icon]}</span>
          <h2 className="text-lg font-bold text-cyan-100">{title}</h2>
          <span className="text-xs text-slate-500">({tracks.length})</span>
        </div>

        {/* Scroll buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            aria-label="Scroll left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Track Cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pt-3 pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
        style={{ scrollbarWidth: "thin" }}
      >
        {tracks.map((track) => (
          <div key={track.id} className="flex-shrink-0 w-64 overflow-visible">
            <ExploreTrackCard
              track={track}
              isPlaying={currentTrackId === track.id && isAudioPlaying}
              isCurrentTrack={currentTrackId === track.id}
              isLoading={loadingTrackId === track.id}
              onPlay={onPlayTrack}
              onTagClick={onTagClick}
              onGenreClick={onGenreClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
