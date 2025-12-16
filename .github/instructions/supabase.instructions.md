---
applyTo: "supabase/migrations/**/*.sql"
---

# Supabase migrations / RLS instructions

- Treat RLS as a hard requirement, not optional.
- Any new table must include: RLS enabled, ownership policies, and updated_at trigger if applicable.
- Never relax policies for convenience. Fix the access pattern instead.
- Keep migrations idempotent where possible and avoid destructive changes unless explicitly requested.
- If you touch Storage policies, verify prefix-based isolation (tracks/{auth.uid()}/...).
- **If you touch files under this scope, run `pnpm verify` before stopping.**
