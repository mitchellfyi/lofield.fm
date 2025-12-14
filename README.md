# Lofield Studio

A Next.js app for generating lo-fi music via ElevenLabs Eleven Music, with an OpenAI-assisted prompt-workflow, chat-based iteration, and a proper library of sessions + tracks.

Built from Vercel’s Next.js AI Chatbot template. :contentReference[oaicite:0]{index=0}

## What it does

1. You sign in (Supabase Auth via Google or GitHub).
2. You set:
   - OpenAI API key + model
   - ElevenLabs API key + music options defaults
   - Artist name (used in metadata and prompt context)
3. You create a “chat” (a session) and draft a music prompt using:
   - Free-text prompt
   - Selectable style controls (genre, BPM/tempo, mood, energy/focus/chill, instrumentation, length, vocals vs instrumental)
4. You hit **Refine** (OpenAI) to:
   - Improve the prompt for Eleven Music
   - Generate structured metadata (title, description, tags, BPM, key, instrumentation, mood scores, etc.)
   - Keep a back-and-forth chat thread for tweaking
5. You hit **Generate track** (ElevenLabs) to create audio.
6. Tracks are saved to Supabase Storage + DB, and playable in-app.
7. A chat session can have multiple tracks (iterations/variants).

## Key UI

Three-panel layout:

- **Left**: sessions list + track library (search/filter)
- **Middle**: prompt chat (OpenAI) + prompt controls + two CTAs
  - CTA 1: “Refine with AI”
  - CTA 2: “Generate track”
- **Right**: selected track player + metadata + prompt snapshot + version history

## Tech stack

- Next.js App Router + Server Actions (from Vercel template). :contentReference[oaicite:1]{index=1}
- Vercel AI SDK for streaming chat + structured outputs. :contentReference[oaicite:2]{index=2}
- OpenAI via AI SDK OpenAI provider (per-user API keys). :contentReference[oaicite:3]{index=3}
- Supabase:
  - Auth (Google + GitHub)
  - Postgres (sessions, messages, tracks, metadata)
  - Storage (MP3 files)
  - Vault for encrypted per-user secrets (OpenAI/ElevenLabs keys). :contentReference[oaicite:4]{index=4}
- Deployment: Vercel

## ElevenLabs music generation

Uses Eleven Music (Text to Music). :contentReference[oaicite:5]{index=5}

- Supports prompt-based generation and optional “composition plans” for deeper control. :contentReference[oaicite:6]{index=6}
- API access is paid-tier only. :contentReference[oaicite:7]{index=7}
- Duration constraints: enforce API limits in UI and server validation (default 4 minutes = 240,000ms). :contentReference[oaicite:8]{index=8}
- Handle “bad_prompt” errors by surfacing ElevenLabs’ suggestion and allowing one-click apply. :contentReference[oaicite:9]{index=9}

## Data model (Supabase)

### Tables

#### `profiles`
- `id uuid` (PK, equals auth user id)
- `artist_name text`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `user_secrets`
Stores references to Vault secrets (never plaintext).
- `user_id uuid` (PK, FK -> profiles.id)
- `openai_secret_id uuid` (FK-ish -> vault.secrets.id)
- `elevenlabs_secret_id uuid`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `user_settings`
Non-sensitive settings.
- `user_id uuid` (PK)
- `openai_model text` (eg `gpt-5`, `gpt-4.1-mini`)
- `eleven_music_defaults jsonb` (length_ms, instrumental flag, output format, etc.)
- `prompt_defaults jsonb` (genre, bpm, mood sliders, instrumentation presets)
- `created_at timestamptz`
- `updated_at timestamptz`

#### `chats`
- `id uuid` (PK)
- `user_id uuid` (FK)
- `title text`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `chat_messages`
Stores the OpenAI prompt-iteration thread.
- `id uuid` (PK)
- `chat_id uuid` (FK)
- `role text` (`user` | `assistant` | `system`)
- `content text`
- `draft_spec jsonb` (optional: current structured “track draft” after this message)
- `created_at timestamptz`

#### `tracks`
A single generated audio output (one chat can have many).
- `id uuid` (PK)
- `chat_id uuid` (FK)
- `user_id uuid` (FK, denormalised for RLS convenience)
- `title text`
- `description text`
- `final_prompt text` (what went to ElevenLabs)
- `metadata jsonb` (genre, bpm, key, instruments, mood, tags, etc.)
- `length_ms int`
- `instrumental boolean`
- `status text` (`draft` | `generating` | `ready` | `failed`)
- `error jsonb` (store provider error payload safely)
- `storage_path text` (Supabase Storage key)
- `created_at timestamptz`
- `updated_at timestamptz`

### Storage bucket

Bucket: `tracks` (private)

Path convention:
`tracks/{user_id}/{chat_id}/{track_id}.mp3`

### RLS

Enable RLS on all tables and only allow access where `auth.uid() = user_id` (or via join on `chats.user_id`).

For Storage: policy to allow read/write only to objects whose path starts with `tracks/{auth.uid()}/...`

Supabase security model guidance: keep RLS on and use anon key client-side. :contentReference[oaicite:10]{index=10}

## Secrets handling (per-user keys)

Use Supabase Vault to store OpenAI and ElevenLabs API keys encrypted at rest. :contentReference[oaicite:11]{index=11}

Rules:
- Never send user API keys to the browser.
- Browser writes secrets via a server endpoint/action that:
  1) calls `vault.create_secret()` in Postgres
  2) stores the returned secret UUID in `user_secrets`
- Server-only code retrieves decrypted secrets (service role) when calling providers.

## OpenAI prompt workflow

OpenAI produces two things every time you hit **Refine**:

1) A normal chat reply to the user (what changed, what options to consider).
2) A structured `TrackDraft` object (schema enforced with AI SDK structured outputs). :contentReference[oaicite:12]{index=12}

`TrackDraft` (example fields)
- `title`
- `description`
- `prompt_final` (Eleven-ready)
- `negative_styles` (copyright-safe exclusions, unwanted instruments, etc.)
- `genre`
- `bpm`
- `key` (optional)
- `time_signature` (optional)
- `instrumentation[]`
- `mood` (labels)
- `energy` (0-100)
- `focus` (0-100)
- `chill` (0-100)
- `length_ms`
- `instrumental`
- `tags[]`

Persist:
- user message -> `chat_messages`
- assistant reply + new `TrackDraft` -> `chat_messages.draft_spec`

Generating a track uses the latest `TrackDraft` in the chat as the source of truth.

## API surface (Next.js Route Handlers / Server Actions)

### Auth / session
- Supabase SSR auth helpers (middleware protecting `/app/*`)

### Settings
- `POST /api/settings/secrets` (store OpenAI/ElevenLabs keys into Vault)
- `PATCH /api/settings` (update models, defaults, artist name)
- `GET /api/settings` (masked summary only)

### Chat
- `POST /api/chats` (create chat)
- `GET /api/chats` (list)
- `GET /api/chats/:id` (detail incl messages + tracks)
- `POST /api/chats/:id/refine` (OpenAI call, stream response, write message + draft_spec)

### Tracks
- `POST /api/chats/:id/tracks` (Generate via ElevenLabs using latest draft_spec)
- `GET /api/tracks/:id` (metadata)
- `GET /api/tracks/:id/play` (returns signed URL or streams file)

## Local development

### Prereqs
- Node 20+
- pnpm
- Supabase project (or local Supabase via CLI)

### Setup
1. Clone the Vercel Next.js AI Chatbot template, then replace auth + persistence with Supabase. :contentReference[oaicite:13]{index=13}
2. Create Supabase project:
   - Enable Google + GitHub OAuth providers
   - Enable Vault extension and prepare functions for storing secrets. :contentReference[oaicite:14]{index=14}
3. Create tables + RLS policies (see `/supabase/migrations`).
4. Create Storage bucket `tracks` (private) + policies.
5. Configure env:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
6. Run:
   - `pnpm install`
   - `pnpm dev`

## Deployment (Vercel)

- Add env vars in Vercel project settings
- Set Supabase Auth redirect URLs
