# Task: Export Options - Copy Code, Download JS, Render Audio

## Metadata

| Field | Value |
|-------|-------|
| ID | `003-003-export-options` |
| Status | `todo` |
| Priority | `003` Medium |
| Created | `2026-01-23 12:00` |
| Started | |
| Completed | |
| Blocked By | |
| Blocks | |
| Assigned To | |
| Assigned At | |

---

## Context

Users want to export their creations for use outside the app. This includes copying the code, downloading as a JS file, and rendering to audio files.

- Copy code: quick clipboard copy for use in Strudel REPL
- Download JS: save as .js file
- Render audio: export to WAV/MP3 for sharing or use in DAWs

---

## Acceptance Criteria

- [ ] "Copy Code" button copies to clipboard with toast confirmation
- [ ] "Download JS" saves current code as `.js` file
- [ ] "Export Audio" modal with format options (WAV, MP3)
- [ ] Duration input for audio export (e.g., 30s, 1min, custom)
- [ ] Progress indicator during render
- [ ] Audio rendered using Web Audio API + MediaRecorder
- [ ] Proper cleanup after render
- [ ] Works with current playing state
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Add copy to clipboard**
   - Files: `app/strudel/page.tsx`
   - Button + toast notification
   - Use navigator.clipboard API

2. **Add JS download**
   - Files: `lib/export.ts`
   - Create blob, trigger download

3. **Create export modal**
   - Files: `components/export/export-modal.tsx`
   - Format selection, duration input
   - Progress bar

4. **Implement audio rendering**
   - Files: `lib/audio-render.ts`
   - Use AudioContext + MediaRecorder
   - Render for specified duration
   - Convert to WAV/MP3

5. **Add UI integration**
   - Files: `app/strudel/page.tsx`
   - Export button in controls
   - Modal trigger

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- MP3 encoding may need `lamejs` library
- WAV is simpler, native browser support
- Consider server-side rendering for long tracks (future)
- May need to handle Strudel's streaming nature specially

---

## Links

- NPM: `lamejs` (MP3 encoding)
- MDN: MediaRecorder API
