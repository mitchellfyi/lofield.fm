# CLAUDE.md - Agent Operating Manual

This document is the single source of truth for autonomous agent operation in this repository.

## Quick Start

When prompted with "continue", "continue working", or similar:

```
1. Read this file completely
2. Execute the Operating Loop (Section A)
3. Complete quality gates after every major change
4. Commit with task reference when done
```

---

## A) Operating Loop

Execute this algorithm on every "continue working" run:

```
STEP 1: CHECK DOING (Your Task)
  - Look in .claude/tasks/doing/
  - Find task file assigned to YOU (check Assigned To field)
  - If found:
    - Read the task file
    - Resume work from the Work Log
    - Continue to STEP 4
  - If another agent's task is in doing/, skip it

STEP 2: PICK FROM TODO
  - Look in .claude/tasks/todo/
  - If task files exist:
    - Sort by priority (filename prefix: PPP-SSS-slug)
      - PPP = priority (001=critical, 002=high, 003=medium, 004=low)
      - SSS = sequence within priority
    - Check dependencies (blockedBy field)
    - Check assignment (skip if Assigned To is set to another agent)
    - Pick first unblocked, unassigned task
    - Update Assigned To with your agent ID
    - Update Assigned At with current timestamp
    - Move file from todo/ to doing/
    - Update status field in file to "doing"
    - Continue to STEP 4

STEP 3: CREATE NEW TASK
  - If todo/ is empty:
    - Read MISSION.md, README.md, MISSION_TASKS.md
    - Analyze current repo state (what exists, what's missing)
    - Identify the single most impactful next task
    - Create task file using template in _templates/task.md
    - Place in .claude/tasks/todo/
    - Move to doing/ immediately
    - Continue to STEP 4

STEP 4: EXECUTE TASK
  For the task in doing/:

  a) PLAN (Gap Analysis First!)
    - Read all relevant files INCLUDING existing implementations
    - Check each acceptance criterion against what exists
    - Identify GAPS: what's missing, incomplete, or needs improvement
    - Write implementation plan focusing on gaps
    - Identify files to create/modify
    - Identify tests needed
    - If something "exists" but is incomplete, plan the completion work

  b) IMPLEMENT
    - Make changes in small, reviewable chunks
    - Update Work Log after each significant action
    - Run quality gates after every major change (see Section D)

  c) TEST
    - Write tests for new functionality
    - Run existing tests to ensure no regressions
    - Update Work Log with test results

  d) REVIEW
    - Self-review the changes
    - Check for edge cases, security issues
    - Verify ALL acceptance criteria are met (not just "something exists")
    - If code partially exists, identify GAPS and IMPROVEMENTS needed

  e) COMPLETE (Only when ALL criteria met!)
    - Run final quality gates
    - Verify EVERY acceptance criterion checkbox can be checked
    - Do NOT mark done just because "code exists" - verify it meets spec
    - Update task status to "done"
    - Update completed timestamp
    - Add completion summary to Work Log
    - Clear Assigned To and Assigned At fields
    - Move file from doing/ to done/
    - Commit with message referencing task ID
    - Regenerate TASKBOARD.md

STEP 5: CONTINUE OR STOP
  - If more tasks remain and within run limit: go to STEP 1
  - If stopping: clear your assignment from any uncompleted tasks
  - Report summary
```

---

## B) Repo Discovery

### Auto-Detection Commands

Run these to discover what's available:

```bash
# Ruby/Rails
[ -f Gemfile ] && echo "Ruby project"
[ -f bin/rails ] && echo "Rails available: bin/rails"
bundle list 2>/dev/null | grep -E "rspec|minitest|rubocop|brakeman|bundler-audit|standard|erb_lint"

# Node/JS
[ -f package.json ] && echo "Node project"
cat package.json 2>/dev/null | grep -E '"(test|lint|format)"'

# CI
[ -f .github/workflows/*.yml ] && echo "GitHub Actions CI"
[ -f .gitlab-ci.yml ] && echo "GitLab CI"
[ -f Makefile ] && echo "Makefile available"
```

### This Repository's Tools

**Primary Quality Command (ALWAYS USE THIS):**
```bash
./bin/quality  # Runs ALL 12 quality gates - MANDATORY before commit
```

#### Quality & Testing Tools

| Category | Tool | Command |
|----------|------|---------|
| **Quality (All)** | Full Suite | `./bin/quality` |
| Ruby Style | RuboCop | `bundle exec rubocop` |
| Ruby Style Fix | RuboCop | `bundle exec rubocop -A` |
| ERB Style | ERB Lint | `bundle exec erb_lint --lint-all` |
| Security | Brakeman | `bundle exec brakeman -q` |
| Security | Bundle Audit | `bundle exec bundle-audit check --update` |
| Tests | RSpec | `bundle exec rspec` |
| Tests (Fast) | RSpec (no slow) | `bundle exec rspec --exclude-pattern 'spec/{performance,system}/**/*'` |
| JS Lint | ESLint | `npm run lint` |
| JS Format | Prettier | `npm run format:check` |
| i18n | i18n-tasks | `bundle exec i18n-tasks health` |
| Model Annotations | Annotaterb | `bundle exec annotaterb models` |

#### Development Scripts

| Script | Purpose |
|--------|---------|
| `./bin/setup` | Setup development environment |
| `./bin/dev` | Start development server with Guard |
| `./bin/quality` | **MANDATORY** - Run ALL quality checks |
| `bundle exec guard` | Real-time quality monitoring |
| `./script/dev/setup-quality-automation` | Setup autonomous quality system |
| `./script/dev/pre-push-quality` | Extended pre-push validation |
| `./script/dev/quality-dashboard` | Live quality metrics and status |
| `./script/dev/quality-check-file` | File-specific quality checks |
| `./script/dev/i18n-check-file` | i18n compliance for templates |
| `./script/dev/route-test-check` | Route testing validation |
| `./script/dev/migration-check` | Migration safety analysis |
| `./script/dev/i18n` | Manage i18n translations |
| `./script/dev/migrations` | Database migration safety tools |
| `./script/dev/anti-pattern-detection` | Detect code anti-patterns |

#### The 12 Autonomous Quality Gates

The `./bin/quality` script enforces these gates:

1. **Code Style**: Zero RuboCop violations (Rails Omakase) + SOLID principles
2. **Security**: Zero Brakeman high/medium issues + Bundle Audit
3. **Tests**: 100% passing, 80% minimum coverage + Test Pyramid compliance
4. **Route Testing**: Every route must have corresponding tests
5. **i18n**: All static text uses translation keys
6. **Template Quality**: ERB lint compliance + semantic HTML
7. **SEO**: Meta tags, structured data, XML sitemaps
8. **Accessibility**: WCAG 2.1 AA compliance via axe-core testing
9. **Performance**: No N+1 queries + response time monitoring
10. **Database**: Proper indexes, constraints, migration safety
11. **Multi-tenant**: acts_as_tenant verification + data isolation
12. **Documentation**: Synchronization and consistency checks

### Discovery Priority

1. **Always run**: `./bin/quality` - comprehensive 12-gate check
2. **Quick feedback**: RuboCop, ESLint, Prettier - fast style checks
3. **Safety critical**: Brakeman, bundle-audit - security before commit
4. **Validation**: RSpec tests - must pass before done
5. **Optional**: Performance tests, accessibility tests - run when relevant

---

## C) Task Lifecycle

### Task ID Format

```
PPP-SSS-slug.md

PPP = Priority (001-004)
  001 = Critical (blocking, security, broken)
  002 = High (important feature, significant bug)
  003 = Medium (normal work, improvements)
  004 = Low (nice-to-have, cleanup)

SSS = Sequence (001-999)
  Within same priority, lower = do first

slug = kebab-case description (max 50 chars)

Examples:
  001-001-fix-security-vulnerability.md
  002-001-add-user-authentication.md
  002-002-add-password-reset.md
  003-001-refactor-user-model.md
```

### Task States

```
.claude/tasks/
  todo/     <- Planned, ready to start (unassigned)
  doing/    <- In progress (assigned to an agent)
  done/     <- Completed with logs (unassigned)
  _templates/ <- Task file template
```

### Task Assignment (Parallel Support)

Each task has assignment metadata:
- **Assigned To**: Agent ID currently working on the task
- **Assigned At**: Timestamp when assignment started (refreshed every hour)

Rules for parallel operation:
1. Only pick up tasks where `Assigned To` is empty
2. Set `Assigned To` to your agent ID when starting
3. Clear `Assigned To` when completing or abandoning
4. If `Assigned At` is >3 hours old, the assignment is stale (can be claimed)
5. Long-running tasks refresh `Assigned At` every hour (heartbeat)

### Moving Tasks

When changing state, physically move the file:

```bash
# Pick up task
mv .claude/tasks/todo/003-001-example.md .claude/tasks/doing/

# Complete task
mv .claude/tasks/doing/003-001-example.md .claude/tasks/done/
```

### Task File Template

Located at `.claude/tasks/_templates/task.md`

Required sections:
- **Title**: Clear, actionable description
- **Context**: Why this task exists
- **Acceptance Criteria**: Definition of done (checkboxes)
- **Plan**: Step-by-step implementation approach
- **Work Log**: Timestamped record of actions and outcomes
- **Testing Evidence**: Commands run, results
- **Notes**: Observations, blockers, decisions
- **Links**: Related files, PRs, issues

---

## D) Quality Gates

### When to Run

Run quality checks after every "major change":
- Adding/modifying a file with significant logic
- Changing database schema
- Adding new dependencies
- Modifying configuration
- Before committing

### Quick Check (During Development)

```bash
# Ruby changes
bundle exec rubocop --only-git-dirty 2>/dev/null || bundle exec rubocop

# JS changes
npm run lint 2>/dev/null || true
npm run format:check 2>/dev/null || true
```

### Full Check (Before Commit)

```bash
# Preferred: use bin/quality if available
[ -x bin/quality ] && bin/quality

# Or run individually:
bundle exec rubocop
bundle exec erb_lint --lint-all
bundle exec brakeman -q
bundle exec bundle-audit check --update
bundle exec rspec --exclude-pattern 'spec/{performance,system}/**/*'
```

### Quality Failure Protocol

If a quality check fails:
1. **STOP** - do not continue with more changes
2. **FIX** - address the failure immediately
3. **RE-RUN** - verify the fix resolves the issue
4. **LOG** - note the failure and fix in Work Log
5. **CONTINUE** - only after all checks pass

### Test Coverage Rules

- **New code**: Must have tests
- **Bug fixes**: Must have regression test
- **Modified code**: Existing tests must still pass
- **No tests exist**: Add tests for area being touched

---

## E) Commit Policy

### Commit Requirements

1. **All quality gates must pass** - never commit failing checks
2. **Task reference required** - include task ID in message
3. **Atomic commits** - one logical change per commit
4. **Working state** - app must work after commit

### Commit Message Format

```
<type>: <description>

[optional body]

Task: <task-id>
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructure without behavior change
- `test`: Adding/updating tests
- `docs`: Documentation only
- `style`: Formatting, no logic change
- `chore`: Maintenance, dependencies

Example:
```
feat: add user authentication system

Implements login/logout with session management.
Adds User model with secure password handling.

Task: 002-001-add-user-authentication
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### What NOT to Commit

- Broken tests
- Security vulnerabilities
- Debug code or console.log
- Commented-out code
- TODO comments without task reference
- Credentials or secrets
- Large binary files

---

## F) Failure Modes

### When Stuck

1. **Document the blocker** in task Work Log
2. **Identify the type**:
   - Missing information -> Add question to Notes
   - Technical limitation -> Research alternatives
   - Scope creep -> Split into subtasks
   - External dependency -> Create blocked task

3. **If blocked for > 3 attempts**:
   - Move task back to todo/ with blocker noted
   - Pick a different task
   - Leave clear handoff notes

### Flaky Tests

1. Re-run the test 3 times
2. If intermittent:
   - Note in Work Log
   - Check for race conditions, timing issues
   - Add retry logic if appropriate
   - Or mark as known flaky with comment

### Scope Explosion

If a task grows beyond original estimate:
1. Complete the minimum viable version
2. Create follow-up tasks for additional scope
3. Commit what's done
4. Move to done with note about follow-ups

### Dependency Conflicts

1. Log the conflict in Work Log
2. Try: `bundle update <gem>` or `npm update <package>`
3. If unresolvable:
   - Document in Notes
   - Check for alternatives
   - Create separate task for dependency upgrade

### Environment Issues

If local environment breaks:
1. Log the issue
2. Try: `bin/setup` if available
3. Check: Ruby version, Node version, database
4. Reset: `bundle install && npm install`

---

## G) Taskboard

### Generate Taskboard

Run `.claude/scripts/taskboard.sh` to regenerate `TASKBOARD.md`:

```bash
.claude/scripts/taskboard.sh
```

### Taskboard Location

`TASKBOARD.md` in repo root - human-readable overview of all tasks.

---

## H) Scripts

### bin/agent

Main entry point for **FULLY AUTONOMOUS + SELF-HEALING + PARALLEL** operation. Runs Claude in dangerous mode with all permissions bypassed and automatic recovery from failures. Supports multiple agents running simultaneously without conflicts.

```bash
# Run 5 tasks (default)
./bin/agent

# Run specific number of tasks
./bin/agent 3

# Run 1 task
./bin/agent 1

# Run multiple agents in parallel
./bin/agent 5 &    # Agent 1 in background
./bin/agent 5 &    # Agent 2 in background
./bin/agent 5 &    # Agent 3 in background

# Named agents (useful for tracking)
AGENT_NAME="worker-1" ./bin/agent 5 &
AGENT_NAME="worker-2" ./bin/agent 5 &
```

**Phase-Based Execution:**

Each task goes through 7 distinct phases, each with a fresh Claude session and focused prompt:

| Phase | Timeout | Purpose |
|-------|---------|---------|
| 1. TRIAGE | 2min | Validate task, check dependencies, verify readiness |
| 2. PLAN | 5min | Gap analysis, detailed implementation planning |
| 3. IMPLEMENT | 30min | Execute the plan, write code |
| 4. TEST | 10min | Run tests, add missing coverage |
| 5. DOCS | 5min | Sync documentation, update annotations |
| 6. REVIEW | 5min | Code review, consistency check, create follow-ups |
| 7. VERIFY | 2min | Verify task management done correctly |

**Environment Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_MODEL` | `opus` | Model to use (opus, sonnet, haiku) - falls back to sonnet on limits |
| `AGENT_DRY_RUN` | `0` | Set to 1 to preview without executing |
| `AGENT_VERBOSE` | `0` | Set to 1 for more output |
| `AGENT_QUIET` | `0` | Set to 1 to disable streaming output (streaming is ON by default) |
| `AGENT_MAX_RETRIES` | `2` | Max retry attempts per phase |
| `AGENT_RETRY_DELAY` | `5` | Base delay between retries (exponential backoff) |
| `AGENT_NO_RESUME` | `0` | Set to 1 to skip resuming interrupted sessions |
| `AGENT_NAME` | `worker-N` | Agent name (auto-generates worker-1, worker-2, etc.) |
| `AGENT_LOCK_TIMEOUT` | `10800` | Stale lock timeout in seconds (3 hours) |
| `AGENT_HEARTBEAT` | `3600` | Heartbeat interval in seconds (1 hour) - refreshes assignment |
| `AGENT_NO_FALLBACK` | `0` | Set to 1 to disable model fallback on rate limits |

**Phase Skip Flags** (set to 1 to skip):

| Variable | Description |
|----------|-------------|
| `SKIP_TRIAGE` | Skip task validation phase |
| `SKIP_PLAN` | Skip planning phase |
| `SKIP_IMPLEMENT` | Skip implementation phase |
| `SKIP_TEST` | Skip testing phase |
| `SKIP_DOCS` | Skip documentation sync phase |
| `SKIP_REVIEW` | Skip code review phase |
| `SKIP_VERIFY` | Skip task verification phase |

**Phase Timeout Overrides** (in seconds):

| Variable | Default | Description |
|----------|---------|-------------|
| `TIMEOUT_TRIAGE` | 120 | Triage phase timeout (2min) |
| `TIMEOUT_PLAN` | 300 | Planning phase timeout (5min) |
| `TIMEOUT_IMPLEMENT` | 1800 | Implementation phase timeout (30min) |
| `TIMEOUT_TEST` | 600 | Testing phase timeout (10min) |
| `TIMEOUT_DOCS` | 300 | Documentation phase timeout (5min) |
| `TIMEOUT_REVIEW` | 300 | Review phase timeout (5min) |
| `TIMEOUT_VERIFY` | 120 | Verification phase timeout (2min) |

**Self-Healing Features:**

| Feature | Description |
|---------|-------------|
| **Phase Isolation** | Each phase runs in fresh Claude session (clean context) |
| **Auto-Retry** | Retries failed phases with exponential backoff |
| **Model Fallback** | Automatically switches from opus to sonnet on rate limits |
| **Session Persistence** | Saves state to `.claude/state/` for crash recovery |
| **Auto-Resume** | Detects interrupted sessions and resumes from last iteration |
| **Health Checks** | Validates environment before each run (CLI, dirs, disk space) |
| **Circuit Breaker** | Pauses 30s after 3 consecutive failures to avoid hammering |
| **Error Detection** | Recognizes rate limits, timeouts, server errors for smart retry |
| **Graceful Cleanup** | Regenerates taskboard on exit (normal or interrupted) |

**Parallel Operation Features:**

| Feature | Description |
|---------|-------------|
| **Lock Files** | Tasks are locked via `.claude/locks/<task-id>.lock` |
| **Atomic Acquisition** | Lock acquisition uses atomic mkdir for race safety |
| **Stale Detection** | Detects dead processes and expired locks (>3 hours) |
| **Task Assignment** | Updates task metadata with agent ID and timestamp |
| **Heartbeat** | Refreshes assignment every hour to prevent stale detection |
| **Auto-Cleanup** | Releases all locks on exit (normal, interrupt, or crash) |
| **Conflict Prevention** | Agents skip tasks locked by others |

**How Self-Healing Works:**

```
1. Health check runs before starting
2. On failure:
   a. Save session state (iteration, status, logs)
   b. Wait with exponential backoff (5s, 10s, 20s...)
   c. Retry with --continue flag to resume
   d. After 3 failures: circuit breaker pauses 30s
3. On crash/kill:
   a. Next run detects interrupted session
   b. Resumes from last iteration automatically
4. On completion:
   a. Clears session state
   b. Regenerates taskboard
```

**CLI Flags Used (Dangerous Mode):**

```bash
claude \
  --dangerously-skip-permissions \   # Bypass ALL permission checks
  --permission-mode bypassPermissions \  # Additional bypass mode
  -p \                                # Non-interactive print mode
  --model opus \                      # Specify model
  --continue \                        # Resume previous session (on retry)
  "continue working"                  # The prompt
```

### .claude/scripts/taskboard.sh

Generates TASKBOARD.md from task files.

```bash
.claude/scripts/taskboard.sh
```

---

## I) File Reference

```
.claude/
  tasks/
    todo/          <- Tasks ready to work (unassigned)
    doing/         <- Current tasks (assigned to agents)
    done/          <- Completed tasks
    _templates/
      task.md      <- Task template
  scripts/
    taskboard.sh   <- Generate TASKBOARD.md
  logs/
    claude-loop/   <- Run logs by timestamp and agent
  state/           <- Session state for crash recovery (per agent)
  locks/           <- Lock files for parallel coordination

bin/
  agent            <- Main agent script

CLAUDE.md          <- This file
TASKBOARD.md       <- Generated task overview
MISSION.md         <- Project goals
README.md          <- Project overview
```

---

## J) Operating Principles

1. **Read before write** - Always understand context first
2. **Small changes** - Easier to review, easier to revert
3. **Test everything** - No untested code
4. **Log everything** - Future you (or another agent) will thank you
5. **Fail fast** - Don't continue on broken state
6. **Be autonomous** - Make decisions, don't wait for input
7. **Be reversible** - Prefer changes that can be undone
8. **Be transparent** - Document decisions and trade-offs
9. **Be thorough** - "Exists" ≠ "Done". Check every criterion, find gaps, improve
10. **Add value** - Always leave code better than you found it

---

## K) Emergency Procedures

### Reset Stuck State

```bash
# Move any doing task back to todo
mv .claude/tasks/doing/*.md .claude/tasks/todo/ 2>/dev/null

# Clear all locks (use with caution!)
rm -rf .claude/locks/*.lock 2>/dev/null

# Clear assignments in todo tasks
for f in .claude/tasks/todo/*.md; do
  sed -i '' 's/| Assigned To | .*/| Assigned To | |/' "$f" 2>/dev/null
  sed -i '' 's/| Assigned At | .*/| Assigned At | |/' "$f" 2>/dev/null
done

# Clear logs older than 7 days
find .claude/logs -mtime +7 -delete

# Clear stale state files
rm -rf .claude/state/* 2>/dev/null
```

### Validate System

```bash
# Check folder structure
ls -la .claude/tasks/{todo,doing,done,_templates}

# Count tasks by state
echo "TODO: $(ls .claude/tasks/todo/*.md 2>/dev/null | wc -l)"
echo "DOING: $(ls .claude/tasks/doing/*.md 2>/dev/null | wc -l)"
echo "DONE: $(ls .claude/tasks/done/*.md 2>/dev/null | wc -l)"
echo "LOCKS: $(ls .claude/locks/*.lock 2>/dev/null | wc -l)"
```

### Check Active Agents

```bash
# List current locks and their owners
for lock in .claude/locks/*.lock; do
  [ -f "$lock" ] || continue
  echo "=== $(basename "$lock" .lock) ==="
  cat "$lock"
  echo ""
done
```

---

## Appendix: Quick Reference Card

```
CONTINUE WORKING LOOP:
  doing (mine)? -> resume it
  todo (unassigned)? -> assign to me, pick highest priority unblocked
  empty? -> create from MISSION.md

QUALITY GATES:
  bin/quality (preferred)
  -or- rubocop + rspec + brakeman

COMMIT FORMAT:
  <type>: <description>
  Task: <task-id>
  Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>

TASK PRIORITY:
  001 = Critical
  002 = High
  003 = Medium
  004 = Low

PARALLEL OPERATION:
  - Check Assigned To before picking task
  - Set Assigned To when starting
  - Clear Assigned To when done or stopping
  - Stale assignments (>3h) can be claimed
  - Heartbeat refreshes every 1h for long tasks

WHEN STUCK:
  1. Log it
  2. Try 3 times
  3. Clear assignment, move back to todo
  4. Pick something else
```
