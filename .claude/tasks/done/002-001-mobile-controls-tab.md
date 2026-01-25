# Mobile Controls Tab

| Field       | Value                       |
| ----------- | --------------------------- |
| ID          | 002-001-mobile-controls-tab |
| Status      | todo                        |
| Priority    | High                        |
| Created     | 2025-01-25                  |
| Assigned To |                             |
| Assigned At |                             |

## Context

On mobile, the timeline/bars are currently in the Code tab. User wants a dedicated tab for controls including timeline/bars, tweaks, and layers.

## Acceptance Criteria

- [ ] Remove timeline/bars from the Code tab on mobile
- [ ] Create a new "Controls" tab (or similar name) on mobile
- [ ] Controls tab contains: Timeline/Bars, Tweaks panel, Layers panel
- [ ] Tab navigation works correctly between Chat, Code, and Controls
- [ ] All controls are functional in the new tab

## Plan

1. Modify MobileTabs component to add third tab
2. Move timeline out of code tab
3. Add TweaksPanel and LayersPanel to new controls tab
4. Pass necessary props through to the new tab content

## Work Log

## Notes
