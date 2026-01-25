# Task: Edit Recorded Automation Values

## Metadata

| Field       | Value                          |
| ----------- | ------------------------------ |
| ID          | `004-001-recording-value-edit` |
| Status      | `todo`                         |
| Priority    | `004` Low                      |
| Created     | `2026-01-24 18:05`             |
| Started     |                                |
| Completed   |                                |
| Blocked By  | `003-011-record-mode`          |
| Blocks      |                                |
| Assigned To |                                |
| Assigned At |                                |

---

## Context

This is a follow-up from task 003-011-record-mode. The recording timeline currently supports deleting automation points but doesn't have a UI for adjusting values.

This would enable users to fine-tune their recordings without having to re-record.

---

## Acceptance Criteria

- [ ] Click on event in RecordingTimeline to select it
- [ ] Show value editor (slider or input) for selected event
- [ ] Support numeric values (BPM, filter, reverb, delay, volume)
- [ ] Support boolean values (mute, solo)
- [ ] Update recording events in real-time
- [ ] Save changes to database
- [ ] Tests for value editing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

### Implementation Approach

1. **Enhance RecordingTimeline**
   - Currently shows selected event details with delete button
   - Add value input/slider next to the event info
   - Different UI for numeric vs boolean values

2. **UI Options**
   - Inline slider in the selected event panel
   - Modal/popover for detailed editing
   - Number input with +/- buttons

3. **Integration**
   - Add `onUpdateEvent` callback to RecordingTimeline
   - Update activeRecording state in studio page
   - Call updateRecordingApi to persist changes

### Files to Modify

- `components/studio/RecordingTimeline.tsx` - Add value editor
- `app/studio/page.tsx` - Wire up event update callback

---

## Work Log

_(Empty - task not started)_

---

## Testing Evidence

_(Empty - task not started)_

---

## Notes

- Consider UX: inline vs modal editing
- BPM values need different range than filter/reverb (0-100%)
- Boolean values could use a simple toggle

---

## Links

**Dependencies:**

- `003-011-record-mode` (completed) - provides base recording infrastructure

**Related Files:**

- `components/studio/RecordingTimeline.tsx` - timeline component
- `lib/types/recording.ts` - RecordingEvent type
