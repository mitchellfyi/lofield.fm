"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePlayer, type PublicTrack } from "@/lib/contexts/player-context";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { PlayerBar } from "@/components/library/player-bar";
import { EditTrackPanel } from "@/components/studio/edit-track-panel";
import { ShareButton } from "@/components/library/share-button";
import Link from "next/link";
import { formatDuration } from "@/lib/utils/format";

function formatDate(dateString: string | null): string {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function TrackPage() {
  const params = useParams();
  const trackId = params?.id as string;
  const { playTrack, currentTrack, isPlaying, setQueue } = usePlayer();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const [track, setTrack] = useState<PublicTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isCurrentTrack = currentTrack?.id === trackId;

  useEffect(() => {
    async function fetchTrack() {
      if (!trackId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/public/tracks/${trackId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Track not found");
          } else {
            setError("Failed to load track");
          }
          return;
        }

        const data = await response.json();
        setTrack(data);

        // Set ownership from server response
        setIsOwner(data.is_owner || false);
      } catch (err) {
        console.error("Error fetching track:", err);
        setError("Failed to load track");
      } finally {
        setLoading(false);
      }
    }

    fetchTrack();
  }, [trackId]);

  const handlePlay = () => {
    if (track) {
      // Create a single-track queue for the player
      // Note: Next/prev buttons will have no effect with a single track
      // This is expected behavior for individual track pages
      setQueue([track], 0);
      playTrack(track);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"></div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
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
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h1 className="text-2xl font-bold text-slate-900">
          {error || "Track not found"}
        </h1>
        <Link
          href="/library"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          Go to Library
        </Link>
      </div>
    );
  }

  const tags = Array.isArray(track.metadata?.tags)
    ? (track.metadata.tags as string[])
    : [];
  const instrumentation = Array.isArray(track.metadata?.instrumentation)
    ? (track.metadata.instrumentation as string[])
    : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="mx-auto max-w-4xl p-6">
        {/* Back button */}
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-emerald-600 mb-6"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Library
        </Link>

        {/* Track header */}
        {isEditing && isOwner ? (
          <EditTrackPanel
            track={{
              id: track.id,
              title: track.title,
              description: track.description || "",
              visibility: track.visibility || "public",
              genre: track.genre,
              bpm: track.bpm,
              metadata: track.metadata,
            }}
            onSave={async (updatedData) => {
              setIsEditing(false);

              // If changed to private, redirect to studio since track is no longer accessible
              if (updatedData?.visibility === "private") {
                window.location.href = "/app";
                return;
              }

              // Refetch track data instead of full page reload
              try {
                const response = await fetch(`/api/public/tracks/${trackId}`);
                if (response.ok) {
                  const data = await response.json();
                  setTrack(data);
                } else if (response.status === 404) {
                  // Track became private or deleted, redirect to studio
                  window.location.href = "/app";
                }
              } catch (err) {
                console.error("Failed to refetch track:", err);
                // Fallback to page reload if refetch fails
                window.location.reload();
              }
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            {isOwner && (
              <div className="mb-4 flex justify-end gap-2">
                <ShareButton trackId={track.id} trackTitle={track.title} />
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Edit Track
                </button>
              </div>
            )}
            {!isOwner && (
              <div className="mb-4 flex justify-end">
                <ShareButton trackId={track.id} trackTitle={track.title} />
              </div>
            )}
            <div className="flex items-start gap-6">
              {/* Play button */}
              <button
                onClick={handlePlay}
                className={`flex-shrink-0 rounded-full p-4 transition ${
                  isCurrentTrack && isPlaying
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                }`}
                aria-label={isCurrentTrack && isPlaying ? "Pause" : "Play"}
              >
                {isCurrentTrack && isPlaying ? (
                  <svg
                    className="h-8 w-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="h-8 w-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {track.title}
                </h1>
                <p className="text-lg text-slate-600 mb-4">
                  {track.artist_name || "Unknown Artist"}
                </p>
                {track.description && (
                  <p className="text-slate-700 mb-6">{track.description}</p>
                )}

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {track.genre && (
                    <div>
                      <span className="font-medium text-slate-700">Genre:</span>
                      <span className="ml-2 text-slate-600">{track.genre}</span>
                    </div>
                  )}
                  {track.bpm && (
                    <div>
                      <span className="font-medium text-slate-700">BPM:</span>
                      <span className="ml-2 text-slate-600">{track.bpm}</span>
                    </div>
                  )}
                  {track.length_ms && (
                    <div>
                      <span className="font-medium text-slate-700">
                        Duration:
                      </span>
                      <span className="ml-2 text-slate-600">
                        {formatDuration(track.length_ms)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-slate-700">Type:</span>
                    <span className="ml-2 text-slate-600">
                      {track.instrumental ? "Instrumental" : "With Vocals"}
                    </span>
                  </div>
                  {track.published_at && (
                    <div>
                      <span className="font-medium text-slate-700">
                        Published:
                      </span>
                      <span className="ml-2 text-slate-600">
                        {formatDate(track.published_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mood indicators */}
            {(track.mood_energy !== null ||
              track.mood_focus !== null ||
              track.mood_chill !== null) && (
              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Mood
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {track.mood_energy !== null && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600">Energy</span>
                        <span className="font-medium text-slate-900">
                          {track.mood_energy}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-emerald-600"
                          style={{ width: `${track.mood_energy}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {track.mood_focus !== null && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600">Focus</span>
                        <span className="font-medium text-slate-900">
                          {track.mood_focus}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-emerald-600"
                          style={{ width: `${track.mood_focus}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {track.mood_chill !== null && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600">Chill</span>
                        <span className="font-medium text-slate-900">
                          {track.mood_chill}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-emerald-600"
                          style={{ width: `${track.mood_chill}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Instrumentation */}
            {instrumentation.length > 0 && (
              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Instrumentation
                </h3>
                <div className="flex flex-wrap gap-2">
                  {instrumentation.map((instrument) => (
                    <span
                      key={instrument}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                    >
                      {instrument}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom player bar */}
      <PlayerBar />
    </div>
  );
}
