# Refactor Large Files (>400 lines)

**Priority:** LOW
**Category:** Tech Debt
**Source:** Periodic Review 2026-01-30
**Status:** DEFERRED

## Problem

8 files exceed 400 lines, making them harder to maintain and test.

## Analysis (2026-01-30)

Most large files are **test files**, which are acceptable to be large:

- `RecordingTimeline.test.ts` (995 lines)
- `tracks.test.ts` (906 lines)
- `LayersPanel.test.ts` (850 lines)
- etc.

The main production code concern:

- `app/studio/page.tsx` (2123 lines) - Main studio page

The studio page is complex by nature and refactoring carries risk.
Recommend addressing only if actively modifying that area.

## Files to Refactor

Identify with: `find . -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20`

Common candidates:

- Page components with embedded logic
- API routes with complex business logic
- Hooks with multiple concerns

## Refactoring Strategies

1. **Extract Components**: Split large components into smaller ones
2. **Extract Hooks**: Move stateful logic into custom hooks
3. **Extract Utilities**: Move pure functions to utility files
4. **Separate Concerns**: Split API routes by responsibility

## Guidelines

- Each file should have a single responsibility
- Target ~200 lines for components
- Target ~150 lines for hooks
- Keep related code together if splitting would hurt readability

## Acceptance Criteria

- [ ] No files exceed 400 lines
- [ ] Tests still pass after refactoring
- [ ] Code remains readable and maintainable
- [ ] No functionality changes
