/**
 * AudioLayer - Multi-track composition layers for the studio
 * Each layer represents a separate musical component (drums, bass, melody, etc.)
 * that can be independently controlled and combined for playback.
 */

/**
 * Color palette for visual layer identification
 */
export const LAYER_COLORS = [
  "#f87171", // red
  "#fb923c", // orange
  "#fbbf24", // amber
  "#a3e635", // lime
  "#34d399", // emerald
  "#22d3ee", // cyan
  "#60a5fa", // blue
  "#a78bfa", // violet
  "#f472b6", // pink
  "#94a3b8", // slate
] as const;

/**
 * Represents a single audio layer in a multi-track composition
 */
export interface AudioLayer {
  /** Unique identifier for the layer */
  id: string;
  /** Display name for the layer (e.g., "drums", "bass") */
  name: string;
  /** Tone.js code for this layer */
  code: string;
  /** Whether this layer is muted (silenced) */
  muted: boolean;
  /** Whether this layer is soloed (only solo'd layers play when any is solo'd) */
  soloed: boolean;
  /** Volume level (0-100), maps to gain adjustment */
  volume: number;
  /** Color for visual identification in the UI */
  color: string;
}

/**
 * Generates a unique layer ID
 */
export function generateLayerId(): string {
  return `layer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a new layer with default values
 */
export function createDefaultLayer(
  name: string,
  code: string = "",
  colorIndex?: number
): AudioLayer {
  const index = colorIndex !== undefined ? colorIndex % LAYER_COLORS.length : 0;
  return {
    id: generateLayerId(),
    name,
    code,
    muted: false,
    soloed: false,
    volume: 100,
    color: LAYER_COLORS[index],
  };
}

/**
 * Default empty layer for when starting fresh
 */
export const EMPTY_LAYER_CODE = `// Add your Tone.js code here
// Example:
// const synth = new Tone.Synth().toDestination();
// new Tone.Loop((time) => synth.triggerAttackRelease("C4", "8n", time), "4n").start(0);
`;

/**
 * Default layers for new compositions
 */
export const DEFAULT_LAYERS: AudioLayer[] = [createDefaultLayer("main", "", 0)];
