# Task: Save Tracks to Database with Basic CRUD

## Metadata

| Field       | Value                                                |
| ----------- | ---------------------------------------------------- |
| ID          | `003-001-save-tracks-db`                             |
| Status      | `todo`                                               |
| Priority    | `003` Medium                                         |
| Created     | `2026-01-23 12:00`                                   |
| Started     |                                                      |
| Completed   |                                                      |
| Blocked By  | `002-004-supabase-auth-setup`                        |
| Blocks      | `003-002-track-revisions`, `003-004-shareable-links` |
| Assigned To |                                                      |
| Assigned At |                                                      |

---

## Context

Users should be able to save their created beats/tracks to their account. This enables persistence across sessions, track management, and future features like sharing and version history.

- Current: code only exists in browser state, lost on refresh
- Need: persistent storage with project/track organization
- Schema: projects contain tracks, tracks have revisions

---

## Acceptance Criteria

- [ ] Database schema: `projects`, `tracks`, `revisions` tables
- [ ] Projects: id, user_id, name, created_at, updated_at
- [ ] Tracks: id, project_id, name, current_code, created_at, updated_at
- [ ] Revisions: id, track_id, code, message, created_at (for version history)
- [ ] RLS policies for user data isolation
- [ ] API routes: create/read/update/delete projects
- [ ] API routes: create/read/update/delete tracks
- [ ] Save button in UI to save current track
- [ ] Track list/browser sidebar
- [ ] Load track from list
- [ ] Auto-save option (debounced)
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Create database schema**
   - Files: `supabase/migrations/003_tracks.sql`
   - Projects, tracks, revisions tables
   - Foreign keys, indexes, RLS

2. **Create API routes**
   - Files: `app/api/projects/route.ts`, `app/api/tracks/route.ts`
   - CRUD operations
   - Auth middleware

3. **Create data hooks**
   - Files: `hooks/use-projects.ts`, `hooks/use-tracks.ts`
   - React Query or SWR for data fetching
   - Optimistic updates

4. **Add track browser UI**
   - Files: `components/tracks/track-browser.tsx`
   - Sidebar with project/track tree
   - Create new, rename, delete

5. **Add save functionality**
   - Files: `app/strudel/page.tsx`
   - Save button
   - Auto-save with debounce
   - Unsaved changes indicator

6. **Add types**
   - Files: `types/database.ts`
   - Generated from Supabase schema

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- Consider adding project templates/presets
- May want tags/categories for organization
- Auto-save should be configurable

---

## Links

- Depends: `002-004-supabase-auth-setup`
- Blocks: `003-002-track-revisions`, `003-004-shareable-links`
