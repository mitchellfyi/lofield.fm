# Fix Tweaks Playback Jankiness and Revert Issues

| Field       | Value                        |
| ----------- | ---------------------------- |
| ID          | 001-001-fix-tweaks-jankiness |
| Status      | todo                         |
| Priority    | Critical                     |
| Created     | 2025-01-25                   |
| Assigned To |                              |
| Assigned At |                              |

## Context

When making tweaks during playback, there is jankiness in the playback and code updates. Sometimes the values revert back after being changed. This is a critical UX issue.

## Acceptance Criteria

- [ ] Tweaks slider changes are smooth without playback interruption
- [ ] Code updates don't cause visual jank in the editor
- [ ] Tweak values don't revert unexpectedly
- [ ] History integration doesn't interfere with tweak changes

## Plan

1. Investigate handleTweaksChange callback
2. Check for race conditions between state updates
3. Review history push debouncing - may be causing reverts
4. Check live update logic for conflicts
5. Ensure code injection and playback update are properly sequenced

## Work Log

## Notes

- Likely related to history debouncing + state update timing
- May need to prevent history push during active slider drag
