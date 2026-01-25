# Task: Public Track Directory with Auto-Play & Discovery

## Overview

Create a public directory where users can discover, play, and explore tracks. Features include continuous auto-play (like a radio), filtering by AI-generated tags and metadata (BPM, genre), and seeding with preset demo tracks.

## Vision

A Spotify-like explore page where users can:

- Browse public tracks in a grid/list view
- Click to play any track instantly
- Enable "radio mode" for continuous auto-play
- Filter by genre, mood, BPM range, tags
- Discover new sounds without creating an account

## Current State

### What Exists (After Phase 1 & 2 Implementation)

- **Privacy levels**: `private`, `unlisted`, `public` on tracks
- **Share system**: Public/unlisted tracks viewable via share token
- **10 Presets**: Demo tracks in `lib/audio/presets/` with tags, BPM, genre
- **Homepage**: Landing with "Open Studio" AND "Explore Tracks" buttons
- **Track player**: Reusable in explore page via ExplorePlayer component
- **Explore page**: `/explore` with grid of public tracks, filters, and player bar
- **Database migrations**: Metadata columns added (007, 008)
- **API endpoints**: `/api/explore` and `/api/explore/play`
- **Play queue system**: Auto-play, shuffle, history navigation
- **Filtering**: Genre, tags, BPM range, sort options

### What's Still Missing (Phase 3-5)

- URL doesn't reflect filter state (not shareable)
- AI tagging system not implemented
- No tag management UI for track owners
- No featured tracks section
- No "Similar tracks" suggestions
- No keyboard shortcuts
- No waveform visualization preview

## Database Changes Required

### New Migration: Track Metadata

```sql
-- Add metadata columns to tracks table
ALTER TABLE public.tracks
  ADD COLUMN bpm integer,
  ADD COLUMN genre varchar(100),
  ADD COLUMN tags text[] DEFAULT '{}',
  ADD COLUMN ai_tags text[] DEFAULT '{}',  -- AI-generated, separate from user tags
  ADD COLUMN plays integer DEFAULT 0,
  ADD COLUMN is_featured boolean DEFAULT false,
  ADD COLUMN is_system boolean DEFAULT false;  -- For preset/demo tracks

-- Index for public track queries
CREATE INDEX tracks_public_idx ON public.tracks(privacy, is_featured, plays)
  WHERE privacy = 'public';

-- Index for tag searches
CREATE INDEX tracks_tags_idx ON public.tracks USING gin(tags);
CREATE INDEX tracks_ai_tags_idx ON public.tracks USING gin(ai_tags);

-- Index for BPM range queries
CREATE INDEX tracks_bpm_idx ON public.tracks(bpm) WHERE bpm IS NOT NULL;

-- RLS policy for public tracks (no auth required for reading)
CREATE POLICY "Anyone can view public tracks"
  ON public.tracks FOR SELECT
  USING (privacy = 'public');
```

### Seed Preset Tracks

Create a seeding script/migration to insert preset tracks as system tracks:

```typescript
// scripts/seed-presets.ts
import { PRESETS } from "@/lib/audio/presets";

for (const preset of PRESETS) {
  await supabase.from("tracks").insert({
    name: preset.name,
    current_code: preset.code,
    bpm: preset.bpm,
    genre: preset.genre,
    tags: preset.tags,
    privacy: "public",
    is_system: true,
    is_featured: true,
    // Create under a system project/user
  });
}
```

## Architecture

### New Pages

#### `/explore` - Main Discovery Page

```
┌─────────────────────────────────────────────────────────────────┐
│  LoField Music Lab                           [Studio] [Sign In] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎵 Explore Public Tracks                                       │
│                                                                 │
│  ┌─ Now Playing ──────────────────────────────────────────────┐ │
│  │ ▶ Midnight Lofi  •  82 BPM  •  Lofi Hip-Hop              │ │
│  │ [============================|=========] 2:34 / 4:00      │ │
│  │ [⏮] [⏸] [⏭]  [🔀 Shuffle]  [🔁 Auto-play ON]            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Filters ──────────────────────────────────────────────────┐ │
│  │ Genre: [All ▼]  BPM: [60]──[180]  Tags: [chill] [jazzy] ✕ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ ▶           │ │ ▶           │ │ ▶           │ │ ▶          │ │
│  │ Midnight    │ │ Deep House  │ │ Dark        │ │ Ambient    │ │
│  │ Lofi        │ │ Groove      │ │ Techno      │ │ Chill      │ │
│  │             │ │             │ │             │ │            │ │
│  │ 82 BPM      │ │ 122 BPM     │ │ 138 BPM     │ │ 70 BPM     │ │
│  │ #chill #lo  │ │ #house #gro │ │ #dark #tech │ │ #ambient   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ ...         │ │ ...         │ │ ...         │ │ ...        │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### New API Endpoints

#### `GET /api/explore`

Fetch public tracks with filtering:

```typescript
interface ExploreQuery {
  genre?: string;
  tags?: string[];
  bpm_min?: number;
  bpm_max?: number;
  sort?: "newest" | "popular" | "random";
  limit?: number;
  offset?: number;
}

interface ExploreResponse {
  tracks: PublicTrack[];
  total: number;
  genres: string[]; // Available genres for filter
  tags: string[]; // Available tags for filter
  bpm_range: { min: number; max: number };
}

interface PublicTrack {
  id: string;
  name: string;
  current_code: string;
  bpm: number | null;
  genre: string | null;
  tags: string[];
  plays: number;
  is_featured: boolean;
  created_at: string;
  // NO user info - privacy
}
```

#### `POST /api/tracks/[id]/play`

Increment play count (rate-limited, fingerprinted):

```typescript
// Prevents spam plays
// Uses IP + user-agent fingerprint
// Max 1 play per track per hour per fingerprint
```

### New Components

#### `ExploreTrackCard`

```typescript
interface ExploreTrackCardProps {
  track: PublicTrack;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}
```

Features:

- Play button with loading state
- BPM badge
- Genre tag
- Tags (truncated with +N more)
- Visual waveform preview (optional)
- Hover to show "Open in Studio" link

#### `ExplorePlayer`

Persistent player bar at top of explore page:

```typescript
interface ExplorePlayerProps {
  currentTrack: PublicTrack | null;
  queue: PublicTrack[];
  autoPlay: boolean;
  shuffle: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onToggleAutoPlay: () => void;
  onToggleShuffle: () => void;
}
```

Features:

- Play/pause/next/previous controls
- Progress bar with seeking
- Auto-play toggle
- Shuffle toggle
- Current track info
- Volume control

#### `ExploreFilters`

```typescript
interface ExploreFiltersProps {
  genres: string[];
  tags: string[];
  bpmRange: { min: number; max: number };
  selectedGenre: string | null;
  selectedTags: string[];
  bpmMin: number;
  bpmMax: number;
  onFilterChange: (filters: FilterState) => void;
}
```

Features:

- Genre dropdown
- Tag pills (click to add/remove)
- BPM range slider
- Clear all filters button
- Active filter count badge

### Auto-Play Queue System

```typescript
// lib/hooks/usePlayQueue.ts

interface PlayQueueState {
  queue: PublicTrack[];
  currentIndex: number;
  autoPlay: boolean;
  shuffle: boolean;
  history: string[]; // Track IDs for previous
}

interface UsePlayQueueReturn {
  currentTrack: PublicTrack | null;
  queue: PublicTrack[];
  isAutoPlay: boolean;
  isShuffle: boolean;

  playTrack: (track: PublicTrack) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleAutoPlay: () => void;
  toggleShuffle: () => void;
  setQueue: (tracks: PublicTrack[]) => void;
  clearQueue: () => void;
}
```

Logic:

- When track ends, if autoPlay: play next in queue
- If shuffle: pick random unplayed track
- If end of queue + autoPlay: fetch more tracks with same filters
- Remember last 50 tracks in history for "previous"

## AI Tagging System

### When to Tag

1. **On track save** (if public): Queue for AI analysis
2. **On privacy change to public**: Queue for AI analysis
3. **Batch job**: Process untagged public tracks periodically

### Tagging Approach

```typescript
// lib/ai/trackTagger.ts

interface TaggingResult {
  genre: string;
  subGenre: string | null;
  mood: string[]; // ['chill', 'melancholic', 'uplifting']
  instruments: string[]; // ['synth', 'drums', 'bass', 'piano']
  characteristics: string[]; // ['lofi', 'ambient', 'glitchy']
  suggestedTags: string[];
  confidence: number;
}

async function analyzeTrackCode(code: string): Promise<TaggingResult> {
  // Use LLM to analyze the Tone.js code and extract:
  // - What synths/instruments are used
  // - BPM (if detectable from Transport.bpm)
  // - Style characteristics
  // - Mood based on scales/chords/tempo
}
```

### Prompt for AI Tagging

````markdown
Analyze this Tone.js music code and provide tags:

Code:

```javascript
{
  code;
}
```
````

Extract:

1. Genre (one of: Electronic, Lofi, House, Techno, Ambient, Hip-Hop, Pop, Rock, R&B, Experimental)
2. Sub-genre if applicable
3. Mood tags (2-4): e.g., chill, energetic, dark, uplifting, melancholic
4. Instruments detected: e.g., synth, drums, bass, piano, strings
5. Characteristics: e.g., lofi, glitchy, minimal, complex, layered
6. BPM if detectable from code

Return as JSON.

````

### User Tag Management

Allow track owners to:
- View AI-suggested tags
- Accept/reject AI tags
- Add custom tags
- Remove tags
- Tags have source: 'user' | 'ai'

## Homepage Integration

### Update `app/page.tsx`

Add "Explore Tracks" link below "Open Studio":

```tsx
<div className="flex gap-4">
  <Link href="/studio">Open Music Studio</Link>
  <Link href="/explore">Explore Public Tracks</Link>
</div>
````

Or make explore the primary CTA with studio secondary.

### Consider Homepage Layout

Option A: Keep simple, add explore link
Option B: Show featured tracks on homepage
Option C: Make explore the homepage, studio is secondary

## Acceptance Criteria

### Phase 1: Basic Directory (MVP) ✅ COMPLETE

- [x] Database migration adds metadata columns (`007_track_metadata.sql`)
- [x] Presets seeded as system tracks (via `/api/admin/seed-presets`)
- [x] `/explore` page shows public tracks in grid
- [x] Click track to play (uses existing audio runtime)
- [x] Basic genre filter dropdown
- [x] Homepage links to explore page
- [x] No user info shown on public tracks
- [x] Mobile responsive grid

### Phase 2: Enhanced Playback ✅ COMPLETE

- [x] Persistent player bar at bottom of explore
- [x] Auto-play next track toggle
- [x] Shuffle mode
- [x] Previous/next controls
- [x] Progress bar (shows bar progress)
- [x] Play count tracking (rate-limited, 1 play/track/hour/fingerprint)

### Phase 3: Advanced Filtering (Partially Complete)

- [x] Tag filtering (multi-select) - implemented in Phase 2
- [x] BPM range inputs - implemented in Phase 2
- [x] Sort by: newest, popular, random - implemented in Phase 2
- [ ] URL reflects filter state (shareable)
- [x] Infinite scroll pagination - implemented in Phase 2
- [ ] "Load more" button alternative

### Phase 4: AI Tagging

- [ ] AI analyzes public tracks on save
- [ ] Tags stored in ai_tags column
- [ ] Users can edit their track's tags
- [ ] Tag management UI in studio
- [ ] Batch processing for existing tracks

### Phase 5: Polish

- [ ] Featured tracks section
- [ ] "Similar tracks" suggestions
- [ ] Share track button (copies URL)
- [ ] "Open in Studio" button (loads code)
- [ ] Keyboard shortcuts (space=play, n=next, p=prev)
- [ ] Waveform visualization preview

## File Structure

```
app/
  explore/
    page.tsx              # Main explore page
    loading.tsx           # Loading skeleton
  api/
    explore/
      route.ts            # GET public tracks
    tracks/
      [id]/
        play/
          route.ts        # POST increment play count
        tags/
          route.ts        # GET/PUT track tags

components/
  explore/
    ExploreTrackCard.tsx
    ExplorePlayer.tsx
    ExploreFilters.tsx
    TrackGrid.tsx
    NowPlaying.tsx

lib/
  hooks/
    usePlayQueue.ts
    useExplore.ts
  ai/
    trackTagger.ts
  types/
    explore.ts
```

## Technical Considerations

### Performance

- Paginate tracks (20 per page)
- Cache filter options (genres, tags)
- Lazy load track cards below fold
- Preload next track audio while current plays

### SEO

- `/explore` should be indexable
- Individual tracks could have `/track/[id]` pages
- Meta tags for sharing

### Audio Handling

- Reuse existing `lib/audio/runtime.ts`
- Handle audio context initialization on user interaction
- Graceful fallback if Tone.js fails to load

### Rate Limiting

- Play count: 1 play/track/hour/IP
- API requests: 60/minute for explore
- AI tagging: Queue with 10 concurrent max

## Estimated Effort

| Phase               | Effort   | Complexity  |
| ------------------- | -------- | ----------- |
| Phase 1 (MVP)       | 3-4 days | Medium      |
| Phase 2 (Playback)  | 2-3 days | Medium      |
| Phase 3 (Filtering) | 2-3 days | Low-Medium  |
| Phase 4 (AI Tags)   | 3-4 days | Medium-High |
| Phase 5 (Polish)    | 2-3 days | Low         |

**Total: 2-3 weeks**

## Open Questions

1. Should we allow comments on public tracks?
2. Should tracks have likes/favorites?
3. Should there be user profiles showing their public tracks?
4. Should we add a "report" feature for inappropriate content?
5. Should presets be editable or locked as "official"?
6. Should we show play counts publicly or keep private?
7. Do we need content moderation for public tracks?

## Dependencies

- Existing audio runtime (no new deps)
- LLM API access for tagging (already have for chat)
- Supabase (already have)

## Risks & Mitigations

| Risk                         | Impact           | Mitigation                        |
| ---------------------------- | ---------------- | --------------------------------- |
| Inappropriate content        | Legal/reputation | Content moderation, report button |
| Audio autoplay blocked       | Broken UX        | Require user click to start       |
| Performance with many tracks | Slow page        | Pagination, virtual scrolling     |
| AI tagging costs             | Budget           | Batch processing, cache results   |
| Copyright content            | Legal            | Terms of service, DMCA process    |

---

**Created:** 2024-01-25
**Updated:** 2026-01-25
**Priority:** High
**Status:** In Progress (Phase 1 & 2 Complete)

---

## Work Log

### 2026-01-25 - Phase 1 & 2 Implementation

**Completed by:** Claude Opus 4.5

#### Files Created:

- `supabase/migrations/007_track_metadata.sql` - Adds bpm, genre, tags, ai_tags, plays, is_featured, is_system columns
- `supabase/migrations/008_system_tracks.sql` - Allows null user_id for system tracks, adds RPC function
- `lib/types/explore.ts` - Type definitions for PublicTrack, ExploreQuery, filters, queue state
- `lib/hooks/useExplore.ts` - Hook for fetching/filtering public tracks with pagination
- `lib/hooks/usePlayQueue.ts` - Hook for queue management with auto-play, shuffle, history
- `app/api/explore/route.ts` - GET endpoint for public tracks with filtering
- `app/api/explore/play/route.ts` - POST endpoint for rate-limited play count
- `app/api/admin/seed-presets/route.ts` - Admin endpoint to seed preset tracks
- `app/explore/page.tsx` - Main explore page
- `components/explore/ExploreTrackCard.tsx` - Track card component
- `components/explore/ExploreFilters.tsx` - Filter controls
- `components/explore/ExplorePlayer.tsx` - Persistent player bar
- `components/explore/TrackGrid.tsx` - Infinite scroll grid
- `components/explore/index.ts` - Component exports
- `scripts/seed-presets.ts` - CLI script for seeding (alternative to API)
- `lib/hooks/__tests__/usePlayQueue.test.ts` - Hook tests
- `lib/types/__tests__/explore.test.ts` - Type tests

#### Files Modified:

- `app/page.tsx` - Added "Explore Tracks" button

#### Commits:

1. `bfb676d` - feat: Add public track explore directory (Phase 1 & 2)
2. `3f4c4e5` - test: Add tests for explore types and usePlayQueue hook

#### Notes:

- Player bar is at bottom (not top as originally designed) - works better for mobile
- Progress bar shows current bar progress rather than full track duration (tracks loop infinitely)
- Presets need to be seeded after migrations run via `/api/admin/seed-presets`
- Tag filtering already works in Phase 2 (multi-select implemented)
- BPM range filter already works in Phase 2

#### Next Steps (Phase 3):

- Add URL state for shareable filter links
- Implement "Load more" button in addition to infinite scroll
- Add sort indicator in UI
