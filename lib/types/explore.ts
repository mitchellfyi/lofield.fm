/**
 * Types for the public track exploration/discovery feature
 */

/**
 * A public track for display in the explore directory
 * Intentionally excludes user information for privacy
 */
export interface PublicTrack {
  id: string;
  name: string;
  current_code: string;
  bpm: number | null;
  genre: string | null;
  tags: string[];
  ai_tags: string[];
  plays: number;
  like_count: number;
  is_featured: boolean;
  is_system: boolean;
  created_at: string;
}

/**
 * Query parameters for fetching explore tracks
 */
export interface ExploreQuery {
  genre?: string;
  tags?: string[];
  bpm_min?: number;
  bpm_max?: number;
  sort?: ExploreSortOption;
  limit?: number;
  offset?: number;
}

/**
 * Sort options for explore tracks
 */
export type ExploreSortOption = "newest" | "popular" | "most_liked" | "random";

/**
 * Response from the explore API
 */
export interface ExploreResponse {
  tracks: PublicTrack[];
  total: number;
  genres: string[];
  tags: string[];
  bpm_range: BpmRange;
}

/**
 * BPM range for filtering
 */
export interface BpmRange {
  min: number;
  max: number;
}

/**
 * Filter state for the explore UI
 */
export interface ExploreFilterState {
  genre: string | null;
  tags: string[];
  bpmMin: number;
  bpmMax: number;
  sort: ExploreSortOption;
}

/**
 * Default filter state
 */
export const DEFAULT_EXPLORE_FILTERS: ExploreFilterState = {
  genre: null,
  tags: [],
  bpmMin: 40,
  bpmMax: 200,
  sort: "popular",
};

/**
 * Play queue state for auto-play functionality
 */
export interface PlayQueueState {
  queue: PublicTrack[];
  currentIndex: number;
  autoPlay: boolean;
  shuffle: boolean;
  history: string[]; // Track IDs for previous navigation
}

/**
 * Default play queue state
 */
export const DEFAULT_PLAY_QUEUE_STATE: PlayQueueState = {
  queue: [],
  currentIndex: -1,
  autoPlay: false,
  shuffle: false,
  history: [],
};

/**
 * Player state for the explore player
 */
export type ExplorePlayerState = "stopped" | "loading" | "playing" | "paused";

/**
 * Convert database row to PublicTrack
 */
export function toPublicTrack(row: Record<string, unknown>): PublicTrack {
  return {
    id: row.id as string,
    name: row.name as string,
    current_code: row.current_code as string,
    bpm: row.bpm as number | null,
    genre: row.genre as string | null,
    tags: (row.tags as string[]) || [],
    ai_tags: (row.ai_tags as string[]) || [],
    plays: (row.plays as number) || 0,
    like_count: (row.like_count as number) || 0,
    is_featured: (row.is_featured as boolean) || false,
    is_system: (row.is_system as boolean) || false,
    created_at: row.created_at as string,
  };
}
