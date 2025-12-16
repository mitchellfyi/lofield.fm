# ADR 0001: Supabase RLS and Vault

**Status**: Accepted  
**Date**: 2025-12-15  
**Deciders**: Engineering Team  
**Related**: Security Model, Data Model

## Context

Lofield Studio needed a secure way to:

1. **Isolate user data** - Users must only access their own chats, tracks, and usage data
2. **Store API keys** - Users provide their own OpenAI and ElevenLabs API keys
3. **Prevent data leaks** - Even application bugs should not allow cross-user access
4. **Minimize attack surface** - Secrets must never reach the browser

### Constraints

- **No dedicated backend**: Using Next.js serverless functions (no long-running server)
- **Cost-effective**: Avoid additional services for auth and secrets management
- **Developer experience**: Make it hard to accidentally violate security
- **Compliance-ready**: Support data residency and encryption requirements

### Problem Statement

Without proper data isolation and secrets management:

- Application bugs could leak user data across accounts
- API keys could be exposed in client-side code or logs
- Debugging requires manual verification of data access patterns
- Security relies entirely on application code correctness

## Decision

We will use **Supabase Row Level Security (RLS)** for data isolation and **Supabase Vault** for secrets management.

### Row Level Security (RLS)

**What**: PostgreSQL's built-in row-level security policies enforced at the database layer.

**How**:

1. Enable RLS on all user-data tables
2. Create policies that check `auth.uid() = user_id`
3. Use user-scoped Supabase client (with session) for regular queries
4. Reserve admin client (service role) for Vault operations only

**Example**:

```sql
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_chats"
  ON chats FOR SELECT
  USING (auth.uid() = user_id);
```

### Supabase Vault

**What**: PostgreSQL extension (`supabase_vault`) for encrypted secret storage.

**How**:

1. Store user API keys in `vault.secrets` table (encrypted at rest)
2. Create `user_secrets` table to map users to their secret IDs
3. Access Vault only via admin client (service role key) server-side
4. Never send decrypted secrets to browser

**Example**:

```typescript
// Server-side only
await supabaseAdmin.rpc("store_user_secret", {
  p_user_id: userId,
  p_provider: "openai",
  p_secret: apiKey,
});
```

## Alternatives Considered

### Option 1: Application-Level Access Control (Rejected)

**Pros**:

- Simpler initial implementation
- More flexible (can implement complex logic)

**Cons**:

- ❌ Application bugs bypass security
- ❌ No defense in depth
- ❌ Hard to audit
- ❌ Easy to forget checks in new endpoints

**Why rejected**: Too risky. Single bug = data leak.

### Option 2: AWS Secrets Manager + Auth0 (Rejected)

**Pros**:

- Industry-standard tools
- Highly scalable

**Cons**:

- ❌ Additional services to manage ($$$)
- ❌ More complex integration
- ❌ Not co-located with database
- ❌ Requires separate billing/monitoring

**Why rejected**: Overkill for current scale, higher cost and complexity.

### Option 3: Environment Variables per User (Rejected)

**Pros**:

- Simple concept

**Cons**:

- ❌ Doesn't scale (need N env vars for N users)
- ❌ Requires redeploy to add users
- ❌ No encryption at rest
- ❌ Exposed in Vercel dashboard

**Why rejected**: Not viable for multi-user app.

### Option 4: Supabase RLS + Vault (Selected)

**Pros**:

- ✅ Defense in depth (database enforces isolation)
- ✅ Built-in to Supabase (no extra service)
- ✅ Encrypted at rest (pgsodium)
- ✅ Auditable (policies in SQL)
- ✅ Hard to make mistakes (RLS blocks unauthorized access)

**Cons**:

- Slightly more complex policy design
- Admin client usage must be carefully controlled

**Why selected**: Best balance of security, cost, and developer experience.

## Consequences

### Positive

1. **Defense in depth**: Even if application code has bugs, RLS prevents cross-user access
2. **Encrypted secrets**: Vault provides PostgreSQL-native encryption for API keys
3. **No extra services**: RLS and Vault are built into Supabase (included in pricing)
4. **Auditable**: RLS policies are declarative SQL (easy to review)
5. **Compliance-ready**: Supports data residency (Supabase region) and encryption at rest

### Negative

1. **Policy complexity**: RLS policies must be carefully designed and tested
2. **Admin client risk**: Service role key must be protected (bypasses RLS)
3. **Learning curve**: Developers must understand RLS and Vault

### Neutral

1. **Database-centric security**: Security model tightly coupled to database
2. **PostgreSQL dependency**: RLS is PostgreSQL-specific (not portable to other databases)

## Implementation

### Phase 1: Enable RLS on All Tables

1. **Create migration** (`/supabase/migrations/0002_rls.sql`):

   ```sql
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
   ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
   -- ... etc
   ```

2. **Add policies for each table**:
   - SELECT: `auth.uid() = user_id`
   - INSERT: `auth.uid() = user_id`
   - UPDATE: `auth.uid() = user_id`
   - DELETE: `auth.uid() = user_id` (where applicable)

3. **Test policies manually**:
   ```sql
   SET LOCAL ROLE authenticated;
   SET LOCAL request.jwt.claims.sub TO 'user-uuid';
   SELECT * FROM chats; -- Should only return user's chats
   RESET ROLE;
   ```

### Phase 2: Implement Vault for API Keys

1. **Enable Vault extension**:

   ```sql
   CREATE EXTENSION IF NOT EXISTS "supabase_vault";
   ```

2. **Create helper functions** (`/supabase/migrations/0004_vault_helpers.sql`):
   - `store_user_secret(user_id, provider, secret)` - Encrypt and store
   - `get_user_secret_id(user_id, provider)` - Get secret ID
   - `decrypt_secret(secret_id)` - Decrypt secret

3. **Create `user_secrets` table**:

   ```sql
   CREATE TABLE user_secrets (
     user_id UUID PRIMARY KEY REFERENCES auth.users,
     openai_secret_id UUID REFERENCES vault.secrets,
     elevenlabs_secret_id UUID REFERENCES vault.secrets
   );
   ```

4. **Update API routes to use Vault**:
   - Settings page: Store keys via admin client
   - Provider calls: Fetch keys from Vault, never send to client

### Phase 3: Enforce Rules

1. **Code review checklist**:
   - [ ] New tables have RLS enabled
   - [ ] Admin client only used for Vault
   - [ ] Secrets never logged or sent to browser

2. **Documentation**:
   - [Security Model](../security/SECURITY_MODEL.md)
   - [RLS Guide](../security/RLS.md)
   - [Secrets Management](../security/SECRETS.md)

3. **Testing**:
   - Manual RLS tests in SQL Editor
   - Integration tests for Vault operations

### Success Criteria

1. **Zero cross-user access**: Users can only see/modify their own data
2. **Zero key leaks**: API keys never appear in browser, logs, or errors
3. **RLS coverage**: 100% of user-data tables have RLS enabled
4. **Vault usage**: 100% of user API keys stored in Vault

## Notes

### Future Considerations

- **Automated RLS testing**: Add tests to CI/CD to verify policies
- **Vault key rotation**: Implement automatic secret rotation
- **Audit logs**: Enable Vault access logging for compliance

### Dependencies

- Requires Supabase project with Vault extension enabled
- Requires service role key (must be kept secure)

## Related Documentation

- [Back to Index](../INDEX.md)
- [Security Model](../security/SECURITY_MODEL.md)
- [RLS Guide](../security/RLS.md)
- [Secrets Management](../security/SECRETS.md)
- [Data Model](../architecture/DATA_MODEL.md)

## Relevant Code

- `/supabase/migrations/0002_rls.sql` - RLS policies for all tables
- `/supabase/migrations/0003_storage.sql` - Storage policies
- `/supabase/migrations/0004_vault_helpers.sql` - Vault helper functions
- `/lib/supabase/admin.ts` - Admin client (service role)
- `/lib/supabase/server.ts` - Server-side client (user session)
- `/lib/supabase/client.ts` - Browser client (anon key)
- `/app/api/settings/secrets/route.ts` - API key storage endpoint
