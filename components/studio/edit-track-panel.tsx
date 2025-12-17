"use client";

import { useState } from "react";

type Track = {
  id: string;
  title: string;
  description: string;
  visibility: "public" | "unlisted" | "private";
  genre?: string | null;
  bpm?: number | null;
  metadata?: {
    tags?: string[];
    genre?: string;
    bpm?: number;
    mood?: {
      energy?: number;
      focus?: number;
      chill?: number;
    };
    instrumentation?: string[];
    key?: string | null;
    time_signature?: string | null;
  };
};

type Props = {
  track: Track;
  onSave: () => void;
  onCancel: () => void;
};

export function EditTrackPanel({ track, onSave, onCancel }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(track.title);
  const [description, setDescription] = useState(track.description);
  const [visibility, setVisibility] = useState(track.visibility);
  const [genre, setGenre] = useState(
    track.genre || track.metadata?.genre || ""
  );
  const [bpm, setBpm] = useState(
    track.bpm?.toString() || track.metadata?.bpm?.toString() || ""
  );
  const [tags, setTags] = useState(track.metadata?.tags?.join(", ") || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updates: Record<string, unknown> = {
        title,
        description,
        visibility,
      };

      // Update genre if changed
      if (genre !== (track.genre || track.metadata?.genre || "")) {
        updates.genre = genre;
      }

      // Update BPM if changed
      const bpmNum = bpm ? parseInt(bpm, 10) : undefined;
      if (
        bpmNum !== undefined &&
        bpmNum !== (track.bpm || track.metadata?.bpm)
      ) {
        updates.bpm = bpmNum;
      }

      // Update tags if changed
      const newTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const currentTags = track.metadata?.tags || [];
      if (JSON.stringify(newTags) !== JSON.stringify(currentTags)) {
        updates.metadata = {
          ...track.metadata,
          tags: newTags,
        };
      }

      const response = await fetch(`/api/tracks/${track.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update track");
      }

      onSave();
    } catch (err) {
      console.error("Failed to update track:", err);
      setError(err instanceof Error ? err.message : "Failed to update track");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Edit Track</h3>
        <button
          onClick={onCancel}
          className="text-slate-400 transition hover:text-slate-600"
          aria-label="Close"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Visibility */}
        <div>
          <label
            htmlFor="visibility"
            className="block text-sm font-medium text-slate-700"
          >
            Visibility
          </label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as "public" | "unlisted" | "private")
            }
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="public">Public - Visible in library</option>
            <option value="unlisted">Unlisted - Only via link</option>
            <option value="private">Private - Only you</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            {visibility === "public" &&
              "Anyone can find and play this track in the library"}
            {visibility === "unlisted" &&
              "Only people with the link can play this track"}
            {visibility === "private" && "Only you can see and play this track"}
          </p>
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-slate-700"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {/* Genre */}
        <div>
          <label
            htmlFor="genre"
            className="block text-sm font-medium text-slate-700"
          >
            Genre
          </label>
          <input
            id="genre"
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            maxLength={100}
            placeholder="e.g., lofi, ambient, jazz"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {/* BPM */}
        <div>
          <label
            htmlFor="bpm"
            className="block text-sm font-medium text-slate-700"
          >
            BPM
          </label>
          <input
            id="bpm"
            type="number"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            min={20}
            max={300}
            placeholder="e.g., 80"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {/* Tags */}
        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-slate-700"
          >
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., chill, study, relaxing (comma-separated)"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            Separate tags with commas
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
