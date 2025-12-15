# Supabase Setup

**Purpose**: Detailed guide for configuring Supabase (database, auth, storage, vault)  
**Audience**: Developers and DevOps  
**Last updated**: 2025-12-15

## Overview

Lofield Studio uses Supabase for:

- **Auth**: Google and GitHub OAuth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Storage**: Private bucket for generated audio files
- **Vault**: Encrypted storage for per-user API keys

## Create Supabase Project

### Option A: Hosted (Recommended for Production)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Choose a region close to your users
4. Save your database password securely

### Option B: Local (Development Alternative)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start
```

## Enable Supabase Vault Extension

The Vault extension is required for storing per-user API keys.

### In Hosted Supabase

1. Go to SQL Editor in Supabase Dashboard
2. Run this command:

```sql
create extension if not exists "supabase_vault";
```

### Verify Vault is Enabled

```sql
select * from pg_extension where extname = 'supabase_vault';
```

You should see one row returned.

## Run Database Migrations

Migrations create all tables, RLS policies, storage buckets, and helper functions.

### Prerequisites

Set your `SUPABASE_DB_URL` in `.env.local`:

```env
SUPABASE_DB_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

**Important**: Use the **primary** (non-pooler) connection on port 5432, not the pooled connection on port 6543.

### Run Migrations

```bash
pnpm db:migrate
```

This pushes all migrations in `/supabase/migrations/` to your database.

### What Gets Created

1. **Tables**: `profiles`, `user_settings`, `chats`, `messages`, `tracks`, `usage_events`, `usage_daily_rollups`, `provider_pricing`
2. **RLS Policies**: User-scoped access controls on all tables
3. **Storage Bucket**: `tracks` bucket with private access
4. **Vault Functions**: Helper functions for storing/retrieving API keys
5. **Triggers**: `updated_at` triggers for timestamp management

## Configure Authentication

### Enable OAuth Providers

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Google**:
   - Add Client ID and Client Secret from Google Cloud Console
   - Set authorized redirect URIs
3. Enable **GitHub**:
   - Add Client ID and Client Secret from GitHub OAuth Apps
   - Set authorization callback URL

### Set Redirect URLs

Add these URLs in Supabase Dashboard → Authentication → URL Configuration:

**Development**:

```
http://localhost:3003/auth/callback
```

**Production**:

```
https://your-domain.com/auth/callback
```

### Site URL

Set the site URL in Supabase Dashboard → Authentication → URL Configuration:

**Development**: `http://localhost:3003`  
**Production**: `https://your-domain.com`

## Configure Storage

### Verify Tracks Bucket

The migrations create a `tracks` bucket. Verify in Supabase Dashboard → Storage.

### Storage Policies

The bucket has RLS-style policies that enforce:

- Users can only upload to `tracks/{user_id}/...`
- Users can only read their own files
- Files are served via short-lived signed URLs

See [Storage Policies](../security/STORAGE.md) for details.

## Database Schema Overview

### Core Tables

| Table                 | Purpose                 | RLS                             |
| --------------------- | ----------------------- | ------------------------------- |
| `profiles`            | User profile data       | Users own their profile         |
| `user_settings`       | Per-user app settings   | Users own their settings        |
| `chats`               | Chat sessions           | Users own their chats           |
| `messages`            | Chat messages           | Users access via chat ownership |
| `tracks`              | Generated audio tracks  | Users own their tracks          |
| `usage_events`        | Provider API usage logs | Users see their own events      |
| `usage_daily_rollups` | Daily usage aggregates  | Users see their own rollups     |
| `provider_pricing`    | Provider cost data      | Public read                     |

### Vault (Secrets)

User API keys are stored in `vault.secrets` with:

- `name`: Format is `{user_id}/openai` or `{user_id}/elevenlabs`
- `secret`: Encrypted API key value
- Only accessible via service role key

## Connection Strings

### Primary (Direct)

**Format**: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

Use for:

- Running migrations (`pnpm db:migrate`)
- Installing extensions
- Admin operations

### Pooled (Transaction Mode)

**Format**: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

Use for:

- Serverless functions (Vercel, AWS Lambda)
- High-concurrency workloads

**Note**: Lofield Studio uses the primary connection for migrations only. The app uses Supabase's client libraries, which handle pooling automatically.

## Common Issues

### Migration Fails with "Extension Does Not Exist"

**Cause**: Vault extension not enabled or using pooled connection.

**Fix**:

1. Ensure you're using the primary connection (port 5432)
2. Run `create extension if not exists "supabase_vault";` in SQL Editor
3. Retry `pnpm db:migrate`

### OAuth Redirect Fails

**Cause**: Redirect URL mismatch.

**Fix**:

1. Verify redirect URLs in Supabase Dashboard match your app URLs exactly
2. Check site URL is set correctly
3. Ensure OAuth provider settings have correct redirect URIs

### Storage Upload Fails with 403

**Cause**: Storage policies not applied or user ID mismatch.

**Fix**:

1. Check migrations created storage policies: `pnpm db:migrate`
2. Verify file path uses correct user ID: `tracks/{auth.uid()}/...`
3. See [Storage Policies](../security/STORAGE.md) for debugging

## Related Documentation

- [Back to Index](../INDEX.md)
- [Quick Start Guide](./QUICKSTART.md)
- [Environment Variables](./ENVIRONMENT.md)
- [Row Level Security (RLS)](../security/RLS.md)
- [Storage Policies](../security/STORAGE.md)
