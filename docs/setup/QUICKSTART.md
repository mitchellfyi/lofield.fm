# Quick Start Guide

**Purpose**: Get Lofield Studio running locally and generate your first track in under 15 minutes  
**Audience**: New developers, both human and AI agents  
**Last updated**: 2025-12-15

## Prerequisites (5 minutes)

1. **Node.js**: Version 20.18+ or 24.x
   ```bash
   node --version  # Should be >= 20.18
   ```

2. **pnpm**: Version 10.26.x
   ```bash
   npm install -g pnpm@10.26.0
   pnpm --version  # Should be 10.26.x
   ```

3. **Supabase Project**: Create a hosted project at [supabase.com](https://supabase.com) or run locally

## Setup Steps (10 minutes)

### 1. Clone and Install

```bash
git clone https://github.com/mitchellfyi/lofield.fm.git
cd lofield.fm
pnpm install
```

### 2. Configure Environment

Create `.env.local` from the template:

```bash
cp .env.example .env.local
```

Fill in the required variables (see [Environment Variables](./ENVIRONMENT.md) for details):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

### 3. Enable Supabase Vault

In your Supabase SQL editor, run:

```sql
create extension if not exists "supabase_vault";
```

### 4. Run Migrations

```bash
pnpm db:migrate
```

This creates all tables, RLS policies, storage buckets, and vault helper functions.

### 5. Configure OAuth

In Supabase Dashboard → Authentication → Providers:

1. Enable Google and/or GitHub OAuth
2. Add redirect URLs:
   - `http://localhost:3003/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)

### 6. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3003](http://localhost:3003)

## Generate Your First Track

1. **Sign In**: Click "Sign In" and authenticate with Google or GitHub
2. **Add API Keys**: Go to Settings → Add your OpenAI and ElevenLabs API keys
3. **Start a Chat**: Return to the main page and describe the lo-fi track you want
4. **Refine the Prompt**: Chat with the AI to refine your track description
5. **Generate**: The system will create your track and save it to Supabase Storage

## Verify Installation

Run the full verification suite:

```bash
pnpm verify
```

This runs:
- `pnpm format:check` - Code formatting
- `pnpm lint` - Linting
- `pnpm typecheck` - TypeScript compilation
- `pnpm test` - Test suite

All checks must pass before committing.

## Next Steps

- **Understand the Architecture**: Read [System Overview](../architecture/OVERVIEW.md)
- **Learn Security Patterns**: See [Secrets Management](../security/SECRETS.md) and [RLS](../security/RLS.md)
- **Provider Details**: Check [OpenAI](../providers/OPENAI.md) and [ElevenLabs](../providers/ELEVENLABS.md) docs

## Troubleshooting

If you encounter issues:
1. Check [Troubleshooting Guide](../runbook/TROUBLESHOOTING.md)
2. Verify your Supabase project is set up correctly (see [Supabase Setup](./SUPABASE.md))
3. Ensure environment variables are correct (see [Environment Variables](./ENVIRONMENT.md))

## Related Documentation

- [Back to Index](../INDEX.md)
- [Environment Variables](./ENVIRONMENT.md)
- [Supabase Setup](./SUPABASE.md)
- [System Overview](../architecture/OVERVIEW.md)
