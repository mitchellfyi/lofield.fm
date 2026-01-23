# Task: Setup Quality Checking Scripts and CI Pipeline

## Metadata

| Field | Value |
|-------|-------|
| ID | `002-001-quality-ci-setup` |
| Status | `todo` |
| Priority | `002` High |
| Created | `2026-01-23 12:00` |
| Started | |
| Completed | |
| Blocked By | |
| Blocks | |
| Assigned To | |
| Assigned At | |

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

1. **Install dev dependencies**
   - Files: `package.json`
   - Add: `prettier`, `eslint-config-prettier`, `@typescript-eslint/eslint-plugin`

2. **Configure Prettier**
   - Files: `.prettierrc`, `.prettierignore`
   - Config: single quotes, no semicolons, 100 char width (or team preference)

3. **Update ESLint config**
   - Files: `eslint.config.mjs`
   - Add TypeScript rules, integrate with Prettier

4. **Add npm scripts**
   - Files: `package.json`
   - Scripts: `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `quality`

5. **Create GitHub Actions CI**
   - Files: `.github/workflows/ci.yml`
   - Jobs: install, lint, typecheck, format check, build

6. **Fix any existing issues**
   - Run quality script, fix all violations

---

## Work Log

(To be filled during execution)

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
