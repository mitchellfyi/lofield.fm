# CLAUDE.md

## Commands

- Install: `pnpm install`
- Dev: `pnpm dev`
- Lint: `pnpm lint`
- Build: `pnpm build`

If commands differ, read `package.json` and update this file.

## What this repo is

Lofield Studio - Next.js + TypeScript app with Supabase Auth/DB/Storage, OpenAI prompt refinement, ElevenLabs track generation, and a Usage page that breaks down spend by day/chat/track.

## Key folders

- `app/` - routes, API handlers, server actions
- `lib/` - Supabase clients and provider wrappers
- `supabase/migrations/` - schema + RLS + storage policies
- `docs/` - specs and notes (when present)

## Non-negotiables

- Secrets: never in the browser. Store per-user provider keys in Supabase Vault and retrieve server-side only.
- Security: RLS must prevent cross-user access by guessed IDs.
- Storage: private bucket; playback via signed URLs only.
- Usage: every provider call should record a `usage_events` row with attribution.

## Workflow

- Prefer: read relevant files -> propose plan -> implement -> run lint -> update docs -> commit.
- Do not "fix" failing tests by deleting them.

## Code style

- TypeScript: explicit types at boundaries, Zod validation for input.
- Error handling: early returns; return typed error objects from API handlers.
- Keep changes small and reviewable.

## Gotchas

- Never log request headers for provider calls (keys can leak).
- Do not import admin/service-role Supabase clients into client components.
- Migration changes require RLS and policy review.
