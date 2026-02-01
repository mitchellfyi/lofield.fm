# Refactor Track Browser Component

**Priority:** 003 (Medium)
**Labels:** technical-debt, refactor
**Created:** 2026-02-01

## Problem

The `components/studio/TrackBrowser.tsx` file is **563 lines** - slightly over the 500 line recommended limit. The component handles multiple concerns:
- Project listing and CRUD
- Track listing and CRUD
- Inline editing state
- Confirmation dialogs

## Proposed Solution

Extract into smaller, focused components:

### 1. Create Sub-components
- `ProjectListItem.tsx` - Single project row with expand/collapse
- `TrackListItem.tsx` - Single track row with actions
- `CreateProjectForm.tsx` - New project input form
- `CreateTrackForm.tsx` - New track input form

### 2. Extract Edit State Hook
- `useInlineEdit()` - Handles edit mode state, input value, commit/cancel

## Acceptance Criteria

- [ ] `TrackBrowser.tsx` is under 300 lines
- [ ] Sub-components have focused responsibilities
- [ ] All existing tests pass

## Estimated Effort

Small (1-2 hours)

## Interest/Principal Matrix

- **Interest Rate:** Low - Less frequently modified than studio page
- **Principal:** Small - Straightforward extraction
