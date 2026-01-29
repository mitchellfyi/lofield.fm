# Task: Add MIDI Keyboard Input Support

## Metadata

| Field       | Value                        |
| ----------- | ---------------------------- |
| ID          | `003-001-midi-input-support` |
| Status      | `todo`                       |
| Priority    | `003` Medium                 |
| Created     | `2026-01-29 21:20`           |
| Started     |                              |
| Completed   |                              |
| Blocked By  |                              |
| Blocks      |                              |
| Assigned To |                              |
| Assigned At |                              |

---

## Context

Music producers often have MIDI keyboards. Supporting MIDI input would allow users to play notes in real-time, test synth sounds, and potentially record performances.

**Problem Statement:**

- **Who**: Users with MIDI keyboards (significant portion of music producers)
- **What**: No way to connect MIDI controllers to the app
- **Why**: MIDI input is standard in music creation software
- **Current workaround**: None - must use computer keyboard or code everything

**Impact**: High for target audience - differentiator for music creation apps

---

## Acceptance Criteria

- [ ] Detect available MIDI devices via Web MIDI API
- [ ] Device selection dropdown in settings or toolbar
- [ ] MIDI note on/off triggers current synth
- [ ] Velocity sensitivity (note velocity affects volume)
- [ ] MIDI CC mapping to tweak parameters (optional Phase 2)
- [ ] Visual keyboard showing pressed notes
- [ ] Works with all Tone.js synth types
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Step 1**: Create MIDI input hook
   - Files: `lib/hooks/useMIDI.ts`
   - Actions: Web MIDI API integration, device enumeration, event handling

2. **Step 2**: Connect MIDI to Tone.js
   - Files: `lib/audio/midiAdapter.ts`
   - Actions: Convert MIDI events to Tone.js triggerAttack/Release

3. **Step 3**: Add device selector UI
   - Files: `components/studio/MIDISettings.tsx`
   - Actions: Dropdown for input device, connection status indicator

4. **Step 4**: Add visual keyboard (optional)
   - Files: `components/studio/MIDIKeyboard.tsx`
   - Actions: On-screen keyboard showing pressed notes

5. **Step 5**: Write tests
   - Files: `lib/hooks/__tests__/useMIDI.test.ts`
   - Coverage: Device detection, note handling, velocity mapping

---

## Notes

- Web MIDI API requires HTTPS in most browsers
- Not all browsers support Web MIDI (Chrome, Edge, Opera do)
- Consider polyfill or graceful degradation
- Could later add MIDI learn for parameter mapping

---

## Links

- Web MIDI API: https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API
- Tone.js MIDI: https://tonejs.github.io/docs/14.7.77/Midi
