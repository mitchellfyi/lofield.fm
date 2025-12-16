# Security Model

**Purpose**: Comprehensive security architecture and threat model for Lofield Studio  
**Audience**: Developers and security auditors  
**Last updated**: 2025-12-15

## Security Overview

Lofield Studio follows a **defense-in-depth** approach with multiple security layers:

1. **Authentication**: OAuth via Supabase Auth (Google, GitHub)
2. **Authorization**: Row Level Security (RLS) enforces user data isolation
3. **Secrets Management**: Supabase Vault stores encrypted API keys server-side
4. **Storage Access**: Private buckets with signed URLs
5. **Network Security**: HTTPS only, no public endpoints without auth

## Core Principle: Never Send Secrets to Browser

**Rule**: Provider API keys, service role keys, and sensitive data **never** leave the server.

### What's Exposed to Browser
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (public Supabase project URL)
- ✅ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (anon key, safe by design)
- ✅ Session cookies (HTTP-only, secure)
- ✅ Signed URLs (time-limited, user-scoped)

### What's Server-Only
- 🔒 `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- 🔒 User API keys (OpenAI, ElevenLabs) stored in Vault
- 🔒 Vault decryption operations
- 🔒 Admin Supabase client operations

## Authentication

### OAuth Providers

Supported:
- **Google OAuth**: Sign in with Google account
- **GitHub OAuth**: Sign in with GitHub account

Configuration:
- Redirect URLs must be whitelisted in Supabase Dashboard → Authentication → URL Configuration
- Development: `http://localhost:3003/auth/callback`
- Production: `https://your-domain.com/auth/callback`

### Session Management

**Cookie-based sessions**:
- Supabase Auth sets HTTP-only cookies
- Cookies are validated on every request via `createServerSupabaseClient()`
- No localStorage or sessionStorage (more secure)

**Session validation**:
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function protectedRoute() {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    redirect('/auth/login');
  }
  
  // session.user.id is safe to use
}
```

## Row Level Security (RLS)

### Principle

**Users can only access rows they own**, determined by `user_id = auth.uid()`.

### RLS Enforcement

Every table (except reference data) has RLS enabled:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);
```

See [RLS Documentation](./RLS.md) for full policy details.

### Why RLS Matters

1. **Defense in depth**: Even if application code has a bug, database prevents cross-user access
2. **Audit-friendly**: Policies are declarative and easy to review
3. **Principle of least privilege**: Users can't bypass restrictions

### RLS Gotchas

❌ **Don't use admin client for regular queries**:
```typescript
// WRONG: Bypasses RLS
import { supabaseAdmin } from '@/lib/supabase/admin';
const { data } = await supabaseAdmin.from('chats').select();
```

✅ **Do use user-scoped client**:
```typescript
// RIGHT: RLS enforced
import { createServerSupabaseClient } from '@/lib/supabase/server';
const supabase = await createServerSupabaseClient();
const { data } = await supabase.from('chats').select();
```

## Secrets Management (Vault)

### Architecture

```
User API Keys (OpenAI, ElevenLabs)
  ↓ Submitted via /api/settings/secrets (HTTPS)
  ↓ Server validates session
  ↓ Server calls supabaseAdmin.rpc('store_user_secret', ...)
  ↓ Vault encrypts and stores in vault.secrets table
  ↓ user_secrets table stores secret_id references
  ↓ Keys NEVER sent back to browser
```

### Vault Operations (Server-Only)

**Store a secret**:
```typescript
import { supabaseAdmin } from '@/lib/supabase/admin';

// Only callable server-side
await supabaseAdmin.rpc('store_user_secret', {
  p_user_id: userId,
  p_provider: 'openai', // or 'elevenlabs'
  p_secret: apiKey,
});
```

**Retrieve a secret**:
```typescript
// Step 1: Get secret_id
const { data: userSecrets } = await supabaseAdmin
  .from('user_secrets')
  .select('openai_secret_id')
  .eq('user_id', userId)
  .maybeSingle();

// Step 2: Decrypt
if (userSecrets?.openai_secret_id) {
  const { data: decrypted } = await supabaseAdmin.rpc('decrypt_secret', {
    secret_id: userSecrets.openai_secret_id,
  });
  // decrypted contains the API key
}
```

**Never**:
- ❌ Send decrypted keys to browser
- ❌ Log full API keys (even in dev)
- ❌ Include keys in error messages

See [Secrets Management](./SECRETS.md) for full details.

## Storage Security

### Private Buckets

All storage buckets are **private by default**:
- `tracks` bucket: User audio files

### Path-Based Isolation

Files are stored with user ID prefix:
```
tracks/{user_id}/{track_id}.mp3
```

Storage policies enforce this structure:

```sql
-- Users can only upload to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tracks'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

See [Storage Policies](./STORAGE.md) for full details.

### Signed URLs

**Time-limited access**:
- Browser requests signed URL from server
- Server validates user owns the file
- Server returns signed URL (valid for 1 hour)
- Browser plays audio directly from signed URL

```typescript
// Server-side
const { data } = await supabase.storage
  .from('tracks')
  .createSignedUrl(`${userId}/${trackId}.mp3`, 3600); // 1 hour

return { signedUrl: data.signedUrl };
```

**Why signed URLs**:
- ✅ No permanent public access
- ✅ User-scoped (can't generate URLs for others' files)
- ✅ Automatically expire

## Threat Model

### Threats We Mitigate

| Threat                     | Mitigation                                                         |
| -------------------------- | ------------------------------------------------------------------ |
| **Cross-user data access** | RLS policies + user_id checks                                      |
| **API key leakage**        | Vault storage, server-side only access                             |
| **Unauthorized file access**| Storage policies + signed URLs                                     |
| **Session hijacking**      | HTTP-only cookies, secure flag, same-site strict                   |
| **SQL injection**          | Parameterized queries (Supabase client auto-escapes)               |
| **XSS attacks**            | React auto-escapes, CSP headers (TODO)                             |

### Threats We Don't (Yet) Mitigate

| Threat                     | Risk Level | Future Mitigation                                    |
| -------------------------- | ---------- | ---------------------------------------------------- |
| **DDoS attacks**           | Medium     | Rate limiting (TODO), Vercel DDoS protection         |
| **Cost bombs**             | Medium     | Usage quotas per user (TODO)                         |
| **Compromised provider**   | Low        | Provider key rotation, monitor provider status       |
| **Insider threats**        | Low        | Audit logs (TODO), least privilege for team members  |

## Security Checklist for New Features

Before deploying:

- [ ] All new tables have RLS enabled
- [ ] All new tables have appropriate policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] No secrets are sent to the browser
- [ ] Admin client is not imported in client components
- [ ] Error messages don't leak sensitive data
- [ ] Logs don't contain API keys, tokens, or full request/response bodies
- [ ] Storage paths include user_id prefix
- [ ] Input is validated (Zod or manual)
- [ ] Session is checked for protected routes/actions

## Incident Response

### Suspected API Key Leak

1. **Immediately revoke the key** in the provider dashboard (OpenAI, ElevenLabs)
2. Generate a new key
3. Update in Vault or environment variables
4. Audit usage logs for unauthorized activity
5. If committed to git: `git filter-branch` to remove from history

See [Incidents Runbook](../runbook/INCIDENTS.md) for full procedures.

### RLS Policy Bug

1. **Do not disable RLS** to "fix" quickly
2. Write a corrective migration with fixed policy
3. Test locally with `set local role authenticated;`
4. Deploy fix migration
5. Verify no cross-user access occurred

### Service Role Key Leak

1. **Immediately** rotate key in Supabase Dashboard
2. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables
3. Redeploy app
4. Audit database for unauthorized access (check RLS-bypassing queries)

## Security Best Practices

### ✅ Do

- **Validate all input** at API boundaries (Zod schemas)
- **Use RLS** for all user data tables
- **Store secrets in Vault**, not environment variables (for user keys)
- **Use signed URLs** for file access
- **Log sanitized errors** (message, status, userId only)
- **Test RLS policies** manually before deploying

### ❌ Don't

- **Send service role key to browser** (or any sensitive key)
- **Bypass RLS** with admin client for regular queries
- **Make storage buckets public** (use signed URLs instead)
- **Log full API requests/responses** (may contain keys)
- **Hardcode secrets** in code

## Compliance Notes

- **Data residency**: Supabase region is user-configurable (EU, US, etc.)
- **Encryption at rest**: Vault uses `pgsodium`, database uses provider encryption
- **Encryption in transit**: HTTPS enforced (Vercel + Supabase)
- **User data ownership**: Users own their API keys, we store them encrypted
- **Data retention**: Users can delete their account (TODO: cascade delete implementation)

## Related Documentation

- [Back to Index](../INDEX.md)
- [Secrets Management](./SECRETS.md)
- [Row Level Security (RLS)](./RLS.md)
- [Storage Policies](./STORAGE.md)
- [Incidents Runbook](../runbook/INCIDENTS.md)

## Relevant Code

- `/lib/supabase/admin.ts` - Admin client (service role key)
- `/lib/supabase/server.ts` - Server-side client (user session)
- `/lib/supabase/client.ts` - Browser client (anon key)
- `/supabase/migrations/0002_rls.sql` - RLS policies
- `/supabase/migrations/0003_storage.sql` - Storage policies
- `/supabase/migrations/0004_vault_helpers.sql` - Vault helper functions
- `/app/api/settings/secrets/route.ts` - API key storage endpoint
