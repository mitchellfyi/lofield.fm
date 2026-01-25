# Task: Show Estimated Cost Per Model

## Metadata

| Field       | Value                        |
| ----------- | ---------------------------- |
| ID          | `004-001-model-cost-display` |
| Status      | `todo`                       |
| Priority    | `004` Low                    |
| Created     | `2026-01-23 20:40`           |
| Started     |                              |
| Completed   |                              |
| Blocked By  |                              |
| Blocks      |                              |
| Assigned To | `worker-1` |
| Assigned At | `2026-01-25 19:57` |

---

## Context

This is a follow-up improvement from task 002-002-ai-model-selection.

The current model selector shows model name, description, and cost tier (low/medium/high) but doesn't show actual estimated costs. Users may want to see approximate per-message or per-token costs to make informed decisions about which model to use.

- Related: OpenAI pricing page has current rates
- User impact: Better cost awareness before using expensive models
- Nice-to-have enhancement, not critical for functionality

---

## Acceptance Criteria

- [ ] Add estimated cost per 1K tokens to AIModel interface
- [ ] Display estimated cost in ModelSelector dropdown
- [ ] Show cost in a user-friendly format (e.g., "$0.01/1K tokens")
- [ ] Consider showing session cost tracking in the future
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Update model configuration**
   - Files: `lib/models.ts`
   - Add `inputCostPer1kTokens` and `outputCostPer1kTokens` fields to AIModel interface
   - Populate with current OpenAI pricing

2. **Update UI**
   - Files: `components/studio/ModelSelector.tsx`
   - Show cost info in dropdown (could be tooltip or inline text)

3. **Write tests**
   - Files: `lib/__tests__/models.test.ts`
   - Verify cost fields exist and have valid values

---

## Work Log

_Work log will be populated when task starts_

---

## Testing Evidence

_Testing evidence will be recorded during implementation_

---

## Notes

- Consider caching pricing data or making it configurable
- Pricing can change - may want to link to OpenAI pricing page

---

## Links

- Related task: `002-002-ai-model-selection`
- OpenAI pricing: https://openai.com/pricing
