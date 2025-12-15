# Secrets Management

**Purpose**: How API keys and sensitive data are stored and accessed in Lofield Studio  
**Audience**: Developers and security auditors  
**Last updated**: 2025-12-15

## Overview

Lofield Studio uses a **per-user API key model**: each user brings their own OpenAI and ElevenLabs API keys. Keys are stored server-side in Supabase Vault and **never** exposed to the browser.

## Architecture

### Key Storage

```
User API Keys
  ↓
Supabase Vault (vault.secrets table)
  ├─ Encrypted at rest
  ├─ Accessible only via service role key
  └─ Named as {user_id}/openai or {user_id}/elevenlabs
```

### Key Retrieval

```
API Request
  ↓
Server validates session
  ↓
Server fetches key from Vault (using service role)
  ↓
Server calls provider API
  ↓
Server logs usage
  ↓
Response (no key exposed)
```

## Supabase Vault

### What is Vault?

Supabase Vault is a PostgreSQL extension (`supabase_vault`) that provides:

- **Encrypted storage**: Secrets are encrypted at rest using `pgsodium`
- **Key rotation**: Built-in support for key rotation
- **Audit trail**: Access logging (if enabled)
- **Row-level isolation**: Secrets are isolated by name

### Vault Schema

Secrets are stored in the `vault.secrets` table:

| Column       | Type      | Description                            |
| ------------ | --------- | -------------------------------------- |
| `id`         | UUID      | Unique identifier                      |
| `name`       | TEXT      | Secret name (e.g., `{user_id}/openai`) |
| `secret`     | TEXT      | Encrypted secret value                 |
| `created_at` | TIMESTAMP | Creation time                          |
| `updated_at` | TIMESTAMP | Last update time                       |

### Naming Convention

Secrets use a hierarchical naming scheme:

- OpenAI key: `{user_id}/openai`
- ElevenLabs key: `{user_id}/elevenlabs`

Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890/openai`

## Server-Side Access

### Admin Client (Service Role)

Only the **admin Supabase client** (using service role key) can access Vault:

```typescript
// lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

**⚠️ Critical**: The service role key **bypasses RLS**. Use it only for:

- Vault operations
- Admin operations requiring elevated privileges
- **Never** import admin client in client components

### Vault Helper Functions

Located in `/supabase/migrations/0004_vault_helpers.sql`:

```sql
-- Store a secret
create or replace function store_user_secret(
  user_id uuid,
  secret_name text,
  secret_value text
) returns void
language plpgsql security definer
as $$
begin
  -- Implementation uses vault.create_secret or vault.update_secret
end;
$$;

-- Retrieve a secret
create or replace function get_user_secret(
  user_id uuid,
  secret_name text
) returns text
language plpgsql security definer
as $$
begin
  -- Implementation uses vault.read_secret
end;
$$;
```

These functions are called from server-side code via the admin client.

### Storing Keys

Example from `/app/api/settings/secrets/route.ts`:

```typescript
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { openai_key, elevenlabs_key } = await request.json();

  // Store in Vault using admin client
  if (openai_key) {
    await supabaseAdmin.rpc("store_user_secret", {
      user_id: session.user.id,
      secret_name: "openai",
      secret_value: openai_key,
    });
  }

  if (elevenlabs_key) {
    await supabaseAdmin.rpc("store_user_secret", {
      user_id: session.user.id,
      secret_name: "elevenlabs",
      secret_value: elevenlabs_key,
    });
  }

  return NextResponse.json({ success: true });
}
```

### Retrieving Keys

Example from `/app/api/chat/route.ts`:

```typescript
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user's OpenAI key from Vault
  const { data: openaiKey } = await supabaseAdmin.rpc("get_user_secret", {
    user_id: session.user.id,
    secret_name: "openai",
  });

  // Fallback to env var for development
  const apiKey = openaiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 400 }
    );
  }

  // Use apiKey for OpenAI call (never send to client)
  // ...
}
```

## Development Fallback Keys

For local development convenience, the app supports fallback keys in `.env.local`:

```env
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
```

**Behavior**:

- If a user has not saved their own key, the app uses the fallback
- Fallback keys are **never** used in production (must be per-user keys)
- Fallback keys are **server-only** (never exposed to client)

## Security Best Practices

### ✅ Do

- **Store keys in Vault** using the admin client
- **Fetch keys server-side** only (API routes, server actions, server components)
- **Validate input** before storing (check key format, length)
- **Use fallback keys** only for local development
- **Log sanitized errors** (no headers, no keys, no full request bodies)

### ⚠️ Caution

- **Service role key**: Treat as root password. Never commit or expose.
- **Error messages**: Ensure provider errors don't leak keys in headers or bodies
- **Logging**: Never log raw API requests/responses that contain keys

### 🚫 Never

- **Send keys to client**: No keys in JSON responses, cookies, or localStorage
- **Log keys**: Even in development, avoid logging full keys
- **Hardcode keys**: Use environment variables or Vault
- **Import admin client in client components**: This exposes service role key

## Error Handling

### Sanitizing Provider Errors

When logging provider errors, remove sensitive data:

```typescript
function sanitizeError(error: any) {
  return {
    message: error.message,
    status: error.status,
    // DO NOT include: headers, request, response, apiKey
  };
}

try {
  await openai.chat.completions.create({ ... });
} catch (error) {
  console.error('OpenAI call failed:', sanitizeError(error));
  return NextResponse.json(
    { error: 'AI provider error' },
    { status: 500 }
  );
}
```

## Key Rotation

### User-Initiated Rotation

Users can update their keys at any time via the Settings page. The new key overwrites the old one in Vault.

### Service Role Key Rotation

If the `SUPABASE_SERVICE_ROLE_KEY` is compromised:

1. Generate a new service role key in Supabase Dashboard
2. Update the key in Vercel environment variables
3. Redeploy the app

## Compliance Considerations

- **User data ownership**: Users own their API keys; we only store them encrypted
- **Data residency**: Vault data resides in the Supabase region (user-configurable)
- **Encryption**: Vault uses `pgsodium` for encryption at rest
- **Access control**: Service role key is the only way to read secrets

## Related Documentation

- [Back to Index](../INDEX.md)
- [Environment Variables](../setup/ENVIRONMENT.md)
- [System Overview](../architecture/OVERVIEW.md)
- [Row Level Security (RLS)](./RLS.md)
