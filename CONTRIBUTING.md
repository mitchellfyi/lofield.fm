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
