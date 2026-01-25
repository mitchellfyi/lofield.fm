# Remove Headers from Code and Chat Sections

| Field       | Value                          |
| ----------- | ------------------------------ |
| ID          | 003-002-remove-section-headers |
| Status      | todo                           |
| Priority    | Medium                         |
| Created     | 2025-01-25                     |
| Assigned To | `worker-1` |
| Assigned At | `2026-01-25 18:37` |

## Context

The Code and AI Chat sections have headers/headings that take up valuable screen real estate. These should be removed to maximize content area.

## Acceptance Criteria

- [ ] Remove "Code" header from CodePanel
- [ ] Remove header/title from ChatPanel
- [ ] Ensure Live mode toggle is still accessible (move if needed)
- [ ] Layout still looks clean without headers
- [ ] Mobile layout adjusted appropriately

## Plan

1. Read CodePanel component and identify header section
2. Read ChatPanel component and identify header section
3. Remove or relocate header elements
4. Ensure essential controls (like Live toggle) are preserved
5. Test on desktop and mobile

## Work Log

## Notes

- Live mode toggle in CodePanel header should be preserved somewhere
- May need to move controls to ActionsBar or elsewhere
