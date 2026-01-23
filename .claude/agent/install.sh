#!/usr/bin/env bash
#
# Claude Agent - Installation Script
#
# This script installs the Claude Agent system into a new project.
#
# Usage:
#   # From within the agent directory:
#   ./install.sh /path/to/new-project
#
#   # Or download and run:
#   curl -sSL https://example.com/install.sh | bash -s /path/to/project
#
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get target project directory
TARGET_DIR="${1:-}"
if [ -z "$TARGET_DIR" ]; then
  echo "Claude Agent Installer"
  echo ""
  echo "Usage: $0 <project-directory>"
  echo ""
  echo "Example:"
  echo "  $0 /path/to/my-project"
  echo "  $0 ."
  exit 1
fi

# Resolve to absolute path
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd)" || {
  log_error "Directory does not exist: $TARGET_DIR"
  exit 1
}

log_info "Installing Claude Agent to: $TARGET_DIR"

# Find source agent directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/run.sh" ]; then
  SOURCE_DIR="$SCRIPT_DIR"
else
  log_error "Cannot find agent source. Run this script from the agent directory."
  exit 1
fi

# Create target directories
log_info "Creating directory structure..."
mkdir -p "$TARGET_DIR/.claude/agent"
mkdir -p "$TARGET_DIR/.claude/tasks/todo"
mkdir -p "$TARGET_DIR/.claude/tasks/doing"
mkdir -p "$TARGET_DIR/.claude/tasks/done"
mkdir -p "$TARGET_DIR/.claude/tasks/_templates"
mkdir -p "$TARGET_DIR/.claude/logs"
mkdir -p "$TARGET_DIR/.claude/state"
mkdir -p "$TARGET_DIR/.claude/locks"
mkdir -p "$TARGET_DIR/bin"

# Copy agent files
log_info "Copying agent files..."
cp -r "$SOURCE_DIR/lib" "$TARGET_DIR/.claude/agent/"
cp -r "$SOURCE_DIR/prompts" "$TARGET_DIR/.claude/agent/"
cp -r "$SOURCE_DIR/scripts" "$TARGET_DIR/.claude/agent/"
cp -r "$SOURCE_DIR/templates" "$TARGET_DIR/.claude/agent/" 2>/dev/null || true
cp "$SOURCE_DIR/run.sh" "$TARGET_DIR/.claude/agent/"
cp "$SOURCE_DIR/README.md" "$TARGET_DIR/.claude/agent/" 2>/dev/null || true

# Make scripts executable
chmod +x "$TARGET_DIR/.claude/agent/run.sh"
chmod +x "$TARGET_DIR/.claude/agent/lib/core.sh"
chmod +x "$TARGET_DIR/.claude/agent/scripts/"*.sh 2>/dev/null || true

# Create bin/agent wrapper if it doesn't exist
if [ ! -f "$TARGET_DIR/bin/agent" ]; then
  log_info "Creating bin/agent wrapper..."
  cat > "$TARGET_DIR/bin/agent" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
exec "$PROJECT_DIR/.claude/agent/run.sh" "$@"
EOF
  chmod +x "$TARGET_DIR/bin/agent"
fi

# Create .gitkeep files
touch "$TARGET_DIR/.claude/tasks/todo/.gitkeep"
touch "$TARGET_DIR/.claude/tasks/doing/.gitkeep"
touch "$TARGET_DIR/.claude/tasks/done/.gitkeep"

# Create initial TASKBOARD.md
if [ ! -f "$TARGET_DIR/TASKBOARD.md" ]; then
  log_info "Creating TASKBOARD.md..."
  cat > "$TARGET_DIR/TASKBOARD.md" << 'EOF'
# Taskboard

Run `.claude/agent/scripts/taskboard.sh` to regenerate this file.

## Quick Start

```bash
# Create a task
# Add a markdown file to .claude/tasks/todo/

# Run the agent
./bin/agent 1

# Check status
cat TASKBOARD.md
```
EOF
fi

# Create sample task template
if [ ! -f "$TARGET_DIR/.claude/tasks/_templates/feature.md" ]; then
  log_info "Creating task template..."
  cat > "$TARGET_DIR/.claude/tasks/_templates/feature.md" << 'EOF'
# Task: [TITLE]

## Metadata

| Field | Value |
|-------|-------|
| ID | `[ID]` |
| Status | `todo` |
| Priority | `002` High |
| Created | `[DATE]` |
| Started | |
| Completed | |
| Blocked By | |
| Blocks | |
| Assigned To | |
| Assigned At | |

---

## Context

[Describe the context and background for this task]

---

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests pass
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

[Will be filled in during PLAN phase]

---

## Links

- [Related file or documentation]

---

## Work Log

[Will be filled in as work progresses]
EOF
fi

# Summary
echo ""
log_success "Claude Agent installed successfully!"
echo ""
echo "Next steps:"
echo "  1. Create a task in .claude/tasks/todo/"
echo "  2. Run: ./bin/agent 1"
echo ""
echo "For more information, see: .claude/agent/README.md"
