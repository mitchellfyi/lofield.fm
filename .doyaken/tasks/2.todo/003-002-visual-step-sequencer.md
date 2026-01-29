# Task: Add Visual Step Sequencer

## Metadata

| Field       | Value                           |
| ----------- | ------------------------------- |
| ID          | `003-002-visual-step-sequencer` |
| Status      | `todo`                          |
| Priority    | `003` Medium                    |
| Created     | `2026-01-29 21:20`              |
| Started     |                                 |
| Completed   |                                 |
| Blocked By  |                                 |
| Blocks      |                                 |
| Assigned To |                                 |
| Assigned At |                                 |

---

## Context

While the AI can generate code for drum patterns and sequences, a visual step sequencer would allow users to quickly create and edit patterns without coding, especially for drums and percussive elements.

**Problem Statement:**

- **Who**: Users who want to create drum patterns quickly
- **What**: No visual way to create/edit rhythmic patterns
- **Why**: Step sequencers are intuitive and faster than coding for rhythm
- **Current workaround**: Ask AI to generate patterns, manually edit code arrays

**Impact**: Medium-High - makes the app more accessible to non-coders

---

## Acceptance Criteria

- [ ] 16-step grid (expandable to 32)
- [ ] Multiple rows for different sounds (kick, snare, hihat, etc.)
- [ ] Click to toggle steps on/off
- [ ] Velocity per step (click and drag or right-click)
- [ ] Real-time playback with position indicator
- [ ] Generates Tone.js Sequence code
- [ ] Copy generated code to editor
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Step 1**: Create step sequencer component
   - Files: `components/studio/StepSequencer.tsx`
   - Actions: Grid UI, step state management, click handling

2. **Step 2**: Add velocity controls
   - Files: `components/studio/StepSequencer.tsx`
   - Actions: Visual velocity bars, drag to adjust

3. **Step 3**: Implement playback integration
   - Files: `lib/audio/sequencerPlayback.ts`
   - Actions: Tone.Transport sync, position indicator

4. **Step 4**: Code generation
   - Files: `lib/audio/sequencerCodeGen.ts`
   - Actions: Convert grid state to Tone.Sequence code

5. **Step 5**: Integration with editor
   - Files: `components/studio/StepSequencer.tsx`, `components/studio/CodePanel.tsx`
   - Actions: "Copy to Editor" button, insert at cursor

6. **Step 6**: Write tests
   - Files: `components/studio/__tests__/StepSequencer.test.ts`
   - Coverage: Grid interactions, code generation, playback sync

---

## Notes

- Start with drums, could later add melodic sequencer
- Consider presets for common patterns (4/4 rock, trap hi-hats, etc.)
- Mobile-friendly touch targets for steps

---

## Links

- Inspiration: Roland TR-808, Native Instruments Battery
- Tone.Sequence: https://tonejs.github.io/docs/14.7.77/Sequence
