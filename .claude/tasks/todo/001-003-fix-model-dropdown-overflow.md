# Fix Model Select Dropdown Overflow Issue

| Field | Value |
|-------|-------|
| ID | 001-003-fix-model-dropdown-overflow |
| Status | todo |
| Priority | Critical |
| Created | 2025-01-25 |
| Assigned To | |
| Assigned At | |

## Context

The model select dropdown in the ActionsBar does not appear when clicked. This is likely due to overflow:hidden on a parent container, but could be another z-index or positioning issue.

## Acceptance Criteria

- [ ] Model dropdown appears when button is clicked
- [ ] Dropdown is positioned correctly relative to button
- [ ] Dropdown is visible above other content (z-index)
- [ ] Dropdown closes when clicking outside
- [ ] Works on both desktop and mobile

## Plan

1. Inspect ModelSelector component
2. Check parent containers for overflow:hidden
3. Check z-index hierarchy
4. Test with position:fixed if needed for dropdown
5. Use React Portal if container overflow can't be changed

## Work Log

## Notes

- ModelSelector is in components/studio/ModelSelector.tsx
- Currently used with compact prop in ActionsBar
- ActionsBar has overflow-x-auto which may clip the dropdown
- May need to use Portal to render dropdown outside container
