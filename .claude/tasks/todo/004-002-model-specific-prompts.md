# Task: Add Model-Specific System Prompts

## Metadata

| Field       | Value                           |
| ----------- | ------------------------------- |
| ID          | `004-002-model-specific-prompts`|
| Status      | `todo`                          |
| Priority    | `004` Low                       |
| Created     | `2026-01-23 20:40`              |
| Started     |                                 |
| Completed   |                                 |
| Blocked By  |                                 |
| Blocks      |                                 |
| Assigned To |                                 |
| Assigned At |                                 |

---

## Context

This is a follow-up improvement from task 002-002-ai-model-selection.

Different models may benefit from different system prompts or prompt variations. For example:
- GPT-4o may handle more complex instructions
- GPT-4o-mini might need simpler, more direct prompts
- Some models may have different context window sizes to consider

- User impact: Potentially better responses per model
- Nice-to-have enhancement for optimization

---

## Acceptance Criteria

- [ ] Research if different models need different prompts
- [ ] Add optional `systemPromptVariation` field to AIModel interface
- [ ] Update prompt loader to apply model-specific variations
- [ ] Ensure backward compatibility (no variation = default prompt)
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Research phase**
   - Test each model with current prompt
   - Identify if any models need adjustments

2. **Update model configuration**
   - Files: `lib/models.ts`
   - Add optional `systemPromptVariation` field

3. **Update prompt loading**
   - Files: `lib/prompts/loader.ts`
   - Accept model parameter
   - Apply variation if specified

4. **Update API route**
   - Files: `app/api/chat/route.ts`
   - Pass model to prompt loader

5. **Write tests**
   - Files: `lib/prompts/__tests__/loader.test.ts`
   - Verify model-specific prompt loading

---

## Work Log

_Work log will be populated when task starts_

---

## Testing Evidence

_Testing evidence will be recorded during implementation_

---

## Notes

- May not be necessary if all models work well with same prompt
- Could consider A/B testing prompt variations

---

## Links

- Related task: `002-002-ai-model-selection`
- File: `lib/prompts/loader.ts`
