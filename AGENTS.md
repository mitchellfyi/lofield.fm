# AGENTS.md

## Setup commands (keep this accurate)

- Install deps: `pnpm install`
- Run dev: `pnpm dev`
- Lint: `pnpm lint`
- Build: `pnpm build`

If these commands differ from `package.json`, update this file.

## What this repo is

Lofield Studio - a Next.js app that lets users refine lo-fi music prompts with OpenAI, then generate tracks with ElevenLabs. Auth, DB, and Storage are Supabase. Deployment is Vercel.

## Project structure

- `app/` - App Router routes, server actions, API route handlers
- `components/` - UI components (auth panel, chat panel)
- `lib/` - Supabase clients, provider clients, validation, secrets helpers
- `supabase/migrations/` - schema, RLS policies, storage policies
- `docs/` - specs and architecture notes (when present)

## Critical invariants (do not break these)

- API keys are per-user secrets stored server-side (Vault). Never send keys to the browser.
- Supabase RLS must prevent cross-user reads/writes by guessed IDs.
- Supabase Storage is private. Playback is via short-lived signed URLs.
- Every OpenAI and ElevenLabs call should write a `usage_events` row with attribution (chat_id, track_id).

## Boundaries

### ✅ Always

- Run lint before finishing.
- Validate external inputs with Zod (or equivalent) at the boundary.
- Keep changes scoped and include a brief test plan in the PR.

### ⚠️ Ask first

- Adding dependencies
- Editing migrations, RLS, or storage policies
- Changing auth flows (OAuth redirects, cookie/session handling)
- Changing usage tracking schema or aggregation logic

### 🚫 Never

- Commit or log secrets (OpenAI/ElevenLabs keys, service role keys)
- Make Storage public or relax RLS "just to make it work"
- Store API keys in localStorage/cookies/client state

## Implementation notes

- Prefer server actions / route handlers for provider calls.
- Never use the Supabase service role client from client components.
- Store provider errors in a sanitised form (no headers, no secrets, no full prompt dumps).

## Code style

- TypeScript: explicit types at boundaries, Zod validation for input.
- Error handling: early returns; return typed error objects from API handlers.
- Keep changes small and reviewable.
- Follow existing patterns in `lib/` and `app/api/`.

### Example: Route handler with validation

```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  // Validate body here with Zod or manual checks

  try {
    // Perform action
  } catch (err) {
    console.error("Action failed", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

## PR checklist

- [ ] Lint passes (`pnpm lint`)
- [ ] Build passes (`pnpm build`)
- [ ] No secrets in diff
- [ ] Migrations reviewed (if changed)
- [ ] RLS sanity checked (if policies changed)
- [ ] Usage events recorded (if provider calls added)
