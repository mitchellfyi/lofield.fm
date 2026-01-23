# Task: Multi-Track Support with Mute/Solo

## Metadata

| Field       | Value                         |
| ----------- | ----------------------------- |
| ID          | `003-007-multi-track-support` |
| Status      | `todo`                        |
| Priority    | `003` Medium                  |
| Created     | `2026-01-23 12:00`            |
| Started     |                               |
| Completed   |                               |
| Blocked By  |                               |
| Blocks      |                               |
| Assigned To |                               |
| Assigned At |                               |

---

## Context

Real music production uses multiple tracks (drums, bass, melody, etc.). Users should be able to create and manage separate layers with independent mute/solo controls.

- Current: single code block = single track
- Need: multiple named tracks that play together
- Each track: separate code, mute/solo/volume
- Chat can target specific track

---

## Acceptance Criteria

- [ ] Track list UI showing all tracks
- [ ] Add/remove/rename tracks
- [ ] Each track has: name, code, mute, solo, volume
- [ ] Mute: silences track
- [ ] Solo: only play solo'd tracks
- [ ] Volume: per-track gain
- [ ] Tracks combine using Strudel's stack()
- [ ] Chat can reference track by name ("make the drums faster")
- [ ] Visual track indicators (playing, muted, etc.)
- [ ] Drag to reorder tracks
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Define track data structure**
   - Files: `types/track.ts`
   - Track: id, name, code, muted, soloed, volume

2. **Create track list component**
   - Files: `components/tracks/track-list.tsx`
   - List with controls per track
   - Add/remove/rename

3. **Create track row component**
   - Files: `components/tracks/track-row.tsx`
   - Mute/solo/volume controls
   - Playing indicator
   - Code preview

4. **Update code execution**
   - Files: `app/strudel/page.tsx`
   - Combine tracks with stack()
   - Apply mute/solo/volume
   - Handle solo logic (solo = mute others)

5. **Update chat to support track context**
   - Files: `app/api/chat/route.ts`
   - Include all track codes in context
   - AI can reference/modify specific tracks

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- Default tracks: drums, bass, melody
- Consider color-coding tracks
- May need track-specific chat sessions

---

## Links

- Strudel stack() documentation
