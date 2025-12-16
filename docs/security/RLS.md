# Row Level Security (RLS)

**Purpose**: Database access control patterns and RLS policies in Lofield Studio  
**Audience**: Developers  
**Last updated**: 2025-12-15

## Overview

Row Level Security (RLS) is PostgreSQL's built-in mechanism for controlling which rows users can access. In Lofield Studio, RLS ensures users can only see and modify their own data.

## Core Principle

**Users can only access rows they own**, determined by matching `user_id` column to `auth.uid()`.

## RLS Configuration

### Enable RLS on Tables

Every table in Lofield Studio has RLS enabled:

```sql
alter table profiles enable row level security;
alter table user_settings enable row level security;
alter table chats enable row level security;
alter table messages enable row level security;
alter table tracks enable row level security;
alter table usage_events enable row level security;
alter table usage_daily_rollups enable row level security;
```

**Exception**: `provider_pricing` is public read-only (no user_id column).

## Policy Patterns

### Pattern 1: Direct Ownership

For tables with a `user_id` column, policies check `auth.uid() = user_id`:

```sql
-- profiles table
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = user_id);
```

**Tables using this pattern**:

- `profiles`
- `user_settings`
- `chats`
- `tracks`
- `usage_events`
- `usage_daily_rollups`

### Pattern 2: Indirect Ownership (via Foreign Key)

For tables without a direct `user_id` column but related to a parent table:

```sql
-- messages table (user_id is on chats table)
create policy "Users can view their own messages"
  on messages for select
  using (
    exists (
      select 1 from chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their chats"
  on messages for insert
  with check (
    exists (
      select 1 from chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );
```

**Tables using this pattern**:

- `messages` (owned via `chats.user_id`)

### Pattern 3: Public Read-Only

For reference data that all users can read but not modify:

```sql
-- provider_pricing table
create policy "Anyone can view provider pricing"
  on provider_pricing for select
  using (true);
```

**Tables using this pattern**:

- `provider_pricing`

## Policy Operations

### SELECT (Read)

```sql
create policy "policy_name"
  on table_name for select
  using ( <condition> );
```

`using`: Condition that must be true for a row to be returned.

### INSERT (Create)

```sql
create policy "policy_name"
  on table_name for insert
  with check ( <condition> );
```

`with check`: Condition that must be true for a row to be inserted.

### UPDATE (Modify)

```sql
create policy "policy_name"
  on table_name for update
  using ( <condition> )
  with check ( <condition> );
```

- `using`: Condition that must be true to select the row for update
- `with check`: Condition that must be true for the updated row

### DELETE (Remove)

```sql
create policy "policy_name"
  on table_name for delete
  using ( <condition> );
```

`using`: Condition that must be true to delete the row.

## Current Policies by Table

### profiles

| Operation | Policy                 |
| --------- | ---------------------- |
| SELECT    | `auth.uid() = user_id` |
| INSERT    | `auth.uid() = user_id` |
| UPDATE    | `auth.uid() = user_id` |
| DELETE    | (not allowed)          |

### user_settings

| Operation | Policy                 |
| --------- | ---------------------- |
| SELECT    | `auth.uid() = user_id` |
| INSERT    | `auth.uid() = user_id` |
| UPDATE    | `auth.uid() = user_id` |
| DELETE    | (not allowed)          |

### chats

| Operation | Policy                 |
| --------- | ---------------------- |
| SELECT    | `auth.uid() = user_id` |
| INSERT    | `auth.uid() = user_id` |
| UPDATE    | `auth.uid() = user_id` |
| DELETE    | `auth.uid() = user_id` |

### messages

| Operation | Policy                    |
| --------- | ------------------------- |
| SELECT    | `chat_id` in user's chats |
| INSERT    | `chat_id` in user's chats |
| UPDATE    | (not allowed)             |
| DELETE    | (not allowed)             |

### tracks

| Operation | Policy                                                                |
| --------- | --------------------------------------------------------------------- |
| SELECT    | Anyone can view public/unlisted tracks OR `auth.uid() = user_id`      |
| INSERT    | `auth.uid() = user_id` AND chat belongs to user                       |
| UPDATE    | `auth.uid() = user_id` (cannot change user_id, chat_id, storage_path) |
| DELETE    | `auth.uid() = user_id` AND chat belongs to user                       |

**Note**: As of migration 0009, tracks support public visibility. Anonymous users can read tracks with `visibility in ('public', 'unlisted')`. Owners can always read all their tracks regardless of visibility.

### usage_events

| Operation | Policy                 |
| --------- | ---------------------- |
| SELECT    | `auth.uid() = user_id` |
| INSERT    | `auth.uid() = user_id` |
| UPDATE    | (not allowed)          |
| DELETE    | (not allowed)          |

### usage_daily_rollups

| Operation | Policy                 |
| --------- | ---------------------- |
| SELECT    | `auth.uid() = user_id` |
| INSERT    | (service role only)    |
| UPDATE    | (service role only)    |
| DELETE    | (not allowed)          |

### provider_pricing

| Operation | Policy               |
| --------- | -------------------- |
| SELECT    | `true` (public read) |
| INSERT    | (service role only)  |
| UPDATE    | (service role only)  |
| DELETE    | (not allowed)        |

## Testing RLS Policies

### Manual Testing

Use Supabase SQL Editor with `set local role authenticated;` to test as a user:

```sql
-- Simulate authenticated user
set local role authenticated;
set local request.jwt.claims.sub to 'user-uuid-here';

-- Try queries (should only see user's own rows)
select * from chats;
select * from messages;

-- Reset
reset role;
```

### Automated Testing

Future: Add RLS tests using Supabase test framework or integration tests.

## Common Pitfalls

### ❌ Using Service Role from Client

```typescript
// WRONG: Admin client in client component
import { supabaseAdmin } from "@/lib/supabase/admin";

export default function MyComponent() {
  const data = await supabaseAdmin.from("chats").select();
  // This bypasses RLS!
}
```

**Fix**: Use the user-scoped client (`lib/supabase/client.ts` or `lib/supabase/server.ts`).

### ❌ Forgetting RLS on New Tables

```sql
-- WRONG: Table without RLS
create table new_table (
  id uuid primary key,
  user_id uuid references auth.users,
  data text
);
-- Missing: alter table new_table enable row level security;
```

**Fix**: Always enable RLS and add policies for every new table.

### ❌ Overly Permissive Policies

```sql
-- WRONG: Allows users to see all rows
create policy "bad_policy"
  on chats for select
  using (true);
```

**Fix**: Use `auth.uid() = user_id` or appropriate ownership check.

## Debugging RLS Issues

### Query Returns No Rows

**Possible causes**:

1. RLS policy is too restrictive
2. User is not authenticated (`auth.uid()` is null)
3. `user_id` doesn't match session

**Debug steps**:

1. Check if user is authenticated: `auth.uid()` should return a UUID
2. Verify `user_id` in the row matches the session user ID
3. Review the policy conditions in Supabase Dashboard → Database → Policies

### Query Fails with Permission Denied

**Possible causes**:

1. RLS is enabled but no policies grant access
2. Policy uses `with check` that fails

**Debug steps**:

1. Verify policies exist for the operation (SELECT, INSERT, UPDATE, DELETE)
2. Check policy conditions match your use case
3. Use `set local role authenticated;` in SQL Editor to test

## Migration Guidelines

When adding new tables:

1. **Enable RLS**: `alter table <table> enable row level security;`
2. **Add ownership column**: `user_id uuid references auth.users not null`
3. **Create policies**: At minimum, SELECT and INSERT for owners
4. **Test**: Verify users can't access others' rows

See [Supabase Instructions](../../.github/instructions/supabase.instructions.md) for full checklist.

## Related Documentation

- [Back to Index](../INDEX.md)
- [Secrets Management](./SECRETS.md)
- [Storage Policies](./STORAGE.md)
- [Supabase Setup](../setup/SUPABASE.md)
