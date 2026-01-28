# Task: when opening the presets modal, the preview and load buttons do not work

## Metadata

| Field       | Value                                                        |
| ----------- | ------------------------------------------------------------ |
| ID          | `003-001-when-opening-the-presets-modal-the-preview-and-loa` |
| Status      | `done`                                                       |
| Priority    | `003` Medium                                                 |
| Created     | `2026-01-28 20:12`                                           |
| Started     | `2026-01-28 21:00`                                           |
| Completed   |                                                              |
| Blocked By  |                                                              |
| Blocks      |                                                              |
| Assigned To |                                                              |
| Assigned At |                                                              |

---

## Context

**Intent**: FIX

When users open the Presets modal and click the "Preview" or "Load" buttons on a preset card, the buttons don't appear to work. The issue is that `onLoadPreset={setCode}` in `app/studio/page.tsx:1241` directly calls `setCode` without properly syncing with the layers system, history, or triggering the necessary state updates.

### Root Cause Analysis

**Data Flow:**

1. `TopBar` receives `onLoadPreset={setCode}` from studio page (line 1241)
2. `TopBar` passes this to `PresetBrowser` (line 156-161)
3. `PresetBrowser.handleLoad` calls `onLoadPreset(preset.code)` (line 47)
4. This directly calls `setCode()` which updates the code state

**The Problem:**
The `setCode` function is a raw useState setter that bypasses critical synchronization:

- Does NOT update the `layers` array (which is the source of truth for playback)
- Does NOT sync with `selectedLayerId`
- Does NOT push to undo/redo history
- Does NOT extract tweaks from the loaded preset code

As a result, when a preset is loaded:

- The code editor shows the new code
- But the layers array still contains the OLD code
- When play is triggered, `combineLayers(layers)` returns the OLD code
- The user sees new code but hears old code (or nothing changes)

**Preview Button:**
The preview functionality is stubbed with a TODO comment at `PresetBrowser.tsx:39` - actual audio preview is not implemented yet.

---

## Acceptance Criteria

- [x] **Load button works correctly**: Clicking Load on a preset updates the code editor AND syncs with layers, history, and tweaks
- [x] **Preview button has clear UX**: Either implement preview functionality OR disable/hide the button with appropriate user feedback
- [x] **State synchronization**: Loaded preset code is reflected in layers array, history, and playback
- [x] **Unsaved changes warning**: The existing confirmation dialog still works correctly
- [x] Tests written and passing (if applicable)
- [x] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

### Solution Overview

1. **Fix Load Button** (`app/studio/page.tsx`)
   - Create a new `handleLoadPreset` callback that properly syncs state:
     - Push current state to history (for undo capability)
     - Set code via `setCode`
     - Update the selected layer's code in `layers` array
     - Extract tweaks from the preset code and apply them
     - If audio is playing, trigger live update with the new code

2. **Address Preview Button** (`components/studio/PresetCard.tsx`)
   - Disable the Preview button with visual styling indicating it's unavailable
   - Add a tooltip explaining audio preview is coming soon
   - Keep the button visible but non-functional for consistent UI layout

### Files to Modify

1. `app/studio/page.tsx` (line ~1241)
   - Create `handleLoadPreset` function following the pattern in `handleCodeChange` (line 909-927)
   - Pass `handleLoadPreset` instead of raw `setCode` to TopBar

2. `components/studio/PresetCard.tsx` (line 45-68)
   - Disable the Preview button
   - Add visual feedback (reduced opacity, cursor-not-allowed)
   - Add title attribute for tooltip

---

## Work Log

### 2026-01-28 20:12 - Created

- Task created via CLI

### 2026-01-28 20:15 - Task Expanded

- Intent: FIX
- Scope: Fix preset load button to properly sync with layers/history, address preview button UX
- Key files:
  - `app/studio/page.tsx` (line 1241 - needs proper handler instead of raw setCode)
  - `components/studio/PresetBrowser.tsx` (line 39 - preview TODO)
  - `components/studio/PresetCard.tsx` (button handlers)
- Complexity: Medium

### 2026-01-28 21:00 - Implementation Complete

**Changes made:**

1. **app/studio/page.tsx** (line 927-962)
   - Created `handleLoadPreset` callback that properly syncs state:
     - Pushes current state to history for undo capability
     - Updates `code` state via `setCode`
     - Updates selected layer's code in `layers` array
     - Extracts and applies tweaks from preset code
     - Triggers live playback update if audio is playing
   - Updated TopBar prop from `onLoadPreset={setCode}` to `onLoadPreset={handleLoadPreset}`

2. **components/studio/PresetCard.tsx**
   - Disabled Preview button with visual feedback (opacity-50, cursor-not-allowed)
   - Added tooltip "Audio preview coming soon"
   - Removed unused `onPreview` and `isPlaying` props

3. **components/studio/PresetBrowser.tsx**
   - Removed unused `previewingPreset` state
   - Removed unused `handlePreview` callback
   - Cleaned up PresetCard props

**Build verification:** Passed (`npm run build` completed successfully)

---

## Notes

**In Scope:**

- Create a proper `handleLoadPreset` function in studio page that syncs code with layers, history, and tweaks
- Either implement preview functionality OR provide clear UX feedback that it's not available
- Ensure loaded presets can be played immediately

**Out of Scope:**

- Implementing full audio preview functionality (would require runtime changes)
- Adding new presets
- Modifying preset filtering/search

**Assumptions:**

- The layers system with `combineLayers()` is the correct approach for playback
- History should be updated when loading a preset (for undo capability)
- Tweaks should be extracted from loaded preset code

**Edge Cases:**

- Loading a preset while audio is playing - should restart with new code
- Loading a preset with unsaved changes - confirmation dialog must still work
- Loading a preset in single-layer vs multi-layer mode

**Risks:**

- Breaking existing code editing flow if handler is not wired correctly
- History stack corruption if not properly handled
- Mitigation: Test thoroughly with manual playback after loading presets

---

## Links

- `app/studio/page.tsx:1241` - Current broken `onLoadPreset={setCode}`
- `app/studio/page.tsx:909-927` - Reference: `handleCodeChange` shows proper sync pattern
- `components/studio/PresetBrowser.tsx:37-51` - Preview and load handlers
- `components/studio/PresetCard.tsx:45-74` - Button implementations
