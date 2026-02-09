# Contributing to LoField Music Lab

Thank you for your interest in contributing to LoField Music Lab.

## Code Quality Standards

All code contributions must meet the following quality standards:

### Principles

- **SOLID** - Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY** - Don't Repeat Yourself
- **KISS** - Keep It Simple, Stupid
- **YAGNI** - You Aren't Gonna Need It

### Requirements

1. **All tests must pass** - Unit tests and E2E tests
2. **No linting errors** - ESLint must pass with no errors
3. **No type errors** - TypeScript must compile without errors
4. **Proper formatting** - Prettier formatting must be applied
5. **Test coverage** - New code should have tests

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run quality checks
npm run quality

# Run all tests
npm run test:all
```

## Git Hooks

This project uses Husky for git hooks:

### Pre-commit

- Runs lint-staged (ESLint + Prettier on staged files)
- Runs TypeScript type checking

### Pre-push

- Runs all quality checks
- Runs unit tests

## Scripts

| Script                  | Description                         |
| ----------------------- | ----------------------------------- |
| `npm run dev`           | Start development server            |
| `npm run build`         | Build for production                |
| `npm run lint`          | Run ESLint                          |
| `npm run lint:fix`      | Run ESLint with auto-fix            |
| `npm run format`        | Format all files with Prettier      |
| `npm run format:check`  | Check formatting                    |
| `npm run typecheck`     | Run TypeScript type check           |
| `npm run quality`       | Run lint + typecheck + format check |
| `npm run quality:full`  | Run quality + unit tests            |
| `npm test`              | Run unit tests                      |
| `npm run test:coverage` | Run tests with coverage report      |
| `npm run test:watch`    | Run tests in watch mode             |
| `npm run test:e2e`      | Run E2E tests                       |
| `npm run test:all`      | Run all tests                       |
| `npm run ci`            | Full CI check (quality + all tests) |

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure all checks pass (`npm run ci`)
5. Commit your changes (hooks will run automatically)
6. Push to your branch
7. Open a Pull Request

## Code Style

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper typing
- Use interfaces for object shapes
- Export types from dedicated files in `lib/types/`

### React

- Use functional components with hooks
- Keep components focused and small (< 300 lines)
- Extract complex logic into custom hooks
- Use proper prop typing

### Testing

- Write tests for new functionality
- Use descriptive test names
- Test edge cases and error conditions
- Follow the existing test patterns

### File Organization

```
app/           - Next.js App Router pages and API routes
components/    - React components organized by feature
lib/           - Shared utilities, hooks, types
  ├── hooks/   - Custom React hooks
  ├── types/   - TypeScript type definitions
  ├── schemas/ - Zod validation schemas
  └── ...
```

## Questions?

Open an issue for any questions about contributing.

## CI/CD

### Workflows

| Workflow   | File                           | Triggers                                                      | Purpose                                                                                   |
| ---------- | ------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **CI**     | `.github/workflows/ci.yml`     | PRs to `main`, pushes to `main`, reusable via workflow_call   | Runs formatting, linting, type checking, unit tests, E2E tests, security audit, and build |
| **Deploy** | `.github/workflows/deploy.yml` | After CI passes on `main` (via workflow_run), manual dispatch | Runs Supabase database migrations to production                                           |

### CI Jobs

The CI workflow runs these jobs:

1. **Quality Checks** — Prettier formatting, ESLint, TypeScript type checking (runs first, fails fast)
2. **Unit Tests** — Vitest test suite (runs in parallel with quality)
3. **Security Audit** — `npm audit` for critical vulnerabilities (runs in parallel)
4. **E2E Tests** — Playwright browser tests (runs after quality + unit tests pass)
5. **Build** — Next.js production build (runs after quality + unit tests pass)

### Running Checks Locally

Run the full CI suite locally before pushing:

```bash
# All quality checks (lint + typecheck + format check)
npm run quality

# Unit tests
npm test

# Full CI (quality + all tests)
npm run ci

# Security audit
npm audit --audit-level=critical

# Build
npm run build
```

### How Deploys Work

1. Code is merged to `main` (requires CI to pass via branch protection)
2. The **CI** workflow runs on push to `main`
3. When CI completes successfully, the **Deploy** workflow triggers automatically via `workflow_run`
4. Supabase database migrations are applied to production
5. A deploy summary (commit SHA, environment, timestamp) is posted as a workflow annotation
6. Only one deploy runs at a time (concurrency group cancels in-progress deploys)

Vercel handles the application deployment separately via its GitHub integration.

### Rollback

To roll back a bad deploy, use the manual workflow dispatch:

1. Go to **Actions → Deploy → Run workflow**
2. Enter the commit SHA of the last known good deploy
3. The workflow runs the full CI suite against that exact commit before deploying
4. If CI passes, migrations are applied from that commit

For application rollback, use Vercel's deployment history to revert to a previous deployment.
