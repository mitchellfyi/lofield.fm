# Task: Show Estimated Cost Per Model

## Metadata

| Field       | Value                        |
| ----------- | ---------------------------- |
| ID          | `004-001-model-cost-display` |
| Status      | `done`                       |
| Priority    | `004` Low                    |
| Created     | `2026-01-23 20:40`           |
| Started     | `2026-01-25 19:57`           |
| Completed   | `2026-01-25 20:06`           |
| Blocked By  |                              |
| Blocks      |                              |
| Assigned To |                              |
| Assigned At |                              |

---

## Context

This is a follow-up improvement from task 002-002-ai-model-selection.

The current model selector shows model name, description, and cost tier (low/medium/high) but doesn't show actual estimated costs. Users may want to see approximate per-message or per-token costs to make informed decisions about which model to use.

- Related: OpenAI pricing page has current rates
- User impact: Better cost awareness before using expensive models
- Nice-to-have enhancement, not critical for functionality

---

## Acceptance Criteria

- [x] Add estimated cost per 1K tokens to AIModel interface
- [x] Display estimated cost in ModelSelector dropdown
- [x] Show cost in a user-friendly format (e.g., "$0.01/1K tokens")
- [x] Consider showing session cost tracking in the future
- [x] Tests written and passing
- [x] Quality gates pass
- [x] Changes committed with task reference

---

## Plan

### Implementation Plan (Generated 2026-01-25 20:00)

#### Gap Analysis

| Criterion                                                   | Status      | Gap                                                              |
| ----------------------------------------------------------- | ----------- | ---------------------------------------------------------------- |
| Add estimated cost per 1K tokens to AIModel interface       | **no**      | Interface only has `costTier`, no cost values                    |
| Display estimated cost in ModelSelector dropdown            | **no**      | Dropdown shows "low/medium/high cost" badge but no dollar values |
| Show cost in user-friendly format (e.g., "$0.01/1K tokens") | **no**      | No cost formatting exists                                        |
| Consider showing session cost tracking in the future        | **no**      | Out of scope for this task - add as future task note             |
| Tests written and passing                                   | **partial** | `lib/__tests__/models.test.ts` exists but no cost field tests    |
| Quality gates pass                                          | **pending** | Will verify at end                                               |
| Changes committed with task reference                       | **pending** | Will commit at end                                               |

#### Current State Analysis

**`lib/models.ts`** (48 lines):

- `AIModel` interface has: `id`, `name`, `description`, `costTier`
- 3 models defined: `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`
- Helper functions: `isValidModel()`, `getModelById()`
- No cost values exist

**`components/studio/ModelSelector.tsx`** (209 lines):

- Renders dropdown with model name, description, cost tier badge
- `getCostBadge()` function maps costTier to badge styling
- Portal-based dropdown with position calculation
- No cost display logic exists

**`lib/__tests__/models.test.ts`** (105 lines):

- Tests model structure, uniqueness, helper functions
- Tests `costTier` field exists and is valid
- No cost value tests

#### OpenAI Pricing (Jan 2026)

| Model       | Input Cost (per 1M tokens) | Output Cost (per 1M tokens) |
| ----------- | -------------------------- | --------------------------- |
| gpt-4o-mini | $0.15                      | $0.60                       |
| gpt-4o      | $2.50                      | $10.00                      |
| gpt-4-turbo | ~$10.00                    | ~$30.00                     |

_Note: gpt-4-turbo is deprecated but still in use - using estimated pricing_

#### Files to Modify

1. **`lib/models.ts`**
   - Add `inputCostPer1kTokens?: number` and `outputCostPer1kTokens?: number` to `AIModel` interface
   - Add cost values to each model in `MODELS` array
   - Add helper function `formatModelCost(model: AIModel): string` to format cost display

2. **`components/studio/ModelSelector.tsx`**
   - Import `formatModelCost` from models
   - Add cost display below model description (line ~147, after description paragraph)
   - Display format: "$0.15 / $0.60 per 1K tokens" (input/output)

3. **`lib/__tests__/models.test.ts`**
   - Add test: all models should have cost fields
   - Add test: cost values should be positive numbers
   - Add test: `formatModelCost` returns expected string format

#### Implementation Order

1. Update `lib/models.ts`:
   - Extend interface
   - Add cost values to models
   - Add format helper

2. Update tests first (TDD approach):
   - Add cost field validation tests
   - Add format function tests

3. Update `components/studio/ModelSelector.tsx`:
   - Import format helper
   - Add cost line to dropdown items

4. Run quality gates

5. Commit

#### Test Plan

- [ ] Test: All models have `inputCostPer1kTokens` field
- [ ] Test: All models have `outputCostPer1kTokens` field
- [ ] Test: Cost values are positive numbers
- [ ] Test: `formatModelCost` returns string like "$X.XX / $X.XX per 1K tokens"
- [ ] Test: `formatModelCost` handles models without cost fields gracefully
- [ ] Manual: Verify dropdown displays costs correctly
- [ ] Manual: Verify compact mode still works

#### Docs to Update

- [ ] None required - this is a UI enhancement

#### Future Tasks to Create

- [ ] Add session cost tracking (display running total of tokens/cost used in session)

---

## Work Log

### 2026-01-25 20:06 - Review Complete (Phase 6)

Code review:

- Issues found: none
- Code follows project conventions
- No code smells or anti-patterns
- Error handling appropriate (formatModelCost returns null for missing data)
- No security vulnerabilities
- No N+1 queries (static data)

Consistency:

- All 7 acceptance criteria met: yes
- Test coverage adequate: yes (11 new test cases, 23 total)
- Docs in sync: yes (README updated)

Quality gates:

- ESLint: pass (0 errors, 2 pre-existing warnings in other files)
- TypeScript: pass
- Prettier: pass
- Vitest: 23/23 tests pass for models.test.ts

Follow-up tasks created:

- None needed - session cost tracking already noted in Notes section

Final status: COMPLETE

### 2026-01-25 20:10 - Documentation Sync (Phase 5)

Docs updated:

- `README.md` - Updated AI Model Selection section to mention cost display feature

Model annotations:

- Not applicable (TypeScript/Next.js project, no Ruby/Rails models)

Consistency checks:

- [x] Code matches docs - README now documents cost tier badges and cost per 1K tokens display
- [x] No broken links - All links valid
- [x] Schema annotations current - N/A for this project type

Notes section updated:

- Added details about cost value storage format
- Added note about format helper behavior
- Added future enhancement note for session cost tracking

Links section updated:

- Added list of modified files for traceability

### 2026-01-25 20:05 - Implementation Complete (Phase 3)

- **Completed**: Implementation of model cost display feature
- **Files modified**:
  - `lib/models.ts` - Added `inputCostPer1kTokens` and `outputCostPer1kTokens` fields to `AIModel` interface, added cost values to all models, added `formatModelCost()` helper function
  - `components/studio/ModelSelector.tsx` - Imported `formatModelCost`, added cost display below model description in dropdown
- **Commit**: `a49ca45` - "feat: Add estimated cost per 1K tokens to model selector"
- **Quality check**: ESLint passes on both files
- **Next**: Tests phase (Phase 4)

### 2026-01-25 20:00 - Triage Validation (Phase 1)

- Dependencies: None - related task `002-002-ai-model-selection` confirmed in done/
- Task clarity: Clear - scope well-defined with specific acceptance criteria
- Ready to proceed: Yes
- Notes: Task file properly structured with Context, Acceptance Criteria, and detailed Plan

### 2026-01-25 20:00 - Planning Complete

- **Gap Analysis**: Performed detailed gap analysis against all acceptance criteria
- **Files Analyzed**:
  - `lib/models.ts` (48 lines) - No cost fields exist, only `costTier`
  - `components/studio/ModelSelector.tsx` (209 lines) - No cost display, only tier badge
  - `lib/__tests__/models.test.ts` (105 lines) - No cost tests exist
- **Pricing Research**: Retrieved current OpenAI pricing (Jan 2026):
  - gpt-4o-mini: $0.15/$0.60 per 1M tokens (input/output)
  - gpt-4o: $2.50/$10.00 per 1M tokens
  - gpt-4-turbo: ~$10.00/$30.00 per 1M tokens (deprecated)
- **Implementation Plan**: Created detailed plan with 5 steps and test cases
- **Ready for Implementation**: Yes

### 2026-01-25 19:57 - Triage Complete

- **Dependencies**: None listed. Related task `002-002-ai-model-selection` is complete in `done/`.
- **Task clarity**: Clear. Scope is well-defined:
  - Add cost fields to `AIModel` interface in `lib/models.ts`
  - Display costs in `ModelSelector.tsx` dropdown
  - Write tests
- **Source files verified**: Both `lib/models.ts` and `components/studio/ModelSelector.tsx` exist
- **Already done check**: No cost fields exist yet in `AIModel` interface - task work needed
- **Ready to proceed**: Yes
- **Notes**: Current interface has `costTier` (low/medium/high) but no actual cost values

---

## Testing Evidence

### 2026-01-25 20:04 - Testing Complete (Phase 4)

Tests written:

- `lib/__tests__/models.test.ts` - 11 new examples added (23 total)

New test cases:

1. `should have inputCostPer1kTokens for all models` - validates all models have input cost field
2. `should have outputCostPer1kTokens for all models` - validates all models have output cost field
3. `should have output cost greater than or equal to input cost` - validates cost relationships
4. `should return formatted string for model with cost data` - basic format test
5. `should format gpt-4o-mini cost correctly` - specific format validation
6. `should format gpt-4o cost correctly` - specific format validation
7. `should format gpt-4-turbo cost correctly` - specific format validation
8. `should return null for model without cost data` - edge case handling
9. `should return null for model with only input cost` - partial cost handling
10. `should return null for model with only output cost` - partial cost handling
11. `should format all MODELS successfully` - comprehensive regex validation

Test results:

- Total: 2019 examples, 0 failures
- Models test file: 23 examples, 0 failures
- Commit: `909f21b` - "test: Add cost field and formatModelCost tests"

Quality gates:

- ESLint: pass (0 errors, 2 pre-existing warnings)
- TypeScript: pass
- Prettier: pass
- Vitest: pass (2019 tests)

---

## Notes

- Consider caching pricing data or making it configurable
- Pricing can change - may want to link to OpenAI pricing page
- Cost values stored as cost per 1K tokens (e.g., $0.00015 = $0.15 per 1M tokens)
- Format helper handles both small costs (<$0.01) with precision and larger costs with 2 decimal places
- Future enhancement: session cost tracking (running total of tokens/cost used)

---

## Links

- Related task: `002-002-ai-model-selection`
- OpenAI pricing: https://openai.com/pricing
- Modified files:
  - `lib/models.ts` - AIModel interface extension, cost data, formatModelCost helper
  - `components/studio/ModelSelector.tsx` - Cost display in dropdown
  - `lib/__tests__/models.test.ts` - Cost field and format function tests
  - `README.md` - Updated AI Model Selection section
