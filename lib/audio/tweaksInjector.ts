/**
 * TweaksInjector - Parse and inject tweak values into Tone.js code
 *
 * Tweaks are stored as a JSON comment at the top of the code:
 * // TWEAKS: {"bpm":82,"swing":8,"filter":8000,"reverb":25,"delay":20}
 *
 * The injector modifies the actual code values to match the tweaks.
 */

import { type TweaksConfig, DEFAULT_TWEAKS } from "@/lib/types/tweaks";

/** Regex to match the TWEAKS comment line */
const TWEAKS_COMMENT_REGEX = /^\/\/\s*TWEAKS:\s*(\{[^}]+\})\s*$/m;

/** Regex patterns for finding values to replace */
const BPM_REGEX = /Tone\.Transport\.bpm\.value\s*=\s*(\d+)/;
const SWING_REGEX = /Tone\.Transport\.swing\s*=\s*([\d.]+)/;
const FILTER_REGEX = /const\s+masterLowpass\s*=\s*new\s+Tone\.Filter\s*\(\s*(\d+)/;
const REVERB_WET_REGEX = /const\s+masterReverb\s*=\s*new\s+Tone\.Reverb\s*\(\s*\{[^}]*wet:\s*([\d.]+)/;
const DELAY_WET_REGEX = /tapeDelay\.wet\.value\s*=\s*([\d.]+)/;

/**
 * Convert tweaks config to a JSON comment string
 */
export function tweaksToComment(tweaks: TweaksConfig): string {
  return `// TWEAKS: ${JSON.stringify(tweaks)}`;
}

/**
 * Extract tweaks from a code comment
 * Returns null if no valid tweaks comment found
 */
export function extractTweaks(code: string): TweaksConfig | null {
  const match = code.match(TWEAKS_COMMENT_REGEX);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]) as Partial<TweaksConfig>;
    // Validate and merge with defaults
    return {
      bpm: typeof parsed.bpm === "number" ? parsed.bpm : DEFAULT_TWEAKS.bpm,
      swing: typeof parsed.swing === "number" ? parsed.swing : DEFAULT_TWEAKS.swing,
      filter: typeof parsed.filter === "number" ? parsed.filter : DEFAULT_TWEAKS.filter,
      reverb: typeof parsed.reverb === "number" ? parsed.reverb : DEFAULT_TWEAKS.reverb,
      delay: typeof parsed.delay === "number" ? parsed.delay : DEFAULT_TWEAKS.delay,
    };
  } catch {
    return null;
  }
}

/**
 * Inject tweaks into code by updating the relevant Tone.js values
 * Adds/updates the TWEAKS comment and modifies the actual code values
 */
export function injectTweaks(code: string, tweaks: TweaksConfig): string {
  let result = code;

  // Remove existing TWEAKS comment if present
  result = result.replace(TWEAKS_COMMENT_REGEX, "").trimStart();

  // Add TWEAKS comment at the top
  result = `${tweaksToComment(tweaks)}\n${result}`;

  // Update BPM
  result = result.replace(BPM_REGEX, `Tone.Transport.bpm.value = ${tweaks.bpm}`);

  // Update swing (convert from 0-100 to 0-1)
  const swingValue = (tweaks.swing / 100).toFixed(2);
  result = result.replace(SWING_REGEX, `Tone.Transport.swing = ${swingValue}`);

  // Update filter frequency
  result = result.replace(FILTER_REGEX, `const masterLowpass = new Tone.Filter(${tweaks.filter}`);

  // Update reverb wet (convert from 0-100 to 0-1)
  const reverbWet = (tweaks.reverb / 100).toFixed(2);
  result = result.replace(
    REVERB_WET_REGEX,
    (match) => match.replace(/wet:\s*[\d.]+/, `wet: ${reverbWet}`)
  );

  // Update delay wet (convert from 0-100 to 0-1)
  const delayWet = (tweaks.delay / 100).toFixed(2);
  result = result.replace(DELAY_WET_REGEX, `tapeDelay.wet.value = ${delayWet}`);

  return result;
}

/**
 * Check if tweaks differ from the values in the code
 * Returns true if the code needs updating
 */
export function tweaksNeedUpdate(code: string, tweaks: TweaksConfig): boolean {
  const existing = extractTweaks(code);
  if (!existing) return true;

  return (
    existing.bpm !== tweaks.bpm ||
    existing.swing !== tweaks.swing ||
    existing.filter !== tweaks.filter ||
    existing.reverb !== tweaks.reverb ||
    existing.delay !== tweaks.delay
  );
}
