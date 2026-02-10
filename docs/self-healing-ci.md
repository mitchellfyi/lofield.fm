# Self-Healing CI Workflow

## Overview

The self-healing CI workflow automatically creates GitHub issues when CI fails on the `main` branch and assigns them to GitHub Copilot for autonomous fixing. This acts as a safety net for regressions and unexpected failures that slip through code review.

## How It Works

1. **Trigger**: The workflow runs when the main CI workflow completes with a `failure` status on the `main` branch only.

2. **Label Management**: Ensures required labels exist:
   - `ci-fix` (red #d73a4a) - Marks CI failure fix requests
   - `automated` (green #0e8a16) - Indicates automation-created issues

3. **Failure Analysis**:
   - Fetches the failed workflow run details
   - Identifies which jobs failed
   - Downloads logs from each failed job
   - Truncates logs to the last 200 lines per job (to stay within GitHub issue limits)

4. **Duplicate Detection**:
   - Checks for existing open issues with `ci-fix` and `automated` labels
   - If found, adds a comment with new failure details instead of creating a duplicate

5. **Rate Limiting**:
   - Tracks the number of failure comments on an issue
   - After 3 automated updates, stops adding comments
   - Adds a `needs-human` label to escalate to human intervention

6. **Issue Creation**:
   - Creates a well-structured issue with:
     - Clear title: `[CI Fix] CI failure on main (<short SHA>)`
     - Link to the failed workflow run
     - Specific instructions for Copilot (fix code, don't skip tests, don't add workarounds)
     - Truncated failure logs in code blocks
     - Attempts to assign to `@copilot` (gracefully handles if the user doesn't exist in the repository)

## Issue Format

The issue body is crafted as a clear prompt for GitHub Copilot's coding agent:

```markdown
## CI Failure — Auto-generated

The CI workflow failed on branch `main` at commit `<SHA>`.

**Failed run:** <URL>

## Task

Analyze the failure logs below and fix the code that is causing CI to fail.

**Rules:**

- Fix the root cause in the source code, tests, or configuration
- Do NOT skip, disable, or mark any tests as expected failures
- Do NOT add `continue-on-error` or any other workaround that masks the failure
- Run the full test suite locally before submitting your PR
- Keep your changes minimal and focused on the fix

## Failure Logs

<truncated logs from each failed job>
```

## Safety Features

### Infinite Loop Prevention

- Only runs when the triggering workflow is "CI", not "Self-Healing CI"
- Only runs for the `main` branch (feature branch failures are the developer's responsibility)
- Only runs for `failure` conclusion (not `cancelled` or `skipped`)

### Rate Limiting

- Maximum 3 automated comments per issue
- After 3 attempts, adds `needs-human` label and stops updating
- Prevents issue spam from persistent failures

### Duplicate Prevention

- Checks for existing open issues before creating new ones
- Adds comments to existing issues instead of creating duplicates
- Only one CI fix issue can be open at a time

## What This Does NOT Do

- ❌ Does not run on feature branches (only `main`)
- ❌ Does not create issues for cancelled workflows (only `failure`)
- ❌ Does not create issues for the self-healing workflow itself (prevents infinite loops)
- ❌ Does not bypass branch protection or deploy safety mechanisms
- ❌ Does not auto-merge fixes (requires manual review)

## Permissions

The workflow requires minimal permissions:

- `issues: write` - Create issues and comments
- `actions: read` - Read workflow run details
- `checks: read` - Read check run status

## GitHub Copilot Integration

The workflow attempts to assign issues to `@copilot`. This assignment may succeed or fail depending on your repository setup:

- **If it succeeds**: Copilot will be automatically assigned and should respond to the issue
- **If it fails**: The workflow gracefully handles the error and continues. GitHub Copilot can still pick up the issue through:
  - The `ci-fix` label (if Copilot watches this label)
  - Manual assignment by a maintainer
  - Copilot's issue monitoring system

The issue body contains clear instructions and failure logs regardless of whether the assignment succeeds, so Copilot can work on it once notified.

## Auto-Merge Implementation (Optional)

The issue description mentions optional auto-merge functionality. This would require:

### Requirements

- A second GitHub account or GitHub App (a user/workflow cannot approve their own PR)
- Additional workflow triggered by Copilot PRs
- CI validation on the fix PR
- Auto-approval and merge if CI passes

### Options

1. **GitHub App** (Recommended)
   - Create a dedicated GitHub App for auto-approval
   - Install it on the repository
   - Use app credentials in the workflow
   - Most secure and maintainable approach

2. **Bot Account**
   - Create a separate GitHub account
   - Add as repository collaborator with write access
   - Store bot account PAT as repository secret
   - Less secure (credential management burden)

3. **Manual Review** (Current Implementation)
   - No auto-merge implemented
   - Copilot creates PR, human reviews and merges
   - Safest approach with human oversight
   - Recommended until auto-merge is proven reliable

### Tradeoffs

**Auto-Merge Pros:**

- Faster incident response
- Truly autonomous healing
- Reduces human intervention burden

**Auto-Merge Cons:**

- Risk of merging incorrect fixes
- Requires additional infrastructure (GitHub App or bot account)
- Can mask underlying problems if fixes are superficial
- Less human oversight

**Current Approach (Manual Review):**

- ✅ Safe - Human validates Copilot's fix
- ✅ Simple - No additional infrastructure needed
- ✅ Transparent - All fixes visible in PR review
- ❌ Slower - Requires human availability
- ❌ Not fully autonomous - Breaks at 3 failures

## Testing

To test the workflow:

1. **Test Issue Creation**:

   ```bash
   # Create a failing test
   # Commit to a feature branch
   # Merge to main
   # Verify issue is created with logs
   ```

2. **Test Duplicate Detection**:

   ```bash
   # With an open ci-fix issue
   # Merge another failing commit
   # Verify comment is added, not new issue
   ```

3. **Test Rate Limiting**:

   ```bash
   # Merge 4 failing commits
   # Verify needs-human label added after 3rd failure
   # Verify no 4th comment is added
   ```

4. **Test Infinite Loop Prevention**:
   - Self-healing workflow failures should NOT trigger new issues
   - Verified by the workflow_run filter (only "CI" workflow)

## Monitoring

Monitor the effectiveness of this workflow:

- Count of `ci-fix` issues created
- Time to resolution (issue created → PR merged)
- Success rate (Copilot fixes vs. needs-human escalations)
- False positive rate (issues created for transient failures)

## Future Improvements

1. **Smarter Duplicate Detection**: Match failures by error message, not just open issue existence
2. **Failure Classification**: Categorize failures (build, test, lint) for better routing
3. **Auto-Close**: Close fixed issues when CI passes on main
4. **Metrics Dashboard**: Track self-healing effectiveness over time
5. **Slack/Email Notifications**: Alert team when `needs-human` label is added
