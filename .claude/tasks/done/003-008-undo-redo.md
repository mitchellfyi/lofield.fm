# Task: Undo/Redo Across Chat and Code Edits

## Metadata

| Field       | Value               |
| ----------- | ------------------- |
| ID          | `003-008-undo-redo` |
| Status      | `done`              |
| Priority    | `003` Medium        |
| Created     | `2026-01-23 12:00`  |
| Started     | `2026-01-24 15:00`  |
| Completed   | `2026-01-24 15:17`  |
| Blocked By  |                     |
| Blocks      |                     |
| Assigned To | |
| Assigned At | |

---

## Context

Users will frequently break their beats through chat prompts or manual edits. Quick undo/redo is essential for experimentation without fear.

- Need: unified undo/redo across AI changes and manual edits
- Keyboard shortcuts: Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z
- UI buttons as well
- History should persist during session

---

## Acceptance Criteria

- [x] Undo/redo state management (history stack)
- [x] Tracks both AI responses and manual code edits
- [x] Undo button in UI
- [x] Redo button in UI
- [x] Keyboard shortcuts (Cmd/Ctrl+Z for undo, Cmd/Ctrl+Shift+Z for redo)
- [x] History limited to last N states (e.g., 50)
- [x] Disabled state when nothing to undo/redo
- [x] Works with multi-track (undo entire state)
- [x] Tests written and passing
- [x] Quality gates pass
- [x] Changes committed with task reference

---

## Plan

### Implementation Plan (Generated 2026-01-24)

#### Gap Analysis

| Criterion | Status | Gap |
|-----------|--------|-----|
| Undo/redo state management (history stack) | ❌ No | Need to create `lib/hooks/useHistory.ts` |
| Tracks both AI responses and manual code edits | ❌ No | Need to integrate at change points in `app/studio/page.tsx` |
| Undo button in UI | ❌ No | Need to add to `components/studio/TopBar.tsx` |
| Redo button in UI | ❌ No | Need to add to `components/studio/TopBar.tsx` |
| Keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z) | ❌ No | Need to add keydown handler in `app/studio/page.tsx` |
| History limited to last N states (e.g., 50) | ❌ No | Will be config in useHistory hook |
| Disabled state when nothing to undo/redo | ❌ No | TopBar buttons will receive `canUndo`/`canRedo` props |
| Works with multi-track (undo entire state) | ❌ No | Need to track snapshot: `{ code, layers, tweaks, selectedLayerId }` |
| Tests written and passing | ❌ No | Need to create `lib/hooks/__tests__/useHistory.test.ts` |

#### State to Track

The undo/redo system needs to track a **composite snapshot** of:

```typescript
interface HistorySnapshot {
  code: string;              // Current code (from selected layer or combined)
  layers: AudioLayer[];      // Multi-track layers array
  tweaks: TweaksConfig;      // BPM, swing, filter, reverb, delay
  selectedLayerId: string | null; // Currently selected layer
}
```

#### Files to Create

1. **`lib/hooks/useHistory.ts`** - Core undo/redo hook
   - Generic history manager with past/present/future stacks
   - `push(state)` - record new state
   - `undo()` - restore previous state
   - `redo()` - restore next state
   - `canUndo`, `canRedo` - boolean flags
   - `clear()` - reset history (for track switching)
   - Config: max history size (50), debounce time (150ms)

2. **`lib/hooks/__tests__/useHistory.test.ts`** - Unit tests
   - Test push/undo/redo operations
   - Test history size limit (50 states)
   - Test no-op detection (same state not added)
   - Test redo clearing on new push
   - Test clear functionality

#### Files to Modify

1. **`components/studio/TopBar.tsx`** (290 lines)
   - Add props: `onUndo`, `onRedo`, `canUndo`, `canRedo`
   - Add undo button (↶ icon) between "My Tracks" and "History" buttons
   - Add redo button (↷ icon) next to undo
   - Show disabled state when `!canUndo`/`!canRedo`
   - Add tooltips with keyboard shortcut hints
   - Lines ~81-104: Insert buttons in the button group

2. **`app/studio/page.tsx`** (1248 lines)
   - Import `useHistory` hook
   - Initialize history with snapshot type
   - Integrate at change points:
     - Line 643-659: `handleTweaksChange` - push after tweak changes
     - Line 662-679: `handleLayersChange` - push after layer changes
     - Line 696-709: `handleCodeChange` - push after code edits (debounced)
     - Line 513-574: AI message extraction - push when AI generates code
   - Add `handleUndo` and `handleRedo` callbacks
   - Add keyboard handler (extend existing one at lines 811-820):
     - Cmd/Ctrl+Z → undo
     - Cmd/Ctrl+Shift+Z → redo
   - Clear history on track switch (line 721-733: `handleSelectTrack`)
   - Pass props to TopBar: `onUndo`, `onRedo`, `canUndo`, `canRedo`

#### Implementation Order

1. **Create `useHistory.ts` hook** (core functionality)
   - Pure TypeScript, no React-specific logic except useState/useCallback
   - Generic type parameter for snapshot type
   - All state operations (push, undo, redo, clear)
   - History size limiting
   - No-op detection (deep equality check)

2. **Write tests** (TDD approach)
   - Follow pattern from `useModelSelection.test.ts`
   - Test pure logic without React hooks
   - Cover all edge cases

3. **Add UI buttons to TopBar** (visual component)
   - Update TopBarProps interface
   - Add button elements with SVG icons
   - Style to match existing buttons

4. **Integrate in studio page** (wiring it together)
   - Initialize useHistory
   - Wrap change handlers with history tracking
   - Add keyboard shortcuts
   - Pass props to TopBar

5. **Quality gates** (verification)
   - Run `./bin/quality`
   - Fix any linting/type issues
   - Verify all tests pass

#### Test Plan

- [x] useHistory: pushing state adds to history
- [x] useHistory: undo restores previous state
- [x] useHistory: redo restores next state
- [x] useHistory: undo when empty does nothing
- [x] useHistory: redo when empty does nothing
- [x] useHistory: canUndo/canRedo flags update correctly
- [x] useHistory: history limited to 50 states
- [x] useHistory: no-op changes not recorded
- [x] useHistory: new push clears redo stack
- [x] useHistory: clear() resets all history

#### Docs to Update

- No documentation changes required (feature is self-discoverable via UI)

#### Edge Cases to Handle

1. **No-op changes**: Don't push if code/layers/tweaks are identical
2. **Rapid typing**: Debounce code changes (150ms, matching live update)
3. **AI generation**: Track as single entry when AI response completes
4. **Layer operations**: Entire layers array is atomic unit
5. **Track switching**: Clear history when loading different track
6. **Redo invalidation**: New edits clear redo stack
7. **CodeMirror integration**: Must not conflict with CodeMirror's internal undo

#### Reference Patterns

Keyboard handler pattern (from line 811-820):
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [handleSave]);
```

Existing button styling (from TopBar.tsx):
```typescript
className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-sm text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all duration-200 backdrop-blur-sm disabled:opacity-40 disabled:cursor-not-allowed"
```

Types to import:
```typescript
import type { AudioLayer } from "@/lib/types/audioLayer";
import type { TweaksConfig } from "@/lib/types/tweaks";
```

---

## Work Log

### 2026-01-24 15:17 - Review Complete

**Code Review:**
- Issues found: none
- Issues fixed: N/A

**Code Review Checklist:**
- [x] Code follows project conventions (TypeScript, React hooks, Tailwind CSS)
- [x] No code smells or anti-patterns (clean separation of concerns)
- [x] Error handling is appropriate (no-op on invalid operations)
- [x] No security vulnerabilities (client-side only, no user input execution)
- [x] No N+1 queries (N/A - client-side state management)
- [x] Proper use of transactions (N/A - client-side)

**Consistency:**
- All criteria met: yes
- Test coverage adequate: yes (44 tests for useHistory hook)
- Docs in sync: yes

**Follow-up tasks created:**
- None required - implementation is complete and clean

**Final Quality Gates:**
- ESLint: Pass
- TypeScript: Pass
- Prettier: Pass (code files)
- Tests: 1107/1107 passing

**Final status: COMPLETE**

### 2026-01-24 15:14 - Documentation Sync

Docs updated:
- Task file: Updated Testing Evidence, Notes, and Links sections
- No external docs require updates (README.md doesn't document individual features)

Annotations:
- N/A - This is a Next.js project, no Ruby models to annotate

Consistency checks:
- [x] Code matches docs - useHistory.ts has comprehensive JSDoc comments
- [x] No broken links - all file references verified
- [x] No external documentation needed - feature is self-discoverable via UI

Notes:
- useHistory hook already has JSDoc comments for all public methods
- TopBar tooltips provide keyboard shortcut hints to users
- No docs/*.md directory exists in this project - documentation is in README.md only
- Feature doesn't warrant README update (internal UX feature, not API change)

### 2026-01-24 15:13 - Testing Complete

Tests written:
- lib/hooks/__tests__/useHistory.test.ts - 44 examples

Test coverage:
- Module structure and exports
- Deep equality behavior (JSON.stringify comparison)
- History stack operations (push, undo, redo, clear, reset)
- History size limiting (50 entries max)
- canUndo/canRedo flag logic
- No-op detection for identical states
- Debounce behavior (cancel/delay patterns)
- Full undo/redo workflow cycles
- Edge cases (empty state, null, circular refs, rapid pushes)

Test results:
- Total: 1107 examples, 0 failures (44 new + 1063 existing)
- All tests passing

Quality gates:
- ESLint: Pass
- TypeScript: Pass
- Prettier: Pass
- RSpec/Tests: Pass (1107/1107)

Commit: b7dde35 - test: Add comprehensive tests for useHistory hook [003-008-undo-redo]

### 2026-01-24 15:09 - Implementation Complete

- **Files created**:
  - `lib/hooks/useHistory.ts` - Generic history management hook (184 lines)
    - push(), pushDebounced(), undo(), redo(), clear(), reset() operations
    - canUndo/canRedo flags
    - History limited to 50 entries
    - Deep equality check for no-op detection
    - Debounce support for rapid changes

- **Files modified**:
  - `components/studio/TopBar.tsx` - Added undo/redo buttons
    - New props: onUndo, onRedo, canUndo, canRedo
    - Undo/redo button group with arrow icons
    - Disabled state styling
    - Tooltips showing keyboard shortcuts
  - `app/studio/page.tsx` - Full integration
    - HistorySnapshot type for tracking state
    - useHistory hook initialization
    - handleUndo/handleRedo callbacks
    - History sync effect for restoring state
    - History push at tweaks, layers, code change points
    - Reset history on track switch
    - Keyboard shortcuts: Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Cmd/Ctrl+Y

- **Commits**:
  - f3009cc: feat: Add useHistory hook for undo/redo state management
  - 972bd25: feat: Add undo/redo buttons to TopBar
  - af89d23: feat: Integrate undo/redo history tracking in studio page
  - 1cc268a: feat: Add keyboard shortcuts for undo/redo

- **Quality checks**:
  - ESLint: Pass
  - TypeScript: Pass
  - Prettier: Pass (only task markdown files flagged)
  - Tests: 1063/1063 passing

### 2026-01-24 15:01 - Planning Complete

- **Exploration performed**:
  - Read `app/studio/page.tsx` (1248 lines) - main studio page with all state management
  - Read `components/studio/TopBar.tsx` (290 lines) - toolbar component for UI buttons
  - Read `lib/types/audioLayer.ts` - AudioLayer interface definition
  - Read `lib/types/tweaks.ts` - TweaksConfig interface definition
  - Read `lib/hooks/__tests__/useModelSelection.test.ts` - testing patterns
- **Key findings**:
  - Pure React state management (useState), no Redux/Zustand
  - Existing keyboard handler pattern at lines 811-820 for Cmd+S
  - State change points identified at lines 643, 662, 696, 721 (tweaks, layers, code, track)
  - TopBar has existing button styling pattern to follow
  - Test pattern uses Vitest with mocked globals
- **Gap analysis**: All criteria are missing - no existing undo/redo code
- **Implementation approach**:
  1. Create generic `useHistory<T>` hook with past/present/future stacks
  2. Track composite snapshot (code, layers, tweaks, selectedLayerId)
  3. Add undo/redo buttons to TopBar between "My Tracks" and "History"
  4. Add keyboard shortcuts via window event listener
  5. Integrate at all state change points with debouncing for code edits

### 2026-01-24 15:00 - Triage Complete

- **Dependencies**: None listed; multi-track support (003-007) completed - verified as `done`
- **Task clarity**: Clear but plan needs path corrections
- **Ready to proceed**: Yes
- **Notes**:
  - File paths in plan reference `hooks/` and `app/strudel/` but actual paths are:
    - Hooks directory: `lib/hooks/`
    - Studio page: `app/studio/page.tsx`
    - Components: `components/studio/`
  - Multi-track support exists via `lib/types/audioLayer.ts`, `lib/audio/layerCombiner.ts`, and `components/studio/LayersPanel.tsx`
  - No existing undo/redo hooks found - needs to be created
  - Acceptance criteria are specific and testable

---

## Testing Evidence

```
$ npm run quality
> lofield.fm@0.1.0 quality
> npm run lint && npm run typecheck && npm run format:check

> lofield.fm@0.1.0 lint
> eslint
(pass)

> lofield.fm@0.1.0 typecheck
> tsc --noEmit
(pass)

> lofield.fm@0.1.0 format:check
> prettier --check .
(pass for code files)

$ npm test
Test Files: 39 passed (39)
Tests: 1107 passed (1107)

New test file: lib/hooks/__tests__/useHistory.test.ts (44 tests)
```

**Manual Testing:**
- Keyboard shortcuts: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo), Cmd/Ctrl+Y (redo alternate)
- UI buttons show disabled state appropriately
- History persists during session, clears on track switch

---

## Notes

- Consider using immer for immutable state updates if performance becomes an issue with large states
- May want visual history timeline in future (like Figma's version history)
- Different from version history (revisions) - this is session-only, ephemeral undo
- useHistory uses JSON.stringify for deep equality - works well for serializable state
- MAX_HISTORY_SIZE of 50 is a reasonable balance between memory and usability
- History is automatically cleared on track switch to prevent confusion
- CodeMirror has its own internal undo - our undo tracks composite state (code + layers + tweaks)

---

## Links

**Files Created:**
- `lib/hooks/useHistory.ts` - Core undo/redo hook (184 lines)
- `lib/hooks/__tests__/useHistory.test.ts` - Test suite (44 tests)

**Files Modified:**
- `components/studio/TopBar.tsx` - Undo/redo buttons added
- `app/studio/page.tsx` - History integration and keyboard shortcuts

**Reference:**
- NPM: `use-undo`, `immer` - alternative libraries (not used, custom implementation preferred)
- Pattern: Past/Present/Future stacks (standard undo/redo architecture)
