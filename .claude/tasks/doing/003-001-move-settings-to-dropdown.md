# Move Settings and Help to User Dropdown

| Field       | Value                             |
| ----------- | --------------------------------- |
| ID          | 003-001-move-settings-to-dropdown |
| Status      | doing                             |
| Priority    | Medium                            |
| Created     | 2025-01-25                        |
| Started     | 2026-01-25                        |
| Assigned To | worker-1                          |
| Assigned At | 2026-01-25 18:22                  |

## Context

Settings and Help links are currently in the TopBar header. They should be moved into the account/user dropdown menu.

## Acceptance Criteria

- [ ] Remove Settings link from TopBar header
- [ ] Remove Help button from TopBar header
- [ ] Add Settings link to UserMenu dropdown
- [ ] Add Help option to UserMenu dropdown
- [ ] Dropdown maintains good UX with additional items

## Plan

### Implementation Plan (Generated 2026-01-25)

#### Gap Analysis

| Criterion                              | Status | Gap                                                        |
| -------------------------------------- | ------ | ---------------------------------------------------------- |
| Remove Settings link from TopBar       | No     | Settings link exists in TopBar.tsx:127-153                 |
| Remove Help button from TopBar         | No     | Help button exists in TopBar.tsx:155-174, modal at 182-242 |
| Add Settings link to UserMenu dropdown | No     | UserMenu.tsx only has Sign Out button (lines 107-122)      |
| Add Help option to UserMenu dropdown   | No     | No Help option exists in UserMenu                          |
| Dropdown maintains good UX             | No     | Need to verify after adding items                          |

#### Files to Modify

1. `components/auth/UserMenu.tsx`
   - Add Settings link (using Next.js Link component) after the user header section
   - Add Help button that opens help modal
   - Need to add `useState` for help modal state
   - Import the help modal content (or create a shared HelpModal component)
   - Add divider between menu items and Sign Out for visual hierarchy
   - Styling should match existing button styles in dropdown

2. `components/studio/TopBar.tsx`
   - Remove Settings link (lines 127-153)
   - Remove Help button (lines 155-174)
   - Remove Help modal JSX (lines 182-242)
   - Remove `showHelp` state (line 25)
   - Keep remaining UI elements: My Tracks, Presets, UserMenu

#### Files to Create

1. `components/shared/HelpModal.tsx` (optional but recommended)
   - Extract help modal content from TopBar.tsx for reuse
   - Accept `isOpen` and `onClose` props
   - Contains all the help content currently in TopBar
   - This avoids code duplication and allows Help to be shown from multiple places

#### Design Decisions

1. **Help implementation approach**: Extract Help modal to shared component since:
   - It's pure content with no TopBar-specific dependencies
   - Could be reused elsewhere (e.g., from a help page)
   - Cleaner than duplicating modal code in UserMenu

2. **Menu item ordering**:
   - Settings first (more frequently used)
   - Help second
   - Divider
   - Sign Out last (standard convention)

3. **UX considerations**:
   - Keep same icon styles for consistency
   - Close dropdown when navigating to Settings (Link handles this)
   - Close dropdown when opening Help modal
   - Maintain visual hierarchy with divider before Sign Out

#### Test Plan

- [ ] Manual: Verify Settings link navigates to /settings
- [ ] Manual: Verify Help button opens help modal
- [ ] Manual: Verify dropdown closes after clicking Settings
- [ ] Manual: Verify dropdown closes after clicking Help
- [ ] Manual: Verify Sign Out still works
- [ ] Manual: Verify TopBar no longer shows Settings/Help buttons
- [ ] E2E: May need to update studio.spec.ts if it references Help button position
- [ ] Visual: Verify responsive behavior on mobile

#### Docs to Update

- None required - this is a UI restructuring without API changes

## Work Log

### 2026-01-25 - Planning Complete

- Analyzed TopBar.tsx: Found Settings link (lines 127-153), Help button (lines 155-174), Help modal (lines 182-242)
- Analyzed UserMenu.tsx: Currently only has Sign Out button (lines 107-122)
- Analyzed Settings page: Standard page at /settings with API key management
- Checked E2E tests: studio.spec.ts doesn't specifically test Settings/Help buttons
- Decision: Extract Help modal to shared component for reuse
- Decision: Menu order = Settings > Help > divider > Sign Out
- No blocking issues identified

### 2026-01-25 18:22 - Triage Complete

- Dependencies: None (no Blocked By field)
- Task clarity: Clear - move Settings and Help from TopBar to UserMenu dropdown
- Ready to proceed: Yes
- Notes:
  - Verified TopBar.tsx contains Settings link (lines 127-153) and Help button with modal (lines 155-174, 182-242)
  - Verified UserMenu.tsx currently only has Sign Out button (lines 107-122)
  - Both components exist and are ready for modification
  - Help modal code will need to be moved to or shared with UserMenu
  - Consider: Help could open same modal, or could link to a help page

### 2026-01-25 18:24 - Implementation Complete

- Created `components/shared/HelpModal.tsx` - extracted help modal for reuse
  - Commit: 0d816dc
- Updated `components/auth/UserMenu.tsx`:
  - Added Settings link with settings icon
  - Added Help button that opens HelpModal
  - Added divider before Sign Out
  - Dropdown closes on Settings click and Help click
  - Commit: 892caa0
- Updated `components/studio/TopBar.tsx`:
  - Removed Settings link (lines 125-151)
  - Removed Help button (lines 153-172)
  - Removed Help modal JSX (lines 180-240)
  - Removed showHelp state and Link import
  - Commit: b760e31
- Quality checks: ESLint pass, TypeScript pass

### 2026-01-25 18:30 - Testing Complete

Tests written:

- `components/shared/__tests__/HelpModal.test.ts` - 9 tests
  - Module structure validation
  - Props interface (isOpen, onClose)
  - Visibility behavior (returns null when closed, JSX when open)
  - Content structure validation
  - Accessibility considerations (fixed positioning)
- `components/auth/__tests__/UserMenu.test.ts` - 27 tests
  - Module structure validation
  - useAuth hook integration
  - User display name logic (full_name > email > "User")
  - Initials generation (handles multi-word names, single names, emails)
  - Sign out behavior (calls signOut, redirects to /)
  - Dropdown menu items (Settings, Help, Sign Out)
  - Menu item order verification (Settings > Help > divider > Sign Out)
  - HelpModal integration
  - Dropdown close behaviors
  - Authentication states (loading, unauthenticated)
  - Avatar display logic

Test results:

- Total: 2008 examples, 0 failures
- New tests: 36 examples (9 HelpModal + 27 UserMenu)
- Commit: 9f58dd8

Quality gates:

- ESLint: pass (0 errors, 2 pre-existing warnings)
- TypeScript: pass
- Prettier: pass
- RSpec: pass (2008/2008)

## Notes
