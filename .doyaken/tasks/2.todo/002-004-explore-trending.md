# Task: Add Trending/Featured Section to Explore Page

## Metadata

| Field       | Value                      |
| ----------- | -------------------------- |
| ID          | `002-004-explore-trending` |
| Status      | `todo`                     |
| Priority    | `002` High                 |
| Created     | `2026-01-29 21:25`         |
| Started     |                            |
| Completed   |                            |
| Blocked By  |                            |
| Blocks      |                            |
| Assigned To |                            |
| Assigned At |                            |

---

## Context

The explore page shows tracks but doesn't highlight what's popular or trending. A trending section helps new users discover the best content and incentivizes creators to make shareable tracks.

**Problem Statement:**

- **Who**: New visitors exploring the platform
- **What**: No curation or trending highlights
- **Why**: Users don't know what's good; everything looks equal
- **Current workaround**: Random browsing, preset filtering

**Marketing Impact**: MEDIUM-HIGH - improves engagement and showcases best content

---

## Acceptance Criteria

- [ ] "Trending" section at top of explore page
- [ ] Trending based on plays in last 7 days
- [ ] "Featured" section for staff picks (manual curation)
- [ ] "New" section for recent tracks
- [ ] Visual distinction for trending/featured badges
- [ ] Auto-refresh trending daily
- [ ] Tests written and passing
- [ ] Quality gates pass

---

## Plan

1. **Step 1**: Database changes
   - Files: `supabase/migrations/`
   - Actions: Add is_featured column if missing, add plays tracking

2. **Step 2**: Trending query
   - Files: `lib/supabase/tracks.ts`
   - Actions: Query tracks by plays in last 7 days

3. **Step 3**: Featured curation
   - Files: Admin dashboard or database
   - Actions: Mark tracks as featured (staff picks)

4. **Step 4**: Update explore page layout
   - Files: `app/explore/page.tsx`
   - Actions: Trending carousel, Featured section, then full grid

5. **Step 5**: Add badges
   - Files: `components/explore/ExploreTrackCard.tsx`
   - Actions: "Trending" fire icon, "Featured" star badge

6. **Step 6**: Write tests
   - Files: `app/explore/__tests__/`
   - Coverage: Trending calculation, featured display

---

## Notes

- Consider time decay for trending (more recent plays weighted higher)
- Featured should rotate to showcase variety
- Could add "Rising" for tracks gaining traction

---

## Links

- File: `app/explore/page.tsx`
- File: `components/explore/ExploreTrackCard.tsx`
