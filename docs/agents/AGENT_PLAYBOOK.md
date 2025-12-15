# Agent Playbook

**Purpose**: Best practices and guidelines for AI agents working in the Lofield Studio codebase  
**Audience**: AI agents (GitHub Copilot, Claude, etc.)  
**Last updated**: 2025-12-15

## Core Principles

### 1. Security First

**Never compromise security**:
- ✅ API keys stay server-side in Vault
- ✅ RLS policies enforce user isolation
- ✅ Storage is private with signed URLs
- ❌ Never send secrets to the client
- ❌ Never relax RLS "just to make it work"
- ❌ Never make storage buckets public

### 2. Test Everything

**Every change needs tests**:
- ✅ Write tests for new features
- ✅ Write tests for bug fixes
- ✅ Run `pnpm verify` before committing
- ❌ Don't delete failing tests
- ❌ Don't skip testing

### 3. Minimal Changes

**Make surgical edits**:
- ✅ Change only what's necessary
- ✅ Follow existing patterns
- ✅ Keep PRs small and focused
- ❌ Don't refactor unrelated code
- ❌ Don't "improve" code that works

## Required Workflows

### Before Making Changes

1. **Read the docs**:
   - [System Overview](../architecture/OVERVIEW.md) - Understand the architecture
   - [Data Flow](../architecture/DATA_FLOW.md) - Understand request flows
   - Relevant guides for your task (security, providers, etc.)

2. **Understand the codebase**:
   - Read existing code in the area you're changing
   - Look for similar patterns to copy
   - Check tests to understand expected behavior

3. **Run the app locally**:
   ```bash
   pnpm install
   pnpm dev
   # Open http://localhost:3003 and test the feature
   ```

### Making Changes

1. **Follow patterns**:
   - Copy existing code structure (see `lib/`, `app/api/`)
   - Use consistent naming conventions
   - Match code style (use `pnpm format`)

2. **Write tests**:
   - Add tests in `/tests` directory
   - Match existing test patterns
   - Cover happy path and error cases

3. **Run verification**:
   ```bash
   pnpm verify  # Runs format:check, lint, typecheck, test
   ```

### After Changes

1. **Verify locally**:
   ```bash
   pnpm dev
   # Test your changes in the browser
   ```

2. **Check all verification passes**:
   ```bash
   pnpm verify  # Must pass 100%
   ```

3. **Review the diff**:
   - Ensure only necessary files changed
   - Check for accidentally committed secrets or debug code

## Code Patterns

### API Routes

**Pattern**: Server-side auth, Vault access, error handling

```typescript
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  // 1. Validate session
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate input (use Zod or manual checks)
  const body = await request.json();
  // ... validate body ...

  // 3. Fetch secrets from Vault (if needed)
  const { data: apiKey } = await supabaseAdmin.rpc('get_user_secret', {
    user_id: session.user.id,
    secret_name: 'provider_name',
  });

  // 4. Perform operation
  try {
    const result = await doWork(apiKey, body);

    // 5. Log usage event (if provider call)
    await supabase.from('usage_events').insert({
      user_id: session.user.id,
      provider: 'provider_name',
      // ... other fields ...
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    // 6. Sanitize and log error
    console.error('Operation failed:', {
      message: err.message,
      status: err.status,
      // DO NOT log: headers, apiKey, full request
    });

    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}
```

### Database Queries

**Pattern**: User-scoped queries with RLS

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function getUserChats(userId: string) {
  const supabase = await createServerSupabaseClient();

  // RLS automatically filters to user's chats
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch chats: ${error.message}`);
  }

  return data;
}
```

**Never** use the admin client for regular queries (bypasses RLS).

### Storage Operations

**Pattern**: User-scoped paths, signed URLs

```typescript
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export async function getTrackSignedUrl(userId: string, trackId: string) {
  const supabase = createBrowserSupabaseClient();

  // Path must include userId for RLS
  const filePath = `${userId}/${trackId}.mp3`;

  const { data, error } = await supabase.storage
    .from('tracks')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
```

## Common Tasks

### Adding a New API Route

1. Create file in `/app/api/[route]/route.ts`
2. Follow API route pattern above
3. Validate session and input
4. Use Vault for secrets if needed
5. Log usage events for provider calls
6. Write tests in `/tests/api/[route].test.ts`
7. Run `pnpm verify`

### Adding a New Database Table

1. Create migration in `/supabase/migrations/NNNN_description.sql`
2. Include:
   - Table definition with `user_id uuid references auth.users`
   - `alter table [table] enable row level security;`
   - Policies for SELECT, INSERT, UPDATE, DELETE
   - `updated_at` trigger if applicable
3. Run locally: `pnpm db:migrate`
4. Test RLS policies manually
5. Update TypeScript types if needed

See [Supabase Instructions](../../.github/instructions/supabase.instructions.md).

### Updating Provider Integration

1. Read provider docs in `/docs/providers/`
2. Follow existing provider patterns
3. Update Vault key retrieval if needed
4. Log usage events with correct metadata
5. Sanitize errors (no headers, no keys)
6. Test with real provider API
7. Run `pnpm verify`

## What NOT to Do

### ❌ Security Violations

- **Don't** import `supabaseAdmin` in client components
- **Don't** send API keys to the browser
- **Don't** log sensitive data (keys, headers, full requests)
- **Don't** make storage buckets public
- **Don't** disable or weaken RLS policies

### ❌ Code Quality Issues

- **Don't** skip `pnpm verify`
- **Don't** commit without tests
- **Don't** delete working tests
- **Don't** refactor unrelated code
- **Don't** add dependencies without asking

### ❌ Data Integrity Issues

- **Don't** skip usage event logging for provider calls
- **Don't** bypass RLS with admin client for regular queries
- **Don't** create tables without RLS enabled
- **Don't** allow cross-user data access

## Debugging Tips

### Check Session

```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('User ID:', session?.user?.id);
```

### Check RLS

```sql
-- In Supabase SQL Editor
set local role authenticated;
set local request.jwt.claims.sub to 'user-uuid';
select * from table_name;
reset role;
```

### Check Vault

```sql
-- Check if secret exists
select name from vault.secrets where name like '%user-uuid%';
```

### Check Storage

```typescript
// List files in user's folder
const { data: files } = await supabase.storage
  .from('tracks')
  .list(`${userId}/`);
console.log('Files:', files);
```

## Emergency Procedures

### Accidental Secret Commit

1. **Immediately** revoke the secret in provider dashboard
2. Remove from git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Generate new secret and update in Vault/env vars
4. Force push (coordinate with team)

### RLS Policy Bug in Production

1. **Don't** disable RLS
2. Write a fix migration:
   ```sql
   drop policy if exists "bad_policy" on table_name;
   create policy "fixed_policy" on table_name for select using (auth.uid() = user_id);
   ```
3. Test locally, then deploy

### Database Migration Failure

1. **Don't** rollback (not supported)
2. Write a new migration to undo changes
3. Test locally first
4. Deploy fix migration

## Resources

- [Documentation Index](../INDEX.md)
- [System Overview](../architecture/OVERVIEW.md)
- [Security Guides](../security/)
- [Troubleshooting](../runbook/TROUBLESHOOTING.md)
- [GitHub Copilot Instructions](../../.github/copilot-instructions.md)

## Related Documentation

- [Back to Index](../INDEX.md)
- [Quick Start Guide](../setup/QUICKSTART.md)
- [Secrets Management](../security/SECRETS.md)
- [RLS](../security/RLS.md)
- [Data Flow](../architecture/DATA_FLOW.md)
