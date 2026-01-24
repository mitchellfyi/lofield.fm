# Task: Export Recording as Rendered Audio

## Metadata

| Field       | Value                           |
| ----------- | ------------------------------- |
| ID          | `003-012-recording-audio-export` |
| Status      | `todo`                          |
| Priority    | `003` Medium                    |
| Created     | `2026-01-24 18:05`              |
| Started     |                                 |
| Completed   |                                 |
| Blocked By  | `003-011-record-mode`           |
| Blocks      |                                 |
| Assigned To |                                 |
| Assigned At |                                 |

---

## Context

This is a follow-up from task 003-011-record-mode. The recording feature captures automation events (BPM, filter, reverb, delay changes) but doesn't yet support exporting audio with those automation changes baked in.

The existing `audioExport.ts` uses OfflineAudioContext for faster-than-realtime rendering, but needs to be enhanced to schedule parameter changes at the correct timestamps during the offline render.

---

## Acceptance Criteria

- [ ] Add `recording?: Recording` parameter to `renderAudio` in `lib/export/audioExport.ts`
- [ ] Schedule tweak injections at event timestamps during offline render
- [ ] Handle timing precision (events are in ms, need to map to audio context time)
- [ ] Expose "Export with Automation" option in ExportModal when recording is active
- [ ] Tests for automation rendering
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

### Implementation Approach

1. **Modify `renderAudio` function**
   - Add optional `recording?: Recording` parameter
   - During offline render, schedule parameter changes at correct times
   - Use Tone.js Transport time scheduling for automation

2. **Technical Challenges**
   - Offline rendering is faster than realtime - need to schedule events properly
   - BPM changes affect transport timing - may need special handling
   - Filter/reverb/delay are more straightforward to automate

3. **Integration**
   - Update ExportModal to show "Include Automation" toggle when activeRecording exists
   - Pass recording to renderAudio when option is enabled

### Files to Modify

- `lib/export/audioExport.ts` - Add automation support
- `components/studio/ExportModal.tsx` - Add automation toggle
- `lib/export/__tests__/audioExport.test.ts` - Add automation tests

---

## Work Log

_(Empty - task not started)_

---

## Testing Evidence

_(Empty - task not started)_

---

## Notes

- This is a complex feature requiring careful timing coordination
- Consider starting with simpler params (filter, reverb, delay) before tackling BPM
- May need to investigate Tone.js offline rendering limitations

---

## Links

**Dependencies:**
- `003-011-record-mode` (completed) - provides Recording type and automation capture

**Related Files:**
- `lib/export/audioExport.ts` - existing audio export
- `lib/types/recording.ts` - Recording type definitions
- `lib/audio/tweaksInjector.ts` - tweak injection utilities
