# Task: Undo/Redo Across Chat and Code Edits

## Metadata

| Field       | Value               |
| ----------- | ------------------- |
| ID          | `003-008-undo-redo` |
| Status      | `todo`              |
| Priority    | `003` Medium        |
| Created     | `2026-01-23 12:00`  |
| Started     |                     |
| Completed   |                     |
| Blocked By  |                     |
| Blocks      |                     |
| Assigned To |                     |
| Assigned At |                     |

---

## Context

Users will frequently break their beats through chat prompts or manual edits. Quick undo/redo is essential for experimentation without fear.

- Need: unified undo/redo across AI changes and manual edits
- Keyboard shortcuts: Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z
- UI buttons as well
- History should persist during session

---

## Acceptance Criteria

- [ ] Undo/redo state management (history stack)
- [ ] Tracks both AI responses and manual code edits
- [ ] Undo button in UI
- [ ] Redo button in UI
- [ ] Keyboard shortcuts (Cmd/Ctrl+Z for undo, Cmd/Ctrl+Shift+Z for redo)
- [ ] History limited to last N states (e.g., 50)
- [ ] Disabled state when nothing to undo/redo
- [ ] Works with multi-track (undo entire state)
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Create undo/redo state manager**
   - Files: `hooks/use-history.ts`
   - History stack with past/present/future
   - Push on change, pop on undo

2. **Integrate with code state**
   - Files: `app/strudel/page.tsx`
   - Wrap code changes with history tracking
   - Debounce manual edits

3. **Add keyboard shortcuts**
   - Files: `hooks/use-keyboard-shortcuts.ts`
   - Global keydown listener
   - Prevent default on matched shortcuts

4. **Add UI buttons**
   - Files: `app/strudel/page.tsx`
   - Undo/redo buttons in toolbar
   - Disabled when unavailable

5. **Handle edge cases**
   - Don't track no-op changes
   - Clear redo on new action

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- Consider using immer for immutable state updates
- May want visual history timeline in future
- Different from version history (revisions) - this is session-only

---

## Links

- NPM: `use-undo`, `immer`
