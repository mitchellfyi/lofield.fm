# Task: Edit Recorded Automation Values

## Metadata

| Field       | Value                          |
| ----------- | ------------------------------ |
| ID          | `004-001-recording-value-edit` |
| Status      | `done`                         |
| Priority    | `004` Low                      |
| Created     | `2026-01-24 18:05`             |
| Started     | `2026-01-25 20:13`             |
| Completed   | `2026-01-25 20:25`             |
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

- [x] Click on event in RecordingTimeline to select it
- [x] Show value editor (slider or input) for selected event
- [x] Support numeric values (BPM, filter, reverb, delay, volume)
- [x] Support boolean values (mute, solo)
- [x] Update recording events in real-time
- [x] Save changes to database
- [x] Tests for value editing
- [x] Quality gates pass
- [x] Changes committed with task reference

---

## Plan

### Implementation Plan (Generated 2026-01-25 20:17)

#### Gap Analysis

| Criterion                                                   | Status      | Gap                                                         |
| ----------------------------------------------------------- | ----------- | ----------------------------------------------------------- |
| Click on event in RecordingTimeline to select it            | ✅ Complete | Already implemented (lines 110-114 `handleEventClick`)      |
| Show value editor (slider or input) for selected event      | ❌ Missing  | Need to add value editor UI in selected event details panel |
| Support numeric values (BPM, filter, reverb, delay, volume) | ❌ Missing  | Need slider for numeric events; reuse `TweakSlider` pattern |
| Support boolean values (mute, solo)                         | ❌ Missing  | Need toggle button for boolean events                       |
| Update recording events in real-time                        | ❌ Missing  | Need local state update + `onUpdateEvent` callback          |
| Save changes to database                                    | ❌ Missing  | Need to wire up `updateRecordingApi` in parent              |
| Tests for value editing                                     | ❌ Missing  | Need to add tests for new functionality                     |
| Quality gates pass                                          | ⏳ Pending  | Run after implementation                                    |
| Changes committed with task reference                       | ⏳ Pending  | After completion                                            |

#### Files to Modify

1. **`components/studio/RecordingTimeline.tsx`** (Primary change)
   - Add `onUpdateEvent?: (event: RecordingEvent) => void` prop to interface (line 22)
   - In selected event details section (lines 182-220):
     - Add value editor after the event label
     - For numeric events (tweak with bpm/filter/reverb/delay, layer_volume): render a slider
     - For boolean events (layer_mute, layer_solo): render a toggle button
   - Create helper function `getEventValueConfig(event)` to return min/max/step based on event type:
     - `tweak.bpm`: 60-200, step 1
     - `tweak.filter`: 100-10000, step 100
     - `tweak.reverb`: 0-100, step 1
     - `tweak.delay`: 0-100, step 1
     - `tweak.swing`: 0-100, step 1
     - `layer_volume`: 0-100, step 1 (volume as percentage)
   - Handle value change by creating updated event and calling `onUpdateEvent`

2. **`app/studio/page.tsx`** (Wire up callback)
   - In RecordingTimeline usage (around line 1404):
     - Add `onUpdateEvent` handler that:
       1. Updates local `activeRecording` state with new event value
       2. Calls `updateRecordingApi(activeRecording.id, { events: newEvents })` to persist

3. **`lib/types/recording.ts`** (Optional - helper constants)
   - Add `RECORDING_EVENT_VALUE_CONFIG` constant with min/max/step for each event type
   - This keeps value config DRY between RecordingTimeline and TWEAK_PARAMS

#### Files to Create

None - all changes fit within existing files.

#### Implementation Details

**1. Value Editor UI (RecordingTimeline.tsx)**

The selected event details panel currently shows:

```
[color dot] [event label] [timestamp] [delete button]
```

Change to:

```
[color dot] [event label] [timestamp]
[value editor: slider OR toggle] [delete button]
```

For **numeric values** - use inline slider similar to TweakSlider:

- Import slider styles from TweakSlider or use same pattern
- Show current value label
- On change: call `onUpdateEvent({ ...event, newValue: value })`

For **boolean values** (mute, solo) - use toggle button:

- Show "On/Off" toggle
- On click: call `onUpdateEvent({ ...event, newValue: !event.newValue })`

**2. Parent Integration (studio/page.tsx)**

Add handler near line 1407:

```typescript
onUpdateEvent={(updatedEvent) => {
  // Update local state
  const newEvents = activeRecording.events.map((e) =>
    e.id === updatedEvent.id ? updatedEvent : e
  );
  setActiveRecording({ ...activeRecording, events: newEvents });

  // Persist to database (if track is saved)
  if (currentTrackId && activeRecording.id) {
    updateRecordingApi(activeRecording.id, { events: newEvents });
  }
}}
```

**3. Value Config Reference**

Use existing TWEAK_PARAMS from `lib/types/tweaks.ts` for tweak events:

- bpm: 60-200, step 1
- swing: 0-100, step 1
- filter: 100-10000, step 100
- reverb: 0-100, step 1
- delay: 0-100, step 1

For layer events:

- layer_volume: 0-100 (percentage), step 1
- layer_mute/layer_solo: boolean toggle

#### Test Plan

Add tests to `components/studio/__tests__/RecordingTimeline.test.ts`:

- [ ] Test onUpdateEvent prop exists in interface
- [ ] Test numeric value change creates correct updated event
- [ ] Test boolean toggle creates correct updated event
- [ ] Test value editor shows correct min/max/step for each event type
- [ ] Test BPM range is 60-200
- [ ] Test filter range is 100-10000
- [ ] Test reverb/delay/swing range is 0-100
- [ ] Test layer_volume range is 0-100
- [ ] Test layer_mute toggle behavior
- [ ] Test layer_solo toggle behavior
- [ ] Test onUpdateEvent is called with updated event object
- [ ] Test value editor only shows when event is selected

#### Docs to Update

None required - this is internal UI functionality.

---

## Work Log

### 2026-01-25 20:13 - Triage Complete

- **Dependencies**: ✅ `003-011-record-mode` is marked done and explicitly deferred value editing to this task
- **Task clarity**: Clear - acceptance criteria are specific and testable
- **Ready to proceed**: Yes

**Notes from code review**:

- `RecordingTimeline.tsx` already has `onSelectEvent` callback and displays selected event details
- Current UI shows event info + delete button, but no value editor
- Types support `newValue: number | boolean` - need different UI for each
- Numeric values: BPM (40-200), filter (0-100), reverb (0-100), delay (0-100), swing (0-100)
- Boolean values: layer_mute, layer_solo
- Will need to add `onUpdateEvent` callback to RecordingTimeline props
- Parent component (studio page) needs to wire up the update handler

### 2026-01-25 20:25 - Implementation Complete

- Completed: Added value editor UI to RecordingTimeline
- Files modified:
  - `components/studio/RecordingTimeline.tsx` - Added onUpdateEvent prop, getEventValueConfig helper, value editor UI
  - `app/studio/page.tsx` - Wired up onUpdateEvent handler with database persistence
- Commit: 0b4fef9
- Quality check: pass (TypeScript compiles, Prettier formatted)
- Next: Testing phase

**Implementation details**:

- Added `onUpdateEvent?: (event: RecordingEvent) => void` prop to RecordingTimelineProps
- Created `getEventValueConfig()` helper to return min/max/step/unit for each event type
- Uses TWEAK_PARAMS from lib/types/tweaks.ts for tweak parameter ranges
- Slider UI for numeric values (BPM, filter, reverb, delay, swing, volume)
- Toggle button for boolean values (mute, solo)
- Styled slider with cyan accent color to match existing UI
- Parent handler updates local state and persists to database

---

## Testing Evidence

### 2026-01-25 20:20 - Testing Complete

Tests written:

- `components/studio/__tests__/RecordingTimeline.test.ts` - 29 new tests added (72 total in file)

New test suites added:

- `onUpdateEvent prop` - 2 tests: callback acceptance, called with updated event
- `getEventValueConfig` - 18 tests:
  - BPM tweak events: min/max/step/isBoolean (4 tests)
  - Filter tweak events: min/max/step/unit (4 tests)
  - Reverb tweak events: range 0-100 (1 test)
  - Delay tweak events: range 0-100 (1 test)
  - Swing tweak events: range 0-100 (1 test)
  - layer_volume events: range/unit/isBoolean (3 tests)
  - layer_mute events: isBoolean/range (2 tests)
  - layer_solo events: isBoolean/range (2 tests)
- `numeric value change behavior` - 2 tests: create updated event, preserve properties
- `boolean toggle behavior` - 4 tests: mute on/off, solo on/off
- `value editor visibility` - 3 tests: show when selected, hide when not selected/interactive

Test results:

- Total: 2048 examples, 0 failures (up from 2019)
- New tests: 29 passed
- Coverage: All value editing functionality covered

Quality gates:

- ESLint: pass (warnings are pre-existing, unrelated to this task)
- TypeScript: pass
- Prettier: pass (task .md files have pre-existing format issues)
- Vitest: pass (2048/2048)

### 2026-01-25 20:25 - Review Complete

Code review:

- Issues found: none
- Code follows project conventions (TypeScript, Tailwind, React patterns)
- No security vulnerabilities (no user input injection risks)
- No N+1 queries (single API call for persistence)
- Error handling appropriate (optional chaining, null checks)
- No orphaned code

Consistency:

- All criteria met: yes (9/9 checked)
- Test coverage adequate: yes (29 new tests, 72 total in file)
- Docs in sync: yes (inline code comments comprehensive)

Follow-up tasks created: none needed

- Implementation is clean and complete
- No technical debt introduced

Final status: COMPLETE

---

### 2026-01-25 20:22 - Documentation Sync

Docs updated:

- None required - this is internal UI functionality (per plan)
- Inline code comments already present and comprehensive

Code documentation verified:

- `components/studio/RecordingTimeline.tsx` - JSDoc on interfaces and helpers (`EventValueConfig`, `getEventValueConfig`)
- `lib/types/recording.ts` - Full JSDoc coverage on all types and functions

Annotations:

- N/A (Node.js project, not Rails)

Consistency checks:

- [x] Code matches docs - README.md describes studio features at appropriate high level
- [x] No broken links - verified markdown files in root
- [x] Schema annotations current - N/A (no Rails models)

### 2026-01-25 20:26 - Verification Complete

Task location: done/
Status field: matches (done)
Acceptance criteria: 9/9 checked

Issues found:

- none

Actions taken:

- Verified task file already in done/ with correct status
- Confirmed all acceptance criteria implemented (code verified via grep)
- Confirmed implementation commits exist (0b4fef9, 8dca49b)
- Committed task file move to done/

Task verified: PASS

---

## Notes

- Consider UX: inline vs modal editing
- BPM values need different range than filter/reverb (0-100%)
- Boolean values could use a simple toggle
- Value editor uses TWEAK_PARAMS from lib/types/tweaks.ts for consistent parameter ranges
- Slider UI styled with cyan accent to match existing TweakSlider pattern

---

## Links

**Dependencies:**

- `003-011-record-mode` (completed) - provides base recording infrastructure

**Related Files:**

- `components/studio/RecordingTimeline.tsx` - timeline component with value editing
- `lib/types/recording.ts` - RecordingEvent type
- `lib/types/tweaks.ts` - TWEAK_PARAMS used for slider ranges
- `app/studio/page.tsx` - parent component with onUpdateEvent handler
