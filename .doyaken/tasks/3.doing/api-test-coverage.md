# Add Test Coverage for API Routes

**Priority:** HIGH
**Category:** Tech Debt / Testing
**Source:** Periodic Review 2026-01-30
**Status:** doing
**Started:** 2026-02-01 16:58
**Assigned To:** worker-1

---

## Context

**Intent**: BUILD

This task adds unit test coverage for the 24 API routes in the codebase. Currently, there is only one test file for Supabase client utilities (`lib/supabase/__tests__/client.test.ts`) and E2E tests for the studio page. No API routes have unit tests.

The project uses:

- **Vitest** as the test runner (v4.0.18)
- **Next.js 16** with App Router (route handlers in `app/api/`)
- **Supabase** for authentication and database
- Existing mock infrastructure: `lib/supabase/mock.ts` provides a mock client for E2E testing

API routes follow consistent patterns:

1. Authentication check via `supabase.auth.getUser()`
2. Database operations via Supabase client
3. JSON responses with standard error handling
4. Some routes use `createServiceClient()` for admin/public operations

---

## Acceptance Criteria

- [ ] Test utility created for mocking Supabase server client
- [ ] Test utility created for testing Next.js API route handlers
- [ ] Critical routes tested (auth/data):
  - [ ] `/api/profile` (GET, PATCH)
  - [ ] `/api/favorites` (GET)
  - [ ] `/api/tracks/[id]/like` (GET, POST, DELETE)
- [ ] High priority routes tested (core features):
  - [ ] `/api/explore` (GET)
  - [ ] `/api/explore/featured` (GET)
  - [ ] `/api/explore/play` (POST)
  - [ ] `/api/tracks/[id]` (GET, PATCH, DELETE)
  - [ ] `/api/tracks` (GET, POST)
- [ ] Medium priority routes tested:
  - [ ] `/api/chat` (POST)
  - [ ] `/api/admin/stats` (GET)
- [ ] Tests cover success and error cases
- [ ] Tests verify authentication requirements
- [ ] Tests validate input handling
- [ ] All tests pass with `npm test`
- [ ] Quality gates pass (lint, typecheck)
- [ ] Changes committed with task reference

---

## Notes

**In Scope:**

- Creating reusable test utilities for API route testing
- Mock utilities for Supabase server client
- Unit tests for critical and high priority routes (minimum viable coverage)
- Tests for authentication enforcement
- Tests for input validation
- Tests for success and error response paths

**Out of Scope:**

- Integration tests with real Supabase
- E2E tests for API routes (existing E2E infrastructure covers UI flows)
- Coverage for all 24 routes in first pass (incremental approach)
- Auth callback routes (`/api/auth/*`) - complex OAuth flows better tested via E2E
- Admin routes beyond `/api/admin/stats`

**Assumptions:**

- Vitest configuration is sufficient (jsdom environment may need adjustment for API tests)
- Existing mock client pattern from `lib/supabase/mock.ts` can be adapted for unit tests
- Route handlers can be imported and tested directly

**Edge Cases:**

- Unauthenticated requests → 401 response
- Invalid input → 400 response
- Missing resources → 404 response
- Database errors → 500 response
- Rate limiting (for `/api/explore/play`) → graceful handling
- Admin-only routes → 403 for non-admins

**Risks:**

- Next.js route handler testing may require special setup for `cookies()` and `headers()` APIs
  - Mitigation: Create mock utilities for these Next.js functions
- Mock complexity for Supabase chainable query builder
  - Mitigation: Leverage existing mock pattern from `lib/supabase/mock.ts`
- Large scope may take significant time
  - Mitigation: Prioritize critical routes, tackle incrementally

---

## API Routes Inventory (24 total)

### Critical (Auth/Data) - Priority 1

| Route                   | Methods           | Auth               | Notes               |
| ----------------------- | ----------------- | ------------------ | ------------------- |
| `/api/profile`          | GET, PATCH        | Required           | User profile CRUD   |
| `/api/favorites`        | GET               | Required           | User's liked tracks |
| `/api/tracks/[id]/like` | GET, POST, DELETE | Required for write | Like/unlike tracks  |

### High Priority (Core Features) - Priority 2

| Route                   | Methods            | Auth     | Notes                               |
| ----------------------- | ------------------ | -------- | ----------------------------------- |
| `/api/explore`          | GET                | None     | Public track discovery              |
| `/api/explore/featured` | GET                | None     | Featured tracks                     |
| `/api/explore/play`     | POST               | None     | Increment play count (rate-limited) |
| `/api/tracks`           | GET, POST          | Required | List/create tracks                  |
| `/api/tracks/[id]`      | GET, PATCH, DELETE | Required | Track CRUD                          |
| `/api/projects`         | GET, POST          | Required | Project management                  |
| `/api/projects/[id]`    | GET, PATCH, DELETE | Required | Project CRUD                        |

### Medium Priority - Priority 3

| Route                                       | Methods           | Auth     | Notes                |
| ------------------------------------------- | ----------------- | -------- | -------------------- |
| `/api/chat`                                 | POST              | Required | AI chat (complex)    |
| `/api/admin/stats`                          | GET               | Admin    | Admin statistics     |
| `/api/admin/users`                          | GET               | Admin    | User list            |
| `/api/admin/users/[id]`                     | GET, PATCH        | Admin    | User management      |
| `/api/admin/seed-presets`                   | POST              | Admin    | Seed data            |
| `/api/tracks/[id]/revisions`                | GET, POST         | Required | Track revisions      |
| `/api/tracks/[id]/revisions/[revisionId]`   | GET               | Required | Revision detail      |
| `/api/tracks/[id]/recordings`               | GET, POST         | Required | Audio recordings     |
| `/api/tracks/[id]/recordings/[recordingId]` | GET, DELETE       | Required | Recording management |
| `/api/tracks/[id]/share`                    | POST              | Required | Share link creation  |
| `/api/share/[token]`                        | GET               | None     | Public share access  |
| `/api/api-keys`                             | GET, POST, DELETE | Required | API key management   |
| `/api/validate-key`                         | POST              | None     | Key validation       |
| `/api/usage`                                | GET               | Required | Usage stats          |

---

## Files to Create

```
lib/test-utils/
  api-route.ts       # Utilities for testing Next.js route handlers
  supabase-mock.ts   # Mock Supabase client for unit tests

app/api/profile/__tests__/
  route.test.ts

app/api/favorites/__tests__/
  route.test.ts

app/api/tracks/[id]/like/__tests__/
  route.test.ts

app/api/explore/__tests__/
  route.test.ts

app/api/explore/featured/__tests__/
  route.test.ts

app/api/explore/play/__tests__/
  route.test.ts

app/api/tracks/__tests__/
  route.test.ts

app/api/tracks/[id]/__tests__/
  route.test.ts

app/api/chat/__tests__/
  route.test.ts

app/api/admin/stats/__tests__/
  route.test.ts
```

---

## Plan

### Gap Analysis

| Criterion                                         | Status | Gap                                                                  |
| ------------------------------------------------- | ------ | -------------------------------------------------------------------- |
| Test utility for mocking Supabase server client   | none   | `lib/supabase/mock.ts` exists for E2E but not adapted for unit tests |
| Test utility for Next.js API route handlers       | none   | Need to mock `cookies()`, `headers()` from `next/headers`            |
| `/api/profile` tests (GET, PATCH)                 | none   | No tests exist                                                       |
| `/api/favorites` tests (GET)                      | none   | No tests exist                                                       |
| `/api/tracks/[id]/like` tests (GET, POST, DELETE) | none   | No tests exist                                                       |
| `/api/explore` tests (GET)                        | none   | No tests exist                                                       |
| `/api/explore/featured` tests (GET)               | none   | No tests exist                                                       |
| `/api/explore/play` tests (POST)                  | none   | No tests exist                                                       |
| `/api/tracks/[id]` tests (GET, PUT, DELETE)       | none   | No tests exist                                                       |
| `/api/tracks` tests (GET, POST)                   | none   | No tests exist                                                       |
| `/api/chat` tests (POST)                          | none   | No tests exist (complex, many external deps)                         |
| `/api/admin/stats` tests (GET)                    | none   | No tests exist                                                       |

### Risks

- [x] Next.js `cookies()` and `headers()` APIs need mocking
  - Mitigation: Create vi.mock for `next/headers` in test utilities
- [x] Supabase chainable query builder is complex to mock
  - Mitigation: Adapt existing `lib/supabase/mock.ts` pattern for unit tests
- [x] Routes import `createClient` which calls `cookies()` at module level
  - Mitigation: Mock at module level before importing route handlers
- [x] `/api/chat` has many external dependencies (OpenAI, rate limiting, etc.)
  - Mitigation: Test simpler routes first, `/api/chat` may be deferred if complex
- [x] `/api/explore/play` has in-memory rate limiting state
  - Mitigation: Test core logic, reset state between tests

### Steps

1. **Create Supabase mock utility for unit tests**
   - File: `lib/test-utils/supabase-mock.ts`
   - Change: Create configurable mock client based on `lib/supabase/mock.ts` pattern
   - Verify: File compiles with TypeScript

2. **Create Next.js API route test utilities**
   - File: `lib/test-utils/api-route.ts`
   - Change: Create helpers for mocking `next/headers` (cookies, headers) and creating Request objects
   - Verify: File compiles with TypeScript

3. **Add tests for /api/profile route**
   - File: `app/api/profile/__tests__/route.test.ts`
   - Change: Test GET (auth required, returns profile), PATCH (validation, updates profile)
   - Verify: `npm test app/api/profile` passes

4. **Add tests for /api/favorites route**
   - File: `app/api/favorites/__tests__/route.test.ts`
   - Change: Test GET (auth required, returns liked tracks, empty state)
   - Verify: `npm test app/api/favorites` passes

5. **Add tests for /api/tracks/[id]/like route**
   - File: `app/api/tracks/[id]/like/__tests__/route.test.ts`
   - Change: Test GET (like status), POST (like track, auth required), DELETE (unlike, auth required)
   - Verify: `npm test app/api/tracks` passes

6. **Add tests for /api/explore route**
   - File: `app/api/explore/__tests__/route.test.ts`
   - Change: Test GET (no auth, filtering, sorting, pagination)
   - Verify: `npm test app/api/explore` passes

7. **Add tests for /api/explore/featured route**
   - File: `app/api/explore/featured/__tests__/route.test.ts`
   - Change: Test GET (returns featured, trending, recent tracks)
   - Verify: `npm test app/api/explore` passes

8. **Add tests for /api/explore/play route**
   - File: `app/api/explore/play/__tests__/route.test.ts`
   - Change: Test POST (increment play count, rate limiting behavior)
   - Verify: `npm test app/api/explore` passes

9. **Add tests for /api/tracks route**
   - File: `app/api/tracks/__tests__/route.test.ts`
   - Change: Test GET (list tracks for project), POST (create track with validation)
   - Verify: `npm test app/api/tracks` passes

10. **Add tests for /api/tracks/[id] route**
    - File: `app/api/tracks/[id]/__tests__/route.test.ts`
    - Change: Test GET (single track), PUT (update track), DELETE (delete track)
    - Verify: `npm test app/api/tracks` passes

11. **Add tests for /api/admin/stats route**
    - File: `app/api/admin/stats/__tests__/route.test.ts`
    - Change: Test GET (admin required, returns stats), 403 for non-admin
    - Verify: `npm test app/api/admin` passes

12. **Add tests for /api/chat route (if time permits)**
    - File: `app/api/chat/__tests__/route.test.ts`
    - Change: Test POST (auth required, rate limiting, API key required)
    - Verify: `npm test app/api/chat` passes
    - Note: May be deferred due to complexity (OpenAI, streaming, validation)

13. **Run full test suite and quality gates**
    - File: N/A (verification step)
    - Change: Run `npm run ci` to verify all tests pass and quality gates met
    - Verify: Exit code 0, no lint/type errors

### Checkpoints

| After Step | Verify                                                |
| ---------- | ----------------------------------------------------- |
| Step 2     | Test utilities compile, can be imported without error |
| Step 5     | All Priority 1 (critical) routes have passing tests   |
| Step 10    | All Priority 2 (high) routes have passing tests       |
| Step 12    | All Priority 3 routes in scope have tests             |
| Step 13    | Full CI passes, ready for commit                      |

### Test Plan

Each route test should cover:

- [ ] Unit: Success case - authenticated request returns expected data
- [ ] Unit: Auth failure - 401 for unauthenticated requests on protected routes
- [ ] Unit: Validation - 400 for invalid input
- [ ] Unit: Not found - 404 for missing resources
- [ ] Unit: Error handling - 500 for database errors (mocked)
- [ ] Unit: Admin routes - 403 for non-admin users

### Docs to Update

- None required for this task (internal test infrastructure)

---

## Work Log

### 2026-02-01 17:16 - Implementation Complete

**Files created:**

- `lib/test-utils/index.ts` - Export barrel
- `lib/test-utils/supabase-mock.ts` - Configurable Supabase mock client
- `lib/test-utils/api-route.ts` - Request/response helpers for route testing
- `app/api/profile/__tests__/route.test.ts` - 13 tests (GET, PATCH with validation)
- `app/api/favorites/__tests__/route.test.ts` - 5 tests (GET with auth)
- `app/api/tracks/[id]/like/__tests__/route.test.ts` - 10 tests (GET, POST, DELETE)
- `app/api/explore/__tests__/route.test.ts` - 7 tests (filtering, sorting, pagination)
- `app/api/explore/featured/__tests__/route.test.ts` - 4 tests (featured/trending/recent)
- `app/api/explore/play/__tests__/route.test.ts` - 6 tests (rate limiting, play count)
- `app/api/tracks/__tests__/route.test.ts` - 10 tests (GET, POST with validation)
- `app/api/tracks/[id]/__tests__/route.test.ts` - 6 tests (auth, validation)
- `app/api/admin/stats/__tests__/route.test.ts` - 5 tests (auth, admin check)

**Results:**

- 66 new API route tests added
- Test count: 2464 → 2530 (+66)
- Quality gates: lint (warnings only), typecheck ✓, tests ✓
- `/api/chat` deferred - complex dependencies (OpenAI, streaming)

**Verification:**

- `npm run lint` - 14 warnings (no errors)
- `npm run typecheck` - passes
- `npm test` - 2530 tests pass

### 2026-02-01 17:15 - Planning Complete

- Steps: 13
- Risks: 5 (all mitigated)
- Test coverage: extensive (10 API routes, ~25 route handlers)
- Key insight: Existing `lib/supabase/mock.ts` provides excellent pattern for chainable query builder
- Key insight: Routes use `createClient()` which is async and calls `cookies()` - must mock before import
- Approach: Create test utilities first (Steps 1-2), then test routes by priority (Critical → High → Medium)
- `/api/chat` may be deferred to follow-up task if complexity exceeds budget

### 2026-02-01 17:00 - Task Expanded

- Intent: BUILD
- Scope: Add unit test coverage for API routes, starting with critical and high priority routes
- Key files to create: Test utilities and test files for ~10 routes
- Key files to modify: Possibly `vitest.config.ts` for API test environment
- Complexity: HIGH (24 routes total, significant test infrastructure needed)
- Approach: Incremental - test utilities first, then critical routes, then high priority

### 2026-02-01 16:58 - Triage Complete

Quality gates:

- Lint: `npm run lint`
- Types: `npm run typecheck`
- Tests: `npm test` (Vitest)
- Build: `npm run build`
- Full CI: `npm run ci` (quality + all tests)

Task validation:

- Context: clear - well-documented existing patterns, mock infrastructure, API inventory
- Criteria: specific - 10 routes prioritized with clear acceptance criteria
- Dependencies: none - no blocking tasks (refactor-large-files is DEFERRED/LOW priority)

Complexity:

- Files: many (~12 new test files + 2 utility files)
- Risk: medium - Next.js route handler testing may need special setup for `cookies()` and `headers()` APIs

Infrastructure assessment:

- Vitest v4.0.18 with jsdom environment ✓
- Existing mock infrastructure: `lib/supabase/mock.ts` provides chainable query builder ✓
- 86 test files, 2464 tests currently passing ✓
- Test patterns established in codebase ✓

Ready: yes
