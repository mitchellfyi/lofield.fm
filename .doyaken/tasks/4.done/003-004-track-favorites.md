# Task: Add Track Favorites/Likes System

## Metadata

| Field       | Value                     |
| ----------- | ------------------------- |
| ID          | `003-004-track-favorites` |
| Status      | `todo`                    |
| Priority    | `003` Medium              |
| Created     | `2026-01-29 21:20`        |
| Started     |                           |
| Completed   |                           |
| Blocked By  |                           |
| Blocks      |                           |
| Assigned To |                           |
| Assigned At |                           |

---

## Context

The explore page shows public tracks but users can't save favorites or see what's popular. A like/favorite system would improve discovery and user engagement.

**Problem Statement:**

- **Who**: Users exploring public tracks
- **What**: No way to save favorites or see popularity
- **Why**: Can't curate personal collection or find popular tracks
- **Current workaround**: Bookmark URLs externally

**Impact**: Medium - improves discovery and retention

---

## Acceptance Criteria

- [ ] Heart/star button on track cards in explore
- [ ] Like count displayed on tracks
- [ ] "My Favorites" section in explore or separate page
- [ ] Liked tracks persist across sessions (database)
- [ ] Sort by "Most Popular" option in explore
- [ ] Anonymous users can like (localStorage) with prompt to sign in
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Step 1**: Database schema
   - Files: `supabase/migrations/`
   - Actions: Create track_likes table (user_id, track_id, created_at)

2. **Step 2**: API endpoints
   - Files: `app/api/tracks/[id]/like/route.ts`
   - Actions: POST to like, DELETE to unlike, GET like status

3. **Step 3**: Update explore queries
   - Files: `lib/supabase/tracks.ts`
   - Actions: Add like_count to track queries, sort by popularity

4. **Step 4**: UI components
   - Files: `components/explore/ExploreTrackCard.tsx`
   - Actions: Like button, count display, optimistic updates

5. **Step 5**: Favorites page
   - Files: `app/favorites/page.tsx`
   - Actions: List user's liked tracks with same card component

6. **Step 6**: Write tests
   - Files: `lib/__tests__/likes.test.ts`, E2E tests
   - Coverage: Like/unlike, counts, auth states

---

## Notes

- Use optimistic updates for snappy UX
- Consider rate limiting likes
- Could add "trending" (likes in last 24h) later

---

## Links

- File: `components/explore/ExploreTrackCard.tsx`
- File: `app/explore/page.tsx`
