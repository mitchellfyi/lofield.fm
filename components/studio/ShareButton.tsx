"use client";

interface ShareButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

export function ShareButton({ disabled = false, onClick }: ShareButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-sm text-[10px] sm:text-xs font-medium transition-all duration-200 text-slate-300 hover:text-cyan-300 border border-slate-600 hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Share track"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      <span className="hidden sm:inline">Share</span>
    </button>
  );
}
