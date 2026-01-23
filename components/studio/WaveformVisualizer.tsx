"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useAudioAnalysis, useTransportState } from "@/lib/audio/useVisualization";

interface WaveformVisualizerProps {
  width?: number;
  height?: number;
  className?: string;
  fillContainer?: boolean; // If true, fills parent container and uses background mode
}

export function WaveformVisualizer({
  width = 200,
  height = 40,
  className = "",
  fillContainer = false,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const analysis = useAudioAnalysis();
  const transport = useTransportState();

  // Compute dimensions based on mode
  const computedDimensions = useMemo(
    () => (fillContainer ? dimensions : { width, height }),
    [fillContainer, dimensions, width, height]
  );

  // Handle resize for fill container mode
  useEffect(() => {
    if (!fillContainer) {
      return;
    }

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [fillContainer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width: w, height: h } = computedDimensions;

    // Set canvas resolution for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, w, h);

      const { waveform, fft, rms } = analysis;
      const isPlaying = transport.playing;

      if (fillContainer) {
        // Background mode - more subtle, full-width visualization
        if (!isPlaying || rms < 0.001) {
          drawBackgroundIdle(ctx, w, h);
        } else {
          drawBackgroundActive(ctx, w, h, waveform, fft, rms);
        }
      } else {
        // Compact mode
        if (!isPlaying || rms < 0.001) {
          drawIdleWave(ctx, w, h);
        } else {
          drawAudioWave(ctx, w, h, waveform, fft, rms);
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [computedDimensions, analysis, transport.playing, fillContainer]);

  if (fillContainer) {
    return (
      <div ref={containerRef} className={className}>
        <canvas
          ref={canvasRef}
          style={{ width: computedDimensions.width, height: computedDimensions.height }}
        />
      </div>
    );
  }

  return <canvas ref={canvasRef} className={className} style={{ width, height }} />;
}

// ─────────────────────────────────────────────────────────────
// Background mode (full-width header)
// ─────────────────────────────────────────────────────────────

function drawBackgroundIdle(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const centerY = height / 2;
  const time = Date.now() / 1000;

  // Multiple subtle wave layers
  for (let layer = 0; layer < 3; layer++) {
    const alpha = 0.08 - layer * 0.02;
    const freq = 2 + layer;
    const amp = 4 - layer;
    const phase = layer * 0.5;

    ctx.beginPath();
    ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x++) {
      const t = x / width;
      const y = centerY + Math.sin(t * Math.PI * freq + time * 0.3 + phase) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawBackgroundActive(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  waveform: Float32Array,
  fft: Float32Array,
  rms: number
) {
  const centerY = height / 2;
  const time = Date.now() / 1000;

  // Calculate bass and mid energy
  let bassEnergy = 0;
  let midEnergy = 0;
  for (let i = 0; i < 8; i++) {
    bassEnergy += Math.max(0, (fft[i] + 100) / 100);
  }
  for (let i = 8; i < 24; i++) {
    midEnergy += Math.max(0, (fft[i] + 100) / 100);
  }
  bassEnergy = bassEnergy / 8;
  midEnergy = midEnergy / 16;

  // Draw frequency bars across full width (behind everything)
  drawBackgroundFFTBars(ctx, width, height, fft);

  // Draw multiple waveform layers
  const intensity = Math.min(rms * 6, 1);

  // Glow layer
  ctx.save();
  ctx.filter = `blur(${6 + bassEnergy * 8}px)`;
  ctx.beginPath();
  ctx.strokeStyle = `rgba(34, 211, 238, ${0.15 + intensity * 0.15})`;
  ctx.lineWidth = 4;
  drawBackgroundWavePath(ctx, width, height, waveform, centerY, rms, time, bassEnergy);
  ctx.stroke();
  ctx.restore();

  // Main wave
  ctx.beginPath();
  ctx.strokeStyle = `rgba(34, 211, 238, ${0.25 + intensity * 0.2})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(34, 211, 238, 0.5)";
  ctx.shadowBlur = 10 + bassEnergy * 15;
  drawBackgroundWavePath(ctx, width, height, waveform, centerY, rms, time, bassEnergy);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Highlight wave
  ctx.beginPath();
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + intensity * 0.1})`;
  ctx.lineWidth = 1;
  drawBackgroundWavePath(ctx, width, height, waveform, centerY, rms * 0.7, time, bassEnergy);
  ctx.stroke();

  // Second wave layer (offset)
  ctx.beginPath();
  ctx.strokeStyle = `rgba(34, 211, 238, ${0.1 + midEnergy * 0.1})`;
  ctx.lineWidth = 1;
  drawBackgroundWavePath(
    ctx,
    width,
    height,
    waveform,
    centerY + 8,
    rms * 0.5,
    time + 0.5,
    midEnergy
  );
  ctx.stroke();
}

function drawBackgroundWavePath(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  waveform: Float32Array,
  centerY: number,
  rms: number,
  time: number,
  bassEnergy: number
) {
  const amplitude = height * 0.3 * Math.min(rms * 4 + 0.2, 1);
  const samples = waveform.length;

  for (let x = 0; x < width; x++) {
    const t = x / width;
    const sampleIndex = Math.floor(t * samples);
    const sample = waveform[sampleIndex] || 0;

    // Add flowing motion
    const flow = Math.sin(t * Math.PI * 3 + time * 1.5) * 0.15 * bassEnergy;
    const y = centerY + sample * amplitude + flow * height * 0.15;

    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

function drawBackgroundFFTBars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fft: Float32Array
) {
  const barCount = 32;
  const barWidth = width / barCount;
  const time = Date.now() / 1000;

  for (let i = 0; i < barCount; i++) {
    const fftIndex = Math.floor((i / barCount) * fft.length * 0.6);
    const value = (fft[fftIndex] + 100) / 100;
    const normalizedValue = Math.max(0, Math.min(1, value));

    // Bar extends from top and bottom edges toward center
    const barHeight = normalizedValue * height * 0.4;
    const shimmer = Math.sin(time * 3 + i * 0.3) * 0.15 + 0.85;

    const x = i * barWidth;

    // Top bar
    const gradientTop = ctx.createLinearGradient(x, 0, x, barHeight);
    gradientTop.addColorStop(0, `rgba(34, 211, 238, ${0.12 * shimmer * normalizedValue})`);
    gradientTop.addColorStop(1, "rgba(34, 211, 238, 0)");
    ctx.fillStyle = gradientTop;
    ctx.fillRect(x, 0, barWidth - 1, barHeight);

    // Bottom bar
    const gradientBottom = ctx.createLinearGradient(x, height, x, height - barHeight);
    gradientBottom.addColorStop(0, `rgba(34, 211, 238, ${0.12 * shimmer * normalizedValue})`);
    gradientBottom.addColorStop(1, "rgba(34, 211, 238, 0)");
    ctx.fillStyle = gradientBottom;
    ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
  }
}

function drawIdleWave(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const centerY = height / 2;
  const time = Date.now() / 1000;

  ctx.beginPath();
  ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
  ctx.lineWidth = 1.5;

  for (let x = 0; x < width; x++) {
    const t = x / width;
    // Subtle sine wave animation
    const y = centerY + Math.sin(t * Math.PI * 4 + time * 0.5) * 3;
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

function drawAudioWave(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  waveform: Float32Array,
  fft: Float32Array,
  rms: number
) {
  const centerY = height / 2;
  const time = Date.now() / 1000;

  // Calculate bass energy from low FFT bins
  let bassEnergy = 0;
  for (let i = 0; i < 8; i++) {
    // FFT values are in dB, typically -100 to 0
    const normalized = (fft[i] + 100) / 100;
    bassEnergy += Math.max(0, normalized);
  }
  bassEnergy = bassEnergy / 8;

  // Glow effect based on volume
  const glowIntensity = Math.min(rms * 8, 1);

  // Draw glow layer
  ctx.save();
  ctx.filter = `blur(${4 + bassEnergy * 4}px)`;
  ctx.beginPath();
  ctx.strokeStyle = `rgba(34, 211, 238, ${0.3 + glowIntensity * 0.4})`;
  ctx.lineWidth = 3;

  drawWavePath(ctx, width, height, waveform, centerY, rms, time, bassEnergy);
  ctx.stroke();
  ctx.restore();

  // Draw main wave
  ctx.beginPath();
  ctx.strokeStyle = `rgba(34, 211, 238, ${0.7 + glowIntensity * 0.3})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(34, 211, 238, 0.8)";
  ctx.shadowBlur = 8 + bassEnergy * 8;

  drawWavePath(ctx, width, height, waveform, centerY, rms, time, bassEnergy);
  ctx.stroke();

  // Draw highlight peaks
  ctx.beginPath();
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + glowIntensity * 0.3})`;
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;

  drawWavePath(ctx, width, height, waveform, centerY, rms * 0.8, time, bassEnergy);
  ctx.stroke();

  // Draw reactive bars based on FFT
  drawFFTBars(ctx, width, height, fft, time);
}

function drawWavePath(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  waveform: Float32Array,
  centerY: number,
  rms: number,
  time: number,
  bassEnergy: number
) {
  const amplitude = height * 0.35 * Math.min(rms * 5 + 0.3, 1);
  const samples = waveform.length;

  for (let x = 0; x < width; x++) {
    const t = x / width;
    const sampleIndex = Math.floor(t * samples);
    const sample = waveform[sampleIndex] || 0;

    // Add subtle wave motion
    const wave = Math.sin(t * Math.PI * 2 + time * 2) * 0.1 * bassEnergy;
    const y = centerY + sample * amplitude + wave * height * 0.1;

    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
}

function drawFFTBars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fft: Float32Array,
  time: number
) {
  const barCount = 16;
  const barWidth = width / barCount;
  const centerY = height / 2;

  for (let i = 0; i < barCount; i++) {
    const fftIndex = Math.floor((i / barCount) * fft.length * 0.5); // Focus on lower frequencies
    const value = (fft[fftIndex] + 100) / 100; // Normalize from dB to 0-1
    const normalizedValue = Math.max(0, Math.min(1, value));

    // Bar height based on frequency magnitude
    const barHeight = normalizedValue * height * 0.4;

    // Subtle shimmer effect
    const shimmer = Math.sin(time * 4 + i * 0.5) * 0.1 + 0.9;

    const x = i * barWidth + barWidth * 0.2;
    const barActualWidth = barWidth * 0.6;

    // Draw bar (both up and down from center)
    const gradient = ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
    gradient.addColorStop(0, `rgba(34, 211, 238, ${0.1 * shimmer})`);
    gradient.addColorStop(0.5, `rgba(34, 211, 238, ${0.25 * shimmer * normalizedValue})`);
    gradient.addColorStop(1, `rgba(34, 211, 238, ${0.1 * shimmer})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(x, centerY - barHeight, barActualWidth, barHeight * 2);
  }
}
