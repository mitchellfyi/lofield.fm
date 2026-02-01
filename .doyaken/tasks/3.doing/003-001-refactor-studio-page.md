# Refactor Studio Page Component

**Priority:** 003 (Medium)
**Labels:** technical-debt, refactor
**Created:** 2026-02-01

## Problem

The `app/studio/page.tsx` file is **1612 lines** - significantly exceeding the recommended 500 line limit. This large monolithic component:
- Makes the code harder to understand and maintain
- Increases cognitive load when debugging
- Makes testing individual features difficult
- Slows down development when multiple features need changes

## Proposed Solution

Extract logical sections into dedicated components/hooks:

### 1. Extract State Management Hooks
- `useStudioState()` - Core editor state (code, layers, tweaks)
- `useRecordingState()` - Recording capture/playback state
- `useSaveState()` - Track save/draft/revision state

### 2. Extract UI Sections
- `DesktopLayout.tsx` - Three-column desktop layout
- `MobileLayout.tsx` - Tabbed mobile layout
- `RecordingControls.tsx` - Recording timeline + playback controls

### 3. Extract Command Palette Commands
- Move commands array to `lib/commands/studioCommands.ts`

## Acceptance Criteria

- [ ] `app/studio/page.tsx` is under 400 lines
- [ ] All extracted components have proper TypeScript interfaces
- [ ] No functionality changes - pure refactor
- [ ] All existing tests still pass

## Estimated Effort

Medium (2-4 hours)

## Interest/Principal Matrix

- **Interest Rate:** Medium - Slows future feature development
- **Principal:** Medium - Requires careful refactoring to preserve behavior
