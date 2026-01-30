# Task: Add Interactive Onboarding Tutorial

## Metadata

| Field       | Value                         |
| ----------- | ----------------------------- |
| ID          | `004-001-onboarding-tutorial` |
| Status      | `todo`                        |
| Priority    | `004` Low                     |
| Created     | `2026-01-29 21:20`            |
| Started     |                               |
| Completed   |                               |
| Blocked By  |                               |
| Blocks      |                               |
| Assigned To |                               |
| Assigned At |                               |

---

## Context

New users may not understand how to use the chat-to-music interface or what Tone.js can do. An interactive tutorial would reduce friction and showcase capabilities.

**Problem Statement:**

- **Who**: New users visiting the app for the first time
- **What**: No guided introduction to features
- **Why**: Users may not understand the chat-to-code paradigm
- **Current workaround**: Trial and error, reading presets

**Impact**: Medium - affects conversion and retention of new users

---

## Acceptance Criteria

- [ ] Tutorial triggers on first visit (stored in localStorage)
- [ ] Step-by-step walkthrough highlighting UI elements
- [ ] "Build your first beat" guided experience
- [ ] Skip button available at all times
- [ ] Can restart tutorial from settings/help
- [ ] Mobile-friendly tutorial flow
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Step 1**: Choose/build tutorial library
   - Files: `lib/tutorial/`
   - Actions: Evaluate react-joyride, intro.js, or custom solution

2. **Step 2**: Define tutorial steps
   - Files: `lib/tutorial/steps.ts`
   - Actions: Define highlights, tooltips, and actions for each step

3. **Step 3**: Create tutorial provider
   - Files: `components/tutorial/TutorialProvider.tsx`
   - Actions: Manage tutorial state, step progression

4. **Step 4**: Add trigger and controls
   - Files: `app/layout.tsx`, `components/settings/`
   - Actions: First-visit detection, restart button in help

5. **Step 5**: Write tests
   - Files: `components/tutorial/__tests__/`
   - Coverage: Step navigation, skip behavior, persistence

---

## Notes

- Keep tutorial short (5-7 steps max)
- Consider video alternative for complex concepts
- Track tutorial completion in analytics

---

## Links

- react-joyride: https://react-joyride.com/
- intro.js: https://introjs.com/
