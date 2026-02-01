# Refactor Studio Page Component

**Priority:** 003 (Medium)
**Labels:** technical-debt, refactor
**Created:** 2026-02-01

## Context

**Intent**: IMPROVE

The `app/studio/page.tsx` file is **1612 lines** - significantly exceeding the recommended 500 line limit. This large monolithic component:

- Makes the code harder to understand and maintain
- Increases cognitive load when debugging
- Makes testing individual features difficult
- Slows down development when multiple features need changes

### Current Architecture Analysis

The studio page manages **13+ major state domains**:

1. **Code/Editor State**: code, validationErrors, liveMode
2. **Layer System**: layers[], selectedLayerId
3. **Tweaks System**: tweaks (bpm, swing, filter, reverb, delay)
4. **History/Undo**: historyState, canUndo, canRedo
5. **Audio Runtime**: playerState, runtimeEvents
6. **Track Management**: currentTrackId, currentTrackName, hasUnsavedChanges
7. **Recording Capture**: isRecording, recordingElapsedMs
8. **Recording Playback**: activeRecording, isPlaybackActive, playbackTimeMs
9. **AI Chat**: inputValue, messages, chatStatus, selectedModel
10. **Layout State**: timelineExpanded, leftColumnWidth, rightColumnWidth, isResizing
11. **Modal Visibility**: 7 modal states (trackBrowser, apiKey, saveAs, export, share, revisionHistory, tutorial)
12. **API Key Status**: hasKey, apiKeyLoading
13. **Draft Recovery**: via useDraftTrack hook

The file already uses **11 specialized hooks** but centralizes all callback handlers and the commands array (~150 lines) in the page component.

### Codebase Patterns

The codebase follows mature patterns suitable for this refactor:

- **Prop-passing with callbacks**: Used by TweaksPanel, LayersPanel, CodePanel
- **Hook-based state**: useHistory, useRecording, useRevisions extract complex logic
- **Context providers**: ToastProvider wraps content for notifications
- **Custom refs for performance**: Prevents unnecessary re-renders

### Key Files to Modify/Create

**Page file:**

- `app/studio/page.tsx` (1612 → <400 lines)

**New hooks:**

- `lib/hooks/useStudioEditor.ts` - Code, layers, tweaks, and history coordination
- `lib/hooks/useStudioPlayback.ts` - Audio runtime, recording capture/playback coordination
- `lib/hooks/useStudioTracks.ts` - Track loading, saving, drafts, revisions coordination

**New components:**

- `components/studio/layouts/DesktopLayout.tsx` - Three-column desktop layout
- `components/studio/layouts/RecordingControls.tsx` - Recording timeline + playback controls

**New commands file:**

- `lib/commands/studioCommands.ts` - Factory function for studio command palette commands

---

## Acceptance Criteria

- [ ] `app/studio/page.tsx` is under 400 lines
- [ ] Three new coordination hooks extract related state:
  - [ ] `useStudioEditor` manages code, layers, tweaks, and history
  - [ ] `useStudioPlayback` manages audio runtime and recording state
  - [ ] `useStudioTracks` manages track CRUD, drafts, and revisions
- [ ] Studio commands extracted to `lib/commands/studioCommands.ts`
- [ ] Desktop layout extracted to `DesktopLayout.tsx`
- [ ] Recording controls extracted to `RecordingControls.tsx`
- [ ] All extracted components/hooks have proper TypeScript interfaces
- [ ] No functionality changes - pure refactor (behavior preserved)
- [ ] All existing tests still pass
- [ ] Quality gates pass (lint, type-check, build)

---

## Notes

**In Scope:**

- Extract state coordination into 3 new hooks
- Extract command palette commands to separate file
- Extract desktop layout and recording controls as components
- Add TypeScript interfaces for all extracted code
- Preserve all existing functionality

**Out of Scope:**

- Changing component behavior or features
- Adding new features or tests
- Mobile layout refactoring (MobileTabs is already a separate component)
- Refactoring child components (TweaksPanel, LayersPanel, etc.)
- Changing the hook patterns already used (useHistory, useRecording, etc.)

**Assumptions:**

- The existing hooks (useHistory, useRecording, etc.) will remain unchanged
- Child components will continue receiving props as before
- The ToastProvider wrapper pattern will remain at page level
- Context/refs patterns in the existing code work correctly

**Edge Cases:**

- History restoration must prevent re-pushing (existing isRestoringFromHistoryRef pattern)
- Live mode updates must be debounced (existing liveUpdateTimeoutRef pattern)
- Global model ref pattern must be preserved for chat transport body function
- Recording automation playback must stay synced with audio playback state

**Risks:**

- **Circular dependencies**: New hooks coordinate state that references each other. Mitigation: Keep hooks focused on single domains, pass callbacks as parameters
- **State synchronization bugs**: Extracting state may break timing of updates. Mitigation: Test playback, recording, and undo/redo flows thoroughly
- **Ref leakage**: Refs must stay in the right scope. Mitigation: Keep refs in the hooks that own the related state

---

## Plan

### Gap Analysis

| Criterion                  | Status  | Gap                                                       |
| -------------------------- | ------- | --------------------------------------------------------- |
| `page.tsx` under 400 lines | none    | Currently 1612 lines, needs full extraction               |
| `useStudioEditor` hook     | none    | Need to create new hook for code/layers/tweaks/history    |
| `useStudioPlayback` hook   | none    | Need to create new hook for audio/recording coordination  |
| `useStudioTracks` hook     | none    | Need to create new hook for track CRUD/drafts/revisions   |
| Commands extracted         | none    | ~130 lines in useMemo need extraction to factory function |
| `DesktopLayout.tsx`        | none    | ~280 lines of desktop layout JSX need extraction          |
| `RecordingControls.tsx`    | none    | ~100 lines of recording controls JSX need extraction      |
| TypeScript interfaces      | partial | Existing hooks have interfaces; new hooks need them       |
| No functionality changes   | full    | Pure refactor - just moving code                          |
| Tests pass                 | full    | Existing tests don't directly test page.tsx               |
| Quality gates pass         | full    | Currently passing                                         |

### Risks

- [ ] **Circular dependencies**: New hooks may reference each other. Mitigation: Use callback parameters, not direct imports between hooks
- [ ] **State sync timing**: Splitting state may break update ordering. Mitigation: Keep coupled state together, test undo/redo + live mode thoroughly
- [ ] **Ref scope leakage**: Refs must stay with owning hook. Mitigation: Map refs to state domains carefully
- [ ] **Chat transport global ref**: `globalModelRef` pattern is unusual. Mitigation: Keep it at module level in page.tsx, pass to hook

### Steps

1. **Create `useStudioEditor` hook**
   - File: `lib/hooks/useStudioEditor.ts`
   - Change: Extract code/layers/tweaks/history state (~250 lines)
   - Contains:
     - `code`, `setCode`, `validationErrors`, `liveMode`
     - `layers`, `selectedLayerId` with handlers
     - `tweaks` with change handler
     - `useHistory` integration with snapshot/restore
     - `handleCodeChange`, `handleLayersChange`, `handleTweaksChange`, `handleSelectLayer`, `handleLoadPreset`
     - Refs: `isRestoringFromHistoryRef`, `historyActionRef`, `prevHistoryStateRef`, `liveUpdateTimeoutRef`, `lastPlayedCodeRef`
   - Verify: TypeScript compiles, exports match expected interface

2. **Create `useStudioPlayback` hook**
   - File: `lib/hooks/useStudioPlayback.ts`
   - Change: Extract audio runtime and recording state (~150 lines)
   - Contains:
     - `playerState`, `runtimeEvents`, runtime subscription
     - `useRecording` integration with handlers
     - `useRecordingPlayback` integration
     - `activeRecording` state
     - `playCode`, `stop`, `handleStartRecording`, `handleStopRecording`
     - Callback to apply tweaks during playback
   - Verify: TypeScript compiles, exports match expected interface

3. **Create `useStudioTracks` hook**
   - File: `lib/hooks/useStudioTracks.ts`
   - Change: Extract track management state (~180 lines)
   - Contains:
     - `currentTrackId`, `currentTrackName`, `hasUnsavedChanges`, `selectedProjectId`
     - `showSaveAsModal`, `saveAsName`, `saving` state
     - `useTracks`, `useAutoSave`, `useDraftTrack`, `useRevisions`, `useProjects` integration
     - `handleSave`, `handleSaveAs`, `handleSelectTrack`, `handleRevert`
     - Refs: `lastSavedCodeRef`
   - Verify: TypeScript compiles, exports match expected interface

4. **Create `studioCommands.ts` factory**
   - File: `lib/commands/studioCommands.ts`
   - Change: Extract command palette commands to factory function (~150 lines)
   - Contains:
     - `createStudioCommands(deps: StudioCommandDeps): Command[]` function
     - Interface for all dependencies (handlers, state flags)
     - All playback/file/edit/view/navigation commands
   - Verify: TypeScript compiles, command IDs match existing

5. **Create `RecordingControls.tsx` component**
   - File: `components/studio/layouts/RecordingControls.tsx`
   - Change: Extract recording timeline UI (~100 lines)
   - Contains:
     - Recording name display
     - Play/pause/reset buttons for automation playback
     - Close button
     - `RecordingTimeline` integration
   - Verify: Component renders, props interface defined

6. **Create `DesktopLayout.tsx` component**
   - File: `components/studio/layouts/DesktopLayout.tsx`
   - Change: Extract three-column desktop layout (~300 lines)
   - Contains:
     - Left sidebar (Timeline, Tweaks, Layers, RecordingControls, RecordingPanel, SpectrumAnalyzer, Console)
     - Resize handles and logic
     - Middle panel (Chat or ApiKeyPrompt)
     - Right panel (Code + PlayerControls)
   - Verify: Component renders, layout behaves identically

7. **Integrate hooks into `page.tsx`**
   - File: `app/studio/page.tsx`
   - Change: Replace inline state with hook calls
   - Import new hooks and wire together
   - Keep: AI chat state, modal visibility states, tutorial state, keyboard shortcuts
   - Verify: All state accessible, handlers connected

8. **Replace inline commands with factory**
   - File: `app/studio/page.tsx`
   - Change: Replace `useMemo` commands block with `createStudioCommands` call
   - Pass all required dependencies
   - Verify: Command palette works identically

9. **Replace layout JSX with components**
   - File: `app/studio/page.tsx`
   - Change: Replace desktop layout JSX with `<DesktopLayout />` component
   - Pass all required props
   - Verify: Layout renders identically

10. **Final cleanup and verification**
    - File: `app/studio/page.tsx`
    - Change: Remove unused imports, verify line count
    - Verify: Line count < 400, no unused code

### Checkpoints

| After Step | Verify                                             |
| ---------- | -------------------------------------------------- |
| Step 3     | All three hooks compile, no circular dependencies  |
| Step 4     | Commands factory compiles, exports Command[]       |
| Step 6     | All new components/hooks render without errors     |
| Step 9     | Studio page renders identically to before refactor |
| Step 10    | `npm run quality` passes, line count < 400         |

### Test Plan

- [ ] Manual: Play/stop audio works
- [ ] Manual: Undo/redo works correctly
- [ ] Manual: Live mode updates while playing
- [ ] Manual: Recording capture and playback works
- [ ] Manual: Track save/load works
- [ ] Manual: Command palette opens and executes commands
- [ ] Manual: All modals open and close
- [ ] Automated: `npm test` passes
- [ ] Automated: `npm run quality` passes
- [ ] Automated: `npm run build` succeeds

### Docs to Update

- [ ] None - pure internal refactor, no API changes

---

## Work Log

### 2026-02-01 19:35 - Task Expanded

- Intent: IMPROVE
- Scope: Refactor 1612-line page into coordinated hooks and extracted components
- Key files to create:
  - `lib/hooks/useStudioEditor.ts`
  - `lib/hooks/useStudioPlayback.ts`
  - `lib/hooks/useStudioTracks.ts`
  - `lib/commands/studioCommands.ts`
  - `components/studio/layouts/DesktopLayout.tsx`
  - `components/studio/layouts/RecordingControls.tsx`
- Complexity: Medium - extensive but mechanical refactoring following existing patterns

### 2026-02-01 19:43 - Planning Complete

- Steps: 10
- Risks: 4 (circular deps, state sync, ref scope, global ref pattern)
- Test coverage: manual testing required (no unit tests for page component)
- Strategy: Bottom-up - create hooks/components first, then integrate

Key decisions:

- Keep AI chat state in page.tsx (not extracted) - tightly coupled to form submission
- Keep modal visibility states in page.tsx - simple booleans, not worth hook
- Keep keyboard shortcuts in page.tsx - depends on many handlers
- `globalModelRef` stays at module level - required for `TextStreamChatTransport.body()`

### 2026-02-01 19:37 - Triage Complete

Quality gates:

- Lint: `npm run lint`
- Types: `npm run typecheck`
- Tests: `npm test`
- Build: `npm run build`
- Full quality: `npm run quality` (lint + typecheck + format:check)

Task validation:

- Context: clear - file size verified (1612 lines), architecture well-documented
- Criteria: specific - line count target (<400), named hooks/components, testable
- Dependencies: none - no blocked tasks, existing hooks remain unchanged

Complexity:

- Files: some - 1 major file to refactor, 6 new files to create
- Risk: medium - large refactor but mechanical; existing patterns documented

Ready: yes

**Status:** doing
**Started:** 2026-02-01 19:37
**Assigned To:** worker-1
