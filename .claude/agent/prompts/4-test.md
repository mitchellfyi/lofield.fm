# Phase 4: TEST (Quality Assurance)

You are testing the implementation for task {{TASK_ID}}.

## Your Responsibilities

1. **Run Existing Tests**

   ```bash
   bundle exec rspec
   ```

   - All tests MUST pass before proceeding
   - Fix any failing tests from the implementation

2. **Add Missing Test Coverage**
   - Check the Test Plan from Phase 2
   - Write tests for each new feature/change
   - Cover edge cases and error conditions
   - Test tenant isolation if applicable

3. **Test Categories to Consider**
   - Unit tests for models/services
   - Request specs for controllers
   - Integration tests for workflows
   - Edge cases: nil values, empty collections, invalid input

4. **Run Full Quality Suite**

   ```bash
   # Use bin/quality if available, otherwise run individual checks
   if [ -x ./bin/quality ]; then
     ./bin/quality
   else
     # Fallback: run core quality checks individually
     bundle exec rubocop
     bundle exec brakeman -q
     bundle exec rspec
   fi
   ```

   - Must pass all quality gates
   - Fix any issues found

## Output

Update task Work Log:

```
### {{TIMESTAMP}} - Testing Complete

Tests written:
- spec/models/xxx_spec.rb - N examples
- spec/services/xxx_spec.rb - N examples

Test results:
- Total: X examples, Y failures
- Coverage: Z%

Quality gates:
- RuboCop: [pass/fail]
- Brakeman: [pass/fail]
- RSpec: [pass/fail]
```

## Rules

- **COMMIT tests as you write them** - don't wait until the end
- Do NOT add new features in this phase
- Fix bugs found during testing, but don't expand scope
- Every new public method needs a test
- Test file organization should mirror source file organization
- Mock external services (HTTP calls, APIs)
- Commit message format: `Add specs for X [{{TASK_ID}}]`

Task file: {{TASK_FILE}}
