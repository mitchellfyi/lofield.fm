"use client";

import { useRef, useState } from "react";

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
  };
  length_ms: number;
  instrumental: boolean;
  status: "draft" | "generating" | "ready" | "failed";
  error?: { message?: string } | null;
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

// Player component that resets when track changes via key prop
function AudioPlayer({ track }: { track: Track }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      <audio
        ref={audioRef}
        src={`/api/tracks/${track.id}/stream`}
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
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
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
            max={duration || track.length_ms}
            value={currentTime}
            onChange={handleSeek}
            className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || track.length_ms)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrackPlayer({ tracks, selectedTrackId, onSelectTrack }: Props) {
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) ?? null;

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

  return (
    <aside className="flex h-full flex-col border-l border-slate-200 bg-white">
      {/* Track list */}
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Tracks</h2>
      </div>
      <div className="max-h-48 overflow-y-auto">
        <ul className="divide-y divide-slate-100">
          {tracks.map((track) => (
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
                  <p className="truncate text-sm font-medium">{track.title}</p>
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
            </div>

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
