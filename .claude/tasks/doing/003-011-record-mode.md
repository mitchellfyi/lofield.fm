# Task: Record Mode - Capture Live Performance Changes

## Metadata

| Field       | Value                                         |
| ----------- | --------------------------------------------- |
| ID          | `003-011-record-mode`                         |
| Status      | `doing`                                       |
| Priority    | `003` Medium                                  |
| Created     | `2026-01-23 12:30`                            |
| Started     | `2026-01-24 17:19`                            |
| Completed   |                                               |
| Blocked By  | `003-001-save-tracks-db`, `003-006-tweaks-ux` |
| Blocks      |                                               |
| Assigned To | `worker-1` |
| Assigned At | `2026-01-24 17:19` |

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

### Implementation Plan (Generated 2026-01-24)

#### Gap Analysis

| Criterion | Status | Gap |
|-----------|--------|-----|
| "Record" button that starts capturing changes while playing | **MISSING** | Need RecordButton component, recording state hook |
| Visual recording indicator (red dot, timer) | **MISSING** | Part of RecordButton, need timer state |
| Captures: timestamp, parameter changed, old value, new value | **MISSING** | Need Recording type, capture logic in TweaksPanel |
| Timeline visualization showing recorded changes | **MISSING** | Need RecordingTimeline component with event markers |
| Playback mode: replays changes in sync with audio | **MISSING** | Need useRecordingPlayback hook, sync with TransportState |
| Edit recorded automation (delete points, adjust values) | **MISSING** | Timeline click-to-select, edit modal or inline editing |
| Save recording to database with track | **MISSING** | Need 006_recordings.sql migration, useRecordings hook |
| Export as rendered audio (changes baked in) | **PARTIAL** | audioExport.ts exists, need to apply automation during render |
| Export as JSON automation data | **MISSING** | Need recordingExport.ts with JSON export |
| Export as video (screen capture) | **FUTURE** | Out of scope for initial implementation |
| Streaming architecture for real-time capture | **MISSING** | Design now, implement via RAF polling pattern used by VisualizationBridge |
| Tests written and passing | **MISSING** | Need unit tests for hooks, component tests |
| Quality gates pass | **PENDING** | Run after implementation |
| Changes committed with task reference | **PENDING** | Commit after completion |

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
     type: 'tweak' | 'layer_mute' | 'layer_volume' | 'layer_solo';
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

---

## Testing Evidence

(To be filled during execution)

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
