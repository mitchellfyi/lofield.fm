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

- Node 20+
- pnpm (`npm install -g pnpm`)
- Supabase project (hosted or local via Supabase CLI)

### Environment

Create `.env.local` (see `.env.example`) with:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> # server only
OPENAI_API_KEY=<optional fallback for development>
ELEVENLABS_API_KEY=<optional fallback for development>
```

### Database + Storage

1. Ensure the Supabase Vault extension is enabled.
2. Run migrations:

   ```bash
   supabase db push --db-url "$SUPABASE_DB_URL"
   # or, with the Supabase CLI running locally:
   supabase migration up
   ```

   Migrations live in `/supabase/migrations/0001_init.sql` and create tables for profiles, user settings, chats, messages, tracks, Storage bucket policies, and Vault helper functions.

3. Enable OAuth providers (Google + GitHub) in Supabase Auth settings and set redirect URLs to your dev and production domains.

### Install & run

```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

## Supabase helpers

- `lib/supabase/client.ts` — browser client (anon key)
- `lib/supabase/server.ts` — server client (SSR cookies)
- `lib/supabase/admin.ts` — service-role client for Vault and privileged actions

## API surface (initial)

- `POST /api/chat` — Streams OpenAI responses with the saved per-user key.
- `POST /api/settings/secrets` — Stores OpenAI / ElevenLabs keys via Supabase Vault and caches a dev-only copy if provided.

## Folder layout

- `/app` — Next.js App Router routes and UI (chat + auth)
- `/components` — UI components
- `/lib` — Supabase and secrets helpers
- `/supabase/migrations` — SQL schema + RLS + Vault helper functions

## Deployment (Vercel)

1. Add the same Supabase env vars in Vercel Project Settings.
2. Set Supabase Auth redirect URLs to your Vercel domains.
3. Ensure the `tracks` bucket exists in Supabase Storage (private).
