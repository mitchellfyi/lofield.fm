# Task: Setup Quality Checking Scripts and CI Pipeline

## Metadata

| Field       | Value                      |
| ----------- | -------------------------- |
| ID          | `002-001-quality-ci-setup` |
| Status      | `doing`                    |
| Priority    | `002` High                 |
| Created     | `2026-01-23 12:00`         |
| Started     | `2026-01-23 19:53`         |
| Completed   |                            |
| Blocked By  |                            |
| Blocks      |                            |
| Assigned To | `worker-1`                 |
| Assigned At | `2026-01-23 19:53`         |

---

## Context

The project currently only has a basic `eslint` script. For maintainability and code quality, we need comprehensive linting, type checking, and formatting scripts that run locally and in CI.

- No TypeScript strict checks are enforced
- No Prettier for consistent formatting
- No CI pipeline exists
- Quality issues will compound as the codebase grows

---

## Acceptance Criteria

- [ ] Add Prettier with consistent config (`.prettierrc`)
- [ ] Configure ESLint with TypeScript-aware rules
- [ ] Add `npm run lint` - runs ESLint
- [ ] Add `npm run format` - runs Prettier fix
- [ ] Add `npm run format:check` - checks Prettier (CI-safe)
- [ ] Add `npm run typecheck` - runs `tsc --noEmit`
- [ ] Add `npm run quality` - runs all checks in sequence
- [ ] Create GitHub Actions workflow (`.github/workflows/ci.yml`)
- [ ] CI runs on push and PR to main
- [ ] All checks pass on current codebase
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

### Implementation Plan (Generated 2026-01-23 19:55)

#### Gap Analysis

| Criterion                                                   | Status      | Gap                                                                                                   |
| ----------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| Add Prettier with consistent config (`.prettierrc`)         | **NO**      | No Prettier installed or configured                                                                   |
| Configure ESLint with TypeScript-aware rules                | **PARTIAL** | ESLint exists with `eslint-config-next/typescript` but no `eslint-config-prettier` to avoid conflicts |
| Add `npm run lint` - runs ESLint                            | **YES**     | Script exists: `"lint": "eslint"`                                                                     |
| Add `npm run format` - runs Prettier fix                    | **NO**      | Script missing                                                                                        |
| Add `npm run format:check` - checks Prettier (CI-safe)      | **NO**      | Script missing                                                                                        |
| Add `npm run typecheck` - runs `tsc --noEmit`               | **NO**      | Script missing                                                                                        |
| Add `npm run quality` - runs all checks in sequence         | **NO**      | Script missing                                                                                        |
| Create GitHub Actions workflow (`.github/workflows/ci.yml`) | **PARTIAL** | `tests.yml` exists but only runs unit/e2e tests, no lint/typecheck/format                             |
| CI runs on push and PR to main                              | **PARTIAL** | `tests.yml` already triggers correctly, new `ci.yml` should follow same pattern                       |
| All checks pass on current codebase                         | **UNKNOWN** | Must run checks to verify                                                                             |
| Tests written and passing                                   | **PARTIAL** | Unit/E2E tests exist, need quality script integration tests                                           |
| Quality gates pass                                          | **UNKNOWN** | Must run after implementation                                                                         |
| Changes committed with task reference                       | **NO**      | Pending completion                                                                                    |

#### Current State Summary

- **Prettier**: Not installed, no config files
- **ESLint**: Installed v9 with flat config (`eslint.config.mjs`), uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- **TypeScript**: Configured with `strict: true` and `noEmit: true` in `tsconfig.json` - ready for typecheck script
- **CI**: `.github/workflows/tests.yml` runs unit and e2e tests on push/PR to main/master
- **Project Structure**: Next.js 16 with TypeScript, files in `app/`, `components/`, `lib/`

#### Files to Modify

1. **`package.json`**
   - Add devDependencies: `prettier`, `eslint-config-prettier`
   - Add scripts: `lint:fix`, `format`, `format:check`, `typecheck`, `quality`
   - Note: `lint` script already exists

2. **`eslint.config.mjs`**
   - Import and add `eslint-config-prettier` to disable formatting rules that conflict with Prettier

#### Files to Create

1. **`.prettierrc`**
   - Purpose: Prettier configuration
   - Config to match existing code style:
     - Double quotes (matches current codebase)
     - No trailing commas where ES5 doesn't support
     - 2-space indentation (matches current)
     - 80 or 100 char line width

2. **`.prettierignore`**
   - Purpose: Tell Prettier which files to skip
   - Ignore: `node_modules/`, `.next/`, `out/`, `build/`, `*.min.js`, `package-lock.json`

3. **`.github/workflows/ci.yml`** (or rename/update `tests.yml`)
   - Purpose: Add quality checks to CI pipeline
   - Decision: Create new `ci.yml` to keep quality checks separate from tests
   - Jobs:
     - `quality`: lint, typecheck, format:check
     - Note: Tests already covered by `tests.yml`
   - Trigger: push and PR to main/master (match existing `tests.yml`)

#### Implementation Steps

1. **Install Prettier and ESLint Prettier config**

   ```bash
   npm install --save-dev prettier eslint-config-prettier
   ```

2. **Create `.prettierrc`** with config matching current code style

3. **Create `.prettierignore`** with standard ignores

4. **Update `eslint.config.mjs`** to include `eslint-config-prettier`

5. **Add npm scripts to `package.json`**:
   - `"lint:fix": "eslint --fix"`
   - `"format": "prettier --write ."`
   - `"format:check": "prettier --check ."`
   - `"typecheck": "tsc --noEmit"`
   - `"quality": "npm run lint && npm run typecheck && npm run format:check"`

6. **Create `.github/workflows/ci.yml`** with quality job

7. **Run `npm run format`** to format existing code

8. **Run `npm run quality`** to verify all checks pass

9. **Fix any issues** discovered by the quality checks

#### Test Plan

- [ ] Verify `npm run lint` works and passes
- [ ] Verify `npm run lint:fix` auto-fixes ESLint issues
- [ ] Verify `npm run format` formats files correctly
- [ ] Verify `npm run format:check` fails on unformatted code and passes after formatting
- [ ] Verify `npm run typecheck` catches type errors and passes with current code
- [ ] Verify `npm run quality` runs all three checks in sequence
- [ ] Verify CI workflow triggers on push to main
- [ ] Verify CI workflow triggers on PR to main
- [ ] Verify all checks pass in CI

#### Docs to Update

- [ ] No external documentation changes required (package.json scripts are self-documenting)

#### Risk Assessment

- **Low Risk**: Adding Prettier formatting may cause a large diff in one commit, but this is expected and acceptable
- **Low Risk**: ESLint + Prettier config conflicts are well-documented; using `eslint-config-prettier` is the standard solution
- **Consideration**: May need to adjust rules if Prettier formatting differs significantly from current style

---

## Work Log

### 2026-01-23 19:53 - Triage Complete

- **Dependencies**: None specified (Blocked By field is empty) - ✅ No blockers
- **Task clarity**: Clear - specific acceptance criteria with testable outcomes
- **Ready to proceed**: Yes
- **Notes**:
  - Current state verified: Project is a Next.js/TypeScript app
  - Existing `npm run lint` script exists (ESLint only)
  - No Prettier config found - needs to be added
  - No `format`, `format:check`, `typecheck`, or `quality` scripts exist
  - CI workflow exists at `.github/workflows/tests.yml` but only runs tests, not quality checks
  - Task scope is accurate and needed - CI should include linting, type checking, and formatting
  - This is a greenfield task with no conflicts with existing completed tasks

### 2026-01-23 19:55 - Planning Complete

- **Gap Analysis**: Performed detailed review of all acceptance criteria
  - 1 criterion already satisfied (`npm run lint` exists)
  - 3 criteria partially satisfied (ESLint TypeScript rules, CI triggers)
  - 9 criteria not satisfied (Prettier, format scripts, typecheck, quality, CI quality jobs)
- **Files reviewed**:
  - `package.json` - current scripts and dependencies
  - `eslint.config.mjs` - flat config with Next.js presets
  - `tsconfig.json` - strict mode enabled, noEmit: true
  - `.github/workflows/tests.yml` - existing CI for tests only
- **Implementation Plan created** with:
  - 2 files to modify (`package.json`, `eslint.config.mjs`)
  - 3 files to create (`.prettierrc`, `.prettierignore`, `.github/workflows/ci.yml`)
  - 9 ordered implementation steps
  - 9-item test plan
  - Risk assessment (low risk overall)
- **Key decisions**:
  - Create separate `ci.yml` for quality checks rather than modifying `tests.yml`
  - Use double quotes in Prettier to match existing code style
  - Use `eslint-config-prettier` to avoid ESLint/Prettier conflicts
- **Ready for implementation**: Yes

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- Consider adding husky + lint-staged for pre-commit hooks in a follow-up task
- May need to adjust Prettier/ESLint rules based on team preferences

---

## Links

- File: `package.json`
- File: `eslint.config.mjs`
