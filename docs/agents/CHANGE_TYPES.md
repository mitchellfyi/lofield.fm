# Change Type Playbooks

**Purpose**: Step-by-step playbooks for common types of changes in the codebase  
**Audience**: AI agents (GitHub Copilot, Claude, etc.)  
**Last updated**: 2025-12-15

## Overview

This document provides playbooks for different types of changes. Each playbook lists:

- Required steps
- Files to update
- Checks to perform
- Common pitfalls

## UI Change

**What**: Adding or modifying user interface components

### Steps

1. **Identify component type**:
   - Server Component (default, for data fetching)
   - Client Component (for interactivity, hooks)

2. **Create or modify component**:

   ```typescript
   // Server Component (default)
   export default async function MyServerComponent() {
     const data = await fetchData();
     return <div>{data}</div>;
   }

   // Client Component (use 'use client')
   'use client';
   export default function MyClientComponent() {
     const [state, setState] = useState(false);
     return <button onClick={() => setState(!state)}>Toggle</button>;
   }
   ```

3. **Add styling** (Tailwind CSS):

   ```typescript
   <div className="flex flex-col gap-4 p-6">
     <h1 className="text-2xl font-bold">Title</h1>
   </div>
   ```

4. **Handle data fetching**:
   - Server Component: Direct async/await
   - Client Component: React Query, SWR, or useState + useEffect

5. **Test locally**:

   ```bash
   pnpm dev
   # Navigate to page in browser
   # Verify appearance and functionality
   ```

6. **Run verification**:
   ```bash
   pnpm verify  # format:check, lint, typecheck, test
   ```

### Files to Update

- `/app/[route]/page.tsx` - Page component
- `/components/*.tsx` - Reusable components
- `/app/globals.css` - Global styles (if needed)
- `/tests/**/*.test.tsx` - Component tests

### Checks

- [ ] Component renders without errors
- [ ] Responsive on mobile and desktop
- [ ] Accessible (semantic HTML, ARIA labels if needed)
- [ ] No console errors or warnings
- [ ] Passes `pnpm verify`

### Common Pitfalls

- ❌ Using client-only hooks (`useState`, `useEffect`) in server components
- ❌ Importing server-only code in client components
- ❌ Forgetting to add `'use client'` for interactive components
- ❌ Not testing different screen sizes

## API Change

**What**: Adding or modifying API routes or server actions

### Steps

1. **Choose implementation**:
   - **API Route**: For external calls, webhooks, complex logic
   - **Server Action**: For form submissions, simple mutations

2. **Create API route**:

   ```typescript
   // /app/api/my-endpoint/route.ts
   import { NextResponse } from "next/server";
   import { createServerSupabaseClient } from "@/lib/supabase/server";

   export async function POST(request: Request) {
     // 1. Validate session
     const supabase = await createServerSupabaseClient();
     const {
       data: { session },
       error,
     } = await supabase.auth.getSession();

     if (error || !session) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

     // 2. Validate input
     const body = await request.json();
     // ... validation logic ...

     // 3. Perform operation
     try {
       const result = await doWork(body);
       return NextResponse.json({ data: result });
     } catch (err) {
       console.error("Operation failed:", {
         message: err.message,
         userId: session.user.id,
       });
       return NextResponse.json({ error: "Failed" }, { status: 500 });
     }
   }
   ```

3. **Or create server action**:

   ```typescript
   // /app/[route]/actions.ts
   'use server';
   import { createServerSupabaseClient } from '@/lib/supabase/server';
   import { revalidatePath } from 'next/cache';

   export async function myAction(formData: FormData) {
     const supabase = await createServerSupabaseClient();
     const { data: { session } } = await supabase.auth.getSession();

     if (!session) {
       throw new Error('Unauthorized');
     }

     // Perform mutation
     await supabase.from('table').insert({ ... });

     // Revalidate if needed
     revalidatePath('/path');

     return { success: true };
   }
   ```

4. **Add usage logging** (if provider call):

   ```typescript
   // After OpenAI/ElevenLabs call
   await supabase.from("usage_events").insert({
     user_id: session.user.id,
     provider: "openai",
     model: "gpt-4o",
     action_type: "refine",
     tokens: usage.total_tokens,
     estimated_cost_usd: calculateCost(usage),
   });
   ```

5. **Write tests**:

   ```typescript
   // /tests/api/my-endpoint.test.ts
   import { describe, it, expect } from "vitest";

   describe("/api/my-endpoint", () => {
     it("returns 401 without session", async () => {
       // Test unauthorized access
     });

     it("performs operation successfully", async () => {
       // Test happy path
     });
   });
   ```

6. **Test locally**:

   ```bash
   pnpm dev
   # Call API route with curl or UI
   curl -X POST http://localhost:3003/api/my-endpoint -H "Content-Type: application/json" -d '{"key":"value"}'
   ```

7. **Run verification**:
   ```bash
   pnpm verify
   ```

### Files to Update

- `/app/api/[route]/route.ts` - API route handler
- `/app/[route]/actions.ts` - Server actions
- `/lib/*.ts` - Helper functions
- `/tests/api/*.test.ts` - API tests

### Checks

- [ ] Session validation works
- [ ] Input validation prevents bad data
- [ ] Error handling returns appropriate status codes
- [ ] Usage events logged (if provider call)
- [ ] No secrets logged
- [ ] Tests pass
- [ ] Passes `pnpm verify`

### Common Pitfalls

- ❌ Forgetting session validation
- ❌ Not sanitizing error logs (leaking keys)
- ❌ Missing usage event logging for provider calls
- ❌ Using admin client when user client should be used
- ❌ Not handling provider errors (401, 429, etc.)

## Migration Change

**What**: Adding or modifying database schema

### Steps

1. **Create migration file**:

   ```bash
   # Naming: NNNN_description.sql (sequential)
   touch supabase/migrations/0009_add_new_table.sql
   ```

2. **Write migration**:

   ```sql
   -- Add table
   CREATE TABLE new_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users NOT NULL,
     data TEXT,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Enable RLS (MANDATORY)
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

   -- Add policies
   CREATE POLICY "users_view_own"
     ON new_table FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "users_insert_own"
     ON new_table FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "users_update_own"
     ON new_table FOR UPDATE
     USING (auth.uid() = user_id);

   CREATE POLICY "users_delete_own"
     ON new_table FOR DELETE
     USING (auth.uid() = user_id);

   -- Add updated_at trigger
   CREATE TRIGGER set_updated_at
     BEFORE UPDATE ON new_table
     FOR EACH ROW
     EXECUTE FUNCTION trigger_set_updated_at();

   -- Add indexes
   CREATE INDEX idx_new_table_user_created
     ON new_table(user_id, created_at DESC);
   ```

3. **Test locally**:

   ```bash
   pnpm db:migrate
   ```

4. **Verify RLS**:

   ```sql
   -- In Supabase SQL Editor
   SET LOCAL ROLE authenticated;
   SET LOCAL request.jwt.claims.sub TO 'test-user-uuid';

   INSERT INTO new_table (user_id, data) VALUES ('test-user-uuid', 'test');
   SELECT * FROM new_table;  -- Should only see test-user-uuid's rows

   RESET ROLE;
   ```

5. **Update TypeScript types** (if needed):

   ```typescript
   // /lib/types.ts
   export interface NewTable {
     id: string;
     user_id: string;
     data: string;
     created_at: string;
     updated_at: string;
   }
   ```

6. **Run migration in production** (before deploying code):

   ```bash
   SUPABASE_DB_URL="..." pnpm db:migrate
   ```

7. **Deploy code that uses migration**

### Files to Update

- `/supabase/migrations/NNNN_description.sql` - Migration file
- `/lib/types.ts` - TypeScript types (if needed)
- `/app/api/` or `/app/` - Code using new schema
- `/tests/` - Tests for new functionality

### Checks

- [ ] Migration runs without errors locally
- [ ] RLS enabled on all user-data tables
- [ ] RLS policies exist for all operations (SELECT, INSERT, UPDATE, DELETE)
- [ ] `updated_at` trigger added (if table has `updated_at`)
- [ ] Indexes added for common queries
- [ ] Migration tested manually with RLS
- [ ] Migration run in production before code deploy
- [ ] Passes `pnpm verify`

### Common Pitfalls

- ❌ Forgetting to enable RLS
- ❌ Missing RLS policies for some operations
- ❌ Deploying code before running migration
- ❌ Not testing RLS with `SET LOCAL ROLE`
- ❌ Forgetting `user_id` column on user-data tables
- ❌ Missing `updated_at` trigger

## Provider Change

**What**: Adding or modifying OpenAI/ElevenLabs integration

### Steps

1. **Identify provider operation**:
   - OpenAI: Chat completion, streaming
   - ElevenLabs: Text-to-speech, subscription check

2. **Fetch user's API key from Vault**:

   ```typescript
   import { supabaseAdmin } from "@/lib/supabase/admin";

   // Get secret ID
   const { data: userSecrets } = await supabaseAdmin
     .from("user_secrets")
     .select("openai_secret_id") // or elevenlabs_secret_id
     .eq("user_id", userId)
     .maybeSingle();

   // Decrypt secret
   let apiKey = null;
   if (userSecrets?.openai_secret_id) {
     const { data } = await supabaseAdmin.rpc("decrypt_secret", {
       secret_id: userSecrets.openai_secret_id,
     });
     apiKey = data;
   }

   // Fallback to env var (dev only)
   apiKey = apiKey || process.env.OPENAI_API_KEY;
   ```

3. **Call provider API**:

   ```typescript
   import { openai } from "@ai-sdk/openai";
   import { streamText } from "ai";

   const result = await streamText({
     model: openai("gpt-4o"),
     messages,
   });
   ```

4. **Extract usage metadata**:

   ```typescript
   result.then(async (completion) => {
     const usage = completion.usage;
     // usage.promptTokens, usage.completionTokens
   });
   ```

5. **Calculate cost**:

   ```typescript
   const { data: pricing } = await supabase
     .from("provider_pricing")
     .select("*")
     .eq("provider", "openai")
     .eq("model", "gpt-4o")
     .order("effective_date", { ascending: false })
     .limit(1)
     .single();

   const cost =
     (usage.promptTokens / 1_000_000) * pricing.input_cost_per_1m +
     (usage.completionTokens / 1_000_000) * pricing.output_cost_per_1m;
   ```

6. **Log usage event** (MANDATORY):

   ```typescript
   await supabase.from("usage_events").insert({
     user_id: session.user.id,
     chat_id: chatId,
     provider: "openai",
     model: "gpt-4o",
     action_type: "refine",
     action_group_id: actionGroupId,
     tokens: usage.totalTokens,
     estimated_cost_usd: cost,
   });
   ```

7. **Handle errors**:

   ```typescript
   try {
     const result = await provider.call();
   } catch (error) {
     // Handle specific errors
     if (error.status === 429) {
       return { error: "Rate limit exceeded" };
     }
     if (error.status === 401) {
       return { error: "Invalid API key" };
     }

     // Log sanitized error
     console.error("Provider call failed:", {
       message: error.message,
       status: error.status,
       // DO NOT log: headers, apiKey
     });

     throw error;
   }
   ```

8. **Test locally**:

   ```bash
   pnpm dev
   # Use UI or API to trigger provider call
   # Verify usage event is logged
   ```

9. **Run verification**:
   ```bash
   pnpm verify
   ```

### Files to Update

- `/app/api/chat/route.ts` - OpenAI integration
- `/lib/elevenlabs.ts` - ElevenLabs integration
- `/lib/usage-tracking.ts` - Usage logging helpers
- `/tests/` - Provider integration tests

### Checks

- [ ] User's API key fetched from Vault
- [ ] Fallback to env var works (dev only)
- [ ] Provider call succeeds with valid key
- [ ] Usage event logged with correct fields
- [ ] Cost calculation uses provider_pricing table
- [ ] Error handling for rate limits (429)
- [ ] Error handling for invalid key (401)
- [ ] No API keys or headers logged
- [ ] Passes `pnpm verify`

### Common Pitfalls

- ❌ Forgetting to log usage event
- ❌ Using wrong usage unit (tokens vs characters)
- ❌ Logging full error (may contain API key in headers)
- ❌ Not handling provider errors
- ❌ Sending API key to client
- ❌ Missing fallback to env var for local dev

## CI Change

**What**: Modifying GitHub Actions workflows or verification scripts

### Steps

1. **Identify change**:
   - Add new check (e.g., security scan)
   - Modify existing check (e.g., change Node version)
   - Add deployment step

2. **Update workflow file**:

   ```yaml
   # .github/workflows/ci.yml
   name: CI

   on:
     pull_request:
     push:
       branches: [main]

   jobs:
     verify:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: "20"
         - uses: pnpm/action-setup@v2
           with:
             version: "10.26.0"
         - run: pnpm install
         - run: pnpm verify
   ```

3. **Test workflow locally** (if possible):

   ```bash
   # Install act (GitHub Actions local runner)
   brew install act

   # Run workflow locally
   act pull_request
   ```

4. **Push and verify on GitHub**:

   ```bash
   git add .github/workflows/ci.yml
   git commit -m "Update CI workflow"
   git push
   # Check GitHub Actions tab for results
   ```

5. **Update documentation**:
   - Update [Releases](../runbook/RELEASES.md) if CI affects deployments
   - Update [Agent Playbook](./AGENT_PLAYBOOK.md) if CI changes verification process

### Files to Update

- `/.github/workflows/*.yml` - Workflow files
- `/package.json` - Scripts (if adding new command)
- `/docs/runbook/RELEASES.md` - Deployment docs
- `/docs/agents/AGENT_PLAYBOOK.md` - Agent guidelines

### Checks

- [ ] Workflow syntax is valid (YAML)
- [ ] All jobs complete successfully
- [ ] New checks align with existing patterns
- [ ] Documentation updated
- [ ] Tested on a PR

### Common Pitfalls

- ❌ Invalid YAML syntax
- ❌ Missing permissions in workflow
- ❌ Using incompatible Node/pnpm versions
- ❌ Not testing workflow before merging

## Related Documentation

- [Back to Index](../INDEX.md)
- [Agent Playbook](./AGENT_PLAYBOOK.md)
- [Repo Gotchas](./REPO_GOTCHAS.md)
- [Supabase Instructions](../../.github/instructions/supabase.instructions.md)
- [Provider Instructions](../../.github/instructions/providers.instructions.md)
- [Next.js Instructions](../../.github/instructions/nextjs.instructions.md)

## Relevant Code

- `/app/` - Application code
- `/lib/` - Helper functions
- `/supabase/migrations/` - Database migrations
- `/tests/` - Test files
- `/.github/workflows/` - CI/CD workflows
