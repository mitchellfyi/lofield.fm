# GitHub Copilot instructions (repo-wide)

You are working on Lofield Studio (Next.js + TypeScript + Supabase + Vercel).

Follow these rules:

- **Write tests** for every new feature or bug fix you implement.
- Never commit or log secrets. API keys are stored server-side in Supabase Vault.
- Do not weaken RLS or make Supabase Storage public.
- Prefer small, reviewable PRs with a clear test plan.
- **Before proposing a PR-ready solution, ensure it passes `pnpm verify`** (runs format:check, lint, typecheck, test).
- If you change behaviour, update relevant docs/specs.
- If you modify scripts, keep CI aligned with the same checks.

When unsure:

- Read existing patterns in `lib/` and copy them.
- Ask before changing migrations, auth flows, or usage tracking.

## Environment Variables

Environment variables required to run the app can be fetched from GitHub repository secrets if and when needed. The following secrets are available:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase publishable default key (client-safe)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `OPENAI_API_KEY` - OpenAI API key (optional development fallback)
- `ELEVENLABS_API_KEY` - ElevenLabs API key (optional development fallback)
