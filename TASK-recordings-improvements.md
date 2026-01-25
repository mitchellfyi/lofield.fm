# Task: Improve Recording System UX and Features

## Overview

Enhance the recording system to make it more useful, discoverable, and properly integrated with tracks. Currently, recordings capture parameter automation (tweak changes over time) and can be saved to tracks, but the UX around this is unclear and some features are missing.

## Current State Analysis

### What Exists

- **Recording capture**: Records parameter tweaks (BPM, filter, reverb, etc.) and layer changes (mute, solo, volume) during playback
- **Database storage**: Recordings table with full CRUD via API (`/api/tracks/[id]/recordings/`)
- **RecordingPanel component**: Lists recordings with load, rename, delete, export (JSON/CSV), and stats
- **RecordingTimeline component**: Visual timeline showing recorded events
- **Export**: JSON and CSV export of recording data (automation events only)

### Current Issues

1. **Discoverability**: RecordingPanel only shows when recordings exist - users don't know where recordings will appear
2. **Unsaved track problem**: If you record without a saved track, recording stays in memory only and shows "Save track to persist" toast - easy to lose work
3. **No audio export**: Can only export automation data (JSON/CSV), not rendered audio with automation applied
4. **Unclear relationship**: Users may not understand that recordings are automation data attached to tracks, not separate audio files
5. **No standalone recordings**: Must have a saved track first to persist recordings

## Proposed Improvements

### Phase 1: UX Clarity (High Priority)

#### 1.1 Always Show Recording Panel

- Show RecordingPanel even when empty with helpful empty state
- Empty state should explain what recordings are and how to create one
- Add visual indicator when recording is in progress

**Files to modify:**

- `app/studio/page.tsx` - Remove `recordings.length > 0` condition
- `components/studio/RecordingPanel.tsx` - Add empty state UI

#### 1.2 Better Save Flow for Unsaved Tracks

When user stops recording without a saved track:

- Show modal prompting to save track now (to persist recording)
- Option to "Save Track & Recording" in one action
- Clear warning that recording will be lost on refresh

**Files to modify:**

- `app/studio/page.tsx` - Modify `handleStopRecording`
- Create new `SaveRecordingPrompt.tsx` modal component

#### 1.3 Recording Status Indicator

- Show persistent indicator when recording is active (beyond just the record button)
- Show indicator when unsaved recording exists in memory
- Toast or banner: "You have an unsaved recording - save track to keep it"

**Files to modify:**

- `app/studio/page.tsx`
- `components/studio/TopBar.tsx` or new status component

### Phase 2: Audio Export (Medium Priority)

#### 2.1 Render Recording to Audio

Add ability to export a recording as rendered audio (WAV/MP3):

1. Play the track with automation applied
2. Capture audio output using Web Audio API
3. Encode to WAV/MP3
4. Provide download

**New files:**

- `lib/export/recordingAudioExport.ts` - Audio rendering logic
- Modify `components/studio/RecordingPanel.tsx` - Add "Export Audio" button

**Technical approach:**

- Use OfflineAudioContext for faster-than-realtime rendering
- Apply recorded events programmatically during render
- Reuse existing `wavEncoder.ts` for encoding

#### 2.2 Export Modal for Recordings

Create dedicated export modal for recordings with options:

- Format: WAV, MP3 (if available)
- Quality settings
- Include/exclude certain automation tracks
- Preview before export

**New files:**

- `components/studio/RecordingExportModal.tsx`

### Phase 3: Enhanced Features (Lower Priority)

#### 3.1 Recording Management

- Duplicate recording
- Merge multiple recordings
- Trim recording (set start/end points)
- Split recording at timestamp

#### 3.2 Recording Editing

- Delete individual events from timeline
- Move events in time
- Adjust event values
- Add new events manually

#### 3.3 Recording Templates

- Save recording as reusable template
- Apply template to different tracks
- Share recordings separately from tracks

## Acceptance Criteria

### Phase 1 Complete When:

- [ ] RecordingPanel shows even when empty with helpful explanation
- [ ] Recording to unsaved track prompts user to save
- [ ] Clear visual indication of unsaved recording in memory
- [ ] User understands recording = automation, not audio capture
- [ ] Tests added for new UI flows

### Phase 2 Complete When:

- [ ] Can export recording as rendered WAV audio
- [ ] Export includes all automation applied to base track
- [ ] Export modal with format/quality options
- [ ] Progress indicator during render
- [ ] Tests for audio export functionality

### Phase 3 Complete When:

- [ ] Basic editing operations work (delete event, move event)
- [ ] Can duplicate recordings
- [ ] Timeline supports click-to-edit events

## Technical Notes

### Database Schema (Existing)

```sql
recordings (
  id uuid PRIMARY KEY,
  track_id uuid REFERENCES tracks(id),
  name text,
  duration_ms integer,
  events jsonb, -- Array of RecordingEvent
  created_at timestamp,
  updated_at timestamp
)
```

### Recording Event Structure

```typescript
interface RecordingEvent {
  id: string;
  timestamp_ms: number;
  type: "tweak" | "layer_mute" | "layer_volume" | "layer_solo";
  param?: keyof TweaksConfig; // For tweak events
  layerId?: string; // For layer events
  oldValue: number | boolean;
  newValue: number | boolean;
}
```

### Key Files

- `lib/types/recording.ts` - Type definitions and utilities
- `lib/hooks/useRecording.ts` - Recording capture hook
- `lib/hooks/useRecordings.ts` - CRUD operations hook
- `lib/hooks/useRecordingPlayback.ts` - Playback automation hook
- `components/studio/RecordingPanel.tsx` - Recording list UI
- `components/studio/RecordingTimeline.tsx` - Visual timeline
- `lib/export/recordingExport.ts` - JSON/CSV export
- `app/api/tracks/[id]/recordings/route.ts` - API endpoints

### Dependencies for Audio Export

- Tone.js (already installed) - For OfflineAudioContext rendering
- Existing `lib/export/wavEncoder.ts` - WAV encoding
- Existing `lib/audio/runtime.ts` - Audio runtime for rendering

## Estimated Effort

| Phase   | Effort   | Complexity  |
| ------- | -------- | ----------- |
| Phase 1 | 2-3 days | Low-Medium  |
| Phase 2 | 3-5 days | Medium-High |
| Phase 3 | 5-7 days | High        |

## Open Questions

1. Should recordings be shareable independently of tracks?
2. Should we support MIDI export of automation data?
3. Should recordings have their own privacy settings?
4. Should we support recording audio input (microphone) in addition to automation?

---

**Created:** 2024-01-25
**Priority:** Medium
**Status:** Planned
