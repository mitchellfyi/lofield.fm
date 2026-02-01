"use client";

import { useState } from "react";

interface NewProjectFormProps {
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function NewProjectForm({ onSubmit, onCancel }: NewProjectFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 mt-4 border-t border-slate-700 pt-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name..."
        className="flex-1 px-3 py-2 bg-slate-700 border border-cyan-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
      />
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
      >
        Create
      </button>
      <button
        onClick={onCancel}
        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
