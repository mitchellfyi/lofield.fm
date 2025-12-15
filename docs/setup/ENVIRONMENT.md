# Environment Variables

**Purpose**: Complete reference for all environment variables used in Lofield Studio  
**Audience**: Developers and DevOps  
**Last updated**: 2025-12-15

## Required Variables

### Supabase Core

| Variable | Description | Example | Where to Find |
|----------|-------------|---------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc.supabase.co` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon/public key (client-safe) | `eyJhbGc...` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only, **never** expose to client) | `eyJhbGc...` | Supabase Dashboard → Settings → API |

### Database (for Migrations)

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `SUPABASE_DB_URL` | Direct PostgreSQL connection string | `postgresql://postgres:[password]@db.abc.supabase.co:5432/postgres` | Preferred: primary (non-pooler) URL, port 5432. Required for migrations. |
| `SUPABASE_PROJECT_REF` | Supabase project reference | `abcdefghij` | Alternative to `SUPABASE_DB_URL` for remote migration push |
| `SUPABASE_ACCESS_TOKEN` | Supabase management token | `sbp_...` | Required with `SUPABASE_PROJECT_REF` for remote push |

## Optional Variables

### Provider Fallback Keys (Development)

These are **optional** and used as fallback during local development only. Production uses per-user keys from Vault.

| Variable | Description | Notes |
|----------|-------------|-------|
| `OPENAI_API_KEY` | OpenAI API key | Fallback for development. Not required in production. |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | Fallback for development. Not required in production. |

## Configuration Files

### `.env.local` (Local Development)

Create this file in the project root. **Never commit it to git** (already in `.gitignore`).

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (for migrations)
SUPABASE_DB_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Optional: Development fallback keys
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
```

### `.env.example` (Template)

The template is committed to the repo and shows the required format without actual secrets.

### Vercel (Production)

Set environment variables in Vercel Project Settings → Environment Variables:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. Optionally: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY` (for fallback)

**Important**: Do **not** set `SUPABASE_DB_URL` in Vercel. Migrations are run separately via CI or locally.

## Security Notes

1. **Never commit secrets** to version control
2. **`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS** - only use server-side
3. **Per-user provider keys** are stored in Supabase Vault and fetched at runtime
4. **Environment variables prefixed with `NEXT_PUBLIC_`** are exposed to the browser - never use for secrets

## How Variables Are Used

### Client-Side (Browser)

Only `NEXT_PUBLIC_*` variables are available:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

Used by `lib/supabase/client.ts` to create the browser Supabase client with the anon key.

### Server-Side

All variables are available on the server:
- `SUPABASE_SERVICE_ROLE_KEY` - Used by `lib/supabase/admin.ts` for Vault access and admin operations
- `OPENAI_API_KEY`, `ELEVENLABS_API_KEY` - Fallback keys when user keys not found in Vault

### Migrations

- `SUPABASE_DB_URL` - Direct database connection for running migrations via `pnpm db:migrate`
- Alternative: `SUPABASE_PROJECT_REF` + `SUPABASE_ACCESS_TOKEN` for remote push

## Troubleshooting

**Build fails with "Missing environment variable"**
- Check that required variables are set in `.env.local` or Vercel environment settings

**Database migrations fail**
- Ensure `SUPABASE_DB_URL` points to the **primary** (non-pooler) connection on port 5432
- Verify the password is correct and special characters are URL-encoded
- Alternative: use `SUPABASE_PROJECT_REF` + `SUPABASE_ACCESS_TOKEN`

**Client can't connect to Supabase**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` are correct
- Check browser console for CORS or connection errors

## Related Documentation

- [Back to Index](../INDEX.md)
- [Quick Start Guide](./QUICKSTART.md)
- [Supabase Setup](./SUPABASE.md)
- [Secrets Management](../security/SECRETS.md)
