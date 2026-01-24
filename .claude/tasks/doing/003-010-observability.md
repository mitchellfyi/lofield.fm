# Task: Observability - Error Tracking and Event Logging

## Metadata

| Field       | Value                   |
| ----------- | ----------------------- |
| ID          | `003-010-observability` |
| Status      | `todo`                  |
| Priority    | `003` Medium            |
| Created     | `2026-01-23 12:00`      |
| Started     |                         |
| Completed   |                         |
| Blocked By  |                         |
| Blocks      |                         |
| Assigned To | `worker-1` |
| Assigned At | `2026-01-24 16:58` |

---

## Context

To maintain and improve the app, we need visibility into errors and usage patterns. This includes client errors, audio failures, LLM failures, and general event logging.

- Client errors: JS exceptions, React errors
- Audio failures: Strudel errors, audio context issues
- LLM failures: API errors, invalid responses
- Events: user actions, feature usage

---

## Acceptance Criteria

- [ ] Error boundary for React errors
- [ ] Client-side error reporting (Sentry or similar)
- [ ] Server-side error logging
- [ ] Strudel/audio error capture
- [ ] LLM error tracking (API errors, validation failures)
- [ ] Basic event logging (page views, feature usage)
- [ ] Error dashboard or integration with logging service
- [ ] Source maps for production debugging
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Set up error tracking service**
   - Files: `lib/error-tracking.ts`
   - Sentry, LogRocket, or Vercel Analytics
   - Initialize in app layout

2. **Add React error boundary**
   - Files: `components/error-boundary.tsx`
   - Catch render errors
   - Show fallback UI
   - Report to service

3. **Add Strudel error handling**
   - Files: `app/strudel/page.tsx`
   - Catch and report audio errors
   - Include code context

4. **Add LLM error tracking**
   - Files: `app/api/chat/route.ts`
   - Log API errors, validation failures
   - Include prompt context (sanitized)

5. **Add event logging**
   - Files: `lib/analytics.ts`
   - Track key user actions
   - Privacy-respecting (no PII)

6. **Configure source maps**
   - Files: `next.config.ts`
   - Upload source maps to error service

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- Sentry has good Next.js integration
- Consider Vercel Analytics for simpler setup
- Be careful not to log sensitive data (API keys, etc.)

---

## Links

- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Vercel Analytics: https://vercel.com/analytics
