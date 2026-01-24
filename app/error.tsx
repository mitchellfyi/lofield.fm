"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5 bg-neutral-950 text-neutral-200">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
        <p className="text-neutral-400 mb-6">
          An unexpected error occurred. Our team has been notified.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
        {error.digest && <p className="mt-4 text-xs text-neutral-500">Error ID: {error.digest}</p>}
      </div>
    </div>
  );
}
