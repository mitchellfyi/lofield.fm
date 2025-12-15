# Lofield Studio

A Next.js app for drafting lo-fi music prompts with the Vercel AI SDK, backed by Supabase for auth, Postgres persistence, Vault-backed secrets, and Storage for generated tracks.

Built from the Vercel Next.js AI Chatbot patterns and adapted to use Supabase (no Auth.js, Neon, or Vercel Blob).

## What it does

1. Sign in with Supabase Auth (Google or GitHub).
2. Save your OpenAI + ElevenLabs API keys (stored via Supabase Vault / service role).
3. Chat with the Vercel AI SDK streaming UI to refine prompts.
4. Persist sessions/messages/tracks to Supabase tables and store audio files in the `tracks` bucket.

## Tech stack

- Next.js App Router + Server Actions
- Vercel AI SDK (`ai`, `@ai-sdk/openai`) for streaming chat
- Supabase:
  - Auth (Google + GitHub)
  - Postgres tables with RLS (`supabase/migrations`)
  - Vault for per-user provider keys
  - Storage bucket `tracks` for audio files
- Styling: Tailwind CSS (app directory)

## Local development

### Prereqs

- Node 20.18+ (24.x OK)
- pnpm 10.26.x (`npm install -g pnpm@10.26.0`)
- Supabase project (hosted or local via Supabase CLI)

### Environment

Create `.env.local` (see `.env.example`) with:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-publishable-default-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> # server only
SUPABASE_DB_URL=<postgres-connection-url-for-your-project> # preferred: primary (non-pooler) DB URL, usually port 5432
SUPABASE_PROJECT_REF=<project-ref> # required if using remote push
SUPABASE_ACCESS_TOKEN=<supabase-access-token> # required if using remote push
OPENAI_API_KEY=<optional fallback for development>
ELEVENLABS_API_KEY=<optional fallback for development>
```

### Database + Storage

1. Ensure the Supabase Vault extension is enabled.
2. Run migrations:

   ```bash
   pnpm db:migrate
   ```

   Migrations live in `/supabase/migrations/0001_init.sql` and create tables for profiles, user settings, chats, messages, tracks, Storage bucket policies, and Vault helper functions.

   - Make sure Vault is enabled in your Supabase project (SQL editor):
     ```sql
     create extension if not exists "supabase_vault";
     ```
   - Preferred: use the primary (non-pgbouncer) connection string for `SUPABASE_DB_URL` so extensions can be installed.
   - If you can’t reach the primary (IPv6/egress restrictions), set `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN`; `pnpm db:migrate` will push migrations remotely via the Supabase CLI.

3. Enable OAuth providers (Google + GitHub) in Supabase Auth settings and set redirect URLs to your dev and production domains.

### Install & run

```bash
pnpm install
pnpm dev
# open http://localhost:3003
```

### Verify before committing

Run all checks (format, lint, typecheck, tests) with:

```bash
pnpm verify
```

This is the canonical "pre-push" command and matches CI behaviour.

## Contributing

### Required before commit/push

**Always run** `pnpm verify` before opening a PR or pushing changes.

CI runs the same checks (format:check, lint, typecheck, tests, build). If CI fails, fix it locally and rerun `pnpm verify` before pushing.

This command ensures:

- Code is formatted correctly (`pnpm format:check`)
- No linting errors (`pnpm lint`)
- TypeScript compiles without errors (`pnpm typecheck`)
- All tests pass (`pnpm test`)

### Local development workflow

1. Make your changes
2. Run `pnpm verify` to check everything passes
3. Fix any issues and repeat step 2
4. Commit and push once verification passes
5. CI will run the same checks on your PR

## Supabase helpers

- `lib/supabase/client.ts` — browser client (anon key)
- `lib/supabase/server.ts` — server client (SSR cookies)
- `lib/supabase/admin.ts` — service-role client for Vault and privileged actions

## API surface (initial)

- `POST /api/chat` — Streams OpenAI responses with the saved per-user key.
- `POST /api/settings/secrets` — Stores OpenAI / ElevenLabs keys via Supabase Vault and caches a dev-only copy if provided.
- `GET /api/usage/elevenlabs/subscription` — Fetch ElevenLabs subscription info (credits balance and limits), cached for 10 minutes.
- `GET /api/usage/elevenlabs/stats` — Fetch daily usage stats for a date range, cached for 3 hours.

## Pages

- `/` — Main chat interface for drafting lo-fi tracks
- `/settings` — Manage API keys and preferences
- `/usage` — View ElevenLabs subscription details and daily credit usage

## Folder layout

- `/app` — Next.js App Router routes and UI (chat + auth)
- `/components` — UI components
- `/lib` — Supabase and secrets helpers
- `/supabase/migrations` — SQL schema + RLS + Vault helper functions

## Deployment (Vercel)

### Option A: Vercel Git Integration (Recommended)

1. Connect the GitHub repo to Vercel
2. Set production branch to `main`
3. Add environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY` (optional)
   - `ELEVENLABS_API_KEY` (optional)
4. Set Supabase Auth redirect URLs to your Vercel domains
5. Ensure the `tracks` bucket exists in Supabase Storage (private)
6. In GitHub branch protection for `main`, require:
   - `CI / verify` status check
   - Vercel deployment checks (if enabled)

**Result**: Preview deployments are created automatically for PRs, and production deployments happen automatically when merging to `main`.

### Option B: GitHub Actions via Vercel CLI (Optional)

For full pipeline control or if you prefer not to give Vercel access to source code, use the GitHub Actions workflows:

- `.github/workflows/vercel-preview.yml` — Preview deployments for PRs
- `.github/workflows/vercel-production.yml` — Production deployments on `main`

**Required GitHub secrets**:

- `VERCEL_TOKEN` — Vercel API token
- `VERCEL_ORG_ID` — Vercel organization ID
- `VERCEL_PROJECT_ID` — Vercel project ID

Both workflows run `pnpm verify` before deploying to ensure code quality.
