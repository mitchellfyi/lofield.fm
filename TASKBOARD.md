# TASKBOARD - lofield.fm

> Auto-generated overview of all tasks. See `.claude/tasks/` for full details.

## Summary

| Status | Count |
|--------|-------|
| 📋 Todo | 17 |
| 🔄 Doing | 0 |
| ✅ Done | 0 |

---

## 📋 Todo (16)

### Priority 002 - High (5)

| ID | Task | Blocked By |
|----|------|------------|
| `002-001` | [Setup Quality Checking Scripts and CI Pipeline](.claude/tasks/todo/002-001-quality-ci-setup.md) | - |
| `002-002` | [Add AI Model Selection with gpt-4o-mini Default](.claude/tasks/todo/002-002-ai-model-selection.md) | - |
| `002-003` | [Chat Prompt Hardening with Schema Validation and Retry Loop](.claude/tasks/todo/002-003-chat-prompt-hardening.md) | - |
| `002-004` | [Implement Supabase Backend and Authentication](.claude/tasks/todo/002-004-supabase-auth-setup.md) | - |
| `002-005` | [User API Key Management with Required Modal](.claude/tasks/todo/002-005-api-key-management.md) | `002-004` |

### Priority 003 - Medium (11)

| ID | Task | Blocked By |
|----|------|------------|
| `003-001` | [Save Tracks to Database with Basic CRUD](.claude/tasks/todo/003-001-save-tracks-db.md) | `002-004` |
| `003-002` | [Track Version History with Revert and Diff View](.claude/tasks/todo/003-002-track-revisions.md) | `003-001` |
| `003-003` | [Export Options - Copy Code, Download JS, Render Audio](.claude/tasks/todo/003-003-export-options.md) | - |
| `003-004` | [Shareable Links with Public Read-Only Pages](.claude/tasks/todo/003-004-shareable-links.md) | `003-001` |
| `003-005` | [Preset Library with Starter Patterns and Genre Templates](.claude/tasks/todo/003-005-preset-library.md) | - |
| `003-006` | [Tweaks UX - Quick Parameter Sliders](.claude/tasks/todo/003-006-tweaks-ux.md) | - |
| `003-007` | [Multi-Track Support with Mute/Solo](.claude/tasks/todo/003-007-multi-track-support.md) | - |
| `003-008` | [Undo/Redo Across Chat and Code Edits](.claude/tasks/todo/003-008-undo-redo.md) | - |
| `003-009` | [Session Cost Controls - Rate Limits and Quotas](.claude/tasks/todo/003-009-session-cost-controls.md) | `002-004` |
| `003-010` | [Observability - Error Tracking and Event Logging](.claude/tasks/todo/003-010-observability.md) | - |
| `003-011` | [Record Mode - Capture Live Performance Changes](.claude/tasks/todo/003-011-record-mode.md) | `003-001`, `003-006` |

### Priority 004 - Low (1)

| ID | Task | Blocked By |
|----|------|------------|
| `004-001` | [Mobile Usability Pass](.claude/tasks/todo/004-001-mobile-usability.md) | - |

---

## 🔄 Doing (0)

_No tasks in progress._

---

## ✅ Done (0)

_No completed tasks yet._

---

## Dependency Graph

```
002-004 (Supabase Auth)
├── 002-005 (API Key Management)
├── 003-001 (Save Tracks)
│   ├── 003-002 (Track Revisions)
│   ├── 003-004 (Shareable Links)
│   └── 003-011 (Record Mode) ← also needs 003-006
└── 003-009 (Cost Controls)

003-006 (Tweaks UX)
└── 003-011 (Record Mode) ← also needs 003-001
```

---

## Next Actions

Tasks ready to start (no blockers):

1. **002-001** - Quality CI Setup ⭐ _Recommended first_
2. **002-002** - AI Model Selection
3. **002-003** - Chat Prompt Hardening
4. **002-004** - Supabase Auth Setup ⭐ _Unlocks many tasks_
5. **003-003** - Export Options
6. **003-005** - Preset Library
7. **003-006** - Tweaks UX
8. **003-007** - Multi-Track Support
9. **003-008** - Undo/Redo
10. **003-010** - Observability
11. **004-001** - Mobile Usability

---

_Last updated: 2026-01-23_
