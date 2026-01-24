/**
 * Tweaks - Quick parameter controls for real-time audio adjustment
 */

export interface TweaksConfig {
  /** Tempo in beats per minute (60-200) */
  bpm: number;
  /** Swing percentage (0-100) */
  swing: number;
  /** Master lowpass filter cutoff frequency in Hz (100-10000) */
  filter: number;
  /** Reverb wet amount (0-100) */
  reverb: number;
  /** Delay wet amount (0-100) */
  delay: number;
}

/**
 * Default tweaks values matching the DEFAULT_CODE in studio/page.tsx
 */
export const DEFAULT_TWEAKS: TweaksConfig = {
  bpm: 82,
  swing: 8,
  filter: 8000,
  reverb: 25,
  delay: 20,
};

/**
 * Tweak parameter metadata for UI rendering
 */
export interface TweakParam {
  key: keyof TweaksConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

/**
 * Configuration for all tweak parameters
 */
export const TWEAK_PARAMS: TweakParam[] = [
  { key: "bpm", label: "BPM", min: 60, max: 200, step: 1, unit: "" },
  { key: "swing", label: "Swing", min: 0, max: 100, step: 1, unit: "%" },
  { key: "filter", label: "Filter", min: 100, max: 10000, step: 100, unit: " Hz" },
  { key: "reverb", label: "Reverb", min: 0, max: 100, step: 1, unit: "%" },
  { key: "delay", label: "Delay", min: 0, max: 100, step: 1, unit: "%" },
];
