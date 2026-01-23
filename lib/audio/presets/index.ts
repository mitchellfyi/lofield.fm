/**
 * Demo song presets for different genres
 * Each preset is a 32-bar arrangement with sections A/B/C/D
 * Features: humanized velocity, section variation, master processing
 */

export { type Preset } from "./types";

import { lofiChill } from "./lofi-chill";
import { deepHouse } from "./deep-house";
import { darkTechno } from "./dark-techno";
import { ambientChill } from "./ambient-chill";
import { rnbSoul } from "./rnb-soul";
import { trapBeat } from "./trap-beat";
import { pop } from "./pop";
import { rock } from "./rock";
import { hiphop } from "./hiphop";
import { trance } from "./trance";

export const PRESETS = [
  lofiChill,
  deepHouse,
  darkTechno,
  ambientChill,
  rnbSoul,
  trapBeat,
  pop,
  rock,
  hiphop,
  trance,
];

export function getPresetById(id: string) {
  return PRESETS.find((p) => p.id === id);
}
