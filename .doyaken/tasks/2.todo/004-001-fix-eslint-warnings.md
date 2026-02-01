# Fix ESLint Unused Variable Warnings

**Priority:** 004 (Low)
**Labels:** technical-debt, code-quality
**Created:** 2026-02-01

## Problem

There are **14 ESLint warnings** for unused variables in test files:

```
app/api/admin/stats/__tests__/route.test.ts - 6 warnings
app/api/explore/__tests__/route.test.ts - 4 warnings
app/api/explore/featured/__tests__/route.test.ts - 4 warnings
```

All are `@typescript-eslint/no-unused-vars` warnings for:
- `request` variables that are assigned but never used
- `table` callback parameters that are defined but never used

## Proposed Solution

1. Remove unused `request` variable assignments in test setup
2. Prefix unused callback parameters with underscore (`_table`)
3. Or use explicit void assignments where parameter must be received

## Acceptance Criteria

- [ ] `npm run lint` shows 0 warnings
- [ ] No functionality changes to tests

## Estimated Effort

Trivial (15-30 minutes)

## Interest/Principal Matrix

- **Interest Rate:** Very Low - Warnings don't affect runtime
- **Principal:** Trivial - Simple fixes
