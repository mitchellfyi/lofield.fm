# Task: Shareable Links with Public Read-Only Pages

## Metadata

| Field       | Value                     |
| ----------- | ------------------------- |
| ID          | `003-004-shareable-links` |
| Status      | `todo`                    |
| Priority    | `003` Medium              |
| Created     | `2026-01-23 12:00`        |
| Started     |                           |
| Completed   |                           |
| Blocked By  | `003-001-save-tracks-db`  |
| Blocks      |                           |
| Assigned To |                           |
| Assigned At |                           |

---

## Context

Users want to share their beats with others via links. Shared tracks should be viewable and playable without requiring an account.

- Public share links (read-only)
- Share tokens for unlisted sharing
- Privacy controls (public, unlisted, private)
- Viewer can play but not edit

---

## Acceptance Criteria

- [ ] Share button on track page
- [ ] Generate unique share token/slug
- [ ] Privacy options: public, unlisted (link only), private
- [ ] Public tracks browsable (future: explore page)
- [ ] Share URL format: `/share/{token}` or `/t/{slug}`
- [ ] Share page shows: track name, author, code (read-only), play button
- [ ] Viewers can play without account
- [ ] Owner can revoke/regenerate share link
- [ ] OG meta tags for social sharing preview
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Update database schema**
   - Files: `supabase/migrations/004_sharing.sql`
   - Add to tracks: share_token, privacy (enum), shared_at

2. **Create share page**
   - Files: `app/share/[token]/page.tsx`
   - Fetch track by token
   - Read-only Strudel player
   - Author attribution

3. **Add share UI**
   - Files: `components/tracks/share-dialog.tsx`
   - Privacy selector
   - Copy link button
   - Regenerate/revoke

4. **Add API routes**
   - Files: `app/api/share/route.ts`
   - Generate token, update privacy
   - Public fetch by token

5. **Add OG meta tags**
   - Files: `app/share/[token]/page.tsx`
   - Dynamic metadata for social preview

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- Consider embed support (iframe) for blogs
- May want download count / play count analytics
- Could add "fork" feature for viewers

---

## Links

- Depends: `003-001-save-tracks-db`
