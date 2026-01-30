# Accessibility Improvements (WCAG Compliance)

**Priority:** CRITICAL
**Category:** UX / Accessibility
**Source:** Periodic Review 2026-01-30

## Problems

1. Missing aria-labels on interactive elements
2. Modal dialogs lack proper focus management
3. Browser `confirm()` dialogs are not accessible
4. Keyboard navigation issues

## Required Fixes

### Missing ARIA Labels

- Play/Stop buttons need aria-label
- Like buttons need better aria-label (current state)
- Filter controls need labels
- Carousel navigation buttons need labels

### Modal Accessibility

- Focus should trap inside modals
- ESC key should close modals
- Focus should return to trigger on close
- Screen readers should announce modal opening

### Replace Browser Dialogs

- Replace `confirm()` calls with accessible custom dialogs
- Location: Delete track confirmation, clear history, etc.

### Keyboard Navigation

- Ensure all interactive elements are reachable via Tab
- Carousel should be navigable via arrow keys
- Audio player controls should be keyboard accessible

## Files to Modify

- `components/explore/ExploreTrackCard.tsx`
- `components/explore/ExplorePlayer.tsx`
- `components/explore/TrendingSection.tsx`
- `components/studio/` (various)

## Acceptance Criteria

- [ ] All buttons have descriptive aria-labels
- [ ] Modals trap focus and handle ESC
- [ ] No browser `confirm()` calls remain
- [ ] VoiceOver/NVDA testing passes
- [ ] WCAG 2.1 AA compliance
