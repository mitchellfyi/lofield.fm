# Task: Improve Recording Panel Discoverability

## Metadata

| Field       | Value                                     |
| ----------- | ----------------------------------------- |
| ID          | `002-003-recording-panel-discoverability` |
| Status      | `todo`                                    |
| Priority    | `002` High                                |
| Created     | `2026-01-29 21:20`                        |
| Started     |                                           |
| Completed   |                                           |
| Blocked By  |                                           |
| Blocks      |                                           |
| Assigned To |                                           |
| Assigned At |                                           |

---

## Context

The recording panel only appears when recordings exist. New users don't know the feature exists, and even experienced users may not discover it. This is a significant UX gap.

**Problem Statement:**

- **Who**: All users, especially new users
- **What**: Recording panel is hidden until you have recordings
- **Why**: Users can't discover the feature or understand what it does
- **Current workaround**: Accidentally discover it after making a recording

**Impact**: Medium-High - feature goes unused due to poor discoverability

---

## Acceptance Criteria

- [ ] Recording panel always visible (collapsed or expanded)
- [ ] Empty state explains what recordings are and how to create one
- [ ] Visual indicator when recording is active
- [ ] Prompt to save track when recording without a saved track
- [ ] Unsaved recording warning before leaving page
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Step 1**: Always show recording panel
   - Files: `components/studio/RecordingTimeline.tsx`
   - Actions: Remove conditional rendering, add empty state UI

2. **Step 2**: Design empty state
   - Files: `components/studio/RecordingTimeline.tsx`
   - Actions: Add explanation text, "Start Recording" CTA, icon

3. **Step 3**: Add recording indicator
   - Files: `components/studio/RecordButton.tsx`, `components/studio/ActionsBar.tsx`
   - Actions: Pulsing indicator, time counter when recording

4. **Step 4**: Add save prompts and warnings
   - Files: `lib/hooks/useRecording.ts`, `components/studio/`
   - Actions: Prompt to save track, beforeunload warning for unsaved recordings

5. **Step 5**: Write tests
   - Files: `components/studio/__tests__/RecordingTimeline.test.ts`
   - Coverage: Empty state, recording indicator, save prompts

---

## Notes

- Keep panel compact when empty to not waste space
- Use consistent iconography with rest of app
- Consider animated recording indicator for visibility

---

## Links

- File: `components/studio/RecordingTimeline.tsx`
- File: `components/studio/RecordButton.tsx`
- File: `lib/hooks/useRecording.ts`
