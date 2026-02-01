# Update Outdated Dependencies

**Priority:** 004 (Low)
**Labels:** technical-debt, dependencies
**Created:** 2026-02-01

## Problem

Several dependencies have newer patch/minor versions available:

| Package | Current | Latest | Risk |
|---------|---------|--------|------|
| @ai-sdk/openai | 3.0.23 | 3.0.25 | Low |
| @ai-sdk/react | 3.0.64 | 3.0.69 | Low |
| @doyaken/doyaken | 0.1.14 | 0.1.16 | Low |
| @playwright/test | 1.58.0 | 1.58.1 | Low |
| ai | 6.0.62 | 6.0.67 | Low |
| react | 19.2.3 | 19.2.4 | Low |
| react-dom | 19.2.3 | 19.2.4 | Low |

**Note:** `@types/node` has a major version jump (20 → 25) - evaluate separately.

## Good News

- **0 security vulnerabilities** reported by `npm audit`

## Proposed Solution

1. Update patch versions: `npm update`
2. Run full test suite to verify compatibility
3. Evaluate @types/node major upgrade separately

## Acceptance Criteria

- [ ] All patch updates applied
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] No new security vulnerabilities

## Estimated Effort

Small (30-60 minutes including testing)

## Interest/Principal Matrix

- **Interest Rate:** Low - All updates are patch versions
- **Principal:** Small - Low risk updates
