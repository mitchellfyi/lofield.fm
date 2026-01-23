# Task: Session Cost Controls - Rate Limits and Quotas

## Metadata

| Field | Value |
|-------|-------|
| ID | `003-009-session-cost-controls` |
| Status | `todo` |
| Priority | `003` Medium |
| Created | `2026-01-23 12:00` |
| Started | |
| Completed | |
| Blocked By | `002-004-supabase-auth-setup` |
| Blocks | |
| Assigned To | |
| Assigned At | |

---

## Context

Without controls, users could abuse the API (intentionally or accidentally), leading to high costs and poor experience for others. Need rate limiting, token caps, and usage tracking.

- Rate limits: requests per minute/hour
- Token caps: max tokens per request, per day
- Usage tracking: monitor per-user consumption
- Abuse detection: flag suspicious patterns

---

## Acceptance Criteria

- [ ] Rate limiting: max N requests per minute per user
- [ ] Token cap per request (system prompt + response)
- [ ] Daily token quota per user
- [ ] Usage tracking in database
- [ ] Usage display in UI (tokens used today, remaining)
- [ ] Clear error messages when limits hit
- [ ] Admin ability to adjust limits per user
- [ ] Abuse detection: flag users exceeding patterns
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Create usage tracking table**
   - Files: `supabase/migrations/005_usage.sql`
   - User usage: tokens_used, request_count, period

2. **Implement rate limiting**
   - Files: `lib/rate-limit.ts`
   - Redis or Supabase-based
   - Sliding window algorithm

3. **Add token counting**
   - Files: `lib/tokens.ts`
   - Count tokens in request/response
   - Use tiktoken or approximation

4. **Update API route**
   - Files: `app/api/chat/route.ts`
   - Check rate limit before processing
   - Track usage after response
   - Return limit headers

5. **Add usage UI**
   - Files: `components/usage/usage-display.tsx`
   - Show current usage, limits
   - Warning when near limit

6. **Add admin controls**
   - Files: `app/admin/users/page.tsx`
   - View user usage, adjust limits

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- Consider tiered limits (free vs paid)
- May want to use Upstash Redis for rate limiting
- Token counting should match OpenAI's algorithm

---

## Links

- NPM: `@upstash/ratelimit`
- NPM: `tiktoken`
- Depends: `002-004-supabase-auth-setup`
