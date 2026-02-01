# Add Test Coverage Reporting

**Priority:** 004 (Low)
**Labels:** technical-debt, testing
**Created:** 2026-02-01

## Problem

Test coverage reporting is configured but missing the required dependency:

```
MISSING DEPENDENCY: Cannot find dependency '@vitest/coverage-v8'
```

Without coverage reports, it's difficult to identify untested code paths.

## Current State

- **95 test files** with **2530 tests** - excellent test count
- Tests pass in ~11 seconds
- No coverage data available

## Proposed Solution

1. Install coverage provider: `npm install -D @vitest/coverage-v8`
2. Run `npm run test:coverage` to generate reports
3. Add coverage thresholds to vitest.config.ts (recommend 70% minimum)
4. Optionally add to CI pipeline

## Acceptance Criteria

- [ ] `npm run test:coverage` works
- [ ] Coverage report shows line/branch/function metrics
- [ ] Coverage thresholds configured (optional)

## Estimated Effort

Small (15-30 minutes)

## Interest/Principal Matrix

- **Interest Rate:** Low - Doesn't block development
- **Principal:** Trivial - Single dependency install
