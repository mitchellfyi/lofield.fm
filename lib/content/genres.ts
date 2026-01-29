/**
 * Genre Landing Page Content
 * SEO-optimized content for genre-specific landing pages
 */

export interface GenreContent {
  slug: string;
  name: string;
  title: string; // SEO title
  description: string; // Meta description
  heroHeadline: string;
  heroSubheadline: string;
  features: string[];
  keywords: string[];
  relatedGenres: string[];
  presetIds: string[]; // IDs of presets to feature
}

export const GENRE_CONTENT: GenreContent[] = [
  {
    slug: "lofi",
    name: "Lo-Fi",
    title: "Lo-Fi Beat Maker Online Free - Create Chill Beats | LoField",
    description:
      "Create lo-fi beats online for free with AI. Make chill hip-hop, study beats, and relaxing music instantly. No experience needed - describe your vibe and start creating.",
    heroHeadline: "Create Lo-Fi Beats Instantly",
    heroSubheadline:
      "Make chill, nostalgic beats perfect for studying, relaxing, or creating content. Describe the vibe you want and AI generates playable lo-fi music in seconds.",
    features: [
      "Warm, vinyl-crackle aesthetics",
      "Jazzy chords and mellow melodies",
      "Perfect for study sessions and focus",
      "Classic boom-bap drum patterns",
      "Tape saturation and filtering",
    ],
    keywords: [
      "lo-fi beat maker",
      "lofi beats online",
      "study beats generator",
      "chill beat maker",
      "lo-fi hip hop creator",
    ],
    relatedGenres: ["ambient", "jazz", "hiphop"],
    presetIds: ["lofi-chill", "chillwave", "jazz-fusion"],
  },
  {
    slug: "ambient",
    name: "Ambient",
    title: "Ambient Music Generator AI - Create Atmospheric Soundscapes | LoField",
    description:
      "Generate ambient music and atmospheric soundscapes with AI. Create relaxing, meditative, and cinematic ambient tracks online for free.",
    heroHeadline: "Generate Ambient Soundscapes",
    heroSubheadline:
      "Create ethereal atmospheres, meditative drones, and cinematic textures. Perfect for relaxation, meditation, background music, and film scoring.",
    features: [
      "Evolving pads and textures",
      "Spacious reverbs and delays",
      "Meditative and relaxing moods",
      "Cinematic atmosphere creation",
      "Drone and generative patterns",
    ],
    keywords: [
      "ambient music generator",
      "atmospheric music creator",
      "meditation music maker",
      "soundscape generator",
      "drone music online",
    ],
    relatedGenres: ["lofi", "downtempo", "dreampop"],
    presetIds: ["ambient-chill", "downtempo", "dreampop"],
  },
  {
    slug: "house",
    name: "House",
    title: "House Music Maker Online - Create Deep House & Nu Disco | LoField",
    description:
      "Make house music online with AI. Create deep house, nu disco, and electronic dance tracks instantly. Free online house beat maker.",
    heroHeadline: "Create House Music Beats",
    heroSubheadline:
      "Produce deep house grooves, nu disco vibes, and dancefloor-ready tracks. From soulful deep house to energetic club bangers.",
    features: [
      "Four-on-the-floor grooves",
      "Funky basslines and chords",
      "Soulful vocal chops ready",
      "Classic house synth stabs",
      "Disco and funk influences",
    ],
    keywords: [
      "house music maker",
      "deep house generator",
      "nu disco creator",
      "electronic dance music maker",
      "EDM beat maker",
    ],
    relatedGenres: ["techno", "nudisco", "trance"],
    presetIds: ["deep-house", "nu-disco", "pop"],
  },
  {
    slug: "techno",
    name: "Techno",
    title: "Techno Beat Maker Online - Create Dark Techno & Industrial | LoField",
    description:
      "Create techno beats online with AI. Make dark techno, industrial, and underground electronic music instantly. Free techno production tool.",
    heroHeadline: "Make Techno Beats",
    heroSubheadline:
      "Produce driving techno rhythms, dark warehouse sounds, and hypnotic club tracks. From minimal to industrial techno.",
    features: [
      "Driving kick drums and percussion",
      "Dark, industrial atmospheres",
      "Hypnotic sequences and arpeggios",
      "Warehouse-ready sound design",
      "Minimal to hard techno styles",
    ],
    keywords: [
      "techno beat maker",
      "dark techno generator",
      "industrial music creator",
      "electronic music maker",
      "underground techno",
    ],
    relatedGenres: ["house", "trance", "ambient"],
    presetIds: ["dark-techno", "trance", "downtempo"],
  },
  {
    slug: "hiphop",
    name: "Hip-Hop",
    title: "Hip-Hop Beat Maker Online Free - Create Rap Beats | LoField",
    description:
      "Make hip-hop and rap beats online for free with AI. Create trap, boom-bap, and modern hip-hop instrumentals instantly.",
    heroHeadline: "Create Hip-Hop Beats",
    heroSubheadline:
      "Produce rap instrumentals, trap beats, and boom-bap rhythms. From classic East Coast to modern trap production.",
    features: [
      "Hard-hitting 808s and drums",
      "Trap hi-hat patterns",
      "Boom-bap sampling aesthetics",
      "Melodic trap elements",
      "R&B and soul influences",
    ],
    keywords: [
      "hip hop beat maker",
      "rap beat generator",
      "trap beat maker",
      "boom bap creator",
      "free beat maker online",
    ],
    relatedGenres: ["lofi", "trap", "rnb"],
    presetIds: ["hiphop", "trap-beat", "rnb-soul"],
  },
  {
    slug: "jazz",
    name: "Jazz",
    title: "Jazz Music Generator AI - Create Jazz Fusion & Bossa Nova | LoField",
    description:
      "Generate jazz music with AI. Create jazz fusion, bossa nova, and smooth jazz tracks online. AI-powered jazz composition tool.",
    heroHeadline: "Generate Jazz Music",
    heroSubheadline:
      "Create sophisticated jazz harmonies, smooth fusion grooves, and bossa nova rhythms. From cool jazz to Latin fusion.",
    features: [
      "Complex chord progressions",
      "Smooth jazz fusion sounds",
      "Bossa nova rhythms",
      "Walking basslines",
      "Sophisticated harmony",
    ],
    keywords: [
      "jazz music generator",
      "jazz fusion creator",
      "bossa nova maker",
      "smooth jazz online",
      "AI jazz composer",
    ],
    relatedGenres: ["lofi", "ambient", "rnb"],
    presetIds: ["jazz-fusion", "bossa-nova", "lofi-chill"],
  },
];

/**
 * Get genre content by slug
 */
export function getGenreBySlug(slug: string): GenreContent | undefined {
  return GENRE_CONTENT.find((g) => g.slug === slug);
}

/**
 * Get all genre slugs for static generation
 */
export function getAllGenreSlugs(): string[] {
  return GENRE_CONTENT.map((g) => g.slug);
}
