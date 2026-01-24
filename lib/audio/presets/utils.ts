import type { Preset } from "./types";
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

const ALL_PRESETS: Preset[] = [
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

/**
 * Get all unique genres from the preset library
 */
export function getUniqueGenres(): string[] {
  const genres = new Set(ALL_PRESETS.map((p) => p.genre));
  return Array.from(genres).sort();
}

/**
 * Get all unique tags from the preset library
 */
export function getUniqueTags(): string[] {
  const tags = new Set(ALL_PRESETS.flatMap((p) => p.tags));
  return Array.from(tags).sort();
}

/**
 * Filter presets by genre, tag, and/or search query
 */
export function filterPresets(options: {
  genre?: string;
  tag?: string;
  search?: string;
}): Preset[] {
  const { genre, tag, search } = options;
  const searchLower = search?.toLowerCase().trim() || "";

  return ALL_PRESETS.filter((preset) => {
    // Filter by genre
    if (genre && preset.genre !== genre) {
      return false;
    }

    // Filter by tag
    if (tag && !preset.tags.includes(tag)) {
      return false;
    }

    // Filter by search query (name, description, or tags)
    if (searchLower) {
      const matchesName = preset.name.toLowerCase().includes(searchLower);
      const matchesDescription = preset.description
        .toLowerCase()
        .includes(searchLower);
      const matchesTags = preset.tags.some((t) =>
        t.toLowerCase().includes(searchLower)
      );
      const matchesGenre = preset.genre.toLowerCase().includes(searchLower);

      if (!matchesName && !matchesDescription && !matchesTags && !matchesGenre) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Search presets by text query across name, description, genre, and tags
 */
export function searchPresets(query: string): Preset[] {
  return filterPresets({ search: query });
}
