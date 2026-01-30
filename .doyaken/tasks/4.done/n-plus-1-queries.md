# Fix N+1 Query Patterns

**Priority:** HIGH
**Category:** Performance
**Source:** Periodic Review 2026-01-30
**Status:** RESOLVED - Investigation Complete

## Problem

N+1 query patterns detected in `lib/tracks.ts` causing excessive database queries.

## Investigation Results

### lib/tracks.ts

The "N+1" pattern here is actually **intentional ownership verification**:

- Operations like `updateTrack`, `deleteTrack` first call `getTrack` to verify ownership
- This is a common security pattern - 2 queries per mutation is acceptable
- The `getTrack` function uses an efficient join: `project:projects!inner(user_id)`

### app/api/explore/route.ts

- Main tracks query is a **single query** with filters applied
- `getFilterOptions` makes 3 queries but **caches for 5 minutes**
- No N+1 pattern detected

### app/api/favorites/route.ts

- Uses 2 queries: get like IDs, then batch fetch tracks by IDs
- This is **batch fetching**, not N+1 (efficient)

### app/user/[username]/page.tsx

- Profile fetch: 1 query
- Tracks fetch: 1 query with join
- Both efficient, no N+1

## Conclusion

The codebase uses appropriate query patterns:

- Ownership verification adds 1 extra query per mutation (acceptable security practice)
- Listing operations use single queries with joins
- Filter options are cached
- No batch operations suffer from N+1

## Recommendation

No changes needed. Current implementation is appropriate.
Consider using RLS policies for ownership enforcement in the future if performance becomes critical.
