# Task: User API Key Management with Required Modal

## Metadata

| Field       | Value                         |
| ----------- | ----------------------------- |
| ID          | `002-005-api-key-management`  |
| Status      | `todo`                        |
| Priority    | `002` High                    |
| Created     | `2026-01-23 12:00`            |
| Started     |                               |
| Completed   |                               |
| Blocked By  | `002-004-supabase-auth-setup` |
| Blocks      |                               |
| Assigned To |                               |
| Assigned At |                               |

---

## Context

Users should provide their own OpenAI API key to use the chat feature. We should NOT fall back to our own API key in production - this prevents abuse and unexpected costs. In development, we can use the env API key for convenience.

- Current: uses server-side `OPENAI_API_KEY` env var for everyone
- Risk: abuse, unexpected costs, no accountability
- Solution: require user's own API key, stored securely per-user

---

## Acceptance Criteria

- [ ] Modal prompts user for API key if not set (before first chat)
- [ ] API key stored securely in Supabase (encrypted at rest)
- [ ] Settings page to view/update/delete API key
- [ ] API key masked in UI (show last 4 chars only)
- [ ] API validates user's key before saving (test call)
- [ ] Chat API uses user's key from database
- [ ] In development (`NODE_ENV=development`), fall back to env key
- [ ] In production, NO fallback - require user key
- [ ] Clear error message when key is missing/invalid
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Create API keys table**
   - Files: `supabase/migrations/002_api_keys.sql`
   - Store encrypted API key per user
   - RLS: users can only access their own keys

2. **Create API key modal component**
   - Files: `components/settings/api-key-modal.tsx`
   - Form to enter OpenAI API key
   - Validation before save
   - Show on first chat attempt if no key

3. **Create settings page**
   - Files: `app/settings/page.tsx`
   - Display masked API key
   - Update/delete functionality

4. **Create API key service**
   - Files: `lib/api-keys.ts`
   - CRUD operations for API keys
   - Encryption/decryption helpers

5. **Update chat API route**
   - Files: `app/api/chat/route.ts`
   - Get user's API key from database
   - In dev: fallback to env
   - In prod: error if no key

6. **Add key validation endpoint**
   - Files: `app/api/validate-key/route.ts`
   - Test API key with minimal call

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- Consider using Supabase Vault for key encryption
- API key should never be sent to client
- Add rate limiting per user in future task

---

## Links

- File: `app/api/chat/route.ts`
- Depends: `002-004-supabase-auth-setup`
