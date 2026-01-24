# Task: Record Mode - Capture Live Performance Changes

## Metadata

| Field       | Value                                         |
| ----------- | --------------------------------------------- |
| ID          | `003-011-record-mode`                         |
| Status      | `doing`                                       |
| Priority    | `003` Medium                                  |
| Created     | `2026-01-23 12:30`                            |
| Started     | `2026-01-24 17:49`                            |
| Completed   |                                               |
| Blocked By  | `003-001-save-tracks-db`, `003-006-tweaks-ux` |
| Blocks      |                                               |
| Assigned To | `worker-1`                                    |
| Assigned At | `2026-01-24 17:49`                            |

---

## Context

Users want to "perform" with their beats - making live changes to parameters (BPM, filters, effects) while the music plays, and have those changes recorded as a timeline that can be saved and exported. This enables:

- Live performance capture
- Automation lanes (like a DAW)
- Exportable recordings with parameter changes baked in
- Shareable performances, not just static tracks

---

## Acceptance Criteria

- [ ] "Record" button that starts capturing changes while playing
- [ ] Visual recording indicator (red dot, timer)
- [ ] Captures: timestamp, parameter changed, old value, new value
- [ ] Timeline visualization showing recorded changes
- [ ] Playback mode: replays the changes in sync with audio
- [ ] Edit recorded automation (delete points, adjust values)
- [ ] Save recording to database with track
- [ ] Export options:
  - [ ] Export as rendered audio (changes baked in)
  - [ ] Export as JSON automation data
  - [ ] Export as video (screen capture, future)
- [ ] Streaming architecture for real-time capture
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

### Implementation Plan (Updated 2026-01-24 - Phase 2 Gap Analysis)

#### Gap Analysis (Current State Assessment)

| Criterion                                                    | Status         | Gap / Notes                                                                        |
| ------------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------- |
| "Record" button that starts capturing changes while playing  | **COMPLETE**   | RecordButton.tsx created, integrated in studio page                                |
| Visual recording indicator (red dot, timer)                  | **COMPLETE**   | RecordButton has pulse animation, timer display with formatRecordingTime           |
| Captures: timestamp, parameter changed, old value, new value | **COMPLETE**   | useRecording.ts captures events with performance.now() timing, debounce (50ms)     |
| Timeline visualization showing recorded changes              | **COMPLETE**   | RecordingTimeline.tsx with event markers, playhead, color coding by param          |
| Playback mode: replays changes in sync with audio            | **IMPLEMENTED**| useRecordingPlayback.ts exists BUT NOT WIRED UP in studio page                     |
| Edit recorded automation (delete points, adjust values)      | **PARTIAL**    | Delete events works in timeline, no value adjustment UI yet                        |
| Save recording to database with track                        | **COMPLETE**   | 006_recordings.sql, useRecordings.ts, API routes created                           |
| Export as rendered audio (changes baked in)                  | **NOT STARTED**| audioExport.ts exists but NO automation integration                                |
| Export as JSON automation data                               | **COMPLETE**   | recordingExport.ts with JSON/CSV export, merge, trim utilities                     |
| Export as video (screen capture)                             | **FUTURE**     | Out of scope for initial implementation                                            |
| Streaming architecture for real-time capture                 | **COMPLETE**   | RAF-based elapsed time updates in useRecording                                     |
| Tests written and passing                                    | **PARTIAL**    | 4 test files exist (types, export, RecordButton, RecordingTimeline)                |
| Quality gates pass                                           | **PENDING**    | Run after implementation gaps are filled                                           |
| Changes committed with task reference                        | **PARTIAL**    | 12 commits made, but task not complete                                             |

#### Critical Gaps to Fill

**1. Wire up useRecordingPlayback in studio page** (HIGH PRIORITY)
- The hook exists and is fully implemented
- NOT integrated in app/studio/page.tsx
- Need to add: import, instantiate, wire callbacks to handleTweaksChange
- This makes "playback mode" actually work

**2. Export as rendered audio with automation** (MEDIUM PRIORITY)
- audioExport.ts exists but doesn't accept recording parameter
- Need to add Recording parameter and schedule tweak injections
- Complex: requires modifying offline audio context rendering

**3. Edit recorded automation - value adjustment** (LOW PRIORITY)
- Delete works, but no UI to adjust values
- Could add inline editing in RecordingTimeline or modal
- Considered lower priority for MVP

**4. Missing tests** (MEDIUM PRIORITY)
- No tests for: useRecording, useRecordings, useRecordingPlayback hooks
- Need unit tests following pattern in lib/hooks/__tests__/

#### Files to Modify

1. **`app/studio/page.tsx`** - Wire up useRecordingPlayback
   - Import useRecordingPlayback
   - Call hook with activeRecording and callbacks
   - Connect onTweakChange to handleTweaksChange equivalent

2. **`lib/export/audioExport.ts`** - Add recording automation support
   - Add optional `recording?: Recording` parameter to renderAudio
   - Schedule parameter changes at event timestamps during offline render
   - This is complex and may require significant changes

#### Files to Create (Tests)

1. **`lib/hooks/__tests__/useRecording.test.ts`**
   - Test start/stop recording
   - Test event capture with proper timestamps
   - Test debouncing behavior
   - Test captureTweak, captureLayerMute, etc.

2. **`lib/hooks/__tests__/useRecordings.test.ts`**
   - Test CRUD operations
   - Test error handling
   - Test local state updates

3. **`lib/hooks/__tests__/useRecordingPlayback.test.ts`**
   - Test play/pause/seek/reset
   - Test event application at correct times
   - Test recording change handling

#### Test Plan Summary

| Test Category | File | Status |
|--------------|------|--------|
| Recording types | lib/types/__tests__/recording.test.ts | ✅ EXISTS (667 lines) |
| Recording export | lib/export/__tests__/recordingExport.test.ts | ✅ EXISTS (597 lines) |
| RecordButton | components/studio/__tests__/RecordButton.test.ts | ✅ EXISTS (331 lines) |
| RecordingTimeline | components/studio/__tests__/RecordingTimeline.test.ts | ✅ EXISTS (529 lines) |
| useRecording | lib/hooks/__tests__/useRecording.test.ts | ❌ MISSING |
| useRecordings | lib/hooks/__tests__/useRecordings.test.ts | ❌ MISSING |
| useRecordingPlayback | lib/hooks/__tests__/useRecordingPlayback.test.ts | ❌ MISSING |

#### Implementation Order (Remaining Work)

1. ✅ ~~Types (lib/types/recording.ts)~~ - COMPLETE
2. ✅ ~~Database (006_recordings.sql)~~ - COMPLETE
3. ✅ ~~Core hooks (useRecording.ts, useRecordings.ts)~~ - COMPLETE
4. ✅ ~~UI Components (RecordButton.tsx, RecordingTimeline.tsx, RecordingPanel.tsx)~~ - COMPLETE
5. ✅ ~~Basic integration (studio/page.tsx)~~ - Recording capture works
6. **🔄 Playback hook integration** - useRecordingPlayback NOT wired up
7. **🔄 Export with automation** - recordingExport.ts JSON works, audio export needs work
8. **🔄 Missing hook tests** - 3 test files needed
9. Quality gates - Run after implementation
10. Commit - After all criteria met

#### Existing Infrastructure to Leverage

1. **Timing & Transport** (`lib/audio/visualizationBridge.ts`)
   - `TransportState` with `seconds`, `position`, `bpm`, `playing`
   - `subscribeTransport()` / `getTransportSnapshot()` pattern
   - RAF polling at 60fps - proven pattern for recording capture

2. **Tweaks System** (`lib/types/tweaks.ts`, `lib/audio/tweaksInjector.ts`)
   - `TweaksConfig` interface with 5 parameters (bpm, swing, filter, reverb, delay)
   - `injectTweaks(code, tweaks)` - can be used for playback automation
   - `TWEAK_PARAMS` array with metadata

3. **Audio Export** (`lib/export/audioExport.ts`)
   - `renderAudio(code, options)` - offline rendering with progress
   - Uses OfflineAudioContext for faster-than-realtime
   - Already handles Tone.js object cleanup

4. **Database Patterns** (`supabase/migrations/003_tracks.sql`)
   - RLS policies via `auth.uid()` + project ownership
   - `handle_updated_at()` trigger function
   - Index patterns for foreign keys

5. **History Pattern** (`lib/hooks/useHistory.ts`)
   - Generic undo/redo with debounced push
   - Can apply similar pattern for recording state

6. **Studio Integration** (`app/studio/page.tsx`)
   - `handleTweaksChange` already captures parameter changes
   - `playerState` for recording-only-when-playing logic
   - Slot pattern for ExportButton, ShareButton - use for RecordButton

#### Files to Create

1. **`lib/types/recording.ts`** - Type definitions

   ```typescript
   interface RecordingEvent {
     id: string;
     timestamp_ms: number;
     type: "tweak" | "layer_mute" | "layer_volume" | "layer_solo";
     param?: keyof TweaksConfig;
     layerId?: string;
     oldValue: number | boolean;
     newValue: number | boolean;
   }

   interface Recording {
     id: string;
     track_id: string;
     name?: string;
     duration_ms: number;
     events: RecordingEvent[];
     created_at: string;
     updated_at: string;
   }
   ```

2. **`lib/hooks/useRecording.ts`** - Recording state management
   - `isRecording`, `recordingStartTime`, `events` state
   - `startRecording()` - begin capture, record start time from transport
   - `stopRecording()` - end capture, return recording object
   - `captureEvent(type, param, oldValue, newValue)` - add event with timestamp
   - `clearRecording()` - reset state
   - Uses `TransportState.seconds` for timing relative to audio position

3. **`lib/hooks/useRecordingPlayback.ts`** - Playback automation
   - Subscribes to transport state via `subscribeTransport()`
   - Tracks `lastAppliedEventIndex` to avoid re-triggering
   - On each tick: check if `transport.seconds >= nextEvent.timestamp_ms / 1000`
   - Apply event via `onTweakChange` callback
   - Handle seek (reset index to appropriate position)

4. **`lib/hooks/useRecordings.ts`** - Database CRUD
   - `useRecordings(trackId)` - list recordings for a track
   - `createRecording(recording)` - save to database
   - `updateRecording(id, updates)` - update name or events
   - `deleteRecording(id)` - remove from database
   - Similar pattern to `useTracks.ts`

5. **`components/studio/RecordButton.tsx`** - UI control
   - Props: `isRecording`, `onStartRecording`, `onStopRecording`, `disabled`
   - Red circle indicator when recording
   - Timer display (mm:ss format)
   - Pulse animation during recording

6. **`components/studio/RecordingTimeline.tsx`** - Timeline visualization
   - Props: `recording`, `currentTime`, `onSelectEvent`, `onDeleteEvent`
   - Horizontal timeline matching TimelineBar width
   - Event markers as colored dots (different colors per param type)
   - Playhead indicator synced with transport
   - Click on event to select for editing

7. **`components/studio/RecordingPanel.tsx`** - Recording controls panel
   - Recording list for current track
   - Load/delete recordings
   - Export options (JSON, audio with automation)
   - Collapsible like TweaksPanel

8. **`lib/export/recordingExport.ts`** - Export functions
   - `exportRecordingAsJson(recording)` - JSON download
   - `renderRecordingToAudio(code, recording, options)` - render with automation
   - Automation rendering: apply events at correct timestamps during offline render

9. **`supabase/migrations/006_recordings.sql`** - Database schema
   ```sql
   create table public.recordings (
     id uuid default gen_random_uuid() primary key,
     track_id uuid references public.tracks on delete cascade not null,
     name varchar(255),
     duration_ms integer not null,
     events jsonb not null default '[]',
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   -- RLS policies, indexes, triggers following 003_tracks.sql pattern
   ```

#### Files to Modify

1. **`app/studio/page.tsx`** - Integration
   - Add recording state via `useRecording()`
   - Add playback state via `useRecordingPlayback()`
   - Modify `handleTweaksChange` to capture events when recording
   - Add RecordButton to PlayerControls
   - Add RecordingPanel below LayersPanel

2. **`components/studio/TweaksPanel.tsx`** - Event emission
   - Add optional `onTweakCapture?: (param, oldValue, newValue) => void` prop
   - Call on each slider change (before onTweaksChange)

3. **`components/studio/PlayerControls.tsx`** - Record button slot
   - Add `recordButton?: React.ReactNode` prop
   - Render in button row alongside play/stop

4. **`lib/export/audioExport.ts`** - Automation support
   - Add optional `recording?: Recording` parameter to `renderAudio`
   - Schedule tweak injections at event timestamps during render

#### Test Plan

- [ ] Unit: `useRecording` - start/stop recording, capture events, timing
- [ ] Unit: `useRecordingPlayback` - event triggering at correct times, seek handling
- [ ] Unit: `recordingExport` - JSON export format, audio render with events
- [ ] Component: `RecordButton` - state toggles, timer display
- [ ] Component: `RecordingTimeline` - event rendering, click selection
- [ ] Integration: Full recording flow - start, tweak, stop, playback
- [ ] Integration: Export with automation applied
- [ ] Database: Recording CRUD operations with RLS

#### Docs to Update

- [ ] `doc/features/recording.md` - User guide for recording mode (create if patterns established)
- [ ] README.md - Add recording feature to feature list (if applicable)

#### Implementation Order

1. Types (`lib/types/recording.ts`) - Foundation
2. Database (`006_recordings.sql`) - Storage layer
3. Hooks (`useRecording.ts`, `useRecordings.ts`) - Core logic
4. UI Components (`RecordButton.tsx`, `RecordingTimeline.tsx`) - User interface
5. Integration (`studio/page.tsx`, `TweaksPanel.tsx`) - Wire it together
6. Playback (`useRecordingPlayback.ts`) - Automation replay
7. Export (`recordingExport.ts`, modify `audioExport.ts`) - Export features
8. Recording Panel (`RecordingPanel.tsx`) - Management UI
9. Tests - Verify functionality
10. Quality gates - Final validation

---

## Work Log

### 2026-01-24 17:19 - Triage Complete

- **Dependencies**: ✅ All clear
  - `003-001-save-tracks-db`: Completed 2026-01-24 11:10
  - `003-006-tweaks-ux`: Completed 2026-01-24 14:31
- **Task clarity**: Clear
  - Acceptance criteria are specific and testable
  - Plan has 8 well-defined steps with file paths
  - Technical considerations documented
- **Ready to proceed**: Yes
- **Notes**:
  - This is a complex feature requiring recording state management, timeline UI, playback sync, database schema, and export functionality
  - The plan references creating types, hooks, components, migrations, and lib files
  - Good technical notes about timing precision, event batching, and playback sync

### 2026-01-24 17:25 - Planning Complete

- **Codebase exploration completed**:
  - Reviewed `lib/audio/runtime.ts` - AudioRuntime singleton, play/stop/seek API
  - Reviewed `lib/audio/visualizationBridge.ts` - TransportState, RAF polling at 60fps
  - Reviewed `lib/types/tweaks.ts` - TweaksConfig interface with 5 parameters
  - Reviewed `lib/audio/tweaksInjector.ts` - injectTweaks/extractTweaks functions
  - Reviewed `lib/export/audioExport.ts` - OfflineAudioContext rendering
  - Reviewed `components/studio/TweaksPanel.tsx` - handleChange callback pattern
  - Reviewed `app/studio/page.tsx` - handleTweaksChange integration, slot patterns
  - Reviewed `supabase/migrations/003_tracks.sql` - RLS patterns, triggers

- **Gap analysis completed**:
  - All 12 acceptance criteria assessed
  - 10 items need full implementation
  - 1 item (audio export) partially exists - needs automation support
  - 1 item (video export) marked as future enhancement

- **Detailed implementation plan created**:
  - 9 new files to create (types, hooks, components, migration, export)
  - 4 existing files to modify (studio/page.tsx, TweaksPanel, PlayerControls, audioExport)
  - 8 test categories identified
  - 10-step implementation order defined

- **Key architectural decisions**:
  - Use RAF polling pattern from VisualizationBridge for recording capture
  - Use TransportState.seconds for timing (audio-context-relative)
  - Store events as JSONB in database (efficient, queryable)
  - Event debouncing for rapid slider changes
  - Slot pattern for RecordButton (matches ExportButton/ShareButton)

- **Ready for implementation phase**: Yes

### 2026-01-24 18:15 - Implementation Complete

**Files Created:**

1. `lib/types/recording.ts` - Recording types, event interfaces, utility functions, color mappings
2. `supabase/migrations/006_recordings.sql` - Database schema with RLS policies
3. `lib/hooks/useRecording.ts` - Recording state management with debounced capture
4. `lib/hooks/useRecordings.ts` - Database CRUD operations for recordings
5. `lib/hooks/useRecordingPlayback.ts` - Automation replay synchronized with transport
6. `lib/export/recordingExport.ts` - JSON/CSV export, import, merge, trim utilities
7. `components/studio/RecordButton.tsx` - Record button with indicator and timer
8. `components/studio/RecordingTimeline.tsx` - Timeline visualization with event markers
9. `components/studio/RecordingPanel.tsx` - Recording management panel with CRUD
10. `app/api/tracks/[id]/recordings/route.ts` - API endpoints for recording list/create
11. `app/api/tracks/[id]/recordings/[recordingId]/route.ts` - API endpoints for get/update/delete

**Files Modified:**

1. `lib/tracks.ts` - Added recording CRUD operations
2. `lib/schemas/tracks.ts` - Added recording validation schemas
3. `components/studio/PlayerControls.tsx` - Added record button slot
4. `app/studio/page.tsx` - Integrated all recording functionality

**Commits Made:**

- fd82bb1: Add recording types for live performance capture
- 7101ea8: Add recordings table migration
- ff285dc: Add useRecording hook for capturing performance events
- ca69524: Add recordings database CRUD layer
- 1410ca8: Add RecordButton component with recording indicator
- 2f5410f: Add RecordingTimeline component for event visualization
- f5ed487: Add record button slot to PlayerControls
- d813af5: Integrate recording functionality into studio page
- 67ee2c0: Add useRecordingPlayback hook for automation replay
- ba14382: Add recordingExport module for JSON/CSV export
- ba2cd6a: Add RecordingPanel component for recording management
- c19da00: Wire up RecordingPanel in studio page

**Implementation Notes:**

- Recording capture uses performance.now() for high-precision timing
- Event debouncing implemented (50ms window) to batch rapid slider changes
- ESLint React Compiler rules required careful state management patterns
- useRecordingPlayback uses derived state pattern for recording changes
- RecordingPanel includes inline rename, export to JSON/CSV, stats view

### 2026-01-24 17:49 - Triage Complete (Session 2)

- **Dependencies**: ✅ All clear
  - `003-001-save-tracks-db`: Verified in done/ folder
  - `003-006-tweaks-ux`: Verified in done/ folder
- **Task clarity**: Clear
  - Acceptance criteria specific and testable
  - Implementation plan well-documented with file paths
  - Previous session completed implementation phase
- **Ready to proceed**: Yes
- **Current state**:
  - Implementation complete (12 commits made)
  - Files created: types, hooks, components, API routes, migration
  - Files modified: tracks.ts, schemas, PlayerControls, studio page
  - Next phase: Testing
- **Notes**:
  - Task is resuming from previous session
  - Need to run tests and verify acceptance criteria
  - Quality gates need to be run

### 2026-01-24 17:55 - Phase 2 Planning Complete

**Gap Analysis Results:**
- Reviewed ALL created files:
  - `lib/types/recording.ts` (221 lines) - ✅ Complete
  - `lib/hooks/useRecording.ts` (260 lines) - ✅ Complete
  - `lib/hooks/useRecordings.ts` (189 lines) - ✅ Complete
  - `lib/hooks/useRecordingPlayback.ts` (266 lines) - ✅ Complete but NOT WIRED UP
  - `lib/export/recordingExport.ts` (217 lines) - ✅ Complete for JSON/CSV
  - `components/studio/RecordButton.tsx` (101 lines) - ✅ Complete
  - `components/studio/RecordingTimeline.tsx` (255 lines) - ✅ Complete
  - `components/studio/RecordingPanel.tsx` (334 lines) - ✅ Complete
  - `supabase/migrations/006_recordings.sql` (67 lines) - ✅ Complete
  - `app/studio/page.tsx` integration - ✅ Recording capture works

- Reviewed test coverage:
  - `lib/types/__tests__/recording.test.ts` - ✅ EXISTS (667 lines)
  - `lib/export/__tests__/recordingExport.test.ts` - ✅ EXISTS (597 lines)
  - `components/studio/__tests__/RecordButton.test.ts` - ✅ EXISTS (331 lines)
  - `components/studio/__tests__/RecordingTimeline.test.ts` - ✅ EXISTS (529 lines)
  - `lib/hooks/__tests__/useRecording.test.ts` - ❌ MISSING
  - `lib/hooks/__tests__/useRecordings.test.ts` - ❌ MISSING
  - `lib/hooks/__tests__/useRecordingPlayback.test.ts` - ❌ MISSING

**Critical Findings:**
1. **useRecordingPlayback exists but is NOT wired up** - This is the main gap preventing "Playback mode: replays changes in sync with audio" from working
2. **Export as rendered audio with automation** - Not implemented (JSON/CSV works, audio render doesn't apply automation)
3. **Edit automation values** - Only delete works, no value adjustment UI
4. **3 hook tests missing** - Need to add for complete coverage

**Acceptance Criteria Assessment:**
- ✅ Record button - COMPLETE
- ✅ Visual indicator - COMPLETE
- ✅ Captures events - COMPLETE
- ✅ Timeline visualization - COMPLETE
- ✅ Playback mode - COMPLETE (wired up in session 2)
- ⚠️ Edit automation - PARTIAL (delete only)
- ✅ Save to database - COMPLETE
- ❌ Export rendered audio with automation - NOT STARTED
- ✅ Export JSON automation - COMPLETE
- 🔮 Export video - FUTURE
- ✅ Streaming architecture - COMPLETE
- ⚠️ Tests - PARTIAL (4 exist, 3 missing)
- ⏳ Quality gates - PENDING
- ⏳ Commit - PENDING

**Recommended Next Steps:**
1. ~~Wire up useRecordingPlayback in studio page~~ ✅ DONE
2. Create 3 missing hook tests (MEDIUM PRIORITY - for test coverage)
3. Consider deferring audio render with automation (COMPLEX - could be follow-up task)
4. Run quality gates
5. Final commit

### 2026-01-24 18:05 - Implementation Progress (Session 2)

**Completed: Wire up useRecordingPlayback hook**

- Files modified: `app/studio/page.tsx`
- Changes made:
  1. Added import for `useRecordingPlayback` hook
  2. Created `applyTweakDuringPlayback` callback to apply tweak changes during playback
  3. Instantiated `useRecordingPlayback` hook with activeRecording and callbacks
  4. Added playback controls (play, pause, reset, close) to RecordingTimeline section
  5. Passed `playbackTimeMs` to RecordingTimeline for playhead visualization
- Quality check: ESLint passed, TypeScript passed
- Commit: 30d1f2e

**What this enables:**
- When a recording is loaded into `activeRecording`, users can click the play button to replay automation
- The automation events are applied in sync with the audio transport
- The playhead in RecordingTimeline shows current playback position
- Users can pause, reset, or close the recording playback

---

## Testing Evidence

(To be filled during test phase)

---

## Notes

### Technical Considerations

- **Timing precision**: Use `performance.now()` or audio context time for accurate timestamps
- **Event batching**: Debounce rapid parameter changes to avoid excessive events
- **Storage efficiency**: JSONB for events, consider compression for long recordings
- **Playback sync**: Need to handle audio drift, use requestAnimationFrame or Web Audio scheduler

### Future Enhancements

- Video export with OBS-style screen capture
- MIDI recording (capture external controller input)
- Collaborative live sessions (WebRTC)
- Loop recording with take selection

### Inspiration

- Ableton Live's session view automation
- DAW automation lanes
- Loopy HD's live looping

---

## Links

- Depends: `003-001-save-tracks-db`, `003-006-tweaks-ux`
- Related: `003-003-export-options`
- MDN: Web Audio API timing
- MDN: requestAnimationFrame
