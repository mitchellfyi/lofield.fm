"use client";

interface ApiKeyPromptProps {
  onAddKey: () => void;
}

export function ApiKeyPrompt({ onAddKey }: ApiKeyPromptProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-slate-800/50 border border-cyan-500/30 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-cyan-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-cyan-300 mb-2">API Key Required</h3>
      <p className="text-sm text-slate-400 mb-4 max-w-sm">
        To use AI chat, please add your OpenAI API key. Your key is stored securely and never
        shared.
      </p>
      <button
        onClick={onAddKey}
        className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20"
      >
        Add API Key
      </button>
    </div>
  );
}
