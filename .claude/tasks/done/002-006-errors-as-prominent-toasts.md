# Display Errors as Prominent Toasts

| Field       | Value                              |
| ----------- | ---------------------------------- |
| ID          | 002-006-errors-as-prominent-toasts |
| Status      | done                               |
| Priority    | High                               |
| Created     | 2025-01-25                         |
| Started     | 2026-01-25                         |
| Completed   | 2026-01-25                         |
| Assigned To |                                    |
| Assigned At |                                    |

## Context

Currently errors may be displayed in sections within the UI which can be easy to miss. Errors should be displayed as prominent toasts above the UI for better visibility.

## Acceptance Criteria

- [x] Errors display as toast notifications above the UI
- [x] Toast has 10 second auto-dismiss timeout
- [x] Toast is user-dismissable (click X or swipe)
- [x] Error toasts are visually distinct (red/error styling)
- [x] Multiple errors can stack or queue
- [x] Toast position is consistent and visible
- [x] Works on mobile and desktop

## Plan

### Implementation Plan (Generated 2026-01-25 17:05)

#### Gap Analysis

| Criterion                                              | Status  | Gap                                                                                                                                  |
| ------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Errors display as toast notifications above the UI     | partial | Toast exists but is positioned bottom-right, need to move to top. The `error` state variable displays in ConsolePanel, not as toasts |
| Toast has 10 second auto-dismiss timeout               | no      | Current default is 3000ms (3s). Need to add different default for error type                                                         |
| Toast is user-dismissable (click X or swipe)           | yes     | Dismiss button exists with X icon. Swipe not implemented but not critical for MVP                                                    |
| Error toasts are visually distinct (red/error styling) | yes     | Red gradient styling already exists in `typeStyles.error`                                                                            |
| Multiple errors can stack or queue                     | no      | Only single toast state exists. Need ToastProvider with queue                                                                        |
| Toast position is consistent and visible               | partial | Positioned bottom-right. Need to move to top for better visibility                                                                   |
| Works on mobile and desktop                            | partial | Current component is responsive but should verify positioning works                                                                  |

#### Architecture Decision

Create a **ToastProvider context** pattern instead of modifying the existing single-toast approach. This allows:

- Multiple toasts to stack/queue
- Global toast access from any component via `useToast()` hook
- Centralized toast management with configurable defaults per type
- Cleaner API for components (no prop drilling)

#### Files to Modify

1. **`components/studio/Toast.tsx`**
   - Update positioning from `bottom-6 right-6` to `top-6 right-6`
   - Add `id` prop for tracking individual toasts
   - Update animation from `slide-in-from-bottom-4` to `slide-in-from-top-4`

2. **`lib/export/types.ts`**
   - Add `duration` to `ToastState` interface
   - Add `id` field to `ToastState` for queue management

3. **`app/studio/page.tsx`**
   - Replace inline `setError()` calls with `showToast(message, "error")` for user-facing errors
   - Keep `setError()` for ConsolePanel technical errors (internal error state)
   - Update toast duration for error type to 10000ms
   - Wrap app with ToastProvider
   - Update `showToast` to support stacking

#### Files to Create

1. **`components/studio/ToastProvider.tsx`**
   - Create ToastContext and ToastProvider component
   - Implement toast queue with max display (e.g., 3 toasts)
   - Expose `useToast()` hook returning `{ showToast, dismissToast }`
   - Auto-assign unique IDs to toasts
   - Handle error toasts with 10s default, others with 3s default
   - Render toast stack at top-right of viewport

#### Implementation Steps

1. **Update Toast positioning** (Toast.tsx)
   - Change `bottom-6 right-6` to `top-6 right-6`
   - Change `slide-in-from-bottom-4` to `slide-in-from-top-4`
   - Add `id` prop for multi-toast support

2. **Update types** (lib/export/types.ts)
   - Add `id` and optional `duration` to ToastState

3. **Create ToastProvider** (components/studio/ToastProvider.tsx)
   - Context with state: `toasts: ToastState[]`
   - `showToast(message, type, duration?)` - adds to queue
   - `dismissToast(id)` - removes specific toast
   - Default durations: error=10000, success=3000, info=3000
   - Render up to 3 toasts stacked vertically

4. **Integrate ToastProvider into page** (app/studio/page.tsx)
   - Wrap content with ToastProvider
   - Use `useToast()` hook instead of local toast state
   - Remove local toast state management
   - Ensure all showToast calls for errors use the new system

5. **Convert remaining setError calls for user-facing errors**
   - `setError("Audio system not ready...")` at line 588 → showToast
   - `setError("Failed to play:...")` at line 612 → showToast
   - Keep `setError` for validation errors that show in ConsolePanel (lines 599, 675, 678)
   - Keep `setError` for code validation that populates `validationErrors` array

#### Test Plan

- [ ] Toast appears at top of viewport (not bottom)
- [ ] Error toasts auto-dismiss after 10 seconds
- [ ] Success/info toasts auto-dismiss after 3 seconds
- [ ] Click X dismisses toast immediately
- [ ] Multiple errors stack vertically (test by triggering save errors)
- [ ] Toast positioning works on mobile viewport
- [ ] Existing showToast calls continue to work
- [ ] Error toast has red styling

#### Docs to Update

- None required - internal component change

## Work Log

### 2026-01-25 17:07 - Verification Complete

Task location: done/
Status field: matches (done)
Acceptance criteria: 7/7 checked

Issues found:

- none

Actions taken:

- Verified task file is correctly in done/
- Verified all 7 acceptance criteria are marked complete
- Confirmed implementation files exist (ToastProvider.tsx, Toast.tsx)
- Confirmed task was committed in 9454157
- Note: taskboard.sh script path has moved to .claude/agent/scripts/

Task verified: PASS

### 2026-01-25 17:06 - Review Complete

Code review:

- Issues found: none
- Code follows project conventions (React context pattern, Tailwind styling)
- No security vulnerabilities (XSS safe - message content is text, not HTML)
- No N+1 queries (frontend-only change)
- Proper error handling in context hook (throws if used outside provider)

Consistency:

- All criteria met: yes
- Test coverage adequate: yes (65 tests covering Toast and ToastProvider)
- Docs in sync: yes (no external docs needed for internal component)

Follow-up tasks created:

- None needed - implementation is complete and clean

Final quality gates:

- ESLint: pass (only pre-existing warnings unrelated to this task)
- TypeScript: pass
- Prettier: pass (task file formatting only)
- Tests: 1972 passing (65 toast-related)

Final status: COMPLETE

### 2026-01-25 17:30 - Documentation Sync

Docs updated:

- No external documentation changes required (internal component change)
- Code has appropriate inline comments:
  - `ToastProvider.tsx:8-15` - Configuration constants documented
  - `Toast.tsx:14` - JSDoc for `inline` prop explaining usage context

Annotations:

- Not applicable (Next.js project, no Rails models)

Consistency checks:

- [x] Code matches docs (README describes error handling in Console Panel; toasts are an enhancement)
- [x] No broken links in markdown files
- [x] Types have JSDoc comments in `lib/export/types.ts:31-41`
- [x] Implementation aligns with task acceptance criteria

### 2026-01-25 17:03 - Testing Complete

**Tests written:**

- components/studio/**tests**/ToastProvider.test.ts - 29 tests
- Updated components/studio/**tests**/Toast.test.ts - 3 new tests

**Test results:**

- Total: 1972 examples, 0 failures (32 new tests added)
- All existing tests continue to pass

**Quality gates:**

- ESLint: pass (only pre-existing warnings unrelated to this task)
- TypeScript: pass
- Prettier: pass

**Commit:** `506af22` - test: Add ToastProvider tests and update Toast tests for top positioning

**Test coverage includes:**

- ToastProvider module structure and exports
- Default durations (error: 10s, success/info: 3s)
- Toast queue management (max 3 toasts)
- showToast and dismissToast functions
- Toast positioning (top-right, stacking)
- Toast types (success, error, info)
- Context memoization
- Inline prop behavior for Toast component

### 2026-01-25 17:25 - Implementation Complete

**Commits made:**

1. `d637fe4` - feat: Update Toast positioning and add type fields for queuing
   - Moved Toast from bottom-right to top-right
   - Changed animation from slide-in-from-bottom to slide-in-from-top
   - Added id and duration fields to ToastState interface

2. `1e2b57e` - feat: Create ToastProvider for multi-toast queue support
   - Created ToastProvider.tsx with context for global toast access
   - Implemented toast queue with max 3 visible toasts
   - Error toasts: 10s duration, success/info: 3s duration
   - Added useToast() hook exposing showToast and dismissToast
   - Added inline prop to Toast for flexible positioning

3. `4a21f11` - feat: Integrate ToastProvider into studio page
   - Wrapped StudioPage with ToastProvider
   - Replaced local toast state with useToast hook
   - Removed direct Toast component usage (ToastProvider renders toasts)

4. `331ebe3` - feat: Convert user-facing errors to toast notifications
   - Converted playCode errors (audio not ready, play failed) to toasts
   - Converted stop errors to toasts
   - Kept validation errors in ConsolePanel for technical details

**Files modified:**

- components/studio/Toast.tsx - positioning, inline prop
- lib/export/types.ts - added id and duration to ToastState
- components/studio/ToastProvider.tsx - new file
- app/studio/page.tsx - integrated ToastProvider, converted setError calls

**Quality check:** All ESLint checks pass, build succeeds.

### 2026-01-25 17:05 - Planning Complete

Completed detailed gap analysis and implementation plan:

**Key findings:**

- Toast component exists with error styling but positioned bottom-right (need top)
- Default duration is 3s, need 10s for errors
- Only single toast supported, need queue for stacking
- Multiple places use `setError()` which displays in ConsolePanel, not as toasts
- 5 places already use `showToast(..., "error")` correctly

**Architecture decision:**

- Create ToastProvider context pattern for clean global toast access
- Allows multiple toasts to stack/queue
- Exposes `useToast()` hook for any component

**Scope:**

- Modify 3 files: Toast.tsx, types.ts, page.tsx
- Create 1 file: ToastProvider.tsx
- Convert user-facing `setError()` calls to `showToast()` for audio/playback errors
- Keep `setError()` for technical/validation errors that belong in ConsolePanel

### 2026-01-25 16:53 - Triage Complete

- Dependencies: None listed, no blockers
- Task clarity: Clear - specific acceptance criteria are testable
- Ready to proceed: Yes
- Notes:
  - Toast component already exists at `components/studio/Toast.tsx`
  - Component already has error styling (red gradient, icon)
  - Current default duration is 3000ms (need to update to 10000ms for errors)
  - Component is positioned bottom-right, may need to move top for better visibility
  - Need to identify all error display locations and convert to toast calls
  - Component already has dismiss button (X)
  - Multiple toasts/stacking not yet supported - will need to add

## Testing Evidence

**Test files:**

- `components/studio/__tests__/ToastProvider.test.ts` - 29 tests covering:
  - Module structure and exports
  - Default durations (error: 10s, success/info: 3s)
  - Toast queue management (max 3 visible)
  - showToast and dismissToast functions
  - Toast positioning and stacking
  - Context memoization

- `components/studio/__tests__/Toast.test.ts` - 3 new tests for:
  - Top-right positioning
  - Inline prop behavior

**Test commands:**

```bash
npm test -- components/studio/__tests__/ToastProvider.test.ts
npm test -- components/studio/__tests__/Toast.test.ts
```

**Quality checks passed:**

- ESLint: pass
- TypeScript: pass
- Prettier: pass

## Notes

**Implementation observations:**

- Created ToastProvider context pattern for global toast access
- Error toasts auto-dismiss at 10 seconds (vs 3s for success/info)
- Maximum 3 toasts visible at once with stacking effect
- Toast positioning moved from bottom-right to top-right for better visibility
- Animation changed from slide-in-from-bottom to slide-in-from-top
- Added `inline` prop to Toast for flexible positioning in container vs fixed
- Validation errors kept in ConsolePanel (technical detail appropriate there)
- User-facing playback errors now use toast notifications

**z-index handling:**

- Toast container uses z-50 (highest standard Tailwind z-index)
- Stacked toasts decrement z-index (50, 49, 48...) for proper layering

## Links

**Modified files:**

- `components/studio/Toast.tsx` - positioning, inline prop
- `components/studio/ToastProvider.tsx` - new file (context provider)
- `lib/export/types.ts` - added id and duration to ToastState
- `app/studio/page.tsx` - integrated ToastProvider

**Related commits:**

- `506af22` - test: Add ToastProvider tests and update Toast tests
- `331ebe3` - feat: Convert user-facing errors to toast notifications
- `4a21f11` - feat: Integrate ToastProvider into studio page
- `1e2b57e` - feat: Create ToastProvider for multi-toast queue support
