# Task: Export Recording as Rendered Audio

## Metadata

| Field       | Value                           |
| ----------- | ------------------------------- |
| ID          | `003-012-recording-audio-export` |
| Status      | `doing`                         |
| Priority    | `003` Medium                    |
| Created     | `2026-01-24 18:05`              |
| Started     | `2026-01-24 18:21`              |
| Completed   |                                 |
| Blocked By  | `003-011-record-mode`           |
| Blocks      |                                 |
| Assigned To | `worker-1` |
| Assigned At | `2026-01-24 18:21` |

---

## Context

This is a follow-up from task 003-011-record-mode. The recording feature captures automation events (BPM, filter, reverb, delay changes) but doesn't yet support exporting audio with those automation changes baked in.

The existing `audioExport.ts` uses OfflineAudioContext for faster-than-realtime rendering, but needs to be enhanced to schedule parameter changes at the correct timestamps during the offline render.

---

## Acceptance Criteria

- [x] Add `recording?: Recording` parameter to `renderAudio` in `lib/export/audioExport.ts`
- [x] Schedule tweak injections at event timestamps during offline render
- [x] Handle timing precision (events are in ms, need to map to audio context time)
- [x] Expose "Export with Automation" option in ExportModal when recording is active
- [x] Tests for automation rendering
- [x] Quality gates pass
- [x] Changes committed with task reference

---

## Plan

### Implementation Plan (Generated 2026-01-24 18:25)

#### Gap Analysis

| Criterion | Status | Gap |
|-----------|--------|-----|
| Add `recording?: Recording` parameter to `renderAudio` | no | Need to add optional parameter and type import |
| Schedule tweak injections at event timestamps during offline render | no | Need to implement event scheduling with `transport.schedule()` |
| Handle timing precision (ms → audio context time) | no | Need conversion: `event.timestamp_ms / 1000` for seconds |
| Expose "Export with Automation" option in ExportModal when recording is active | no | Need to add toggle + pass recording to component |
| Tests for automation rendering | no | Need new test file or extend existing |
| Quality gates pass | pending | Will run after implementation |
| Changes committed with task reference | pending | Will commit after quality passes |

#### Technical Approach

The existing `audioExport.ts:renderAudio()` already uses `transport.schedule()` to stop the transport at duration (line 146). We can use the same pattern to schedule parameter changes from recording events.

**Key insight**: The offline context renders faster than realtime, but Tone.js Transport scheduling still works correctly because it uses transport time (not wall-clock time). Events scheduled at transport time `t` will fire at the correct position in the rendered audio.

**BPM special handling**: BPM changes affect transport timing. When BPM changes mid-recording, subsequent event timestamps (in ms) may not align correctly with transport position. For simplicity in v1, we'll schedule events using absolute seconds (`timestamp_ms / 1000`), which works as long as the initial BPM matches the recording. A warning will be logged if BPM changes are detected.

**Tweak application strategy**:
1. Parse the recording events
2. For each tweak event, use `transport.schedule()` to schedule a callback at `event.timestamp_ms / 1000` seconds
3. In the callback, apply the tweak value to the running Tone.js graph (via the same injection pattern used in live playback)

**Challenge**: The code is evaluated once at the start. To change parameters mid-render, we need to:
- Track Tone.js objects that were created (already done via `disposables` array)
- Schedule parameter changes on those objects directly using Tone.js param automation (e.g., `filter.frequency.setValueAtTime()`)

**Alternative approach (simpler)**: Re-inject tweaks into code before rendering, creating a version that has all parameter changes baked in at their final values. This is simpler but loses automation timeline.

**Chosen approach**: Schedule parameter changes using Tone.js's built-in parameter automation APIs. The `transport.schedule()` approach with direct object manipulation is more faithful to the original recording.

#### Files to Modify

1. **`lib/export/audioExport.ts`**
   - Add `recording?: Recording` to `AudioExportOptions` interface
   - Import `Recording` type from `@/lib/types/recording`
   - Import `TweaksConfig` from `@/lib/types/tweaks`
   - Create helper function `scheduleAutomationEvents(transport, events, trackedObjects)`:
     - Map event param names to Tone.js object properties
     - Schedule `setValueAtTime()` calls for each event
   - Track created objects in `disposables` to reference later for automation
   - Handle param→object mapping: bpm→Transport.bpm, filter→masterLowpass.frequency, reverb→masterReverb.wet, delay→tapeDelay.wet

2. **`components/studio/ExportModal.tsx`**
   - Add `recording?: Recording` prop to `ExportModalProps`
   - Add state: `const [includeAutomation, setIncludeAutomation] = useState(false);`
   - Add toggle UI (only visible when `recording` prop is provided)
   - Pass `recording` to `renderAudio()` when `includeAutomation` is true

3. **`app/studio/page.tsx`**
   - Pass `activeRecording` to `<ExportModal>` component

#### Files to Create

_(None - extending existing files)_

#### Test Plan

Add to `lib/export/__tests__/audioExport.test.ts`:

- [ ] `scheduleAutomationEvents` function is exported and callable
- [ ] Events are scheduled at correct transport times (mock transport.schedule)
- [ ] Filter frequency changes are correctly scheduled
- [ ] Reverb wet changes are correctly scheduled
- [ ] Delay wet changes are correctly scheduled
- [ ] BPM changes trigger console warning (BPM automation is complex)
- [ ] Empty recording doesn't cause errors
- [ ] `renderAudio` accepts recording option without error

Note: Full integration tests require browser environment with Web Audio API. Unit tests will focus on scheduling logic with mocks.

#### Docs to Update

_(None required - internal feature)_

#### Implementation Order

1. Add types and imports to `audioExport.ts`
2. Create object tracking mechanism to capture named Tone.js objects
3. Implement `scheduleAutomationEvents` helper
4. Integrate scheduling into `renderAudio` flow
5. Update `ExportModal` props and UI
6. Update `studio/page.tsx` to pass recording
7. Add tests
8. Run quality gates

---

## Work Log

### 2026-01-24 18:25 - Planning Complete

- **Gap Analysis Completed**: Reviewed all relevant files
  - `lib/export/audioExport.ts` (240 lines) - existing offline render with OfflineAudioContext
  - `lib/types/recording.ts` (221 lines) - Recording, RecordingEvent types
  - `lib/audio/tweaksInjector.ts` (105 lines) - tweak injection patterns
  - `components/studio/ExportModal.tsx` (279 lines) - export UI
  - `app/studio/page.tsx` (1692 lines) - has activeRecording state
  - `lib/hooks/useRecordingPlayback.ts` (266 lines) - playback pattern reference

- **Technical Decisions**:
  1. Use `transport.schedule()` for automation (already used in line 146 for stop)
  2. Track named objects separately from disposables for parameter access
  3. BPM changes will log warning (complex timing implications for v1)
  4. Filter/reverb/delay straightforward via `.setValueAtTime()` or `.rampTo()`

- **Implementation Order**:
  1. audioExport.ts - types, helper function, integration
  2. ExportModal.tsx - add recording prop and toggle UI
  3. page.tsx - pass activeRecording prop
  4. Tests - mock-based unit tests

- **Ready for implementation phase**

### 2026-01-24 18:32 - Implementation Complete

- **Files Modified**:
  - `lib/export/audioExport.ts` - Added Recording/TweaksConfig imports, TrackedObjects interface, scheduleAutomationEvents function, object tracking in Proxy
  - `components/studio/ExportModal.tsx` - Added recording prop, includeAutomation state, UI toggle
  - `app/studio/page.tsx` - Pass activeRecording to ExportModal
  - `lib/export/__tests__/audioExport.test.ts` - Added 13 tests for scheduleAutomationEvents

- **Commits**:
  - `2d29c17` - feat: Add recording automation support to audio export
  - `2202f90` - feat: Add automation toggle to ExportModal
  - `0c3303a` - feat: Pass activeRecording to ExportModal
  - `8f13af6` - style: Format ExportModal with Prettier
  - `b9c9d01` - test: Add tests for scheduleAutomationEvents function

- **Quality Check**: Pass
  - TypeScript: No errors
  - ESLint: No errors
  - Tests: 1642/1642 passing (37 in audioExport.test.ts)

- **Technical Notes**:
  - Used `ReturnType<typeof Tone.getTransport>` for Transport type (not exported directly)
  - Tracked Filter, Reverb, FeedbackDelay as first instances created
  - BPM changes log warning at scheduled time (not applied due to timing complexity)
  - Used `rampTo()` for smooth parameter transitions (50ms ramp)

### 2026-01-24 18:21 - Triage Complete

- **Dependencies**: ✅ `003-011-record-mode` is completed (found in `.claude/tasks/done/`)
- **Task clarity**: Clear - well-defined acceptance criteria with specific files to modify
- **Ready to proceed**: Yes
- **Notes**:
  - All key files exist: `lib/export/audioExport.ts`, `lib/types/recording.ts`, `components/studio/ExportModal.tsx`
  - Task scope is well-bounded: add recording parameter to renderAudio, schedule automation, update ExportModal
  - Technical challenges are documented (offline rendering timing, BPM special handling)
  - No ambiguities requiring clarification

---

## Testing Evidence

```bash
# TypeScript compilation
$ npm run typecheck
> tsc --noEmit
# (no errors)

# ESLint
$ npm run lint
> eslint
# (no errors)

# Unit Tests
$ npm run test -- lib/export/__tests__/audioExport.test.ts
 ✓ lib/export/__tests__/audioExport.test.ts (37 tests) 6ms

# Full Test Suite
$ npm run test
 Test Files  56 passed (56)
 Tests       1642 passed (1642)
```

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
