"use client";

import { useMemo } from "react";

interface WaveformPreviewProps {
  code: string;
  isPlaying: boolean;
  height?: number;
  barCount?: number;
  className?: string;
}

/**
 * Generates a deterministic pseudo-random waveform from track code.
 * Uses a simple hash function to generate consistent bar heights.
 */
function generateWaveformBars(code: string, barCount: number): number[] {
  // Simple hash function for deterministic randomness
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const bars: number[] = [];
  let seed = Math.abs(hash);

  for (let i = 0; i < barCount; i++) {
    // LCG pseudo-random generator
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    // Generate bar height between 0.2 and 1.0 for visual appeal
    const normalized = (seed / 0x7fffffff) * 0.8 + 0.2;
    // Apply smoothing for more natural waveform shape
    bars.push(normalized);
  }

  // Apply simple moving average for smoother waveform
  const smoothed: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    const prev = bars[Math.max(0, i - 1)];
    const curr = bars[i];
    const next = bars[Math.min(bars.length - 1, i + 1)];
    smoothed.push((prev + curr + next) / 3);
  }

  return smoothed;
}

/**
 * A visual waveform preview for a track card.
 * Generates a deterministic waveform pattern based on the track's code.
 */
export function WaveformPreview({
  code,
  isPlaying,
  height = 32,
  barCount = 24,
  className = "",
}: WaveformPreviewProps) {
  const bars = useMemo(() => generateWaveformBars(code, barCount), [code, barCount]);

  return (
    <div
      className={`flex items-center justify-between gap-0.5 ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {bars.map((barHeight, index) => (
        <div
          key={index}
          className={`flex-1 rounded-full transition-all duration-300 ${
            isPlaying
              ? "bg-gradient-to-t from-cyan-500 to-cyan-400"
              : "bg-gradient-to-t from-slate-600 to-slate-500"
          }`}
          style={{
            height: `${barHeight * 100}%`,
            animationDelay: isPlaying ? `${index * 50}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}
