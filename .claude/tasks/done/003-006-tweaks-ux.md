# Task: Tweaks UX - Quick Parameter Sliders

## Metadata

| Field       | Value               |
| ----------- | ------------------- |
| ID          | `003-006-tweaks-ux` |
| Status      | `done`              |
| Priority    | `003` Medium        |
| Created     | `2026-01-23 12:00`  |
| Started     | `2026-01-24 14:14`  |
| Completed   | `2026-01-24 14:31`  |
| Blocked By  |                     |
| Blocks      |                     |
| Assigned To |                     |
| Assigned At |                     |

---

## Context

Users want quick, visual controls to tweak their beats without typing code or chatting. Sliders for common parameters provide immediate feedback and encourage experimentation.

- BPM: tempo control
- Swing: groove feel
- Density: note frequency
- Filter: brightness/darkness
- Drum balance: kick vs snare vs hats
- Effects: delay, reverb amount

---

## Acceptance Criteria

- [x] Collapsible "Tweaks" panel in UI
- [x] BPM slider (60-200, updates setcps)
- [x] Swing slider (0-100%)
- [x] Master filter slider (lowpass cutoff)
- [x] Reverb/delay amount sliders
- [x] Changes apply in real-time while playing
- [x] Visual feedback (current value display)
- [x] Reset to defaults button
- [x] Tweaks persist with track save
- [x] Tests written and passing
- [x] Quality gates pass
- [x] Changes committed with task reference

---

## Plan

### Implementation Plan (Generated 2026-01-24 14:21)

#### Gap Analysis

| Criterion                                | Status  | Gap                                                                |
| ---------------------------------------- | ------- | ------------------------------------------------------------------ |
| Collapsible "Tweaks" panel in UI         | no      | Need to create new TweaksPanel component                           |
| BPM slider (60-200, updates setcps)      | no      | Need slider + Tone.Transport.bpm.value integration                 |
| Swing slider (0-100%)                    | no      | Need slider + Tone.Transport.swing integration                     |
| Master filter slider (lowpass cutoff)    | no      | Need slider + code injection for master filter                     |
| Reverb/delay amount sliders              | no      | Need sliders + code injection for wet values                       |
| Changes apply in real-time while playing | partial | Runtime already supports live updates via `play(code, true)`       |
| Visual feedback (current value display)  | no      | Need value labels on sliders                                       |
| Reset to defaults button                 | no      | Need reset button with default values                              |
| Tweaks persist with track save           | no      | Need to store tweaks in track data (JSON column or code injection) |
| Tests written and passing                | no      | Need Vitest unit tests for all components                          |
| Quality gates pass                       | pending | Will verify after implementation                                   |
| Changes committed with task reference    | pending | Will commit when done                                              |

#### Architecture Decisions

**Audio Engine**: The app uses **Tone.js** (not Strudel). Key globals:

- `Tone.Transport.bpm.value` - Direct BPM control
- `Tone.Transport.swing` - Swing percentage (0-1)
- Master effects chain exists in DEFAULT_CODE with variables like `masterLowpass`, `masterReverb`, `tapeDelay`

**Persistence Strategy**: Option A - Store tweaks in code injection

- Rationale: Avoids database migration, works with existing save system
- Implementation: Inject tweak values at the top of code before execution
- Format: `// TWEAKS: {"bpm":82,"swing":0.08,"filter":8000,"reverb":0.25,"delay":0.2}`

**Real-Time Updates**: Use `getAudioRuntime().play(code, true)` for seamless updates

- The `keepPosition=true` flag maintains playback position during code re-eval

#### Files to Create

1. `components/studio/TweaksPanel.tsx`
   - Main collapsible panel container
   - Follow ConsolePanel pattern for expand/collapse
   - Contains all slider components
   - Reset button at bottom
   - Props: `tweaks: TweaksConfig`, `onTweaksChange: (tweaks) => void`, `playerState`, `defaultTweaks`

2. `components/studio/TweakSlider.tsx`
   - Reusable slider component with value display
   - Props: `label`, `value`, `min`, `max`, `step`, `unit`, `onChange`
   - Shows current value inline with label
   - HTML range input styled with Tailwind

3. `lib/types/tweaks.ts`
   - `TweaksConfig` interface: `{ bpm, swing, filter, reverb, delay }`
   - `DEFAULT_TWEAKS` constant with sensible defaults
   - Helper functions: `tweaksToComment()`, `commentToTweaks()`

4. `lib/audio/tweaksInjector.ts`
   - `injectTweaks(code: string, tweaks: TweaksConfig): string`
   - `extractTweaks(code: string): TweaksConfig | null`
   - Parses/injects TWEAKS comment at top of code
   - Generates runtime code to apply tweaks to Tone.js

5. `components/studio/__tests__/TweaksPanel.test.ts`
   - Module structure tests
   - Props interface tests
   - Slider behavior tests (bounds, value changes)
   - Reset button behavior tests

6. `components/studio/__tests__/TweakSlider.test.ts`
   - Module structure tests
   - Props interface tests
   - Range input behavior tests

7. `lib/audio/__tests__/tweaksInjector.test.ts`
   - Inject/extract roundtrip tests
   - Edge cases (no existing tweaks, malformed comment)
   - Code transformation tests

#### Files to Modify

1. `app/studio/page.tsx`
   - Add `tweaks` state with `useState<TweaksConfig>(DEFAULT_TWEAKS)`
   - Add `handleTweaksChange` callback
   - Extract tweaks from loaded track code on `handleSelectTrack`
   - Inject tweaks into code before `playCode()` and save
   - Add `<TweaksPanel>` between `<PlayerControls>` and `<ConsolePanel>`
   - Pass `playerState` to TweaksPanel for real-time update logic

2. `lib/types/tracks.ts`
   - No changes needed (tweaks stored in code string)

#### Implementation Order

1. Create `lib/types/tweaks.ts` - types and defaults
2. Create `lib/audio/tweaksInjector.ts` - code transformation
3. Create `components/studio/TweakSlider.tsx` - reusable slider
4. Create `components/studio/TweaksPanel.tsx` - main container
5. Integrate into `app/studio/page.tsx` - wire up state
6. Write tests for all new modules
7. Run quality gates and fix any issues

#### Test Plan

- [ ] TweaksPanel exports correctly
- [ ] TweakSlider renders with correct min/max/value
- [ ] BPM slider updates within 60-200 range
- [ ] Swing slider updates within 0-100% range
- [ ] Filter slider updates within 100-10000 Hz range
- [ ] Reverb slider updates within 0-100% range
- [ ] Delay slider updates within 0-100% range
- [ ] tweaksToComment produces valid JSON comment
- [ ] commentToTweaks parses TWEAKS comment correctly
- [ ] injectTweaks adds tweaks code block
- [ ] extractTweaks retrieves tweaks from code
- [ ] Reset button restores DEFAULT_TWEAKS
- [ ] Real-time updates work while playing

#### Docs to Update

- None required (feature is self-explanatory, UI-discoverable)

#### UI/UX Details

**TweaksPanel Layout**:

```
┌─ Tweaks (click to expand/collapse) ──────────────┐
│ BPM          [=====|=====]  82                   │
│ Swing        [=|=========]  8%                   │
│ Filter       [========|==]  8000 Hz              │
│ Reverb       [==|========]  25%                  │
│ Delay        [==|========]  20%                  │
│                                                  │
│  [Reset to Defaults]                             │
└──────────────────────────────────────────────────┘
```

**Slider Styling** (matching existing UI):

- Track: `bg-slate-800 h-1.5 rounded-full`
- Thumb: `bg-cyan-500 w-3 h-3 rounded-full cursor-pointer`
- Active track: `bg-gradient-to-r from-cyan-600 to-cyan-400`

**Panel Styling** (matching ConsolePanel):

- Container: `rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm`
- Header: `px-3 py-2 border-b border-cyan-500/20 bg-slate-900/50`
- Expand/collapse chevron animation

#### Tweaks Code Injection Format

Input code:

```javascript
Tone.Transport.bpm.value = 82;
Tone.Transport.swing = 0.08;
// ... rest of code
```

After injection with tweaks `{bpm: 90, swing: 0.15, filter: 6000, reverb: 0.4, delay: 0.3}`:

```javascript
// TWEAKS: {"bpm":90,"swing":0.15,"filter":6000,"reverb":0.4,"delay":0.3}
Tone.Transport.bpm.value = 90;
Tone.Transport.swing = 0.15;
// ... rest of code (with masterLowpass/masterReverb/tapeDelay values updated)
```

The injector will:

1. Parse existing BPM/swing lines and replace values
2. Find `masterLowpass` filter frequency and update
3. Find `masterReverb` wet value and update
4. Find `tapeDelay` wet value and update

---

## Work Log

### 2026-01-24 14:32 - Verification Complete

Task location: done/
Status field: matches (done)
Acceptance criteria: 12/12 checked

Issues found:

- None

Actions taken:

- Verified task file state is correct
- Confirmed all acceptance criteria are checked
- Work log has complete entries for all phases
- Committing task files to git

Task verified: PASS

### 2026-01-24 14:31 - Review Complete

**Code review**:

- Issues found: none
- Issues fixed: N/A

**Consistency**:

- All criteria met: yes
- Test coverage adequate: yes (154 new tests, 883 total passing)
- Docs in sync: yes (JSDoc comments accurate)

**Quality gates final verification**:

- ESLint: pass
- TypeScript: pass (tsc --noEmit clean)
- Prettier: pass
- Tests: 883 passing, 0 failures

**Follow-up tasks created**: none (feature complete as specified)

**Code review checklist**:

| Check                         | Status | Notes                                    |
| ----------------------------- | ------ | ---------------------------------------- |
| Code follows project patterns | ✅     | TweaksPanel follows ConsolePanel pattern |
| No code smells                | ✅     | Clean functional components with hooks   |
| Error handling appropriate    | ✅     | Graceful fallbacks with console.warn     |
| No security vulnerabilities   | ✅     | Safe JSON parsing with try/catch         |
| No N+1 queries                | ✅     | N/A - no DB queries                      |
| Proper transactions           | ✅     | N/A - no DB changes                      |

**Final status**: COMPLETE

### 2026-01-24 14:28 - Documentation Sync

**Docs updated**:

- No external docs needed - feature is self-explanatory and UI-discoverable
- All new files have JSDoc comments:
  - `lib/types/tweaks.ts` - Interface and constant documentation
  - `lib/audio/tweaksInjector.ts` - Function documentation with usage examples in header comment

**Annotations**:

- N/A - This is a Next.js/TypeScript project, no Rails model annotations

**Consistency checks**:

- [x] Code matches docs (JSDoc comments accurate)
- [x] No broken links in codebase
- [x] Schema annotations current (N/A - no DB changes)

**Notes section updated** to reflect actual implementation (Tone.js, not Strudel).

### 2026-01-24 14:19 - Implementation Complete

**Implementation Progress**:

- Completed: All 5 implementation steps
- Files created:
  - `lib/types/tweaks.ts` - Types and defaults (commit: 6773858)
  - `lib/audio/tweaksInjector.ts` - Code transformation (commit: 8a0ba77)
  - `components/studio/TweakSlider.tsx` - Reusable slider (commit: 0fbe76c)
  - `components/studio/TweaksPanel.tsx` - Main container (commit: 40a53f6)
- Files modified:
  - `app/studio/page.tsx` - Integrated tweaks state and panel (commit: ba0463a)
- Quality check: ESLint and Prettier passing
- Next: Tests phase will write tests

**Commits made**:

1. `6773858` - Add tweaks types and defaults
2. `8a0ba77` - Add tweaks injector for code transformation
3. `0fbe76c` - Add TweakSlider component for parameter control
4. `40a53f6` - Add TweaksPanel component with collapsible UI
5. `ba0463a` - Integrate TweaksPanel into studio page

### 2026-01-24 14:21 - Planning Complete

**Codebase Analysis**:

- Analyzed audio architecture: App uses **Tone.js** (not Strudel as originally thought)
- Found runtime singleton at `lib/audio/runtime.ts` with `play(code, keepPosition)` for live updates
- Identified existing collapsible panel pattern in `ConsolePanel.tsx`
- Reviewed existing test patterns in `components/studio/__tests__/`
- Confirmed no existing tweaks or slider components

**Architecture Decisions Made**:

1. **Persistence via code injection** - Avoids DB migration, stores `// TWEAKS: {json}` comment
2. **Reusable TweakSlider component** - Custom styled range input matching existing UI
3. **Real-time updates via play(code, true)** - Existing runtime API supports this
4. **State lifted to page.tsx** - Matches existing pattern for track/code state

**Files Identified**:

- 7 new files to create (2 components, 1 types, 1 utils, 3 test files)
- 1 file to modify (app/studio/page.tsx)

**Ready for implementation phase**.

### 2026-01-24 14:14 - Triage Complete

- Dependencies: None listed, all prior 003-series tasks (003-001 through 003-005) completed
- Task clarity: Clear - well-defined acceptance criteria with specific slider controls and behavior
- Ready to proceed: Yes
- Notes:
  - No existing tweaks or slider components found - this is a new feature
  - Will need to research Strudel's runtime parameter control API
  - Consider integration with existing track persistence (003-001-save-tracks-db)
  - Acceptance criteria are specific and testable

---

## Testing Evidence

### 2026-01-24 14:27 - Tests Complete

**Tests written**:

- `lib/types/__tests__/tweaks.test.ts` - 22 examples
- `lib/audio/__tests__/tweaksInjector.test.ts` - 35 examples
- `components/studio/__tests__/TweakSlider.test.ts` - 46 examples
- `components/studio/__tests__/TweaksPanel.test.ts` - 51 examples

**Test results**:

- Total: 883 examples, 0 failures (154 new tests added)
- All existing tests continue to pass

**Quality gates**:

- ESLint: pass
- TypeScript: pass
- Prettier: pass

**Commit**: `553e0c2` - Add tests for tweaks feature

---

## Notes

- Implementation uses Tone.js (not Strudel) for audio engine
- Tweaks persisted via JSON comment injection in code: `// TWEAKS: {...}`
- Real-time updates use `getAudioRuntime().play(code, true)` with keepPosition flag
- Consider MIDI controller support in future enhancement

---

## Links

- Tone.js docs: https://tonejs.github.io/
- Implementation files:
  - `lib/types/tweaks.ts` - Types and defaults
  - `lib/audio/tweaksInjector.ts` - Code transformation
  - `components/studio/TweakSlider.tsx` - Reusable slider
  - `components/studio/TweaksPanel.tsx` - Main panel
  - `app/studio/page.tsx:337-652` - Integration
