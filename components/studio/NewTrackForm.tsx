"use client";

import { useState } from "react";

interface NewTrackFormProps {
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function NewTrackForm({ onSubmit, onCancel }: NewTrackFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Track name..."
        className="flex-1 px-3 py-1.5 bg-slate-700 border border-cyan-500/30 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
      />
      <button
        onClick={handleSubmit}
        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
      >
        Add
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
