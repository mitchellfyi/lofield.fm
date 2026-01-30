"use client";

import { useLike } from "@/lib/hooks/useLike";

interface LikeButtonProps {
  trackId: string;
  initialLiked?: boolean;
  initialCount?: number;
  size?: "sm" | "md";
  showCount?: boolean;
  onAuthRequired?: () => void;
}

/**
 * Like/heart button for tracks with optimistic updates
 */
export function LikeButton({
  trackId,
  initialLiked = false,
  initialCount = 0,
  size = "sm",
  showCount = true,
  onAuthRequired,
}: LikeButtonProps) {
  const { liked, likeCount, loading, toggle } = useLike(trackId, initialLiked, initialCount);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault();

    try {
      await toggle();
    } catch {
      // If toggle fails due to auth, notify parent
      onAuthRequired?.();
    }
  };

  const sizeClasses = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  const buttonClasses = size === "sm" ? "p-1" : "p-1.5";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`group flex items-center gap-1 ${buttonClasses} rounded-full transition-all ${
        liked ? "text-rose-400 hover:text-rose-300" : "text-slate-400 hover:text-rose-400"
      } ${loading ? "opacity-50 cursor-wait" : ""}`}
      aria-label={liked ? "Unlike track" : "Like track"}
      title={liked ? "Unlike" : "Like"}
    >
      <svg
        className={`${sizeClasses} transition-transform ${liked ? "scale-110" : "group-hover:scale-110"}`}
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {showCount && likeCount > 0 && (
        <span className="text-xs font-medium">{likeCount.toLocaleString()}</span>
      )}
    </button>
  );
}
