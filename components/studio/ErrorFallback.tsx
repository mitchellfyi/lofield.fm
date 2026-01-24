"use client";

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  componentName?: string;
}

export function ErrorFallback({ error, resetError, componentName }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-950/20 border border-red-800/30 rounded-lg text-center">
      <div className="text-red-400 text-sm font-medium mb-2">
        {componentName ? `Error in ${componentName}` : "Something went wrong"}
      </div>
      <p className="text-neutral-400 text-xs mb-4 max-w-md">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={resetError}
        className="px-4 py-2 text-sm bg-neutral-800 text-neutral-200 rounded hover:bg-neutral-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
