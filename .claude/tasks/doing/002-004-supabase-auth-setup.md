# Task: Implement Supabase Backend and Authentication

## Metadata

| Field       | Value                                                  |
| ----------- | ------------------------------------------------------ |
| ID          | `002-004-supabase-auth-setup`                          |
| Status      | `doing`                                                |
| Priority    | `002` High                                             |
| Created     | `2026-01-23 12:00`                                     |
| Started     | `2026-01-23 21:01`                                     |
| Completed   |                                                        |
| Blocked By  |                                                        |
| Blocks      | `002-005-api-key-management`, `003-001-save-tracks-db` |
| Assigned To | `worker-1`                                             |
| Assigned At | `2026-01-23 21:01`                                     |

---

## Context

The app needs persistent storage and user authentication to support features like saving tracks, API key management, and sharing. Supabase provides PostgreSQL database and authentication out of the box.

- No database currently
- No user authentication
- Required for: saving tracks, API keys, sharing, user preferences
- Supabase offers: Postgres, Auth (GitHub, Google, email), Row Level Security

---

## Acceptance Criteria

- [ ] Supabase project created and configured
- [ ] Environment variables set up (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`)
- [ ] Supabase client configured (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- [ ] GitHub OAuth authentication working
- [ ] Google OAuth authentication working
- [ ] Email/password authentication working
- [ ] Auth UI components (sign in, sign up, sign out)
- [ ] Protected routes middleware
- [ ] User session available in client and server components
- [ ] Basic `users` table with profile data
- [ ] Row Level Security enabled
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

### Implementation Plan (Generated 2026-01-23 21:05)

#### Gap Analysis

| Criterion                               | Status  | Gap                                                          |
| --------------------------------------- | ------- | ------------------------------------------------------------ |
| Supabase project created and configured | no      | No Supabase project exists - requires manual dashboard setup |
| Environment variables set up            | no      | `.env.local` only has OpenAI vars - need Supabase URL/keys   |
| Supabase client configured              | no      | No `lib/supabase/` directory exists                          |
| GitHub OAuth authentication             | no      | No OAuth implementation exists                               |
| Google OAuth authentication             | no      | No OAuth implementation exists                               |
| Email/password authentication           | no      | No auth implementation exists                                |
| Auth UI components                      | no      | No `components/auth/` directory - only `components/studio/`  |
| Protected routes middleware             | no      | No `middleware.ts` file exists                               |
| User session in client/server           | no      | No session handling exists                                   |
| Basic `users` table                     | no      | No database schema or migrations                             |
| Row Level Security enabled              | no      | No RLS policies defined                                      |
| Tests written and passing               | no      | Need to add auth-related tests                               |
| Quality gates pass                      | pending | Need to verify after implementation                          |
| Changes committed                       | pending | After implementation complete                                |

#### Architecture Context

**Current Structure:**

- Next.js 16.x with App Router
- TypeScript strict mode
- Tailwind CSS v4 for styling
- Vitest for unit tests, Playwright for E2E
- `@/` alias for root imports
- Pattern: `lib/` for utilities/hooks, `components/` for UI
- Pattern: `components/studio/` for domain-specific components
- Pattern: Tests in `__tests__/` directories within feature folders

**Key Files to Reference:**

- `app/layout.tsx` - Root layout (needs auth provider wrapper)
- `app/studio/page.tsx` - Main app page (uses "use client", hooks pattern)
- `components/studio/TopBar.tsx` - Navigation bar (add user menu here)
- `lib/hooks/useModelSelection.ts` - Hook pattern with localStorage

#### Files to Create

1. **`lib/supabase/client.ts`** - Browser Supabase client
   - Create browser client using `@supabase/ssr`
   - Export `createClient` function for client components
   - Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **`lib/supabase/server.ts`** - Server Supabase client
   - Create server client with cookie handling
   - Export `createClient` function for server components/API routes
   - Handle cookies for session management

3. **`lib/supabase/middleware.ts`** - Middleware helpers
   - Update session function for middleware
   - Cookie handling for auth token refresh

4. **`middleware.ts`** (root) - Route protection middleware
   - Check auth state for protected routes
   - Redirect unauthenticated users to sign-in
   - Allow public routes (/, /auth/\*)
   - Refresh session on every request

5. **`components/auth/SignInForm.tsx`** - Sign-in UI component
   - Email/password form with validation
   - OAuth buttons (GitHub, Google)
   - Error message display
   - Link to sign-up
   - Match existing Tailwind/cyan color scheme

6. **`components/auth/SignUpForm.tsx`** - Sign-up UI component
   - Email/password registration form
   - Password confirmation
   - Terms acceptance checkbox
   - Link to sign-in

7. **`components/auth/UserMenu.tsx`** - User dropdown menu
   - Display user avatar (from provider or initials)
   - User email display
   - Sign out button
   - Match existing dropdown style from TopBar

8. **`components/auth/AuthProvider.tsx`** - Auth context provider
   - React context for auth state
   - Provide user/session to components
   - Handle auth state changes

9. **`app/auth/sign-in/page.tsx`** - Sign-in page
   - Server component wrapper
   - Redirect if already authenticated
   - Display SignInForm

10. **`app/auth/sign-up/page.tsx`** - Sign-up page
    - Server component wrapper
    - Redirect if already authenticated
    - Display SignUpForm

11. **`app/auth/callback/route.ts`** - OAuth callback handler
    - Handle OAuth redirect from providers
    - Exchange code for session
    - Redirect to studio on success

12. **`app/auth/confirm/route.ts`** - Email confirmation handler
    - Handle email verification links
    - Confirm user email
    - Redirect appropriately

13. **`supabase/migrations/001_initial_schema.sql`** - Database schema
    - Create `public.profiles` table linked to `auth.users`
    - Add fields: id, email, display_name, avatar_url, created_at, updated_at
    - Enable RLS on profiles table
    - Create RLS policies for read/write

14. **`lib/hooks/useAuth.ts`** - Auth hook
    - Get current user/session
    - Subscribe to auth state changes
    - Sign out function

15. **`lib/supabase/__tests__/client.test.ts`** - Client tests
    - Test client creation
    - Test environment variable handling

16. **`lib/hooks/__tests__/useAuth.test.ts`** - Auth hook tests
    - Test auth state handling
    - Test sign out functionality

#### Files to Modify

1. **`package.json`** - Add dependencies
   - Add `@supabase/supabase-js` (~2.x)
   - Add `@supabase/ssr` (~0.x)

2. **`.env.local`** - Add Supabase env vars
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Add `SUPABASE_SERVICE_ROLE_KEY`

3. **`.env.example`** - Document env vars
   - Add placeholders for Supabase vars

4. **`app/layout.tsx`** - Add auth provider
   - Wrap children with AuthProvider
   - Keep minimal, server component compatible

5. **`components/studio/TopBar.tsx`** - Add user menu
   - Import and render UserMenu component
   - Show sign-in button when not authenticated
   - Show UserMenu dropdown when authenticated

#### Implementation Order

1. **Phase 1: Infrastructure** (dependencies & env vars)
   - Install packages
   - Set up environment variables
   - Create Supabase project (manual step)

2. **Phase 2: Client Setup**
   - Create browser client (`lib/supabase/client.ts`)
   - Create server client (`lib/supabase/server.ts`)
   - Create middleware helpers (`lib/supabase/middleware.ts`)

3. **Phase 3: Auth Context**
   - Create AuthProvider component
   - Create useAuth hook
   - Update app layout to use AuthProvider

4. **Phase 4: Auth Pages**
   - Create sign-in page and form
   - Create sign-up page and form
   - Create OAuth callback route
   - Create email confirmation route

5. **Phase 5: Middleware**
   - Create root middleware.ts
   - Configure protected routes
   - Test redirect behavior

6. **Phase 6: UI Integration**
   - Create UserMenu component
   - Update TopBar to show auth state
   - Test sign-in/sign-out flow

7. **Phase 7: Database**
   - Create migrations file
   - Document RLS policies
   - Note: Actual migration requires Supabase CLI or dashboard

8. **Phase 8: Testing**
   - Write unit tests for Supabase clients
   - Write unit tests for useAuth hook
   - Write E2E tests for auth flow (if time permits)

9. **Phase 9: Quality & Commit**
   - Run all quality gates
   - Fix any issues
   - Commit with task reference

#### Test Plan

- [ ] Unit test: Supabase client creation with valid env vars
- [ ] Unit test: Supabase client error handling with missing env vars
- [ ] Unit test: useAuth hook returns null user when not authenticated
- [ ] Unit test: useAuth hook returns user when authenticated
- [ ] Integration test: Sign-in form validation
- [ ] Integration test: Sign-up form validation
- [ ] E2E test: OAuth sign-in flow (mock or skip in CI)
- [ ] E2E test: Email sign-in flow
- [ ] E2E test: Protected route redirect

#### Docs to Update

- [ ] `.env.example` - Add Supabase environment variable placeholders
- [ ] `README.md` - Add authentication setup instructions (optional)

#### Manual Steps Required (for human)

1. **Create Supabase Project** at https://supabase.com/dashboard
2. **Get API Keys** from Project Settings → API
3. **Configure OAuth Providers** in Authentication → Providers:
   - GitHub: Create GitHub OAuth App, add Client ID/Secret
   - Google: Create Google Cloud OAuth credentials, add Client ID/Secret
4. **Set Redirect URLs** in Authentication → URL Configuration:
   - Add `http://localhost:3000/auth/callback` for development
   - Add production URL when deploying
5. **Run Database Migrations** via Supabase dashboard SQL editor or CLI

---

## Work Log

### 2026-01-23 21:01 - Triage Complete

- Dependencies: No blockers - `Blocked By` field is empty
- Task clarity: Clear - acceptance criteria are specific and testable (13 checkboxes)
- Ready to proceed: Yes
- Notes:
  - No existing Supabase setup found in codebase (no `lib/supabase/`, no packages in `package.json`)
  - Task is genuinely needed - provides foundational auth/database infrastructure
  - This task blocks two other tasks (`002-005-api-key-management`, `003-001-save-tracks-db`)
  - Plan is well-structured with 7 clear implementation steps
  - Note: OAuth provider configuration (Step 7) requires manual Supabase dashboard setup - code can scaffold but actual OAuth credentials need human input

### 2026-01-23 21:03 - Implementation Progress

**Commits Made:**
1. `fccd8ab` - feat: Add Supabase client infrastructure [002-004]
   - Installed @supabase/supabase-js and @supabase/ssr
   - Created lib/supabase/client.ts (browser client)
   - Created lib/supabase/server.ts (server client)
   - Created lib/supabase/middleware.ts (middleware helpers)
   - Updated .env.example with Supabase config placeholders

2. `94a566f` - feat: Add AuthProvider and useAuth hook [002-004]
   - Created components/auth/AuthProvider.tsx
   - Created lib/hooks/useAuth.ts
   - Updated app/layout.tsx with AuthProvider

3. `af5be44` - feat: Add sign-in and sign-up pages [002-004]
   - Created components/auth/SignInForm.tsx
   - Created components/auth/SignUpForm.tsx
   - Created app/auth/sign-in/page.tsx
   - Created app/auth/sign-up/page.tsx

4. `3ed3e61` - feat: Add auth routes and middleware [002-004]
   - Created app/auth/callback/route.ts (OAuth callback)
   - Created app/auth/confirm/route.ts (email confirmation)
   - Created middleware.ts (route protection)

5. `48cb20b` - feat: Add UserMenu to TopBar [002-004]
   - Created components/auth/UserMenu.tsx
   - Updated components/studio/TopBar.tsx with UserMenu

6. `61a36cc` - feat: Add database migration for profiles [002-004]
   - Created supabase/migrations/001_initial_schema.sql
   - Profiles table with RLS policies
   - Auto-create profile trigger on signup

7. `466282b` - style: Format auth components with Prettier [002-004]

**Quality Checks:**
- ESLint: Pass
- TypeScript: Pass
- Prettier: Pass
- Vitest: 90 tests pass, 2 skipped

---

## Testing Evidence

**Unit Tests:**
- All existing tests pass (90 passed, 2 skipped)
- Auth-related unit tests to be added in test phase

**Manual Testing:**
- Requires Supabase project setup for full verification
- Code compiles without TypeScript errors

---

## Notes

- Use `@supabase/ssr` for proper cookie handling in Next.js
- May want to add email verification for email/password auth
- Consider adding profile page in follow-up

---

## Links

- Doc: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Doc: https://supabase.com/docs/guides/auth/social-login
