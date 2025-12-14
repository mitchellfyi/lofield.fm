# GitHub Copilot instructions (repo-wide)

You are working on Lofield Studio (Next.js + TypeScript + Supabase + Vercel).

Follow these rules:

- Never commit or log secrets. API keys are stored server-side in Supabase Vault.
- Do not weaken RLS or make Supabase Storage public.
- Prefer small, reviewable PRs with a clear test plan.
- Before finishing: run lint (`pnpm lint`).
- If you change behaviour, update relevant docs/specs.

When unsure:

- Read existing patterns in `lib/` and copy them.
- Ask before changing migrations, auth flows, or usage tracking.
