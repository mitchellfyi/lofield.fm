# Task: Observability - Error Tracking and Event Logging

## Metadata

| Field       | Value                   |
| ----------- | ----------------------- |
| ID          | `003-010-observability` |
| Status      | `done`                  |
| Priority    | `003` Medium            |
| Created     | `2026-01-23 12:00`      |
| Started     | `2026-01-24 16:58`      |
| Completed   | `2026-01-24 17:17`      |
| Blocked By  |                         |
| Blocks      |                         |
| Assigned To | |
| Assigned At | |

---

## Context

To maintain and improve the app, we need visibility into errors and usage patterns. This includes client errors, audio failures, LLM failures, and general event logging.

- Client errors: JS exceptions, React errors
- Audio failures: Strudel errors, audio context issues
- LLM failures: API errors, invalid responses
- Events: user actions, feature usage

---

## Acceptance Criteria

- [x] Error boundary for React errors
- [x] Client-side error reporting (Sentry or similar)
- [x] Server-side error logging
- [x] Strudel/audio error capture
- [x] LLM error tracking (API errors, validation failures)
- [x] Basic event logging (page views, feature usage)
- [x] Error dashboard or integration with logging service
- [x] Source maps for production debugging
- [x] Tests written and passing
- [x] Quality gates pass
- [x] Changes committed with task reference

---

## Plan

### Implementation Plan (Generated 2026-01-24 17:05)

#### Gap Analysis

| Criterion | Status | Gap |
|-----------|--------|-----|
| Error boundary for React errors | None | No `error.tsx`, `global-error.tsx`, or custom ErrorBoundary component exists |
| Client-side error reporting | None | No Sentry, LogRocket, or similar. Only `console.error/warn` scattered in code |
| Server-side error logging | Minimal | Basic try-catch with `console.error` in API routes. No structured logging |
| Strudel/audio error capture | Partial | `RuntimeEvent` tracked in `runtime.ts` (max 10 events, ephemeral). No external reporting |
| LLM error tracking | Partial | Retry logic exists. Validation errors tracked via headers. No persistent logging |
| Basic event logging | None | No analytics or event tracking infrastructure |
| Error dashboard or logging service | None | No integration with any logging/monitoring service |
| Source maps for production | None | `next.config.ts` is empty - no source map config |
| Tests | None | No observability-specific tests exist |

#### Approach Decision: Sentry vs. Lightweight

After analysis, **Sentry** is the recommended approach because:
1. First-class Next.js 16 support with `@sentry/nextjs`
2. Handles client, server, and edge runtime errors automatically
3. Source map upload built-in
4. Free tier (5K errors/month) sufficient for this project
5. Integrates with existing Vercel deployment
6. Provides error grouping, stack traces, and breadcrumbs

Alternative: A lightweight custom solution could use a logger lib + database storage, but this would require significant custom code for dashboards, alerting, and source map handling.

#### Files to Create

1. **`lib/observability/index.ts`** - Central observability module
   - `captureError(error, context)` - unified error capture
   - `captureEvent(name, data)` - event logging
   - `captureAudioError(error, code)` - audio-specific errors
   - `captureLLMError(error, context)` - LLM-specific errors
   - Abstracts Sentry so we can swap later if needed

2. **`lib/observability/sentry.ts`** - Sentry initialization and config
   - Client-side init
   - Server-side init
   - User context enrichment
   - Sampling configuration

3. **`app/error.tsx`** - Next.js route-level error boundary
   - Catches rendering errors in route segments
   - Shows user-friendly error UI
   - Reports to Sentry with context

4. **`app/global-error.tsx`** - Root-level error boundary
   - Catches errors in root layout
   - Required by Next.js for root-level recovery
   - Minimal fallback UI

5. **`components/studio/ErrorFallback.tsx`** - Studio-specific error UI
   - Reset button to recover from errors
   - Helpful error message
   - Report feedback option

6. **`instrumentation.ts`** - Next.js instrumentation hook
   - Server-side Sentry initialization
   - Required for Node.js runtime tracking
   - Catches server-side errors automatically

7. **`sentry.client.config.ts`** - Sentry client config
   - Browser-side initialization
   - Performance monitoring config
   - Replay session config (optional)

8. **`sentry.server.config.ts`** - Sentry server config
   - Node.js runtime initialization
   - Server transaction config

9. **`sentry.edge.config.ts`** - Sentry edge config
   - Edge runtime initialization (if needed)

#### Files to Modify

1. **`next.config.ts`** - Add Sentry integration
   - Import and wrap with `withSentryConfig`
   - Enable source map upload
   - Configure build options

2. **`app/layout.tsx`** - Initialize observability
   - Import Sentry client config
   - No changes to JSX needed (Sentry auto-wraps)

3. **`lib/audio/runtime.ts`** - Integrate audio error reporting
   - Import `captureAudioError`
   - Call on `eval_fail` and `error` events
   - Include code context (sanitized)

4. **`app/api/chat/route.ts`** - Add LLM error tracking
   - Import `captureLLMError`
   - Wrap API calls with error capture
   - Log validation failures with context
   - Add request ID for tracing

5. **`app/api/tracks/route.ts`** - Example API error improvement
   - Replace `console.error` with structured logging
   - Add error context

6. **`package.json`** - Add dependencies
   - `@sentry/nextjs` - Sentry SDK
   - No other dependencies needed

7. **`.env.example`** - Add Sentry env vars
   - `SENTRY_DSN` - Sentry Data Source Name
   - `SENTRY_ORG` - Sentry organization
   - `SENTRY_PROJECT` - Sentry project
   - `SENTRY_AUTH_TOKEN` - For source map upload

#### Test Plan

1. **Unit Tests**
   - [ ] `lib/observability/__tests__/index.test.ts`
     - Test `captureError` calls Sentry with correct params
     - Test `captureEvent` calls Sentry breadcrumb/event
     - Test error context enrichment
     - Test sanitization of sensitive data

2. **Component Tests**
   - [ ] `app/__tests__/error.test.tsx`
     - Test error boundary renders fallback UI
     - Test reset function works
     - Test error reported to Sentry

3. **Integration Tests**
   - [ ] E2E test for error recovery flow
   - [ ] Verify source maps work in production build

#### Docs to Update

- [ ] `.env.example` - Add Sentry configuration variables
- [ ] `README.md` - Add observability setup section (if requested)

#### Implementation Order

1. **Phase 1: Foundation**
   - Install `@sentry/nextjs`
   - Create `sentry.*.config.ts` files
   - Update `next.config.ts`
   - Add environment variables

2. **Phase 2: Error Boundaries**
   - Create `app/error.tsx`
   - Create `app/global-error.tsx`
   - Create `components/studio/ErrorFallback.tsx`

3. **Phase 3: Observability Module**
   - Create `lib/observability/index.ts`
   - Create `lib/observability/sentry.ts`

4. **Phase 4: Integration**
   - Update `lib/audio/runtime.ts` for audio errors
   - Update `app/api/chat/route.ts` for LLM errors
   - Update other API routes as needed

5. **Phase 5: Testing & Validation**
   - Write unit tests
   - Write component tests
   - Run quality gates
   - Verify in development
   - Test source map upload (if Sentry account configured)

#### Complexity Estimate

| Item | Complexity | Notes |
|------|------------|-------|
| Sentry setup | Low | Mostly config files |
| Error boundaries | Low | Standard Next.js patterns |
| Observability module | Medium | Abstraction layer with context |
| Audio error integration | Low | Small changes to runtime.ts |
| LLM error tracking | Medium | Need to handle streaming context |
| Tests | Medium | Mocking Sentry, testing boundaries |
| Source maps | Low | Config only |

**Total estimated files**: 9 new, 7 modified

---

## Work Log

### 2026-01-24 17:17 - Verification Complete

Task location: done/
Status field: matches (done)
Acceptance criteria: 11/11 checked

Issues found:
- none

Verification details:
- All 12 created files exist:
  - lib/observability/index.ts ✓
  - lib/observability/__tests__/index.test.ts ✓
  - app/error.tsx ✓
  - app/__tests__/error.test.ts ✓
  - app/global-error.tsx ✓
  - app/__tests__/global-error.test.ts ✓
  - components/studio/ErrorFallback.tsx ✓
  - components/studio/__tests__/ErrorFallback.test.ts ✓
  - sentry.client.config.ts ✓
  - sentry.server.config.ts ✓
  - sentry.edge.config.ts ✓
  - instrumentation.ts ✓
- 10 commits in git history referencing task ID
- Task file properly in done/ folder
- Assigned To/Assigned At fields cleared
- Started and Completed timestamps set

Actions taken:
- Task already in done/ - no move needed
- Verified all acceptance criteria implementations exist

Task verified: PASS

### 2026-01-24 17:17 - Review Complete

Code review:
- Issues found: none
- Code follows project conventions (TypeScript, React, Next.js patterns)
- Proper Sentry scope isolation using withScope for tagged errors
- Code truncation (500 chars) prevents large payloads
- No security vulnerabilities - sensitive data not logged, code truncated
- All error handling appropriate with context enrichment

Consistency:
- All criteria met: yes
- Test coverage adequate: yes (73 new tests covering all observability functions)
- Docs in sync: yes (.env.example updated with Sentry vars)

Quality gates:
- ESLint: PASS
- TypeScript: PASS
- Tests: PASS (1266 total, 73 new observability tests)

Follow-up tasks created: none (implementation complete)

Final status: COMPLETE

### 2026-01-24 17:14 - Documentation Sync

Docs updated:
- `.env.example` - Already contains Sentry configuration (added in Phase 1)
- Task file - Updated Notes section with implementation observations
- Task file - Updated Links section with complete file listing

Annotations:
- N/A (Node.js project, no model annotations)

Consistency checks:
- [x] Code matches docs - observability module exports match documented API
- [x] No broken links - all file paths verified to exist
- [x] .env.example has all required Sentry variables
- [x] README not updated (observability is internal infrastructure, not user-facing)

### 2026-01-24 17:13 - Testing Phase Complete

- **Tests written**:
  - `lib/observability/__tests__/index.test.ts` - 22 unit tests
    - captureError with/without context and extra metadata
    - captureAudioError with full context and code truncation
    - captureLLMError with model tags and validation error handling
    - captureEvent breadcrumb tracking
    - setUser/clearUser context management
    - addBreadcrumb with categories and data
  - `app/__tests__/error.test.ts` - 14 tests for route error boundary
  - `app/__tests__/global-error.test.ts` - 21 tests for global error boundary
  - `components/studio/__tests__/ErrorFallback.test.ts` - 16 tests for fallback component
- **Test results**:
  - Total: 1266 examples, 0 failures
  - New tests: 73 examples
  - All pre-existing tests still passing (1193)
- **Quality gates**:
  - ESLint: PASS
  - TypeScript: PASS
  - Prettier: PASS (code files)
- **Fix applied**: Replaced deprecated `hideSourceMaps` with `sourcemaps.deleteSourcemapsAfterUpload` in next.config.ts
- **Commits**: `f71ff75`

### 2026-01-24 17:10 - Implementation Phase 4 Complete

- **Completed**: Integrated error capture into codebase
- **Files modified**:
  - `lib/audio/runtime.ts` - Added captureAudioError for init/play errors
  - `app/api/chat/route.ts` - Added captureLLMError with request ID tracing
  - `lib/observability/index.ts` - Added extra field spread in captureLLMError
- **Commits**: `e91f761`
- **Quality check**: PASS (eslint, prettier)
- **Notes**: Added request ID generation for LLM tracing

### 2026-01-24 17:08 - Implementation Phase 3 Complete

- **Completed**: Created observability abstraction module
- **Files created**:
  - `lib/observability/index.ts` - Central observability module with captureError, captureAudioError, captureLLMError, captureEvent, user context helpers
- **Commits**: `878d6e1`
- **Quality check**: PASS (eslint, prettier)

### 2026-01-24 17:07 - Implementation Phase 2 Complete

- **Completed**: Created Next.js error boundaries
- **Files created**:
  - `app/global-error.tsx` - Root layout error boundary (inline styles, works without CSS)
  - `app/error.tsx` - Route-level error boundary (uses Tailwind)
  - `components/studio/ErrorFallback.tsx` - Reusable studio error fallback
- **Commits**: `fabb102`
- **Quality check**: PASS (eslint, prettier)

### 2026-01-24 17:05 - Implementation Phase 1 Complete

- **Completed**: Sentry foundation setup
- **Files created**:
  - `sentry.client.config.ts` - Client-side Sentry init with Session Replay
  - `sentry.server.config.ts` - Server-side Sentry init
  - `sentry.edge.config.ts` - Edge runtime Sentry init
  - `instrumentation.ts` - Next.js instrumentation hook
- **Files modified**:
  - `next.config.ts` - Added withSentryConfig wrapper, source maps
  - `package.json` - Added @sentry/nextjs dependency
  - `.env.example` - Added Sentry environment variables
- **Commits**: `9b88118`
- **Quality check**: PASS (eslint, prettier)

### 2026-01-24 17:05 - Planning Complete

- **Comprehensive codebase analysis completed**
- **Gap analysis**: All 8 acceptance criteria analyzed against existing code
- **Findings**:
  - No error boundaries exist (`error.tsx`, `global-error.tsx`, or custom)
  - No error tracking service (Sentry, LogRocket, etc.)
  - Basic `console.error` in 5 files: `runtime.ts`, `rate-limit.ts`, `abuse.ts`, `share.ts`, `audioExport.ts`
  - Audio runtime has ephemeral event tracking (max 10 events, lost on refresh)
  - LLM validation retry exists but no persistent error logging
  - `next.config.ts` is empty - no source map configuration
  - 32 unit tests exist but none for observability
- **Architecture decision**: Sentry recommended over lightweight custom solution
  - First-class Next.js 16 support
  - Source maps built-in
  - Free tier sufficient (5K errors/month)
  - Vercel integration
- **Plan created**: 9 new files, 7 modified files, 5 implementation phases
- **Ready for implementation**: Yes

### 2026-01-24 16:58 - Triage Complete

- **Dependencies**: None specified, no blockers identified
- **Task clarity**: Clear - well-defined acceptance criteria with specific deliverables
- **Ready to proceed**: Yes
- **Notes**:
  - No existing error boundary, Sentry, or observability code found in the codebase
  - This is a greenfield implementation
  - Related task `003-012-install-vercel-analytics` exists for basic analytics, but this task is more comprehensive (error tracking, error boundaries, LLM error tracking)
  - The two tasks have some overlap in "event logging" but this task focuses on error tracking and observability while 003-012 focuses on visitor analytics
  - All acceptance criteria are testable and specific
  - Plan references correct file paths for a Next.js project

---

## Testing Evidence

### Test Run Output

```
 ✓ lib/observability/__tests__/index.test.ts (22 tests) 18ms
 ✓ app/__tests__/error.test.ts (14 tests) 26ms
 ✓ app/__tests__/global-error.test.ts (21 tests) 53ms
 ✓ components/studio/__tests__/ErrorFallback.test.ts (16 tests) 19ms

 Test Files  49 passed (49)
       Tests  1266 passed (1266)
    Duration  7.06s
```

### Quality Check Output

```
$ npm run lint
> lofield.fm@0.1.0 lint
> eslint
(no errors)

$ npx tsc --noEmit
(no errors)
```

---

## Notes

- Sentry has good Next.js integration
- Consider Vercel Analytics for simpler setup (separate task 003-012)
- Be careful not to log sensitive data (API keys, etc.)
- Code truncation in audio error capture (500 chars) prevents large payloads
- Session Replay enabled for production debugging (1% sessions, 100% on error)
- Source maps are deleted after upload to keep them private
- Noisy errors filtered: ResizeObserver, network errors, audio context init
- Global error boundary uses inline styles (no CSS dependency for recovery)

---

## Links

### Created Files
- `lib/observability/index.ts` - Central observability abstraction module
- `lib/observability/__tests__/index.test.ts` - Unit tests (22 tests)
- `app/error.tsx` - Route-level error boundary
- `app/__tests__/error.test.ts` - Error boundary tests (14 tests)
- `app/global-error.tsx` - Root layout error boundary
- `app/__tests__/global-error.test.ts` - Global error tests (21 tests)
- `components/studio/ErrorFallback.tsx` - Reusable fallback component
- `components/studio/__tests__/ErrorFallback.test.ts` - Fallback tests (16 tests)
- `sentry.client.config.ts` - Client-side Sentry initialization
- `sentry.server.config.ts` - Server-side Sentry initialization
- `sentry.edge.config.ts` - Edge runtime Sentry initialization
- `instrumentation.ts` - Next.js instrumentation hook

### Modified Files
- `next.config.ts` - Added Sentry config wrapper and source maps
- `lib/audio/runtime.ts` - Integrated captureAudioError
- `app/api/chat/route.ts` - Integrated captureLLMError with request ID tracing
- `.env.example` - Added Sentry environment variables
- `package.json` - Added @sentry/nextjs dependency

### External Links
- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Vercel Analytics: https://vercel.com/analytics
