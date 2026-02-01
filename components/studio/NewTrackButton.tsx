"use client";

interface NewTrackButtonProps {
  onClick: () => void;
}

export function NewTrackButton({ onClick }: NewTrackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      New Track
    </button>
  );
}
