# Task: Track Version History with Revert and Diff View

## Metadata

| Field       | Value                     |
| ----------- | ------------------------- |
| ID          | `003-002-track-revisions` |
| Status      | `todo`                    |
| Priority    | `003` Medium              |
| Created     | `2026-01-23 12:00`        |
| Started     |                           |
| Completed   |                           |
| Blocked By  | `003-001-save-tracks-db`  |
| Blocks      |                           |
| Assigned To | `worker-1` |
| Assigned At | `2026-01-24 11:13` |

---

## Context

Users need to see the history of changes to their tracks, compare versions, and revert to previous versions. Each AI-generated change creates a new revision.

- Each chat response that changes code = new revision
- Users can browse history, see what changed
- Can revert to any previous version
- Diff view shows code changes between versions

---

## Acceptance Criteria

- [ ] Auto-create revision on each code change from chat
- [ ] Revision includes: code, timestamp, optional message/prompt
- [ ] History panel showing list of revisions
- [ ] Click revision to preview (without loading)
- [ ] "Revert to this version" button
- [ ] Diff view comparing two revisions (side-by-side or unified)
- [ ] Current version indicator
- [ ] Limit revisions per track (e.g., keep last 50)
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Update revision creation**
   - Files: `app/strudel/page.tsx`, `hooks/use-tracks.ts`
   - Create revision after successful AI response
   - Include user prompt as message

2. **Create history panel component**
   - Files: `components/tracks/revision-history.tsx`
   - List of revisions with timestamps
   - Preview on hover/click

3. **Add diff view**
   - Files: `components/tracks/diff-view.tsx`
   - Use `diff` or `diff2html` library
   - Side-by-side and unified views

4. **Implement revert**
   - Files: `hooks/use-tracks.ts`
   - Copy revision code to current
   - Create new revision for the revert

5. **Add revision cleanup**
   - Files: `lib/tracks.ts`
   - Delete old revisions beyond limit
   - Triggered on new revision

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- Consider git-like branching in far future
- May want to mark certain revisions as "starred"
- Cleanup should run async (edge function or cron)

---

## Links

- Depends: `003-001-save-tracks-db`
- NPM: `diff`, `diff2html`
