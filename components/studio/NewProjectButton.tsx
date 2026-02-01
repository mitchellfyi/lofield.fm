"use client";

interface NewProjectButtonProps {
  onClick: () => void;
}

export function NewProjectButton({ onClick }: NewProjectButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-3 mt-2 text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/50 rounded-lg transition-colors"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      New Project
    </button>
  );
}
