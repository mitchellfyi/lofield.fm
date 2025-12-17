"use client";

import { useState, useMemo } from "react";

type ShareButtonProps = {
  trackId: string;
  trackTitle: string;
  className?: string;
};

export function ShareButton({
  trackId,
  trackTitle,
  className = "",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  // Compute share URL once
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/tracks/${trackId}`;
  }, [trackId]);

  const handleShare = async () => {
    // Try Web Share API first (mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: trackTitle,
          text: `Check out "${trackTitle}" on Lofield`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled share or share failed
        // Fall through to copy link
        if ((err as Error).name === "AbortError") {
          return; // User cancelled, don't copy
        }
      }
    }

    // Fallback to copy to clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${className}`}
      aria-label="Share track"
    >
      {copied ? (
        <>
          <svg
            className="h-4 w-4 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-emerald-600">Link copied!</span>
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span>Share</span>
        </>
      )}
    </button>
  );
}
