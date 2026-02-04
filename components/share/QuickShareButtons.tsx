"use client";

import { useState } from "react";
import { getTwitterShareUrl, getTrackShareText } from "@/lib/share/socialLinks";

interface QuickShareButtonsProps {
  /** Whether the track is currently playing */
  isPlaying: boolean;
  /** The name of the current track */
  trackName?: string | null;
  /** The genre of the track (optional) */
  genre?: string;
  /** Callback when a share action occurs */
  onShare?: (platform: string) => void;
}

/**
 * Inline social sharing buttons that appear when a track is playing.
 * Provides quick access to Twitter/X sharing and copy link functionality.
 */
export function QuickShareButtons({
  isPlaying,
  trackName,
  genre,
  onShare,
}: QuickShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  // Only show when track is playing
  if (!isPlaying) {
    return null;
  }

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const displayName = trackName || "My Track";
  const shareText = getTrackShareText(displayName, genre);
  const hashtags = ["LoFieldFM", "AIMusic"];

  const twitterUrl = getTwitterShareUrl({
    url: currentUrl,
    title: `${displayName} | LoField Music Lab`,
    text: shareText,
    hashtags,
  });

  const handleTwitterShare = () => {
    window.open(twitterUrl, "_blank", "noopener,noreferrer,width=600,height=400");
    onShare?.("twitter");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      onShare?.("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      onShare?.("copy");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
      {/* Twitter/X Share Button */}
      <button
        onClick={handleTwitterShare}
        className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-medium bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 hover:border-[#1DA1F2]/50 transition-all duration-200 backdrop-blur-sm"
        title={`Share "${displayName}" on Twitter/X`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="hidden sm:inline">Share</span>
      </button>

      {/* Copy Link Button */}
      <button
        onClick={handleCopyLink}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-medium transition-all duration-200 backdrop-blur-sm ${
          copied
            ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
            : "bg-slate-700/50 border border-cyan-500/30 text-cyan-300 hover:bg-slate-700/70 hover:border-cyan-500/50"
        }`}
        title="Copy link to clipboard"
      >
        {copied ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="hidden sm:inline">Copied!</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
            <span className="hidden sm:inline">Copy Link</span>
          </>
        )}
      </button>
    </div>
  );
}
