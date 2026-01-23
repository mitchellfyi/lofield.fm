# Testing Infrastructure

This document describes the automated testing setup for the Strudel MVP.

## Overview

The project has comprehensive test coverage including:
- **Unit tests** for business logic (Vitest)
- **E2E tests** for full user workflows (Playwright)
- **Headless audio verification** via test API

## Running Tests

### Unit Tests
```bash
npm test              # Run once
npm run test:watch    # Watch mode
```

### E2E Tests
```bash
npm run test:e2e         # Headless mode
npm run test:e2e:headed  # With browser UI
npm run test:e2e:ui      # Playwright UI mode
```

### All Tests
```bash
npm run test:all
```

## Test Structure

### Unit Tests (`lib/**/*.test.ts`)
- `llmContract.test.ts` - Code extraction, validation, retry logic
- `runtime.test.ts` - Strudel runtime state management

### E2E Tests (`e2e/strudel.spec.ts`)
Tests cover:
1. Page load and UI elements
2. Audio engine initialization
3. Play/Stop behavior and state transitions
4. Auto-initialization on first play
5. AI chat integration and code updates
6. Code validation and error handling
7. Eval error handling
8. Runtime events display
9. Button state management

## Test API for E2E

When `NEXT_PUBLIC_E2E=1`, the runtime exposes a test API on `window.__strudelTest`:

```typescript
interface StrudelTestAPI {
  getState(): PlayerState;
  getLastEvents(): RuntimeEvent[];
  wasInitCalled(): boolean;
  wasPlayCalled(): boolean;
  wasHushCalled(): boolean;
}
```

This allows E2E tests to verify:
- Audio engine initialization happened
- Play was called (without relying on actual sound)
- State transitions are correct
- Events were emitted properly

## Headless Audio Verification

Instead of trying to detect audio output (unreliable in headless mode), we verify:
1. `initStrudel()` was called
2. Code evaluation succeeded (no errors)
3. State transitioned to `playing`
4. `hush()` was called on stop
5. Runtime events were logged correctly

This provides deterministic, reliable test signals.

## CI Integration

Tests run automatically on every PR via GitHub Actions (`.github/workflows/tests.yml`):
- Unit tests run first (fast feedback)
- E2E tests run in parallel job
- Playwright reports are uploaded as artifacts

## Configuration Files

- `vitest.config.ts` - Unit test configuration
- `playwright.config.ts` - E2E test configuration
- `.github/workflows/tests.yml` - CI workflow

## Environment Variables

- `NEXT_PUBLIC_E2E=1` - Enables test API (only in E2E mode)
- `OPENAI_API_KEY` - Required for AI chat tests (CI secret)

## Test Patterns

### Mocking for Unit Tests
Unit tests mock the Strudel globals:
```typescript
global.window = { initStrudel: vi.fn(), hush: vi.fn() } as any;
```

### E2E Test Pattern
```typescript
// Wait for Strudel to load
await waitForStrudelLoad(page);

// Interact with UI
await page.getByRole('button', { name: 'Play' }).click();

// Verify state via test API
const testAPI = await getTestAPI(page);
expect(testAPI?.wasPlayCalled()).toBe(true);
```

## Debugging

### Unit Tests
```bash
npm run test:watch  # Watch mode with hot reload
```

### E2E Tests
```bash
npm run test:e2e:headed  # See browser
npm run test:e2e:ui      # Playwright UI with time travel
```

### CI Failures
1. Check workflow logs in GitHub Actions
2. Download Playwright report artifact
3. Look for screenshots/traces in report

## Adding New Tests

### Unit Test
1. Create `*.test.ts` next to the file you're testing
2. Use Vitest's `describe`, `it`, `expect` APIs
3. Mock external dependencies

### E2E Test
1. Add test to `e2e/strudel.spec.ts`
2. Use Playwright's page interaction APIs
3. Verify via test API when possible
4. Check UI state for user-visible changes

## Performance

- Unit tests: ~600ms for 44 tests
- E2E tests: ~2-3 minutes for 11 tests (includes app startup)

## Security

All tests run through:
1. Code validation (dangerous tokens blocked)
2. Strudel code validation (tempo + playback required)
3. CodeQL security scanning (planned)
