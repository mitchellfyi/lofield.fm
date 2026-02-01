"use client";

import { useInlineEdit } from "@/lib/hooks/useInlineEdit";
import type { Track } from "@/lib/types/tracks";

interface TrackListItemProps {
  track: Track;
  isSelected: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function TrackListItem({
  track,
  isSelected,
  onSelect,
  onRename,
  onDelete,
}: TrackListItemProps) {
  const { isEditing, editValue, inputRef, startEdit, setEditValue, handleKeyDown, handleBlur } =
    useInlineEdit({
      initialValue: track.name,
      onSubmit: onRename,
    });

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
        isSelected ? "bg-cyan-600/20 border border-cyan-500/50" : "hover:bg-slate-700/50"
      }`}
      onClick={onSelect}
    >
      <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
        />
      </svg>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 px-2 py-1 bg-slate-600 border border-cyan-500/50 rounded text-white text-sm focus:outline-none focus:border-cyan-400"
        />
      ) : (
        <span className="flex-1 text-slate-200 text-sm">{track.name}</span>
      )}

      {/* Track Actions */}
      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            startEdit();
          }}
          className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
          title="Rename"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
          title="Delete"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
