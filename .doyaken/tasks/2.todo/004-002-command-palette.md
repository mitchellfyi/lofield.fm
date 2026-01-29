# Task: Add Command Palette (Cmd+K)

## Metadata

| Field       | Value                     |
| ----------- | ------------------------- |
| ID          | `004-002-command-palette` |
| Status      | `todo`                    |
| Priority    | `004` Low                 |
| Created     | `2026-01-29 21:20`        |
| Started     |                           |
| Completed   |                           |
| Blocked By  |                           |
| Blocks      |                           |
| Assigned To |                           |
| Assigned At |                           |

---

## Context

Power users benefit from keyboard-driven interfaces. A command palette (like VS Code's Cmd+P) would allow quick access to all app actions without mouse navigation.

**Problem Statement:**

- **Who**: Power users who prefer keyboard navigation
- **What**: No quick-access command interface
- **Why**: Mouse navigation is slower for experienced users
- **Current workaround**: Navigate manually, use browser shortcuts

**Impact**: Low-Medium - quality of life for power users

---

## Acceptance Criteria

- [ ] Cmd+K (Ctrl+K on Windows) opens command palette
- [ ] Fuzzy search through available commands
- [ ] Commands include: Play/Stop, Export, Save, Load Preset, etc.
- [ ] Recent commands shown first
- [ ] Keyboard navigation (arrow keys, enter to select)
- [ ] Escape to close
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Step 1**: Choose/build palette component
   - Files: `components/shared/CommandPalette.tsx`
   - Actions: Evaluate cmdk, kbar, or build custom

2. **Step 2**: Define commands registry
   - Files: `lib/commands/registry.ts`
   - Actions: List all commands with names, shortcuts, handlers

3. **Step 3**: Add keyboard listener
   - Files: `app/layout.tsx` or custom hook
   - Actions: Global Cmd+K listener, focus management

4. **Step 4**: Implement search
   - Files: `components/shared/CommandPalette.tsx`
   - Actions: Fuzzy matching, result ranking

5. **Step 5**: Write tests
   - Files: `components/shared/__tests__/CommandPalette.test.ts`
   - Coverage: Search, keyboard nav, command execution

---

## Notes

- cmdk is a popular, accessible option: https://cmdk.paco.me/
- Consider adding recent commands and favorites
- Could later add command chaining

---

## Links

- cmdk: https://cmdk.paco.me/
- kbar: https://kbar.vercel.app/
