# Improve Tracks Error Handling and Draft State

| Field | Value |
|-------|-------|
| ID | 002-004-improve-tracks-error-handling |
| Status | todo |
| Priority | High |
| Created | 2025-01-25 |
| Assigned To | `worker-1` |
| Assigned At | `2026-01-25 16:03` |

## Context

When clicking "My Tracks", users see "Failed to fetch projects" - needs friendlier message. Also need draft state for current track and ability to switch between tracks.

## Acceptance Criteria

- [ ] Show friendlier error message when fetching projects fails
- [ ] If tracks are saved locally, show them even when fetch fails
- [ ] Allow switching between tracks
- [ ] Implement draft state for current loaded track
- [ ] Add tests for the functionality

## Plan

1. Investigate TrackBrowser component and useProjects hook
2. Add better error handling with user-friendly messages
3. Implement local/draft track storage
4. Add track switching functionality
5. Write tests

## Work Log

## Notes
