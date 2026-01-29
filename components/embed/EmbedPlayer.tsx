"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getAudioRuntime, type PlayerState } from "@/lib/audio/runtime";
import { useTransportState } from "@/lib/audio/useVisualization";

interface EmbedPlayerProps {
  trackName: string;
  trackCode: string;
  shareUrl: string;
  theme?: "light" | "dark";
}

/**
 * Lightweight embed player for external websites
 */
export function EmbedPlayer({ trackName, trackCode, shareUrl, theme = "dark" }: EmbedPlayerProps) {
  const runtimeRef = useRef(getAudioRuntime());
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [hasInitialized, setHasInitialized] = useState(false);
  const transportState = useTransportState();

  // Subscribe to player state changes
  useEffect(() => {
    const unsubscribe = runtimeRef.current.subscribe(() => {
      setPlayerState(runtimeRef.current.getState());
    });
    return unsubscribe;
  }, []);

  const handlePlay = useCallback(async () => {
    if (!hasInitialized) {
      await runtimeRef.current.init();
      setHasInitialized(true);
    }

    if (playerState === "playing") {
      runtimeRef.current.stop();
    } else {
      await runtimeRef.current.play(trackCode);
    }
  }, [hasInitialized, playerState, trackCode]);

  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";
  const progress = transportState?.progress ?? 0;

  const isDark = theme === "dark";
  const bgGradient = isDark
    ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
    : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";
  const accentColor = "#22d3ee";
  const borderColor = isDark ? "rgba(34,211,238,0.3)" : "rgba(34,211,238,0.5)";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 80,
        background: bgGradient,
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          padding: "16px 20px",
          gap: 16,
        }}
      >
        {/* Play/Pause button */}
        <button
          onClick={handlePlay}
          disabled={isLoading}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "none",
            background: isPlaying
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : `linear-gradient(135deg, ${accentColor}, #06b6d4)`,
            color: "white",
            cursor: isLoading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 4px 12px ${isPlaying ? "rgba(239,68,68,0.4)" : "rgba(34,211,238,0.4)"}`,
            transition: "all 0.2s ease",
          }}
        >
          {isLoading ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ animation: "spin 1s linear infinite" }}
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          ) : isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ marginLeft: 2 }}
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Track info and progress */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: textColor,
              marginBottom: 8,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {trackName}
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${accentColor}, #06b6d4)`,
                borderRadius: 3,
                transition: isPlaying ? "width 0.1s linear" : "width 0.2s ease",
              }}
            />
          </div>
        </div>

        {/* LoField branding link */}
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 6,
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            color: mutedColor,
            textDecoration: "none",
            fontSize: 12,
            fontWeight: 500,
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />
          <span>lofield.fm</span>
        </a>
      </div>

      {/* Inline styles for animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
