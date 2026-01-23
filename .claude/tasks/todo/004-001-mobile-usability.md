# Task: Mobile Usability Pass

## Metadata

| Field       | Value                      |
| ----------- | -------------------------- |
| ID          | `004-001-mobile-usability` |
| Status      | `todo`                     |
| Priority    | `004` Low                  |
| Created     | `2026-01-23 12:00`         |
| Started     |                            |
| Completed   |                            |
| Blocked By  |                            |
| Blocks      |                            |
| Assigned To |                            |
| Assigned At |                            |

---

## Context

Mobile users should have a functional (if simplified) experience. The current two-panel layout doesn't work on small screens. Mobile also has unique audio permission challenges.

- Current: desktop-only layout
- Need: responsive design for mobile
- Issues: touch controls, audio permissions, keyboard

---

## Acceptance Criteria

- [ ] Responsive layout works on mobile (< 768px)
- [ ] Single-column layout with tab switching (chat vs code)
- [ ] Touch-friendly button sizes (min 44px tap targets)
- [ ] Virtual keyboard doesn't break layout
- [ ] Audio initialization works on iOS Safari
- [ ] Audio plays after user interaction (browser requirement)
- [ ] Code editor usable on mobile (or read-only with copy)
- [ ] Tested on iOS Safari and Android Chrome
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Add responsive breakpoints**
   - Files: `app/strudel/page.tsx`, `globals.css`
   - Tailwind responsive classes
   - Stack panels vertically on mobile

2. **Add tab navigation for mobile**
   - Files: `components/mobile/tab-bar.tsx`
   - Switch between chat and code views
   - Tab state management

3. **Fix touch targets**
   - Audit all buttons
   - Ensure min 44x44px
   - Add touch feedback

4. **Handle iOS audio**
   - Files: `app/strudel/page.tsx`
   - Resume AudioContext on first touch
   - Clear guidance for user

5. **Optimize code editor for mobile**
   - Consider read-only with copy button
   - Or simplified editor
   - Handle virtual keyboard

6. **Test on real devices**
   - iOS Safari (iPhone)
   - Android Chrome
   - Document any limitations

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- May want to detect mobile and show simplified UI
- Consider "add to home screen" PWA in future
- Audio autoplay restrictions are strict on iOS

---

## Links

- MDN: Web Audio API autoplay policy
- iOS Safari quirks documentation
