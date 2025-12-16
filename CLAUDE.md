# CLAUDE.md

## Documentation

📚 **[Complete Documentation](./docs/INDEX.md)** - Full documentation index  
🤖 **[Agent Playbook](./docs/agents/AGENT_PLAYBOOK.md)** - Detailed guide for AI agents working in this codebase  
🔧 **[Troubleshooting Guide](./docs/runbook/TROUBLESHOOTING.md)** - Common issues and solutions

## Commands

- Install: `pnpm install`
- Dev: `pnpm dev`
- Lint: `pnpm lint`
- Build: `pnpm build`
- Format: `pnpm format` (writes)
- Format check: `pnpm format:check` (no writes)
- Typecheck: `pnpm typecheck`
- Test: `pnpm test`
- **Verify (pre-push):** `pnpm verify` — runs format:check, lint, typecheck, test in order

If commands differ, read `package.json` and update this file.

## Required before commit/push

**ALWAYS** run `pnpm verify` before finishing a change. This is non-negotiable.

CI runs the same checks (format:check, lint, typecheck, tests, build). If CI fails, fix it locally and rerun `pnpm verify` before pushing.

**You cannot finish a task without passing `pnpm verify`.**

**Do not**:

- Ship failing tests or typecheck errors
- Bypass verification by editing CI
- Hand-wave CI failures
- Mark tasks complete without running `pnpm verify`

## What this repo is

Lofield Studio - Next.js + TypeScript app with Supabase Auth/DB/Storage, OpenAI prompt refinement, ElevenLabs track generation, and a Usage page that breaks down spend by day/chat/track.

## Key folders

- `app/` - routes, API handlers, server actions
- `lib/` - Supabase clients and provider wrappers
- `supabase/migrations/` - schema + RLS + storage policies
- `docs/` - specs and notes (when present)

## Non-negotiables

- **Testing**: All new features and fixes must include tests.
- Secrets: never in the browser. Store per-user provider keys in Supabase Vault and retrieve server-side only.
- Security: RLS must prevent cross-user access by guessed IDs.
- Storage: private bucket; playback via signed URLs only.
- Usage: every provider call should record a `usage_events` row with attribution.

## Workflow

- Prefer: read relevant files -> propose plan -> **write tests** -> implement -> run `pnpm verify` -> update docs -> commit.
- Do not "fix" failing tests by deleting them.

## Code style

- TypeScript: explicit types at boundaries, Zod validation for input.
- Error handling: early returns; return typed error objects from API handlers.
- Keep changes small and reviewable.

## Gotchas

- Never log request headers for provider calls (keys can leak).
- Do not import admin/service-role Supabase clients into client components.
- Migration changes require RLS and policy review.
