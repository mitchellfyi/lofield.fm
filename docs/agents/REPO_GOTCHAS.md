# Repository Gotchas

**Purpose**: Common mistakes agents make in this repo and how to avoid them  
**Audience**: AI agents (GitHub Copilot, Claude, etc.)  
**Last updated**: 2025-12-15

## Critical Rules

These rules are **non-negotiable**. Violating them creates security vulnerabilities or breaks the app.

### 🔒 Security Violations

#### Never Import Admin Client in Client Components

**Wrong**:

```typescript
// ❌ WRONG: Client component importing admin client
"use client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default function MyComponent() {
  const data = await supabaseAdmin.from("chats").select();
  // This exposes service role key to browser!
}
```

**Right**:

```typescript
// ✅ RIGHT: Client component uses client library
"use client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function MyComponent() {
  const supabase = createBrowserSupabaseClient();
  const data = await supabase.from("chats").select();
  // RLS enforced, safe
}
```

**Why**: Admin client uses service role key which bypasses RLS. Exposing to browser = total security breach.

#### Never Log API Keys or Headers

**Wrong**:

```typescript
// ❌ WRONG: Logging full error (may contain keys in headers)
try {
  await openai.chat.completions.create({ ... });
} catch (error) {
  console.error('OpenAI failed:', error);
  // Error object may contain request.headers with API key!
}
```

**Right**:

```typescript
// ✅ RIGHT: Log sanitized error
try {
  await openai.chat.completions.create({ ... });
} catch (error) {
  console.error('OpenAI failed:', {
    message: error.message,
    status: error.status,
    // DO NOT log: headers, request, apiKey
  });
}
```

**Why**: Logs may be sent to external services or viewed by multiple team members. API keys in logs = security breach.

#### Never Disable RLS to "Make It Work"

**Wrong**:

```sql
-- ❌ WRONG: Disabling RLS to bypass policy issues
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
```

**Right**:

```sql
-- ✅ RIGHT: Fix the policy instead
DROP POLICY IF EXISTS "bad_policy" ON chats;

CREATE POLICY "users_view_own_chats"
  ON chats FOR SELECT
  USING (auth.uid() = user_id);
```

**Why**: RLS is the primary defense against cross-user data access. Disabling it = data leak.

#### Never Make Storage Buckets Public

**Wrong**:

```sql
-- ❌ WRONG: Making bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'tracks';
```

**Right**:

```typescript
// ✅ RIGHT: Use signed URLs
const { data } = await supabase.storage
  .from("tracks")
  .createSignedUrl(`${userId}/${trackId}.mp3`, 3600);
```

**Why**: Public buckets allow anyone to access all files. Use signed URLs for time-limited access.

### 🏗️ Code Structure Violations

#### Don't Import Server-Only Code in Client Components

**Wrong**:

```typescript
// ❌ WRONG: Importing server-only function in client component
"use client";
import { getSecretFromVault } from "@/lib/secrets"; // Server-only!

export default function Settings() {
  const apiKey = await getSecretFromVault("openai");
  // This won't work and may break build
}
```

**Right**:

```typescript
// ✅ RIGHT: Use Server Action or API Route
"use client";
import { saveApiKey } from "./actions"; // Server Action

export default function Settings() {
  async function handleSubmit(formData: FormData) {
    await saveApiKey(formData);
  }
  // Server Action handles Vault access
}
```

**Why**: Client components run in browser, can't access server-only APIs (Vault, admin client, env vars).

#### Don't Create Tables Without RLS

**Wrong**:

```sql
-- ❌ WRONG: Table without RLS
CREATE TABLE new_table (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  data TEXT
);
-- Missing: ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
```

**Right**:

```sql
-- ✅ RIGHT: Table with RLS and policies
CREATE TABLE new_table (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data TEXT
);

ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own"
  ON new_table FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own"
  ON new_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Why**: Every user-data table needs RLS. See [Supabase Instructions](../../.github/instructions/supabase.instructions.md).

#### Don't Forget Usage Event Logging for Provider Calls

**Wrong**:

```typescript
// ❌ WRONG: Provider call without usage logging
const response = await openai.chat.completions.create({ ... });
// Missing: Insert into usage_events
return response;
```

**Right**:

```typescript
// ✅ RIGHT: Provider call with usage logging
const response = await openai.chat.completions.create({ ... });

// Log usage event
await supabase.from('usage_events').insert({
  user_id: session.user.id,
  chat_id: chatId,
  provider: 'openai',
  model: 'gpt-4o',
  action_type: 'refine',
  tokens: response.usage.total_tokens,
  estimated_cost_usd: calculateCost(response.usage),
});

return response;
```

**Why**: Usage tracking is a core feature. Every provider call must be logged. See [Provider Instructions](../../.github/instructions/providers.instructions.md).

### 📝 Code Quality Violations

#### Don't Skip `pnpm verify`

**Wrong**:

```bash
# ❌ WRONG: Committing without verification
git add .
git commit -m "Add feature"
git push
```

**Right**:

```bash
# ✅ RIGHT: Always verify before committing
pnpm verify  # Runs format:check, lint, typecheck, test
# Fix any issues
git add .
git commit -m "Add feature"
git push
```

**Why**: `pnpm verify` is the quality gate. All checks must pass before merging.

#### Don't Delete Working Tests

**Wrong**:

```typescript
// ❌ WRONG: Deleting failing test
// test('should validate user input', () => {
//   // This test is failing, so I'll delete it
// });
```

**Right**:

```typescript
// ✅ RIGHT: Fix the test or fix the code
test("should validate user input", () => {
  // Fix test to match actual behavior
  // Or fix code to match expected behavior
});
```

**Why**: Tests document expected behavior. Deleting tests hides bugs.

## Common Mistakes

### Mistake: Using `ENVIRONMENT.md` Instead of `ENV_VARS.md`

**What happens**: Documentation references point to wrong file.

**Fix**: Use `/docs/setup/ENV_VARS.md` for environment variable documentation.

**Why**: The issue spec requires `ENV_VARS.md`. Both files may exist temporarily.

### Mistake: Forgetting `updated_at` Trigger

**Wrong**:

```sql
-- ❌ WRONG: Table without updated_at trigger
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Right**:

```sql
-- ✅ RIGHT: Table with updated_at trigger
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
```

**Why**: `updated_at` should auto-update on changes. Trigger ensures it happens.

### Mistake: Hardcoding Localhost URLs

**Wrong**:

```typescript
// ❌ WRONG: Hardcoded localhost
const API_URL = "http://localhost:3003/api/chat";
```

**Right**:

```typescript
// ✅ RIGHT: Relative URLs or environment-aware
const API_URL = "/api/chat"; // Relative URL, works everywhere
// Or use Next.js environment variables if needed
```

**Why**: Code should work in dev, preview, and production without changes.

### Mistake: Not Handling Provider Errors

**Wrong**:

```typescript
// ❌ WRONG: No error handling
const audio = await client.textToSpeech.convert({ ... });
```

**Right**:

```typescript
// ✅ RIGHT: Handle rate limits, invalid keys, etc.
try {
  const audio = await client.textToSpeech.convert({ ... });
} catch (error) {
  if (error.status === 429) {
    throw new Error('ElevenLabs quota exceeded. Check your subscription.');
  }
  if (error.status === 401) {
    throw new Error('Invalid ElevenLabs API key. Update in Settings.');
  }
  throw error;
}
```

**Why**: Provider APIs can fail for many reasons. Handle gracefully.

### Mistake: Mixing Up `tokens` and `characters`

**Wrong**:

```typescript
// ❌ WRONG: Using characters for OpenAI
await supabase.from("usage_events").insert({
  provider: "openai",
  characters: prompt.length, // Wrong unit!
});
```

**Right**:

```typescript
// ✅ RIGHT: Use tokens for OpenAI, characters for ElevenLabs
await supabase.from("usage_events").insert({
  provider: "openai",
  tokens: response.usage.total_tokens, // Correct
});

await supabase.from("usage_events").insert({
  provider: "elevenlabs",
  characters: prompt.length, // Correct
});
```

**Why**: Different providers use different usage units.

### Mistake: Forgetting to Include `user_id` in Queries

**Wrong**:

```typescript
// ❌ WRONG: No user_id filter (RLS will block anyway, but inefficient)
const { data } = await supabase.from("chats").select().eq("id", chatId);
```

**Right**:

```typescript
// ✅ RIGHT: Include user_id for clarity and index usage
const { data } = await supabase
  .from("chats")
  .select()
  .eq("user_id", userId)
  .eq("id", chatId)
  .maybeSingle();
```

**Why**: RLS enforces it anyway, but explicit filter improves readability and uses indexes.

### Mistake: Using `createClient` Instead of Helper Functions

**Wrong**:

```typescript
// ❌ WRONG: Direct createClient usage
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, anonKey);
```

**Right**:

```typescript
// ✅ RIGHT: Use helper functions
// Server-side
import { createServerSupabaseClient } from "@/lib/supabase/server";
const supabase = await createServerSupabaseClient();

// Client-side
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
const supabase = createBrowserSupabaseClient();
```

**Why**: Helper functions handle cookies, sessions, and caching correctly.

## Debugging Tips

### Check Which Client You're Using

```typescript
// In a component or API route
console.log("Supabase client:", supabase.constructor.name);
// Should be 'SupabaseClient' (not admin)

// Check if session exists
const {
  data: { session },
} = await supabase.auth.getSession();
console.log("User ID:", session?.user?.id);
```

### Test RLS Locally

```sql
-- In Supabase SQL Editor
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'user-uuid';

SELECT * FROM chats;  -- Should only return user's chats

RESET ROLE;
```

### Check Environment Variables

```typescript
// Server-side only!
console.log({
  hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  // Never log the actual values
});
```

## Quick Reference

### File Locations

| Task                         | Location                                      |
| ---------------------------- | --------------------------------------------- |
| Admin client (service role)  | `/lib/supabase/admin.ts`                      |
| Server-side client (session) | `/lib/supabase/server.ts`                     |
| Browser client (anon)        | `/lib/supabase/client.ts`                     |
| Migrations                   | `/supabase/migrations/*.sql`                  |
| API routes                   | `/app/api/*/route.ts`                         |
| Server actions               | `/app/**/actions.ts`                          |
| Vault helpers                | `/supabase/migrations/0004_vault_helpers.sql` |

### Common Patterns

| Pattern           | Example                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| Validate session  | `const { data: { session } } = await supabase.auth.getSession()`            |
| Fetch from Vault  | `const { data } = await supabaseAdmin.rpc('decrypt_secret', { secret_id })` |
| Log usage event   | `await supabase.from('usage_events').insert({ ... })`                       |
| Create signed URL | `await supabase.storage.from('tracks').createSignedUrl(path, 3600)`         |
| RLS policy        | `CREATE POLICY "name" ON table USING (auth.uid() = user_id)`                |

## Related Documentation

- [Back to Index](../INDEX.md)
- [Agent Playbook](./AGENT_PLAYBOOK.md)
- [Security Model](../security/SECURITY_MODEL.md)
- [Supabase Instructions](../../.github/instructions/supabase.instructions.md)
- [Provider Instructions](../../.github/instructions/providers.instructions.md)
- [Next.js Instructions](../../.github/instructions/nextjs.instructions.md)

## Relevant Code

- `/.github/instructions/` - Pattern-specific rules for agents
- `/lib/supabase/` - Supabase client helpers
- `/lib/` - Utility functions and helpers
- `/supabase/migrations/` - Database schema and RLS policies
