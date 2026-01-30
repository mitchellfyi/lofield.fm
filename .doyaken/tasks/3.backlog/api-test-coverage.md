# Add Test Coverage for API Routes

**Priority:** HIGH
**Category:** Tech Debt / Testing
**Source:** Periodic Review 2026-01-30
**Status:** DEFERRED - Significant effort required

## Problem

24 API routes have zero test coverage, making it risky to refactor or modify them.

## Note

This is a multi-day effort requiring:

- Test utility setup for mocking Supabase
- Writing tests for each route's success/error paths
- Testing authentication requirements

Recommend tackling incrementally when modifying specific routes.

## API Routes Needing Tests

### Critical (Auth/Data)

- `/api/auth/callback`
- `/api/auth/confirm`
- `/api/profile`
- `/api/favorites`
- `/api/tracks/[id]/like`

### High Priority (Core Features)

- `/api/explore`
- `/api/explore/featured`
- `/api/explore/play`
- `/api/project/[id]`
- `/api/project/[id]/track`

### Medium Priority

- `/api/presets`
- `/api/ai/chat`
- `/api/ai/improve`

## Implementation

1. Create test utilities for API route testing
2. Mock Supabase client for database operations
3. Test success and error paths
4. Test authentication requirements
5. Test input validation

## Files to Create

- `app/api/**/__tests__/*.test.ts` for each route

## Acceptance Criteria

- [ ] All critical API routes have tests
- [ ] Tests cover success and error cases
- [ ] Tests verify authentication requirements
- [ ] Tests validate input handling
