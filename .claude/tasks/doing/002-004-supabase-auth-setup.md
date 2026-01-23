# Task: Implement Supabase Backend and Authentication

## Metadata

| Field       | Value                                                  |
| ----------- | ------------------------------------------------------ |
| ID          | `002-004-supabase-auth-setup`                          |
| Status      | `todo`                                                 |
| Priority    | `002` High                                             |
| Created     | `2026-01-23 12:00`                                     |
| Started     |                                                        |
| Completed   |                                                        |
| Blocked By  |                                                        |
| Blocks      | `002-005-api-key-management`, `003-001-save-tracks-db` |
| Assigned To | `worker-1` |
| Assigned At | `2026-01-23 21:01` |

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

1. **Install Supabase packages**
   - Files: `package.json`
   - Add: `@supabase/supabase-js`, `@supabase/ssr`

2. **Configure Supabase clients**
   - Files: `lib/supabase/client.ts`, `lib/supabase/server.ts`
   - Browser client for client components
   - Server client for server components/API routes

3. **Set up environment variables**
   - Files: `.env.local`, `.env.example`
   - Add Supabase URL and keys

4. **Create auth components**
   - Files: `components/auth/sign-in.tsx`, `components/auth/user-menu.tsx`
   - Sign in form with GitHub, Google, email options
   - User menu with avatar, sign out

5. **Add middleware for protected routes**
   - Files: `middleware.ts`
   - Check session, redirect to login if needed

6. **Create database schema**
   - Files: `supabase/migrations/001_users.sql`
   - Users table, profiles table
   - Enable RLS policies

7. **Configure OAuth providers in Supabase dashboard**
   - GitHub OAuth app
   - Google OAuth credentials

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- Use `@supabase/ssr` for proper cookie handling in Next.js
- May want to add email verification for email/password auth
- Consider adding profile page in follow-up

---

## Links

- Doc: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Doc: https://supabase.com/docs/guides/auth/social-login
