# Testing the Self-Healing CI Workflow

This document provides step-by-step instructions for testing the self-healing CI workflow to ensure it works correctly in all scenarios.

## Prerequisites

- The workflow file `.github/workflows/self-healing-ci.yml` is in place
- You have permissions to push to the repository
- You have permissions to view GitHub Actions workflows

## Test Scenarios

### Test 1: Issue Creation on First Failure

**Objective**: Verify that the workflow creates a new issue when CI fails on main for the first time.

**Steps**:

1. Create a feature branch:

   ```bash
   git checkout -b test/trigger-ci-failure
   ```

2. Intentionally break a test (e.g., modify a simple test to fail):

   ```bash
   # Example: Make a unit test fail
   echo "// INTENTIONAL FAILURE" >> lib/__tests__/errors.test.ts
   echo "test('this should fail', () => { expect(true).toBe(false); });" >> lib/__tests__/errors.test.ts
   ```

3. Commit and push to the feature branch:

   ```bash
   git add .
   git commit -m "test: intentional CI failure"
   git push origin test/trigger-ci-failure
   ```

4. Create a pull request and verify CI passes or fails as expected on the PR (it should fail)

5. Merge the PR to main (you may need to temporarily disable branch protection or use admin override)

6. Wait for the main branch CI to fail

7. Verify the self-healing workflow runs and creates an issue:
   - Go to Actions → Self-Healing CI
   - Check that the workflow ran after the CI failure
   - Go to Issues
   - Verify a new issue exists with:
     - Title: `[CI Fix] Build failure on main (<short SHA>)`
     - Labels: `ci-fix`, `automated`
     - Assignee: `@copilot`
     - Body contains failure logs and proper instructions

**Expected Result**: A new issue is created with all required elements.

**Cleanup**: Don't close the issue yet; it will be used in subsequent tests.

---

### Test 2: Comment on Existing Issue (2nd Failure)

**Objective**: Verify that a second failure adds a comment to the existing issue instead of creating a new one.

**Steps**:

1. With the issue still open from Test 1, introduce another failure:

   ```bash
   git checkout -b test/second-ci-failure main
   # Make another test fail
   echo "test('another failure', () => { expect(1).toBe(2); });" >> lib/__tests__/errors.test.ts
   git add .
   git commit -m "test: second intentional CI failure"
   git push origin test/second-ci-failure
   ```

2. Create and merge a PR to main

3. Wait for the self-healing workflow to run

4. Verify that:
   - No new issue was created
   - The existing issue has a new comment
   - The comment starts with "## New Failure Detected"
   - The comment includes new failure logs and run URL

**Expected Result**: The existing issue receives a comment with the new failure details.

**Cleanup**: Keep the issue open for Test 3.

---

### Test 3: Rate Limiting and `needs-human` Label (3rd Failure)

**Objective**: Verify that after 3 automated updates, the workflow stops adding comments and adds a `needs-human` label.

**Steps**:

1. Introduce a third failure:

   ```bash
   git checkout -b test/third-ci-failure main
   echo "test('third failure', () => { expect(true).toBeFalsy(); });" >> lib/__tests__/errors.test.ts
   git add .
   git commit -m "test: third intentional CI failure"
   git push origin test/third-ci-failure
   ```

2. Merge to main

3. Wait for the self-healing workflow

4. Verify:
   - The issue has a second "New Failure Detected" comment
   - (Total comments from workflow should be 2 now)

5. Introduce a fourth failure:

   ```bash
   git checkout -b test/fourth-ci-failure main
   echo "test('fourth failure', () => { throw new Error('fail'); });" >> lib/__tests__/errors.test.ts
   git add .
   git commit -m "test: fourth intentional CI failure"
   git push origin test/fourth-ci-failure
   ```

6. Merge to main

7. Wait for the self-healing workflow

8. Verify:
   - The issue has a third "New Failure Detected" comment
   - (Total comments from workflow should be 3 now)

9. Introduce a fifth failure:

   ```bash
   git checkout -b test/fifth-ci-failure main
   echo "test('fifth failure', () => { expect(1).toBe(999); });" >> lib/__tests__/errors.test.ts
   git add .
   git commit -m "test: fifth intentional CI failure"
   git push origin test/fifth-ci-failure
   ```

10. Merge to main

11. Wait for the self-healing workflow

12. Verify:
    - The issue has a new comment saying "Maximum Retry Limit Reached"
    - The issue has the `needs-human` label
    - No new "New Failure Detected" comment was added

**Expected Result**: After 3 automated failure comments, the workflow stops adding failure details and adds `needs-human` label with an escalation message.

**Cleanup**: Close the issue and fix the tests.

---

### Test 4: Fix and Verify No Issue Creation on Success

**Objective**: Verify that the workflow doesn't create issues when CI passes.

**Steps**:

1. Close the existing `ci-fix` issue (if still open)

2. Fix the failing tests:

   ```bash
   git checkout main
   git pull
   git checkout -b fix/restore-tests
   # Remove the intentional failures added in previous tests
   git checkout <commit-before-test-1> -- lib/__tests__/errors.test.ts
   git add .
   git commit -m "fix: restore tests to passing state"
   git push origin fix/restore-tests
   ```

3. Merge to main

4. Wait for CI to pass

5. Verify:
   - The self-healing workflow does NOT run (or runs but does nothing)
   - No new issue is created

**Expected Result**: Successful CI runs don't trigger issue creation.

---

### Test 5: Infinite Loop Prevention

**Objective**: Verify that failures in the self-healing workflow itself don't create issues.

**Steps**:

1. This is difficult to test without modifying the workflow itself

2. Review the workflow configuration:
   - Verify `on.workflow_run.workflows` is set to `["CI"]` only
   - This ensures it only triggers on the "CI" workflow, not on "Self-Healing CI"

3. If you want to be thorough, temporarily introduce an error in the self-healing workflow (e.g., invalid GitHub API call), trigger it, and verify no issue is created for the self-healing workflow failure

**Expected Result**: The workflow is correctly scoped to only trigger on CI failures, not its own failures.

---

## Cleanup After Testing

After all tests are complete:

1. Close any remaining test issues
2. Remove any test labels
3. Ensure the repository is back in a clean state
4. Document any issues discovered during testing

## Monitoring in Production

Once deployed to production:

1. **Monitor Issue Creation**:
   - Check for false positives (issues created for transient failures)
   - Check for missed failures (no issue created when CI fails)

2. **Monitor Rate Limiting**:
   - Track how often issues reach the `needs-human` state
   - Adjust the retry limit if needed

3. **Monitor Copilot Response**:
   - Track how quickly Copilot responds to issues
   - Track the success rate of Copilot's fixes
   - Review PR quality for autonomous fixes

4. **Track Metrics**:
   - Number of `ci-fix` issues created per week/month
   - Average time to resolution
   - Success rate (fixed on first try vs. needs-human)
   - False positive rate

## Troubleshooting

### Issue Not Created

- Check the workflow run logs in Actions → Self-Healing CI
- Verify the CI workflow name matches exactly ("CI")
- Verify the failure was on the `main` branch
- Check for API permission errors

### Duplicate Issues Created

- Check the label exact match (should be `ci-fix` AND `automated`)
- Verify the duplicate check logic in the workflow

### Labels Not Created

- Check workflow permissions (needs `issues: write`)
- Check the label creation step in the workflow logs

### Workflow Not Triggering

- Verify `workflow_run` trigger configuration
- Check branch name matches (`main`)
- Verify the trigger workflow name matches exactly
