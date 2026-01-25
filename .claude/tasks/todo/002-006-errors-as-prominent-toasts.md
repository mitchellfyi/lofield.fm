# Display Errors as Prominent Toasts

| Field       | Value                              |
| ----------- | ---------------------------------- |
| ID          | 002-006-errors-as-prominent-toasts |
| Status      | todo                               |
| Priority    | High                               |
| Created     | 2025-01-25                         |
| Assigned To |                                    |
| Assigned At |                                    |

## Context

Currently errors may be displayed in sections within the UI which can be easy to miss. Errors should be displayed as prominent toasts above the UI for better visibility.

## Acceptance Criteria

- [ ] Errors display as toast notifications above the UI
- [ ] Toast has 10 second auto-dismiss timeout
- [ ] Toast is user-dismissable (click X or swipe)
- [ ] Error toasts are visually distinct (red/error styling)
- [ ] Multiple errors can stack or queue
- [ ] Toast position is consistent and visible
- [ ] Works on mobile and desktop

## Plan

1. Review existing Toast component
2. Update Toast to support configurable timeout (default 10s for errors)
3. Find all error display locations in the app
4. Replace inline error displays with toast calls
5. Ensure error toast has prominent red/error styling
6. Test error scenarios

## Work Log

## Notes

- Existing Toast component at components/studio/Toast.tsx
- Currently used for success/info messages
- May need to add error-specific styling
- Consider z-index to ensure toast appears above all content
