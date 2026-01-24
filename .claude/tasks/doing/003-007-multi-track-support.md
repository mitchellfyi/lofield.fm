# Task: Multi-Track Support with Mute/Solo

## Metadata

| Field       | Value                         |
| ----------- | ----------------------------- |
| ID          | `003-007-multi-track-support` |
| Status      | `doing`                       |
| Priority    | `003` Medium                  |
| Created     | `2026-01-23 12:00`            |
| Started     | `2026-01-24 14:33`            |
| Completed   |                               |
| Blocked By  |                               |
| Blocks      |                               |
| Assigned To | `worker-1`                    |
| Assigned At | `2026-01-24 14:33`            |

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

### Implementation Plan (Generated 2026-01-24 14:45)

#### Gap Analysis

| Criterion                                      | Status            | Gap                                                                  |
| ---------------------------------------------- | ----------------- | -------------------------------------------------------------------- |
| Track list UI showing all tracks               | **No**            | Need to create `LayersPanel` component                               |
| Add/remove/rename tracks                       | **No**            | Need UI controls and state management                                |
| Each track has: name, code, mute, solo, volume | **No**            | Need new `AudioLayer` type (not existing Track model)                |
| Mute: silences track                           | **No**            | Need mute logic - inject comment prefix to disable code              |
| Solo: only play solo'd tracks                  | **No**            | Need solo logic - mute non-solo'd tracks when any is solo'd          |
| Volume: per-track gain                         | **No**            | Need volume multiplier injected into track code                      |
| Tracks combine using Strudel's stack()         | **Clarification** | This app uses Tone.js, not Strudel. Code concatenation is equivalent |
| Chat can reference track by name               | **No**            | Need to update system prompt and include layer context               |
| Visual track indicators (playing, muted, etc.) | **No**            | Need status icons in LayerRow                                        |
| Drag to reorder tracks                         | **Defer**         | Nice-to-have, can add later with react-beautiful-dnd                 |
| Tests written and passing                      | **No**            | Need unit tests for new components and logic                         |
| Quality gates pass                             | **Pending**       | Will verify at completion                                            |
| Changes committed with task reference          | **Pending**       | Will commit at completion                                            |

#### Key Architecture Decisions

1. **New Type Name**: Use `AudioLayer` (not "Track" which conflicts with existing saved-project Track model)
2. **Code Combination Strategy**: Concatenate all layer codes into single string for eval (simplest, reuses existing runtime)
3. **Mute Implementation**: Comment out layer code with `/* MUTED */` wrapper when muted
4. **Solo Implementation**: When any layer is solo'd, mute all non-solo'd layers automatically
5. **Volume Implementation**: Inject volume multiplier into instrument `.volume.value` assignments
6. **State Management**: Add `layers: AudioLayer[]` and `selectedLayerId` to studio page state
7. **Drag-to-Reorder**: Defer to follow-up task (not blocking core functionality)

#### Files to Create

1. **`lib/types/audioLayer.ts`** - New type definition

   ```typescript
   export interface AudioLayer {
     id: string;
     name: string;
     code: string;
     muted: boolean;
     soloed: boolean;
     volume: number; // 0-100, maps to dB offset
     color: string; // For visual identification
   }
   ```

   - Also export: `DEFAULT_LAYERS`, `createDefaultLayer()`, `LAYER_COLORS`

2. **`components/studio/LayersPanel.tsx`** - Main layers container
   - Collapsible panel (like TweaksPanel pattern)
   - Header with "Layers" title + "Add Layer" button
   - Map over layers → LayerRow
   - "Reset to defaults" button

3. **`components/studio/LayerRow.tsx`** - Single layer row
   - Name input (editable)
   - Mute button (toggle, cyan when active)
   - Solo button (toggle, yellow when active)
   - Volume slider (horizontal, 0-100)
   - Delete button (with confirmation)
   - Color indicator dot
   - Playing indicator (pulsing when transport running)

4. **`lib/audio/layerCombiner.ts`** - Logic for combining layers
   - `combineLayers(layers: AudioLayer[]): string` - concatenate with mute/volume logic
   - `applyMuteLogic(code: string, muted: boolean): string` - wrap in comment
   - `applySoloLogic(layers: AudioLayer[]): AudioLayer[]` - return layers with effective mute state
   - `injectLayerVolume(code: string, volumePercent: number): string` - modify volume values

5. **`lib/types/audioLayer.test.ts`** - Unit tests for layer type helpers

6. **`lib/audio/__tests__/layerCombiner.test.ts`** - Unit tests for combiner logic

7. **`components/studio/__tests__/LayerRow.test.tsx`** - Component tests

#### Files to Modify

1. **`app/studio/page.tsx`** (~1163 lines)
   - Add state: `const [layers, setLayers] = useState<AudioLayer[]>(DEFAULT_LAYERS);`
   - Add state: `const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);`
   - Modify `playCode` to use `combineLayers(layers)` instead of single `code`
   - Update `handleSubmit` to include layer context in chat prompt
   - Add `LayersPanel` to UI (between ChatPanel and CodePanel)
   - Connect code editor to selected layer's code
   - Update live coding effect to use combined layers

2. **`prompts/system-prompt.md`**
   - Add section explaining multi-layer composition
   - Instruct AI on how to modify specific layers by name
   - Example: "When user says 'make drums faster', only modify the drums layer code"
   - Provide format for layer-specific responses

3. **`lib/audio/llmContract.ts`**
   - Add `extractLayerName(text: string): string | null` - detect which layer AI is modifying
   - Update validation to handle partial/single-layer code

4. **`app/api/chat/route.ts`**
   - Update message building to include all layer codes with names
   - Format: "=== LAYER: drums ===\n{code}\n=== LAYER: bass ===\n{code}..."

#### Test Plan

- [ ] Unit: `AudioLayer` type exports correctly
- [ ] Unit: `createDefaultLayer()` generates valid layer with unique ID
- [ ] Unit: `combineLayers()` concatenates all unmuted layer codes
- [ ] Unit: `combineLayers()` excludes muted layer code (wraps in comment)
- [ ] Unit: `combineLayers()` handles solo logic (solo = others muted)
- [ ] Unit: `injectLayerVolume()` modifies volume values in code
- [ ] Unit: Empty layers array returns empty string
- [ ] Component: LayerRow renders name, mute, solo, volume controls
- [ ] Component: LayerRow mute toggle calls handler
- [ ] Component: LayerRow solo toggle calls handler
- [ ] Component: LayersPanel renders all layers
- [ ] Component: LayersPanel add button creates new layer
- [ ] Integration: Playing combined layers produces audio (manual E2E)
- [ ] Integration: Muting a layer silences it (manual E2E)
- [ ] Integration: Solo-ing a layer mutes others (manual E2E)

#### Docs to Update

- [ ] Add to MISSION_TASKS.md if not already present
- [ ] No README changes needed (user docs not required per CLAUDE.md)

#### Implementation Order

**Phase 1: Core Types & Logic** (no UI yet)

1. Create `lib/types/audioLayer.ts`
2. Create `lib/audio/layerCombiner.ts`
3. Write tests for both

**Phase 2: UI Components** (isolated)

1. Create `components/studio/LayerRow.tsx`
2. Create `components/studio/LayersPanel.tsx`
3. Write component tests

**Phase 3: Integration** (connect everything)

1. Update `app/studio/page.tsx` state management
2. Connect LayersPanel to studio page
3. Update playCode to use combined layers
4. Verify basic playback works

**Phase 4: Chat Integration** (AI awareness)

1. Update `prompts/system-prompt.md`
2. Update `app/api/chat/route.ts` to include layer context
3. Test AI responses to layer-specific requests

**Phase 5: Quality & Cleanup**

1. Run full test suite
2. Run `./bin/quality`
3. Fix any issues
4. Commit with task reference

#### Complexity Estimate

| Phase   | Files          | Complexity | Est. LOC     |
| ------- | -------------- | ---------- | ------------ |
| Phase 1 | 2 new, 2 tests | Low        | ~200         |
| Phase 2 | 2 new, 1 test  | Medium     | ~350         |
| Phase 3 | 1 modify       | High       | ~150 changes |
| Phase 4 | 2 modify       | Medium     | ~100 changes |
| Phase 5 | -              | Low        | -            |

**Total**: ~800 new/modified lines of code

---

## Work Log

### 2026-01-24 - Implementation Progress

**Commits Made:**

1. `ce80d9a` - feat: Add AudioLayer type for multi-track support
2. `d411b4a` - feat: Add layerCombiner for multi-track code combination
3. `0469bd8` - feat: Add LayerRow component for layer controls
4. `1a7b565` - feat: Add LayersPanel component for managing layers
5. `085c280` - feat: Integrate layers into studio page state management
6. `47a03e0` - docs: Add multi-layer composition section to system prompt
7. `7fc5775` - feat: Include layer context in chat API messages

**Files Created:**

- `lib/types/audioLayer.ts` - AudioLayer interface, colors, helpers
- `lib/audio/layerCombiner.ts` - combineLayers, applySoloLogic, volumeToDb
- `components/studio/LayerRow.tsx` - Individual layer row with mute/solo/volume
- `components/studio/LayersPanel.tsx` - Container panel with add/reset

**Files Modified:**

- `app/studio/page.tsx` - Added layers state, LayersPanel UI, updated playCode
- `prompts/system-prompt.md` - Added multi-layer composition instructions

**Quality Checks:**

- All files pass ESLint
- No TypeScript errors
- Commits made incrementally after each logical change

**Next Steps:**

- Testing phase will verify functionality
- May need to handle AI responses that return modified layer code

### 2026-01-24 14:45 - Planning Complete

- **Gap Analysis**: Completed full codebase exploration
- **Key Findings**:
  - Existing `Track` type is for saved projects (DB), need new `AudioLayer` type for composition layers
  - App uses Tone.js, not Strudel - code concatenation is the equivalent of stack()
  - Studio page has ~20 useState calls - adding 2 more for layers state
  - TweaksPanel and TweakSlider provide good patterns to follow for UI
  - Chat currently passes single code block - needs update for layer context
  - System prompt needs multi-layer instructions
- **Architecture Decisions**:
  - New type: `AudioLayer` (avoids naming conflict)
  - Mute: Comment wrapper approach (simple, reversible)
  - Solo: Compute effective mute state when combining
  - Volume: Inject modifier into `.volume.value` lines
  - Defer drag-to-reorder (not core functionality)
- **Plan Written**: 5-phase implementation with specific files and test cases
- **Complexity**: ~800 LOC across 7 new files, 4 modified files
- **Ready for**: Implementation phase

### 2026-01-24 14:33 - Triage Complete

- **Dependencies**: None - `Blocked By` field is empty. No dependencies required.
- **Task clarity**: Clear with minor corrections needed
  - Plan references `app/strudel/page.tsx` but actual file is `app/studio/page.tsx`
  - Plan references Strudel's `stack()` but codebase uses Tone.js (need equivalent approach)
  - Existing `Track` type in `lib/types/tracks.ts` is for saved tracks in DB, not multi-track layers
  - Need new type for "composition layers" to avoid confusion (e.g., `AudioLayer` or `CompositionTrack`)
- **Ready to proceed**: Yes
- **Notes**:
  - Main studio page at `app/studio/page.tsx` - 1163 lines, complex state management
  - Current architecture: single code block with DEFAULT_CODE containing all instruments inline
  - Multi-track would require splitting into separate code blocks per layer
  - Tone.js approach: multiple Sequences/Patterns that play simultaneously (already works this way)
  - Key challenge: UI for managing multiple code blocks and combining them
  - Consider: Whether to combine at code level (concatenate) or runtime level (multiple eval)

---

## Testing Evidence

### 2026-01-24 - Testing Phase Complete

**Tests Written:**
- `lib/types/__tests__/audioLayer.test.ts` - 35 tests
  - Module exports, LAYER_COLORS, generateLayerId, createDefaultLayer, EMPTY_LAYER_CODE, DEFAULT_LAYERS
- `lib/audio/__tests__/layerCombiner.test.ts` - 56 tests
  - applySoloLogic, applyMuteWrapper, volumeToDb, injectLayerVolume, generateLayerHeader, combineLayers, extractLayerNames
- `components/studio/__tests__/LayerRow.test.ts` - 46 tests
  - Props interface, mute/solo/volume controls, delete button, selection, playing indicator, name editing
- `components/studio/__tests__/LayersPanel.test.ts` - 43 tests
  - Expand/collapse, add/update/delete layer, reset, layer selection, integration with audioLayer types

**Test Results:**
```
Test Files: 38 passed (38)
Tests: 1063 passed (1063)
Duration: 5.06s
```

**New Tests Added:** 180 (35 + 56 + 46 + 43)

**Quality Gates:**
- ESLint: PASS
- TypeScript: PASS
- Prettier: PASS
- Vitest: PASS (1063 tests)

**Commits:**
- `0791c0c` - test: Add specs for multi-track layer support
- `1f462cf` - style: Apply prettier formatting to layer components

---

## Notes

- Default tracks: drums, bass, melody
- Consider color-coding tracks
- May need track-specific chat sessions

---

## Links

- Strudel stack() documentation
