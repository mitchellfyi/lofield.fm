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
import { downtempo } from "./downtempo";
import { chillwave } from "./chillwave";
import { jazzFusion } from "./jazz-fusion";
import { bossaNova } from "./bossa-nova";
import { dreampop } from "./dreampop";
import { nuDisco } from "./nu-disco";
import { acousticPiano } from "./acoustic-piano";
import { acousticGuitar } from "./acoustic-guitar";
import { acousticDrums } from "./acoustic-drums";

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
  downtempo,
  chillwave,
  jazzFusion,
  bossaNova,
  dreampop,
  nuDisco,
  acousticPiano,
  acousticGuitar,
  acousticDrums,
];

export function getPresetById(id: string) {
  return PRESETS.find((p) => p.id === id);
}

// Re-export utility functions
export { filterPresets, getUniqueGenres, getUniqueTags, searchPresets } from "./utils";
