# Task: Export Recording as Rendered Audio

## Metadata

| Field       | Value                           |
| ----------- | ------------------------------- |
| ID          | `003-012-recording-audio-export` |
| Status      | `done`                          |
| Priority    | `003` Medium                    |
| Created     | `2026-01-24 18:05`              |
| Started     | `2026-01-24 18:21`              |
| Completed   | `2026-01-24 18:40`              |
| Blocked By  | `003-011-record-mode`           |
| Blocks      |                                 |
| Assigned To | |
| Assigned At | |

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

### 2026-01-24 18:37 - Testing Complete

Tests written:
- `lib/export/__tests__/audioExport.test.ts` - 37 examples (scheduleAutomationEvents function)
- `components/studio/__tests__/ExportModal.test.ts` - 51 examples (added 9 for recording automation)

Test results:
- Total: 1651 examples, 0 failures
- All 56 test files passing

Quality gates:
- ESLint: pass
- Prettier: pass (source files)
- TypeScript: pass
- RSpec/Vitest: pass

Commits:
- `b951593` - test: Add tests for ExportModal recording automation feature

Test Plan Coverage:
- [x] `scheduleAutomationEvents` function is exported and callable
- [x] Events are scheduled at correct transport times (mock transport.schedule)
- [x] Filter frequency changes are correctly scheduled
- [x] Reverb wet changes are correctly scheduled
- [x] Delay wet changes are correctly scheduled
- [x] BPM changes trigger console warning (BPM automation is complex)
- [x] Empty recording doesn't cause errors
- [x] `renderAudio` accepts recording option without error

Additional ExportModal tests:
- [x] Recording prop handling (events, no events, null, undefined)
- [x] includeAutomation toggle state (initial, toggle, conditional passing)
- [x] Event count display in automation toggle label

### 2026-01-24 18:38 - Documentation Sync

Docs updated:
- No external docs needed (internal feature enhancement as noted in plan)
- Code has appropriate inline documentation:
  - `scheduleAutomationEvents` function has JSDoc comment explaining purpose
  - `applyTweakToObjects` helper has JSDoc comment
  - Inline comments explain BPM warning, swing handling, filter/reverb/delay logic

Annotations:
- N/A (Node.js/Next.js project, no Rails model annotations)

Consistency checks:
- [x] Code matches docs - implementation matches task plan
- [x] No broken links - all referenced files verified to exist:
  - `lib/export/audioExport.ts` ✓
  - `lib/types/recording.ts` ✓
  - `lib/audio/tweaksInjector.ts` ✓
  - `components/studio/ExportModal.tsx` ✓
  - `app/studio/page.tsx` ✓
- [x] Dependency task verified: `003-011-record-mode` in done/
- [x] Test files exist and verified:
  - `lib/export/__tests__/audioExport.test.ts` (37 tests)
  - `components/studio/__tests__/ExportModal.test.ts` (51 tests)

### 2026-01-24 18:40 - Review Complete

Code review:
- Issues found: none
- Issues fixed: N/A

Code review checklist:
- [x] Code follows project conventions
- [x] No code smells or anti-patterns
- [x] Error handling is appropriate
- [x] No security vulnerabilities (SQL injection, XSS, etc.)
- [x] No N+1 queries (N/A - frontend code)
- [x] Proper use of transactions where needed (N/A - frontend code)

Consistency:
- All criteria met: yes
- Test coverage adequate: yes (22 new tests for automation feature)
- Docs in sync: yes (internal feature, code comments sufficient)

Follow-up tasks created:
- None needed - feature is complete and well-tested

Quality gates final run:
- ESLint: pass
- TypeScript: pass
- Tests: 1651 passed (56 files)

Final status: COMPLETE

### 2026-01-24 18:42 - Verification Complete

Task location: done/
Status field: matches (done)
Acceptance criteria: 7/7 checked

Issues found:
- none

Actions taken:
- Verified task file is in done/ (moved previously)
- Verified all acceptance criteria are marked complete
- Verified timestamps set correctly (Started: 18:21, Completed: 18:40)
- Verified Assigned To/At fields cleared
- Working tree already clean (all commits done)

Task verified: PASS

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

# Prettier (source files)
$ npx prettier --check "lib/**/*.ts" "components/**/*.tsx" "components/**/*.ts" "app/**/*.tsx"
Checking formatting...
All matched files use Prettier code style!

# Unit Tests - audioExport
$ npm run test -- lib/export/__tests__/audioExport.test.ts
 ✓ lib/export/__tests__/audioExport.test.ts (37 tests)

# Unit Tests - ExportModal
$ npm run test -- components/studio/__tests__/ExportModal.test.ts
 ✓ components/studio/__tests__/ExportModal.test.ts (51 tests)

# Full Test Suite
$ npm run test
 Test Files  56 passed (56)
 Tests       1651 passed (1651)
```

---

## Notes

**Initial Planning Notes:**
- This is a complex feature requiring careful timing coordination
- Consider starting with simpler params (filter, reverb, delay) before tackling BPM
- May need to investigate Tone.js offline rendering limitations

**Implementation Observations:**
- Used `ReturnType<typeof Tone.getTransport>` for Transport type since Tone.js doesn't export it directly
- BPM automation intentionally skipped in export with console warning - changing BPM mid-render affects transport timing which desynchronizes scheduled events
- Used `rampTo()` with 50ms duration for smooth parameter transitions instead of instant value changes
- TrackedObjects captures first instances of Filter, Reverb, FeedbackDelay during code execution
- Proxy pattern on Tone namespace intercepts object creation without modifying user code

**Design Decisions:**
- Chose transport.schedule() over pre-baking values into code to preserve timeline fidelity
- Optional "Include Automation" toggle UI only shown when recording prop is provided
- Event count displayed in toggle label for user awareness

---

## Links

**Dependencies:**
- `003-011-record-mode` (completed) - provides Recording type and automation capture

**Related Files:**
- `lib/export/audioExport.ts` - audio export with automation scheduling
- `lib/types/recording.ts` - Recording type definitions
- `lib/audio/tweaksInjector.ts` - tweak injection utilities
- `components/studio/ExportModal.tsx` - export UI with automation toggle

**Test Files:**
- `lib/export/__tests__/audioExport.test.ts` - scheduleAutomationEvents tests
- `components/studio/__tests__/ExportModal.test.ts` - recording automation UI tests
