# Task: Add AI Model Selection with gpt-4o-mini Default

## Metadata

| Field | Value |
|-------|-------|
| ID | `002-002-ai-model-selection` |
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

The app currently hardcodes `gpt-4o-mini` in the API route. Users may want to use different models (gpt-4o, gpt-4-turbo, etc.) based on their needs and budget. We need a way to configure and select the model.

- Current: hardcoded `openai('gpt-4o-mini')` in `app/api/chat/route.ts`
- Users have no control over model choice
- Different models have different cost/quality tradeoffs

---

## Acceptance Criteria

- [ ] Create model configuration with supported models list
- [ ] Default model is `gpt-4o-mini`
- [ ] Model can be selected via UI dropdown in the chat interface
- [ ] Selected model persists in localStorage
- [ ] Model selection is passed to API route
- [ ] API validates model is in allowed list
- [ ] UI shows current model name
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Create model config**
   - Files: `lib/models.ts`
   - Define supported models array with name, id, description

2. **Update API route**
   - Files: `app/api/chat/route.ts`
   - Accept model from request body
   - Validate against allowed models
   - Default to gpt-4o-mini if not provided

3. **Add model selector to UI**
   - Files: `app/strudel/page.tsx`
   - Add dropdown in header or controls area
   - Store selection in localStorage
   - Pass model to chat API

4. **Add types**
   - Files: `types/index.ts`
   - Type for model config, API request

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- Consider showing estimated cost per model in future
- May want to add model-specific system prompts later

---

## Links

- File: `app/api/chat/route.ts`
- File: `app/strudel/page.tsx`
