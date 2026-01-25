# Actions Bar Functionality and Tests

| Field       | Value                                   |
| ----------- | --------------------------------------- |
| ID          | 002-005-actions-bar-functionality-tests |
| Status      | todo                                    |
| Priority    | High                                    |
| Created     | 2025-01-25                              |
| Assigned To |                                         |
| Assigned At |                                         |

## Context

The ActionsBar component consolidates all action buttons. Need to verify all buttons work correctly and add comprehensive tests.

## Acceptance Criteria

- [ ] Undo button works and respects canUndo state
- [ ] Redo button works and respects canRedo state
- [ ] Save button triggers save and shows saving state
- [ ] Save As button opens save-as modal
- [ ] History button opens revision history (when track is saved)
- [ ] Copy button copies code to clipboard
- [ ] Revert button reverts to default code
- [ ] Export button opens export modal
- [ ] Share button opens share dialog (disabled when no track)
- [ ] Model selector works and persists selection
- [ ] All disabled states render correctly
- [ ] All hover/active states work
- [ ] Mobile layout displays correctly (icons only)
- [ ] Write unit tests for ActionsBar component
- [ ] Write integration tests for action handlers

## Plan

1. Manual test each button in the ActionsBar
2. Verify state management (disabled, loading, etc.)
3. Write Jest/React Testing Library tests
4. Test mobile responsive behavior
5. Document any issues found

## Work Log

## Notes

- ActionsBar is at components/studio/ActionsBar.tsx
- Props include callbacks for all actions
- Some actions require track to be saved first (share, history)
