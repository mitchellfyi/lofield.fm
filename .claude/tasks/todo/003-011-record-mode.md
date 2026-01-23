# Task: Record Mode - Capture Live Performance Changes

## Metadata

| Field       | Value                                         |
| ----------- | --------------------------------------------- |
| ID          | `003-011-record-mode`                         |
| Status      | `todo`                                        |
| Priority    | `003` Medium                                  |
| Created     | `2026-01-23 12:30`                            |
| Started     |                                               |
| Completed   |                                               |
| Blocked By  | `003-001-save-tracks-db`, `003-006-tweaks-ux` |
| Blocks      |                                               |
| Assigned To |                                               |
| Assigned At |                                               |

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

1. **Design recording data structure**
   - Files: `types/recording.ts`
   - Recording: id, track_id, duration, events[]
   - Event: timestamp_ms, type, param, value, previous_value

2. **Create recording state manager**
   - Files: `hooks/use-recording.ts`
   - Start/stop recording
   - Capture events with timestamps
   - Sync with audio playback position

3. **Integrate with tweaks panel**
   - Files: `components/tweaks/tweaks-panel.tsx`
   - Emit events on parameter changes
   - Only capture when recording active

4. **Create timeline visualization**
   - Files: `components/recording/timeline.tsx`
   - Horizontal timeline with event markers
   - Zoom/pan controls
   - Click to edit event

5. **Implement playback mode**
   - Files: `hooks/use-recording-playback.ts`
   - Sync events with audio time
   - Apply parameter changes at correct timestamps

6. **Add database schema**
   - Files: `supabase/migrations/006_recordings.sql`
   - Recordings table linked to tracks
   - Events stored as JSONB

7. **Implement export options**
   - Files: `lib/recording-export.ts`
   - Render audio with automation applied
   - Export JSON for external tools

8. **Add streaming architecture**
   - Consider WebSocket or Server-Sent Events
   - Real-time sync for collaborative features (future)

---

## Work Log

(To be filled during execution)

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
