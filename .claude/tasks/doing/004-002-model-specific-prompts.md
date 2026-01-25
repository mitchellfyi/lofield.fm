# Task: Add Model-Specific System Prompts

## Metadata

| Field       | Value                            |
| ----------- | -------------------------------- |
| ID          | `004-002-model-specific-prompts` |
| Status      | `doing`                          |
| Priority    | `004` Low                        |
| Created     | `2026-01-23 20:40`               |
| Started     | `2026-01-25 20:38`               |
| Completed   |                                  |
| Blocked By  |                                  |
| Blocks      |                                  |
| Assigned To | `worker-1`                       |
| Assigned At | `2026-01-25 20:38`               |

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

### Implementation Plan (Generated 2026-01-25)

#### Gap Analysis

| Criterion | Status | Gap |
|-----------|--------|-----|
| Research if different models need different prompts | not done | Need to document findings - likely all GPT-4 models work well with same prompt |
| Add optional `systemPromptVariation` field to AIModel interface | not done | Need to add field to `lib/models.ts` AIModel interface |
| Update prompt loader to apply model-specific variations | not done | Need to modify `lib/prompts/loader.ts` to accept model and apply variations |
| Ensure backward compatibility (no variation = default prompt) | not done | Design ensures this - undefined variation = use default prompt |
| Tests written and passing | not done | Need to create `lib/prompts/__tests__/loader.test.ts` |
| Quality gates pass | not done | Run `./bin/quality` after implementation |
| Changes committed with task reference | not done | Final step after all above pass |

#### Research Findings (Pre-Implementation Notes)

All three models (gpt-4o-mini, gpt-4o, gpt-4-turbo) are GPT-4 class OpenAI models that:
- Support the same system prompt format
- Have similar instruction-following capabilities
- Share the same token limits for system prompts (~8K tokens is safe)

Current system prompt (`prompts/system-prompt.md`) is 249 lines, well within limits for all models.

**Recommendation**: The current prompt works for all models. The variation system should be designed for:
1. Future flexibility (e.g., if we add Claude, Gemini, or local models)
2. Potential per-model optimizations (e.g., gpt-4o-mini might benefit from shorter prompts for cost)

#### Files to Modify

1. **`lib/models.ts`** (lines 5-14)
   - Add `systemPromptVariation?: "default" | "concise" | string` to `AIModel` interface
   - Keep all existing models without variation (defaults to standard prompt)

2. **`lib/prompts/loader.ts`** (lines 18-21)
   - Modify `loadSystemPrompt()` to accept optional `variation?: string` parameter
   - If variation is provided, try to load `prompts/system-prompt-{variation}.md`
   - Fall back to default `prompts/system-prompt.md` if variation file doesn't exist
   - Export new `loadSystemPromptForModel(modelId: string)` convenience function

3. **`app/api/chat/route.ts`** (line 36)
   - Change: `const systemPrompt = loadSystemPrompt();`
   - To: `const systemPrompt = loadSystemPromptForModel(modelName);`
   - This is a 1-line change since the convenience function handles the lookup

#### Files to Create

1. **`lib/prompts/__tests__/loader.test.ts`**
   - Test `loadPrompt()` with valid/invalid filenames
   - Test `loadSystemPrompt()` returns content
   - Test `loadSystemPrompt(variation)` with and without variation
   - Test `loadSystemPromptForModel()` with various model IDs
   - Test backward compatibility (no variation = default prompt)
   - Test `buildRetryPrompt()` with error messages

#### Test Plan

- [ ] `loadPrompt("system-prompt.md")` returns non-empty string
- [ ] `loadPrompt("nonexistent.md")` throws error
- [ ] `loadSystemPrompt()` returns content from system-prompt.md
- [ ] `loadSystemPrompt("concise")` falls back to default (file doesn't exist)
- [ ] `loadSystemPromptForModel("gpt-4o-mini")` returns default prompt
- [ ] `loadSystemPromptForModel("gpt-4o")` returns default prompt
- [ ] `loadRetryPrompt(["error1", "error2"])` includes both errors
- [ ] All existing tests continue to pass

#### Implementation Order

1. Update `AIModel` interface in `lib/models.ts` (no functional change to existing code)
2. Update `loadSystemPrompt()` in `lib/prompts/loader.ts` to accept variation
3. Add `loadSystemPromptForModel()` function in `lib/prompts/loader.ts`
4. Update `app/api/chat/route.ts` to use new function
5. Create test file `lib/prompts/__tests__/loader.test.ts`
6. Run `./bin/quality` to verify all gates pass
7. Commit with task reference

#### Docs to Update

- [ ] None required - this is an internal implementation detail

---

## Work Log

### 2026-01-25 - Planning Complete

- Analyzed existing codebase:
  - `lib/models.ts`: 82 lines, defines AIModel interface and 3 models (gpt-4o-mini, gpt-4o, gpt-4-turbo)
  - `lib/prompts/loader.ts`: 40 lines, simple file-based prompt loading
  - `app/api/chat/route.ts`: 275 lines, calls `loadSystemPrompt()` at line 36
  - `prompts/system-prompt.md`: 249 lines, comprehensive Tone.js music generation prompt
  - `prompts/retry-prompt.md`: 22 lines, validation retry template
- Gap analysis complete: All acceptance criteria require implementation
- Research finding: All GPT-4 models work with same prompt format, but adding variation support enables future flexibility
- Design decision: Use optional variation field with graceful fallback to default prompt
- Test file location: `lib/prompts/__tests__/loader.test.ts` (directory doesn't exist yet)
- Ready for implementation phase

### 2026-01-25 20:38 - Triage Complete

- Dependencies: ✅ None blocking (related task 002-002-ai-model-selection is completed)
- Task clarity: Clear - well-defined scope with specific files and acceptance criteria
- Ready to proceed: Yes
- Notes:
  - Task file is well-formed with all required sections
  - Acceptance criteria are specific and testable
  - Plan references concrete files: `lib/models.ts`, `lib/prompts/loader.ts`, `app/api/chat/route.ts`
  - This is a low-priority enhancement (research-first approach is appropriate)
  - May result in no code changes if research shows models work well with same prompt

### 2026-01-25 20:39 - Implementation Progress

- **Completed Step 1**: Added `systemPromptVariation` field to AIModel interface
  - Files modified: `lib/models.ts`
  - Commit: 53fc061
  - Quality check: ✅ ESLint passed

- **Completed Step 2 & 3**: Updated prompt loader with variation support
  - Modified `loadSystemPrompt()` to accept optional variation parameter
  - Added `loadSystemPromptForModel()` convenience function
  - Graceful fallback when variation file doesn't exist
  - Files modified: `lib/prompts/loader.ts`
  - Commit: d55fa05
  - Quality check: ✅ ESLint passed

- **Completed Step 4**: Updated chat route to use model-specific loading
  - Changed import from `loadSystemPrompt` to `loadSystemPromptForModel`
  - Updated call site to pass `modelName`
  - Files modified: `app/api/chat/route.ts`
  - Commit: deef0f5
  - Quality check: ✅ ESLint passed, TypeScript passes

- **Next**: Tests will be written in the TEST phase

---

## Testing Evidence

_Testing evidence will be recorded during TEST phase_

---

## Notes

- May not be necessary if all models work well with same prompt
- Could consider A/B testing prompt variations

---

## Links

- Related task: `002-002-ai-model-selection`
- File: `lib/prompts/loader.ts`
