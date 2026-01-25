# Fix Saving Tracks

| Field       | Value                     |
| ----------- | ------------------------- |
| ID          | 001-002-fix-saving-tracks |
| Status      | todo                      |
| Priority    | Critical                  |
| Created     | 2025-01-25                |
| Assigned To |                           |
| Assigned At |                           |

## Context

Track saving functionality needs to be fixed. The useDraftTrack hook was added for local draft recovery, but there may be issues with the overall save flow.

## Acceptance Criteria

- [ ] Save button correctly saves track to server
- [ ] Save As creates new track successfully
- [ ] Draft state is saved locally for recovery
- [ ] Draft is cleared after successful server save
- [ ] Error states are handled gracefully with user feedback
- [ ] Unsaved changes indicator works correctly
- [ ] Loading/saving states display properly

## Plan

1. Review current save implementation in studio page
2. Test save flow end-to-end
3. Verify useDraftTrack hook works correctly
4. Check error handling paths
5. Ensure UI states reflect saving status

## Work Log

## Notes

- useDraftTrack hook was recently added
- clearDraft is called after successful saves
- saveDraft is called when code changes
