# Troubleshooting

**Purpose**: Common issues and solutions for Lofield Studio  
**Audience**: Developers and operators  
**Last updated**: 2025-12-15

## Development Environment

### `pnpm install` Fails

**Symptoms**:
- Dependency resolution errors
- Lock file conflicts

**Solutions**:
1. **Check pnpm version**:
   ```bash
   pnpm --version  # Should be 10.26.x
   npm install -g pnpm@10.26.0
   ```

2. **Clear cache and reinstall**:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

3. **Check Node version**:
   ```bash
   node --version  # Should be >= 20.18
   ```

### `pnpm dev` Fails to Start

**Symptoms**:
- Port already in use
- Environment variable errors

**Solutions**:

1. **Port conflict**:
   ```bash
   # Kill process on port 3003
   lsof -ti:3003 | xargs kill -9
   pnpm dev
   ```

2. **Missing `.env.local`**:
   ```bash
   cp .env.example .env.local
   # Fill in required variables
   pnpm dev
   ```

3. **Database connection fails**:
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` are correct
   - Check Supabase project is running

### `pnpm verify` Fails

**Symptoms**:
- Format, lint, typecheck, or test errors

**Solutions**:

1. **Format errors**:
   ```bash
   pnpm format  # Auto-fix formatting
   pnpm verify
   ```

2. **Lint errors**:
   ```bash
   pnpm lint  # See errors
   # Fix manually, then:
   pnpm verify
   ```

3. **TypeScript errors**:
   ```bash
   pnpm typecheck  # See errors
   # Fix types, then:
   pnpm verify
   ```

4. **Test failures**:
   ```bash
   pnpm test  # See failing tests
   # Fix tests, then:
   pnpm verify
   ```

## Database & Migrations

### Migration Fails: "Extension Does Not Exist"

**Symptoms**:
```
ERROR: extension "supabase_vault" does not exist
```

**Solutions**:

1. **Enable Vault extension** in Supabase SQL Editor:
   ```sql
   create extension if not exists "supabase_vault";
   ```

2. **Use primary (non-pooler) connection**:
   ```env
   # WRONG (pooler on port 6543)
   SUPABASE_DB_URL=postgresql://postgres...@aws-0-region.pooler.supabase.com:6543/postgres

   # RIGHT (primary on port 5432)
   SUPABASE_DB_URL=postgresql://postgres...@db.project-ref.supabase.co:5432/postgres
   ```

3. **Retry migration**:
   ```bash
   pnpm db:migrate
   ```

### Migration Fails: "Permission Denied"

**Symptoms**:
```
ERROR: permission denied to create extension "supabase_vault"
```

**Solutions**:

1. **Use primary connection** (port 5432, not pooler)
2. **Use Management API** (alternative):
   ```env
   SUPABASE_PROJECT_REF=your-project-ref
   SUPABASE_ACCESS_TOKEN=sbp_...
   ```
   ```bash
   pnpm db:migrate  # Will push remotely via Supabase CLI
   ```

### RLS Blocks All Queries

**Symptoms**:
- User can't see their own data
- `SELECT` returns empty results

**Solutions**:

1. **Check user is authenticated**:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   console.log('User ID:', session?.user?.id);
   ```

2. **Verify `user_id` matches**:
   ```sql
   select auth.uid();  -- Should match user_id in tables
   ```

3. **Check RLS policies exist**:
   - Go to Supabase Dashboard → Database → Policies
   - Verify policies for SELECT, INSERT, UPDATE, DELETE

4. **Test policy in SQL Editor**:
   ```sql
   set local role authenticated;
   set local request.jwt.claims.sub to 'your-user-uuid';
   select * from chats;  -- Should return user's chats
   reset role;
   ```

## Authentication

### OAuth Redirect Fails

**Symptoms**:
- Redirect loop
- "Invalid redirect URL" error

**Solutions**:

1. **Check redirect URLs in Supabase**:
   - Go to Authentication → URL Configuration
   - Verify `http://localhost:3003/auth/callback` is listed (dev)
   - Verify production URLs are listed (prod)

2. **Check site URL**:
   - Set to `http://localhost:3003` (dev) or `https://your-domain.com` (prod)

3. **Clear cookies**:
   ```bash
   # In browser DevTools:
   Application → Cookies → Clear
   ```

### Session Expires Immediately

**Symptoms**:
- User signs in but immediately signed out
- Session is null after redirect

**Solutions**:

1. **Check cookie settings**:
   - In Supabase Dashboard → Authentication → URL Configuration
   - Ensure site URL matches your domain

2. **Check for clock skew**:
   - Verify system time is correct
   - JWT expiry is time-sensitive

3. **Inspect session cookie**:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Session:', session);
   ```

## Storage

### Upload Fails with 403

**Symptoms**:
```
StorageError: new row violates row-level security policy
```

**Solutions**:

1. **Verify file path includes user ID**:
   ```typescript
   // WRONG
   const path = `tracks/${trackId}.mp3`;

   // RIGHT
   const path = `tracks/${userId}/${trackId}.mp3`;
   ```

2. **Check storage policies exist**:
   - Go to Supabase Dashboard → Storage → Policies
   - Verify INSERT policy for user's folder

3. **Use admin client for server-side uploads**:
   ```typescript
   import { supabaseAdmin } from '@/lib/supabase/admin';
   await supabaseAdmin.storage.from('tracks').upload(...);
   ```

### Signed URL Returns 404

**Symptoms**:
- File exists but signed URL returns 404

**Solutions**:

1. **Verify file path is correct**:
   ```typescript
   // Check file exists
   const { data: files } = await supabase.storage
     .from('tracks')
     .list(`${userId}/`);
   console.log('Files:', files);
   ```

2. **Check ownership**:
   - User can only create signed URLs for their own files
   - Path must start with `{userId}/`

3. **Regenerate signed URL**:
   ```typescript
   const { data } = await supabase.storage
     .from('tracks')
     .createSignedUrl(`${userId}/${trackId}.mp3`, 3600);
   ```

## Provider APIs

### OpenAI API Key Invalid

**Symptoms**:
```
401 Unauthorized: Invalid API key
```

**Solutions**:

1. **Verify key in Settings page**:
   - Go to `/settings` and re-enter OpenAI API key
   - Key should start with `sk-`

2. **Check key in Vault**:
   ```sql
   select name from vault.secrets where name like '%/openai';
   ```

3. **Use fallback key for testing**:
   ```env
   # .env.local
   OPENAI_API_KEY=sk-...
   ```

### ElevenLabs Character Limit Exceeded

**Symptoms**:
```
429 Too Many Requests: Character quota exceeded
```

**Solutions**:

1. **Check subscription in ElevenLabs dashboard**:
   - Go to [elevenlabs.io](https://elevenlabs.io) → Account
   - Verify character quota and usage

2. **Upgrade subscription**:
   - Starter: 30k characters/month ($5)
   - Creator: 100k characters/month ($22)
   - Pro: 500k characters/month ($99)

3. **Wait for quota reset**:
   - Check `next_character_count_reset_unix` in `/usage` page
   - Quotas reset monthly

### Provider Call Fails with Network Error

**Symptoms**:
```
Error: connect ETIMEDOUT
```

**Solutions**:

1. **Check internet connection**:
   ```bash
   ping api.openai.com
   ```

2. **Verify Vercel egress**:
   - Ensure Vercel serverless functions can reach external APIs
   - Check firewall/VPN settings

3. **Retry with exponential backoff** (future enhancement)

## Build & Deployment

### Vercel Build Fails

**Symptoms**:
- Build fails on Vercel with TypeScript or missing env var errors

**Solutions**:

1. **Run `pnpm verify` locally first**:
   ```bash
   pnpm verify
   # Fix all errors before pushing
   ```

2. **Check environment variables in Vercel**:
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Ensure all required vars are set

3. **Check build logs**:
   - Vercel Dashboard → Deployments → [Your Deployment] → Build Logs
   - Look for specific error messages

### Next.js Build Fails: "Module Not Found"

**Symptoms**:
```
Error: Cannot find module '@/lib/...'
```

**Solutions**:

1. **Verify imports use correct path aliases**:
   ```typescript
   // Check tsconfig.json paths
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```

2. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules .next
   pnpm install
   pnpm build
   ```

## Related Documentation

- [Back to Index](../INDEX.md)
- [Common Failures](./COMMON_FAILURES.md)
- [Quick Start Guide](../setup/QUICKSTART.md)
- [Supabase Setup](../setup/SUPABASE.md)
