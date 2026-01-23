# Task: Chat Prompt Hardening with Schema Validation and Retry Loop

## Metadata

| Field | Value |
|-------|-------|
| ID | `002-003-chat-prompt-hardening` |
| Status | `todo` |
| Priority | `002` High |
| Created | `2026-01-23 12:00` |
| Started | |
| Completed | |
| Blocked By | |
| Blocks | |
| Assigned To | |
| Assigned At | |

---

## Context

The current chat implementation relies on regex to extract code from markdown. This is fragile - the model might return malformed responses. We need structured output with schema validation and automatic retry on invalid code.

- Current: regex extraction of code blocks (`/```(?:js|javascript)?\n([\s\S]*?)```/`)
- No validation that extracted code is syntactically valid
- No retry mechanism when model returns bad output
- Strudel errors are caught but not fed back to model

---

## Acceptance Criteria

- [ ] Use Vercel AI SDK structured output (tool calls or JSON mode)
- [ ] Define Zod schema for response: `{ notes: string[], code: string }`
- [ ] Validate extracted code is syntactically valid JavaScript
- [ ] Implement retry loop (max 3 attempts) when code is invalid
- [ ] Feed validation errors back to model in retry
- [ ] Show retry status in UI ("Fixing code..." indicator)
- [ ] Fallback to previous working code on all retries failed
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Add Zod schema**
   - Files: `lib/schemas.ts`
   - Define response schema with notes array and code string

2. **Update API route for structured output**
   - Files: `app/api/chat/route.ts`
   - Use `generateObject` or structured output mode
   - Return typed response

3. **Add code validation**
   - Files: `lib/validate-code.ts`
   - Parse code with acorn or simple Function() test
   - Return validation errors

4. **Implement retry loop on client**
   - Files: `app/strudel/page.tsx`
   - On invalid code, send error context back
   - Max 3 retries with backoff
   - Show status to user

5. **Add fallback mechanism**
   - Keep last known working code
   - Revert on total failure

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- Consider using `generateObject` with Zod for type-safe structured output
- May need to adjust system prompt for structured responses
- Acorn parser is lightweight for syntax validation

---

## Links

- File: `app/api/chat/route.ts`
- File: `app/strudel/page.tsx`
- Doc: https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data
