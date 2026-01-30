# Task: Add Tone.js Autocomplete to Code Editor

## Metadata

| Field       | Value                              |
| ----------- | ---------------------------------- |
| ID          | `002-001-code-editor-autocomplete` |
| Status      | `todo`                             |
| Priority    | `002` High                         |
| Created     | `2026-01-29 21:20`                 |
| Started     |                                    |
| Completed   |                                    |
| Blocked By  |                                    |
| Blocks      |                                    |
| Assigned To |                                    |
| Assigned At |                                    |

---

## Context

The code editor currently has autocomplete explicitly disabled. Users writing Tone.js code have no help with syntax, constructor parameters, or available methods. This is a significant UX gap for a music coding platform.

**Problem Statement:**

- **Who**: Users writing Tone.js code (all users)
- **What**: No autocomplete, parameter hints, or documentation tooltips
- **Why**: Users must memorize Tone.js API or constantly reference external docs
- **Current workaround**: Copy from presets, external documentation

**Impact**: High - affects every coding session

---

## Acceptance Criteria

- [ ] Tone.js class names autocomplete (Synth, FMSynth, Sampler, etc.)
- [ ] Constructor parameter hints with types and defaults
- [ ] Hover tooltips showing method signatures and descriptions
- [ ] Common Tone.js patterns as snippets
- [ ] Performance: no noticeable lag when typing
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Step 1**: Create Tone.js language data
   - Files: `lib/editor/toneCompletions.ts`
   - Actions: Define completion items for Tone.js classes, methods, properties

2. **Step 2**: Implement CodeMirror autocomplete extension
   - Files: `components/studio/CodePanel.tsx` or editor setup
   - Actions: Add autocomplete extension with Tone.js completions

3. **Step 3**: Add parameter hints
   - Files: `lib/editor/toneSignatures.ts`
   - Actions: Define function signatures for hover tooltips

4. **Step 4**: Add code snippets
   - Files: `lib/editor/toneSnippets.ts`
   - Actions: Common patterns (synth setup, drum pattern, chord progression)

5. **Step 5**: Write tests
   - Files: `lib/editor/__tests__/toneCompletions.test.ts`
   - Coverage: Completion triggers, snippet expansion, performance

---

## Notes

- CodeMirror 6 uses @codemirror/autocomplete extension
- Consider lazy-loading completion data for performance
- Priority completions: Synth types, Effects, Transport, Pattern

---

## Links

- File: `components/studio/CodePanel.tsx`
- Tone.js API: https://tonejs.github.io/docs/
