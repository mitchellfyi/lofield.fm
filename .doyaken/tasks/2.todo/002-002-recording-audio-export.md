# Task: Add Audio Export for Recordings with Automation

## Metadata

| Field       | Value                            |
| ----------- | -------------------------------- |
| ID          | `002-002-recording-audio-export` |
| Status      | `todo`                           |
| Priority    | `002` High                       |
| Created     | `2026-01-29 21:20`               |
| Started     |                                  |
| Completed   |                                  |
| Blocked By  |                                  |
| Blocks      |                                  |
| Assigned To |                                  |
| Assigned At |                                  |

---

## Context

The recording system captures automation data (parameter tweaks, mute/solo changes) but can only export as JSON/CSV. Users cannot render their performance to audio with the automation applied.

**Problem Statement:**

- **Who**: Users who record live performances with tweaks
- **What**: Cannot export recorded sessions as audio files
- **Why**: The whole point of recording is to capture a performance - users want the audio
- **Current workaround**: None - must manually recreate performance for export

**Impact**: High - recording feature is incomplete without this

---

## Acceptance Criteria

- [ ] "Export Recording to Audio" button in recording panel
- [ ] WAV export renders audio with automation applied
- [ ] Progress indicator during render (recordings can be long)
- [ ] Renders at full quality (same as regular WAV export)
- [ ] Works with multi-layer compositions
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Step 1**: Extend WAV export to accept automation data
   - Files: `lib/export/audioExport.ts`
   - Actions: Add function to render with automation timeline

2. **Step 2**: Implement automation playback during render
   - Files: `lib/audio/automationPlayer.ts`
   - Actions: Apply recorded parameter changes at correct timestamps

3. **Step 3**: Add UI for recording export
   - Files: `components/studio/RecordingTimeline.tsx` or `ExportModal.tsx`
   - Actions: Add export button, progress modal, format selection

4. **Step 4**: Handle edge cases
   - Files: Various
   - Actions: Empty recordings, very long recordings, error handling

5. **Step 5**: Write tests
   - Files: `lib/export/__tests__/recordingExport.test.ts`
   - Coverage: Automation application, timing accuracy, error cases

---

## Notes

- May need to use offline rendering (Tone.Offline) for accuracy
- Consider memory usage for very long recordings
- Existing WAV export code can be extended

---

## Links

- File: `lib/export/audioExport.ts`
- File: `lib/export/recordingExport.ts`
- File: `components/studio/RecordingTimeline.tsx`
