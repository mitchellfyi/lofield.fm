# Claude Agent System

A portable, phase-based autonomous agent system for Claude Code.

## Overview

This agent system enables Claude to work through tasks autonomously using a structured 7-phase workflow. Tasks are managed as markdown files that move through directories (`todo/` → `doing/` → `done/`).

## Quick Start

```bash
# Run the agent (processes 5 tasks by default)
./bin/agent

# Run a specific number of tasks
./bin/agent 3

# Dry run (preview without executing)
AGENT_DRY_RUN=1 ./bin/agent 1
```

## Directory Structure

```
.claude/
├── agent/                 # Portable agent system (this folder)
│   ├── lib/
│   │   └── core.sh       # Main agent logic
│   ├── prompts/          # Phase prompts (1-7)
│   ├── scripts/          # Utility scripts
│   ├── templates/        # Task templates
│   ├── run.sh            # Entry point
│   ├── install.sh        # Installation script
│   └── README.md         # This file
├── tasks/                 # Project-specific task storage
│   ├── todo/             # Pending tasks
│   ├── doing/            # In-progress tasks
│   ├── done/             # Completed tasks
│   └── _templates/       # Project task templates
├── logs/                  # Execution logs
├── state/                 # Agent state files
├── locks/                 # Lock files for parallel agents
└── config.sh             # Project-specific config (optional)
```

## The 7 Phases

Each task goes through these phases:

1. **TRIAGE** - Parse task, validate requirements, check dependencies
2. **PLAN** - Design implementation approach, update task with plan
3. **IMPLEMENT** - Write the code according to plan
4. **TEST** - Run tests, fix failures
5. **DOCS** - Update documentation as needed
6. **REVIEW** - Final code review, create follow-up tasks
7. **VERIFY** - Run quality gates, commit, complete task

## Task Format

Tasks are markdown files with this structure:

```markdown
# Task: [Title]

## Metadata

| Field      | Value               |
| ---------- | ------------------- |
| ID         | `001-001-task-name` |
| Status     | `todo`              |
| Priority   | `002` High          |
| Created    | `2024-01-15`        |
| Blocked By |                     |
| Blocks     |                     |

---

## Context

[Background and context for the task]

---

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests pass

---

## Plan

[Filled during PLAN phase]

---

## Work Log

[Filled as work progresses]
```

## Priority Levels

- `001` - Critical (blockers, security issues)
- `002` - High (core features)
- `003` - Medium (improvements)
- `004` - Low (nice-to-haves)

## Environment Variables

| Variable         | Default    | Description                          |
| ---------------- | ---------- | ------------------------------------ |
| `CLAUDE_MODEL`   | `opus`     | Model to use (opus, sonnet)          |
| `AGENT_DRY_RUN`  | `0`        | Preview without executing            |
| `AGENT_PROGRESS` | `1`        | Show progress updates                |
| `AGENT_QUIET`    | `0`        | Disable all output                   |
| `AGENT_NAME`     | `agent-$$` | Agent identifier (for parallel runs) |

## Parallel Execution

Run multiple agents simultaneously:

```bash
AGENT_NAME="worker-1" ./bin/agent 5 &
AGENT_NAME="worker-2" ./bin/agent 5 &
wait
```

Lock files prevent task conflicts.

## Installation in New Projects

From a project that has the agent installed:

```bash
.claude/agent/install.sh /path/to/new-project
```

This copies the agent system and creates the required directory structure.

## Configuration

Create `.claude/config.sh` for project-specific settings:

```bash
# Example config.sh
export CLAUDE_MODEL="sonnet"
export AGENT_PROGRESS=0

# Custom quality command
export QUALITY_CMD="npm test && npm run lint"
```

## Scripts

- `taskboard.sh` - Regenerate TASKBOARD.md summary
- `cleanup.sh` - Clean up old logs and state files

## Model Fallback

If the primary model hits rate limits, the agent automatically falls back to sonnet for 60 seconds before retrying with opus.

## Timeouts

Each phase has a timeout to prevent hanging:

| Phase     | Timeout |
| --------- | ------- |
| TRIAGE    | 120s    |
| PLAN      | 300s    |
| IMPLEMENT | 600s    |
| TEST      | 600s    |
| DOCS      | 300s    |
| REVIEW    | 600s    |
| VERIFY    | 180s    |

## Troubleshooting

**Task stuck in doing/**

- Check logs in `.claude/logs/`
- Manually move back to `todo/` to retry
- Or move to `done/` if work is complete

**Rate limits**

- Agent auto-falls back to sonnet
- Wait and retry, or reduce parallel agents

**Lock conflicts**

- Check `.claude/locks/` for stale locks
- Remove lock files if agents have exited

## License

Part of the curated.www project.
