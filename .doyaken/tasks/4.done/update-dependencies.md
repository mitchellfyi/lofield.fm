# Update Outdated Dependencies

**Priority:** MEDIUM
**Category:** Tech Debt
**Source:** Periodic Review 2026-01-30
**Status:** COMPLETED

## Problem

12 dependencies are outdated and may have security vulnerabilities or missing bug fixes.

## Updates Applied (2026-01-30)

### Security Fix

- `next` 16.1.4 → 16.1.6 (Fixed HIGH severity DoS vulnerabilities)
- `eslint-config-next` 16.1.4 → 16.1.6

### Minor Updates

- `@ai-sdk/openai` 3.0.18 → 3.0.23
- `@ai-sdk/react` 3.0.50 → 3.0.64
- `@doyaken/doyaken` 0.1.13 → 0.1.14
- `@sentry/nextjs` 10.36.0 → 10.38.0
- `@supabase/supabase-js` 2.91.1 → 2.93.3
- `@types/react` 19.2.9 → 19.2.10
- `ai` 6.0.48 → 6.0.62

## Verification

- [x] `npm audit` shows 0 vulnerabilities
- [x] All 2464 tests pass
- [x] Lint passes
- [x] TypeScript type check passes

## Deferred

- `@types/node` 20.x → 25.x (major version, needs careful testing)
- `react`/`react-dom` 19.2.3 → 19.2.4 (released today, defer to next update)
