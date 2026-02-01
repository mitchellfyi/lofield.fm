"use client";

import { useInlineEdit } from "@/lib/hooks/useInlineEdit";
import type { ProjectWithTrackCount } from "@/lib/types/tracks";

interface ProjectListItemProps {
  project: ProjectWithTrackCount;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  children?: React.ReactNode;
}

export function ProjectListItem({
  project,
  isExpanded,
  onToggleExpand,
  onRename,
  onDelete,
  children,
}: ProjectListItemProps) {
  const { isEditing, editValue, inputRef, startEdit, setEditValue, handleKeyDown, handleBlur } =
    useInlineEdit({
      initialValue: project.name,
      onSubmit: onRename,
    });

  return (
    <div className="group">
      {/* Project Header */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors">
        <button
          onClick={onToggleExpand}
          className="text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 bg-slate-600 border border-cyan-500/50 rounded text-white text-sm focus:outline-none focus:border-cyan-400"
          />
        ) : (
          <span className="flex-1 text-white font-medium cursor-pointer" onClick={onToggleExpand}>
            {project.name}
          </span>
        )}

        <span className="text-xs text-slate-500">
          {project.track_count} track{project.track_count !== 1 ? "s" : ""}
        </span>

        {/* Project Actions */}
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <button
            onClick={startEdit}
            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Rename"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Tracks List (expanded) */}
      {isExpanded && <div className="ml-6 mt-1 space-y-1">{children}</div>}
    </div>
  );
}
