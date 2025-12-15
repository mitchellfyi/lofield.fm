---
applyTo: "**/*.ts,**/*.tsx,app/**/*,components/**/*,lib/**/*"
---

# Next.js / TypeScript instructions

- Use App Router patterns.
- Keep server-only code (admin Supabase, Vault, provider keys) out of client components.
- Validate boundary inputs with Zod (or equivalent) for request bodies and query params.
- Prefer explicit error handling and typed return shapes.
- Do not introduce new state libraries unless asked.
- If you touch app/lib/components, ensure `pnpm verify` still passes before committing.
