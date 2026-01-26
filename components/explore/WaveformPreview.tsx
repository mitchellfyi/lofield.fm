"use client";

import { useMemo, useEffect, useRef } from "react";
import { useAudioAnalysis } from "@/lib/audio/useVisualization";

interface WaveformPreviewProps {
  code: string;
  isPlaying: boolean;
  height?: number;
  barCount?: number;
  className?: string;
}

/**
 * Generates a deterministic pseudo-random waveform from track code.
 * Used as the static/idle display pattern.
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
 * Convert FFT dB values to normalized bar heights
 */
function fftToBarHeights(fft: Float32Array, barCount: number): number[] {
  const bars: number[] = [];
  const binCount = fft.length;

  // Group FFT bins into bars (logarithmic distribution for better visual)
  for (let i = 0; i < barCount; i++) {
    // Use logarithmic distribution to emphasize lower frequencies
    const startBin = Math.floor((i / barCount) ** 1.5 * binCount);
    const endBin = Math.floor(((i + 1) / barCount) ** 1.5 * binCount);
    const actualEndBin = Math.max(startBin + 1, endBin);

    // Average the bins in this range
    let sum = 0;
    for (let j = startBin; j < actualEndBin && j < binCount; j++) {
      // FFT values are in dB (typically -100 to 0)
      // Convert to 0-1 range
      const normalized = (fft[j] + 100) / 100;
      sum += Math.max(0, Math.min(1, normalized));
    }
    const avg = sum / (actualEndBin - startBin);

    // Apply some scaling and minimum height
    bars.push(Math.max(0.1, Math.min(1, avg * 1.5)));
  }

  return bars;
}

/**
 * A visual waveform preview for a track card.
 * Shows real-time audio visualization when playing,
 * or a deterministic pattern based on track code when idle.
 */
export function WaveformPreview({
  code,
  isPlaying,
  height = 32,
  barCount = 24,
  className = "",
}: WaveformPreviewProps) {
  const staticBars = useMemo(() => generateWaveformBars(code, barCount), [code, barCount]);
  const audioAnalysis = useAudioAnalysis();
  const barsRef = useRef<HTMLDivElement[]>([]);

  // Use requestAnimationFrame for smooth bar height updates when playing
  useEffect(() => {
    if (!isPlaying) return;

    let animationId: number;

    const updateBars = () => {
      if (!isPlaying) return;

      const liveBars = fftToBarHeights(audioAnalysis.fft, barCount);

      barsRef.current.forEach((bar, index) => {
        if (bar && liveBars[index] !== undefined) {
          bar.style.height = `${liveBars[index] * 100}%`;
        }
      });

      animationId = requestAnimationFrame(updateBars);
    };

    animationId = requestAnimationFrame(updateBars);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, audioAnalysis.fft, barCount]);

  // When not playing, reset bar heights to static values
  useEffect(() => {
    if (!isPlaying) {
      barsRef.current.forEach((bar, index) => {
        if (bar && staticBars[index] !== undefined) {
          bar.style.height = `${staticBars[index] * 100}%`;
        }
      });
    }
  }, [isPlaying, staticBars]);

  return (
    <div
      className={`flex items-center justify-between gap-0.5 ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {staticBars.map((barHeight, index) => (
        <div
          key={index}
          ref={(el) => {
            if (el) barsRef.current[index] = el;
          }}
          className={`flex-1 rounded-full transition-colors duration-200 ${
            isPlaying
              ? "bg-gradient-to-t from-cyan-500 to-cyan-400"
              : "bg-gradient-to-t from-slate-600 to-slate-500"
          }`}
          style={{
            height: `${barHeight * 100}%`,
            transition: isPlaying ? "height 50ms ease-out" : "height 300ms ease-out",
          }}
        />
      ))}
    </div>
  );
}
