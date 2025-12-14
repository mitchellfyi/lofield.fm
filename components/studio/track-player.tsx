"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Track = {
  id: string;
  title: string;
  description: string;
  final_prompt: string;
  metadata: {
    genre?: string;
    bpm?: number;
    mood?: {
      energy?: number;
      focus?: number;
      chill?: number;
    };
    tags?: string[];
    instrumentation?: string[];
    key?: string | null;
    time_signature?: string | null;
  };
  length_ms: number;
  instrumental: boolean;
  status: "draft" | "generating" | "ready" | "failed";
  error?: { message?: string; suggestion?: string; type?: string } | null;
  storage_path: string | null;
  created_at: string;
};

type Props = {
  tracks: Track[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
};

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Constants for signed URL management
const SIGNED_URL_REFRESH_INTERVAL = 50 * 1000; // Refresh every 50s (before 60s expiration)

// Player component that resets when track changes via key prop
function AudioPlayer({ track }: { track: Track }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch signed URL when component mounts
  const fetchSignedUrl = useCallback(async () => {
    try {
      setLoadError(null);
      const response = await fetch(`/api/tracks/${track.id}/play`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load track");
      }
      const data = await response.json();
      setSignedUrl(data.signedUrl);
    } catch (err) {
      console.error("Failed to fetch signed URL", err);
      setLoadError(err instanceof Error ? err.message : "Failed to load track");
    }
  }, [track.id]);

  // Fetch signed URL on mount and set up refresh timer
  useEffect(() => {
    fetchSignedUrl();
    // Refresh signed URL periodically (before expiration)
    const interval = setInterval(fetchSignedUrl, SIGNED_URL_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSignedUrl]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

  function handleTimeUpdate() {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime * 1000);
    }
  }

  function handleLoadedMetadata() {
    if (audioRef.current) {
      setDuration(audioRef.current.duration * 1000);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time / 1000;
    }
  }

  return (
    <div className="rounded-xl bg-slate-900 p-4 text-white">
      {loadError ? (
        <div className="rounded-lg bg-red-900/50 p-3 text-red-200">
          <p className="text-sm font-medium">Playback error</p>
          <p className="mt-1 text-xs">{loadError}</p>
        </div>
      ) : !signedUrl ? (
        <div className="flex items-center justify-center py-4">
          <svg
            className="h-5 w-5 animate-spin text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
          >
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
        </div>
      ) : (
        <>
          <audio
            ref={audioRef}
            src={signedUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 transition hover:bg-emerald-500"
            >
              {isPlaying ? (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 pl-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={duration > 0 ? duration : track.length_ms}
                value={currentTime}
                onChange={handleSeek}
                className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>
                  {formatTime(duration > 0 ? duration : track.length_ms)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function TrackPlayer({ tracks, selectedTrackId, onSelectTrack }: Props) {
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) ?? null;

  // Filter state
  const [genreFilter, setGenreFilter] = useState<string>("");
  const [moodFilter, setMoodFilter] = useState<string>(""); // chill, focus, energy, or empty
  const [bpmRange, setBpmRange] = useState<[number, number]>([0, 220]);

  // Get unique genres from tracks
  const genres = Array.from(
    new Set(
      tracks
        .map((t) => t.metadata.genre)
        .filter((g): g is string => g !== undefined)
    )
  ).sort();

  // Apply filters
  const filteredTracks = tracks.filter((track) => {
    // Genre filter
    if (genreFilter && track.metadata.genre !== genreFilter) {
      return false;
    }

    // BPM filter
    if (
      track.metadata.bpm &&
      (track.metadata.bpm < bpmRange[0] || track.metadata.bpm > bpmRange[1])
    ) {
      return false;
    }

    // Mood filter - check which mood is highest
    if (moodFilter && track.metadata.mood) {
      const { energy, focus, chill } = track.metadata.mood;
      const maxMood = Math.max(energy ?? 0, focus ?? 0, chill ?? 0);

      if (moodFilter === "energy" && (energy ?? 0) !== maxMood) return false;
      if (moodFilter === "focus" && (focus ?? 0) !== maxMood) return false;
      if (moodFilter === "chill" && (chill ?? 0) !== maxMood) return false;
    }

    return true;
  });

  if (tracks.length === 0) {
    return (
      <aside className="flex h-full flex-col border-l border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Tracks</h2>
        <div className="mt-4 flex flex-1 flex-col items-center justify-center text-center">
          <div className="rounded-full bg-slate-100 p-4">
            <svg
              className="h-8 w-8 text-slate-400"
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
          </div>
          <p className="mt-3 text-sm text-slate-600">No tracks yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Generate a track to see it here
          </p>
        </div>
      </aside>
    );
  }

  const hasActiveFilters =
    genreFilter || moodFilter || bpmRange[0] > 0 || bpmRange[1] < 220;

  return (
    <aside className="flex h-full flex-col border-l border-slate-200 bg-white">
      {/* Track list header with filters */}
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Tracks</h2>

        {/* Filters */}
        {tracks.length > 0 && (
          <div className="mt-3 space-y-2">
            {/* Genre filter */}
            {genres.length > 0 && (
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
              >
                <option value="">All genres</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            )}

            {/* Mood filter */}
            <select
              value={moodFilter}
              onChange={(e) => setMoodFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
            >
              <option value="">All moods</option>
              <option value="energy">Energy</option>
              <option value="focus">Focus</option>
              <option value="chill">Chill</option>
            </select>

            {/* BPM range filter */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500">
                BPM: {bpmRange[0]} - {bpmRange[1]}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={bpmRange[0]}
                  onChange={(e) =>
                    setBpmRange([Number(e.target.value), bpmRange[1]])
                  }
                  min={0}
                  max={220}
                  className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                  placeholder="Min"
                />
                <input
                  type="number"
                  value={bpmRange[1]}
                  onChange={(e) =>
                    setBpmRange([bpmRange[0], Number(e.target.value)])
                  }
                  min={0}
                  max={220}
                  className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setGenreFilter("");
                  setMoodFilter("");
                  setBpmRange([0, 220]);
                }}
                className="w-full rounded-lg bg-slate-100 px-2 py-1.5 text-xs text-slate-700 transition hover:bg-slate-200"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
      <div className="max-h-48 overflow-y-auto">
        {filteredTracks.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No tracks match your filters
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredTracks.map((track) => (
              <li key={track.id}>
                <button
                  onClick={() => onSelectTrack(track.id)}
                  className={`w-full px-4 py-2 text-left transition ${
                    selectedTrackId === track.id
                      ? "bg-emerald-50 text-emerald-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium">
                      {track.title}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        track.status === "ready"
                          ? "bg-emerald-100 text-emerald-700"
                          : track.status === "generating"
                            ? "bg-amber-100 text-amber-700"
                            : track.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {track.status}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected track details */}
      {selectedTrack && (
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {/* Player - use key to reset state when track changes */}
          {selectedTrack.status === "ready" && selectedTrack.storage_path && (
            <AudioPlayer key={selectedTrack.id} track={selectedTrack} />
          )}

          {/* Status display */}
          {selectedTrack.status === "generating" && (
            <div className="rounded-xl bg-amber-50 p-4 text-amber-800">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
                <span className="text-sm font-medium">
                  Generating your track...
                </span>
              </div>
            </div>
          )}

          {selectedTrack.status === "failed" && (
            <div className="rounded-xl bg-red-50 p-4 text-red-800">
              <p className="text-sm font-medium">Generation failed</p>
              {selectedTrack.error?.message && (
                <p className="mt-1 text-xs">{selectedTrack.error.message}</p>
              )}
              {selectedTrack.error?.suggestion && (
                <div className="mt-3">
                  <p className="text-xs font-medium">Suggestion:</p>
                  <p className="mt-1 text-xs">
                    {selectedTrack.error.suggestion}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="mt-4 space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {selectedTrack.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {selectedTrack.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {selectedTrack.metadata.genre && (
                <div>
                  <span className="text-xs text-slate-500">Genre</span>
                  <p className="font-medium text-slate-800">
                    {selectedTrack.metadata.genre}
                  </p>
                </div>
              )}
              {selectedTrack.metadata.bpm && (
                <div>
                  <span className="text-xs text-slate-500">BPM</span>
                  <p className="font-medium text-slate-800">
                    {selectedTrack.metadata.bpm}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-slate-500">Length</span>
                <p className="font-medium text-slate-800">
                  {formatTime(selectedTrack.length_ms)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Type</span>
                <p className="font-medium text-slate-800">
                  {selectedTrack.instrumental ? "Instrumental" : "With Vocals"}
                </p>
              </div>
              {selectedTrack.metadata.key && (
                <div>
                  <span className="text-xs text-slate-500">Key</span>
                  <p className="font-medium text-slate-800">
                    {selectedTrack.metadata.key}
                  </p>
                </div>
              )}
              {selectedTrack.metadata.time_signature && (
                <div>
                  <span className="text-xs text-slate-500">Time Signature</span>
                  <p className="font-medium text-slate-800">
                    {selectedTrack.metadata.time_signature}
                  </p>
                </div>
              )}
            </div>

            {/* Instrumentation */}
            {selectedTrack.metadata.instrumentation &&
              selectedTrack.metadata.instrumentation.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500">
                    Instrumentation
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedTrack.metadata.instrumentation.map(
                      (instrument) => (
                        <span
                          key={instrument}
                          className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
                        >
                          {instrument}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Mood scores */}
            {selectedTrack.metadata.mood && (
              <div>
                <span className="text-xs text-slate-500">Mood</span>
                <div className="mt-1 flex gap-2">
                  {selectedTrack.metadata.mood.energy !== undefined && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Energy:{" "}
                      {Math.round(selectedTrack.metadata.mood.energy * 100)}%
                    </span>
                  )}
                  {selectedTrack.metadata.mood.focus !== undefined && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      Focus:{" "}
                      {Math.round(selectedTrack.metadata.mood.focus * 100)}%
                    </span>
                  )}
                  {selectedTrack.metadata.mood.chill !== undefined && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Chill:{" "}
                      {Math.round(selectedTrack.metadata.mood.chill * 100)}%
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedTrack.metadata.tags &&
              selectedTrack.metadata.tags.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500">Tags</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedTrack.metadata.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Final prompt */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs font-medium text-slate-500">
                Final Prompt
              </span>
              <p className="mt-1 text-xs text-slate-700">
                {selectedTrack.final_prompt}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedTrack.final_prompt);
                  // Could add a toast notification here
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Copy Prompt
              </button>
              {/* TODO: Implement regenerate - needs to create a new track with same prompt */}
              {/* <button
                onClick={() => {
                  // Would need to call the tracks API with the same prompt
                }}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                Regenerate
              </button> */}
            </div>
          </div>
        </div>
      )}

      {/* No track selected */}
      {!selectedTrack && (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <p className="text-sm text-slate-500">
            Select a track to view details
          </p>
        </div>
      )}
    </aside>
  );
}
