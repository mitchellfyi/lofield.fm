# AI Agent Instructions

## M12N working agreement

Read [docs/m12n-standards.md](docs/m12n-standards.md) and
[docs/project-brief.md](docs/project-brief.md) before work. They provide the
shared delivery, research, security, cost and stewardship rules and this project's
context. Work on main by default; use one worktree, branch and PR per repository
when the owner requests portfolio PR delivery. Finish with verified main
integration, green required CI and safe local/remote cleanup. Preserve this
repository's domain rules and commands below. Weekly stewardship only creates
an Ops decision issue; downstream work starts with a later owner assignment.

This file is the source of truth for all AI coding agents working on this project.

## Ops-managed services

- Consult the Ops registry at `../../m12n-org/ops.m12n.org/docs/projects.md`
  and its `docs/runbooks/project-service-changes.md` before changing deployment,
  domains, authentication, analytics, or data services.
- LoField uses its own official, self-hosted Coolify Supabase stack at
  `https://supabase-lofield.m12n.org`. Never connect to Supabase Cloud. The
  September 2026 cutover intentionally started fresh without old Cloud data.
- Ops owns production environment values and the deployment workflow. Keep
  public build-time values separate from server-only service and encryption keys.
- Check Umami, GlitchTip, Supabase auth return URLs, and email configuration
  together when a project domain changes. Preserve existing provider IDs.
- Keep hourly R2 snapshots, 24-hour retention, and verified scratch restores.
  Physical pruning belongs only to the weekly restore drill.
- Do not create verification accounts or send test email without owner approval.
  Use rolled-back SQL fixtures and rejected auth requests for routine smoke tests.

## Quick Start

1. Read `docs/project-brief.md` for project goals and tech stack
2. Check `.doyaken/tasks/` for current work items
3. Follow the guidelines in `.doyaken/prompts/library/`

## Core Guidelines

Read these prompts before writing code:

- **[Code Quality](.doyaken/prompts/library/quality.md)** - KISS, YAGNI, DRY, SOLID principles
- **[Testing](.doyaken/prompts/library/testing.md)** - Test methodology and structure
- **[Security](.doyaken/prompts/library/review-security.md)** - OWASP Top 10, security checklist

## Quality Gates

All code must pass before commit:

- Linting passes
- Type checking passes (if applicable)
- Tests pass
- Build succeeds

Check `.doyaken/manifest.yaml` for project-specific commands.

## Commit Messages

Format: `type(scope): description [task-id]`

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

---

## Project Structure

```
.doyaken/
  manifest.yaml       # Project settings
  tasks/
    1.blocked/        # Blocked by dependencies
    2.todo/           # Ready to start
    3.doing/          # In progress
    4.done/           # Completed
  prompts/
    library/          # Reusable prompt modules
    phases/           # Workflow phase prompts
  skills/             # On-demand skills
```

## Prompts Library

Detailed methodology in `.doyaken/prompts/library/`:

| Prompt                                                            | Use When                  |
| ----------------------------------------------------------------- | ------------------------- |
| [quality.md](.doyaken/prompts/library/quality.md)                 | Writing or reviewing code |
| [testing.md](.doyaken/prompts/library/testing.md)                 | Adding or modifying tests |
| [review.md](.doyaken/prompts/library/review.md)                   | Code review               |
| [planning.md](.doyaken/prompts/library/planning.md)               | Planning implementation   |
| [review-security.md](.doyaken/prompts/library/review-security.md) | Security-sensitive code   |
| [debugging.md](.doyaken/prompts/library/debugging.md)             | Investigating issues      |
| [errors.md](.doyaken/prompts/library/errors.md)                   | Error handling            |
| [refactor.md](.doyaken/prompts/library/refactor.md)               | Refactoring code          |

## Workflow Phases

For structured tasks, use phases in `.doyaken/prompts/phases/`:

| Phase | File                                                     | Purpose                     |
| ----- | -------------------------------------------------------- | --------------------------- |
| 0     | [0-expand.md](.doyaken/prompts/phases/0-expand.md)       | Expand brief into full spec |
| 1     | [1-triage.md](.doyaken/prompts/phases/1-triage.md)       | Validate task, check deps   |
| 2     | [2-plan.md](.doyaken/prompts/phases/2-plan.md)           | Gap analysis, planning      |
| 3     | [3-implement.md](.doyaken/prompts/phases/3-implement.md) | Write code                  |
| 4     | [4-test.md](.doyaken/prompts/phases/4-test.md)           | Add tests                   |
| 5     | [5-docs.md](.doyaken/prompts/phases/5-docs.md)           | Update documentation        |
| 6     | [6-review.md](.doyaken/prompts/phases/6-review.md)       | Code review                 |
| 7     | [7-verify.md](.doyaken/prompts/phases/7-verify.md)       | Final verification          |

## Skills

On-demand skills in `.doyaken/skills/`:

| Skill                                                     | Purpose                   |
| --------------------------------------------------------- | ------------------------- |
| [check-quality](.doyaken/skills/check-quality.md)         | Run all quality checks    |
| [audit-security](.doyaken/skills/audit-security.md)       | Security code review      |
| [audit-performance](.doyaken/skills/audit-performance.md) | Performance analysis      |
| [audit-debt](.doyaken/skills/audit-debt.md)               | Technical debt assessment |
| [audit-deps](.doyaken/skills/audit-deps.md)               | Dependency security audit |

## Task Management

### Task File Format

Files in `.doyaken/tasks/` use format: `PPP-SSS-slug.md`

- PPP = Priority (001=Critical, 002=High, 003=Medium, 004=Low)
- SSS = Sequence number

### Task States

| State        | Meaning                 |
| ------------ | ----------------------- |
| `1.blocked/` | Waiting on dependencies |
| `2.todo/`    | Ready to start          |
| `3.doing/`   | Currently in progress   |
| `4.done/`    | Completed               |

## Configuration

See `.doyaken/manifest.yaml` for:

- Project metadata
- Quality gate commands
- Agent settings
- Integration configuration

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Error tracking

Read [docs/error-tracking.md](docs/error-tracking.md) before changing error
handling, instrumentation, deployment configuration, or adding a new entry point.
Preserve the Ops-managed GlitchTip DSN and the privacy filter.
