"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSyncExternalStore } from "react";
import { getVisualizationBridge, type AudioAnalysisData } from "@/lib/audio/visualizationBridge";

interface SpectrumAnalyzerProps {
  /** Height of the analyzer in pixels */
  height?: number;
  /** Show frequency labels on the x-axis */
  showLabels?: boolean;
  /** Enable peak hold visualization */
  peakHold?: boolean;
  /** Peak hold decay time in ms */
  peakDecayMs?: number;
  /** Bar color gradient start (bottom) */
  colorStart?: string;
  /** Bar color gradient end (top) */
  colorEnd?: string;
  /** Peak indicator color */
  peakColor?: string;
  /** Background color */
  bgColor?: string;
}

// Frequency labels for logarithmic scale
const FREQ_LABELS = ["50", "100", "200", "500", "1k", "2k", "5k", "10k", "20k"];
const FREQ_POSITIONS = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

/**
 * Get x position for a frequency value (logarithmic scale)
 */
function freqToX(freq: number, width: number): number {
  const minFreq = 20;
  const maxFreq = 20000;
  if (freq <= minFreq) return 0;
  if (freq >= maxFreq) return width;
  const logPos = Math.log10(freq / minFreq) / Math.log10(maxFreq / minFreq);
  return logPos * width;
}

/**
 * Real-time spectrum analyzer visualization
 * Uses canvas for smooth 60fps rendering
 */
export function SpectrumAnalyzer({
  height = 80,
  showLabels = true,
  peakHold = true,
  peakDecayMs = 1000,
  colorStart = "#22d3ee", // cyan-400
  colorEnd = "#06b6d4", // cyan-500
  peakColor = "#f97316", // orange-500
  bgColor = "rgba(15, 23, 42, 0.5)", // slate-900/50
}: SpectrumAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peaksRef = useRef<Float32Array | null>(null);
  const peakTimesRef = useRef<Float32Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Get audio analysis data from the visualization bridge
  const bridge = getVisualizationBridge();
  const analysisData = useSyncExternalStore(
    bridge.subscribeAnalysis,
    bridge.getAnalysisSnapshot,
    () => ({ fft: new Float32Array(64), waveform: new Float32Array(256), rms: 0 })
  );

  // Draw the spectrum visualization
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, data: AudioAnalysisData) => {
      const { fft } = data;
      const now = performance.now();
      const labelHeight = showLabels ? 16 : 0;
      const analyzerHeight = height - labelHeight;

      // Initialize peaks array if needed
      if (!peaksRef.current || peaksRef.current.length !== fft.length) {
        peaksRef.current = new Float32Array(fft.length).fill(-100);
        peakTimesRef.current = new Float32Array(fft.length).fill(0);
      }

      // Clear canvas
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      // Create gradient for bars
      const gradient = ctx.createLinearGradient(0, analyzerHeight, 0, 0);
      gradient.addColorStop(0, colorStart);
      gradient.addColorStop(1, colorEnd);

      // Calculate bar width based on logarithmic distribution
      const barCount = 32; // Number of visual bars
      const barGap = 2;

      // Group FFT bins into visual bars using logarithmic distribution
      const barsData: number[] = [];
      for (let i = 0; i < barCount; i++) {
        // Calculate which FFT bins map to this visual bar
        const startRatio = i / barCount;
        const endRatio = (i + 1) / barCount;

        // Convert to logarithmic frequency range
        const minFreq = 20;
        const maxFreq = 20000;
        const startFreq = minFreq * Math.pow(maxFreq / minFreq, startRatio);
        const endFreq = minFreq * Math.pow(maxFreq / minFreq, endRatio);

        // Map frequencies to FFT bins (assuming 44.1kHz sample rate, fft.length bins)
        const nyquist = 22050;
        const startBin = Math.floor((startFreq / nyquist) * fft.length);
        const endBin = Math.ceil((endFreq / nyquist) * fft.length);

        // Average the bins for this bar
        let sum = 0;
        let count = 0;
        for (let j = startBin; j < endBin && j < fft.length; j++) {
          sum += fft[j];
          count++;
        }
        const avgDb = count > 0 ? sum / count : -100;
        barsData.push(avgDb);
      }

      // Draw bars
      const barWidth = (width - barGap * (barCount - 1)) / barCount;
      ctx.fillStyle = gradient;

      for (let i = 0; i < barCount; i++) {
        const db = barsData[i];
        // Normalize dB to 0-1 range (assuming -100 to 0 dB range)
        const normalized = Math.max(0, Math.min(1, (db + 100) / 100));
        const barHeight = normalized * analyzerHeight;

        const x = i * (barWidth + barGap);
        const y = analyzerHeight - barHeight;

        // Draw bar with rounded top
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();

        // Peak hold
        if (peakHold && peaksRef.current && peakTimesRef.current) {
          const peakDb = peaksRef.current[i];
          const peakTime = peakTimesRef.current[i];

          // Update peak if current value is higher
          if (db > peakDb) {
            peaksRef.current[i] = db;
            peakTimesRef.current[i] = now;
          } else if (now - peakTime > peakDecayMs) {
            // Decay peak after hold time
            peaksRef.current[i] = Math.max(peakDb - 0.5, -100);
          }

          // Draw peak indicator
          const peakNormalized = Math.max(0, Math.min(1, (peaksRef.current[i] + 100) / 100));
          const peakY = analyzerHeight - peakNormalized * analyzerHeight;
          if (peakY < analyzerHeight - 2) {
            ctx.fillStyle = peakColor;
            ctx.fillRect(x, peakY, barWidth, 2);
            ctx.fillStyle = gradient;
          }
        }
      }

      // Draw frequency labels
      if (showLabels) {
        ctx.fillStyle = "#64748b"; // slate-500
        ctx.font = "9px system-ui, sans-serif";
        ctx.textAlign = "center";

        for (let i = 0; i < FREQ_LABELS.length; i++) {
          const x = freqToX(FREQ_POSITIONS[i], width);
          if (x > 10 && x < width - 10) {
            ctx.fillText(FREQ_LABELS[i], x, height - 2);
          }
        }
      }
    },
    [showLabels, peakHold, peakDecayMs, colorStart, colorEnd, peakColor, bgColor]
  );

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isMinimized) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size accounting for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      draw(ctx, rect.width, rect.height, analysisData);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analysisData, draw, isMinimized]);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="w-full px-3 py-1.5 rounded-lg bg-slate-900/50 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors flex items-center justify-center gap-2 text-[10px] text-slate-400 hover:text-slate-300"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Show Spectrum
      </button>
    );
  }

  return (
    <div className="rounded-lg bg-slate-900/50 border border-cyan-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-cyan-500/20 flex items-center justify-between">
        <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
          Spectrum
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="p-0.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors"
          title="Minimize"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>
      {/* Canvas */}
      <canvas ref={canvasRef} style={{ width: "100%", height }} className="block" />
    </div>
  );
}
