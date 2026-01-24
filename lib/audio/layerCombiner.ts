/**
 * LayerCombiner - Combines multiple audio layers into executable code
 *
 * Handles mute/solo logic and volume adjustment when combining layers
 * for playback. All layers are concatenated with appropriate comments
 * and modifications applied.
 */

import { type AudioLayer } from "@/lib/types/audioLayer";

/**
 * Apply solo logic to determine effective mute state for all layers.
 * When any layer is soloed, non-soloed layers become effectively muted.
 */
export function applySoloLogic(layers: AudioLayer[]): AudioLayer[] {
  const anySoloed = layers.some((layer) => layer.soloed);

  if (!anySoloed) {
    return layers;
  }

  // When any layer is soloed, non-soloed layers are effectively muted
  return layers.map((layer) => ({
    ...layer,
    muted: layer.muted || !layer.soloed,
  }));
}

/**
 * Wrap code in a mute comment block.
 * The code is preserved but won't execute when eval'd.
 */
export function applyMuteWrapper(code: string, layerName: string): string {
  return `/* === MUTED: ${layerName} ===
${code}
=== END MUTED === */`;
}

/**
 * Convert volume percentage (0-100) to decibel offset (-60 to 0).
 * 100% = 0dB (no change)
 * 50% = -6dB (half perceived loudness)
 * 0% = -60dB (effectively silent)
 */
export function volumeToDb(volumePercent: number): number {
  if (volumePercent <= 0) return -60;
  if (volumePercent >= 100) return 0;
  // Logarithmic scaling: -20 * log10(100/percent)
  return 20 * Math.log10(volumePercent / 100);
}

/**
 * Inject volume offset into layer code.
 * Adds a volume modifier comment at the top that the runtime can use.
 */
export function injectLayerVolume(
  code: string,
  volumePercent: number,
  layerName: string
): string {
  // If volume is 100%, no modification needed
  if (volumePercent === 100) {
    return code;
  }

  const dbOffset = volumeToDb(volumePercent);
  const volumeComment = `// LAYER_VOLUME: ${dbOffset.toFixed(1)}dB (${volumePercent}%) for "${layerName}"`;

  return `${volumeComment}\n${code}`;
}

/**
 * Generate a layer header comment for clarity in combined output.
 */
export function generateLayerHeader(layer: AudioLayer): string {
  const status = layer.muted ? " [MUTED]" : layer.soloed ? " [SOLO]" : "";
  const volume = layer.volume !== 100 ? ` (${layer.volume}%)` : "";
  return `// ═══════════════════════════════════════════════════════════
// LAYER: ${layer.name}${status}${volume}
// ═══════════════════════════════════════════════════════════`;
}

/**
 * Combine multiple layers into a single executable code string.
 *
 * Applies:
 * - Solo logic (when any layer is soloed, others are muted)
 * - Mute wrapping (muted code is commented out)
 * - Volume injection (volume offsets are added as comments)
 * - Layer headers for readability
 */
export function combineLayers(layers: AudioLayer[]): string {
  if (layers.length === 0) {
    return "";
  }

  // Apply solo logic to get effective mute states
  const effectiveLayers = applySoloLogic(layers);

  const parts: string[] = [];

  for (const layer of effectiveLayers) {
    const code = layer.code.trim();

    // Skip empty layers
    if (!code) {
      continue;
    }

    // Generate header
    const header = generateLayerHeader(layer);

    if (layer.muted) {
      // Wrap entire layer (including header) in comment block
      parts.push(applyMuteWrapper(`${header}\n${code}`, layer.name));
    } else {
      // Add header and volume-adjusted code
      const volumeAdjustedCode = injectLayerVolume(
        code,
        layer.volume,
        layer.name
      );
      parts.push(`${header}\n${volumeAdjustedCode}`);
    }
  }

  return parts.join("\n\n");
}

/**
 * Extract layer names from combined code (for debugging/display).
 */
export function extractLayerNames(combinedCode: string): string[] {
  const layerNameRegex = /\/\/ LAYER: ([^\n[]+)/g;
  const names: string[] = [];
  let match;

  while ((match = layerNameRegex.exec(combinedCode)) !== null) {
    names.push(match[1].trim());
  }

  return names;
}
