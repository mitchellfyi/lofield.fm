# Task: Add Public User Profiles

## Metadata

| Field       | Value                   |
| ----------- | ----------------------- |
| ID          | `002-005-user-profiles` |
| Status      | `todo`                  |
| Priority    | `002` High              |
| Created     | `2026-01-29 21:25`      |
| Started     |                         |
| Completed   |                         |
| Blocked By  |                         |
| Blocks      |                         |
| Assigned To |                         |
| Assigned At |                         |

---

## Context

Users can create tracks but have no public identity. Profiles let creators build a presence, showcase their work, and gain followers. This is essential for community building.

**Problem Statement:**

- **Who**: Creators who want recognition for their work
- **What**: No public profile or portfolio page
- **Why**: Can't build audience or reputation on the platform
- **Current workaround**: Share individual track links

**Marketing Impact**: HIGH - profiles = identity = retention + community

---

## Acceptance Criteria

- [ ] Public profile page at /user/[username]
- [ ] Profile displays: username, bio, avatar, created tracks
- [ ] Edit profile in settings
- [ ] Username customization (unique, URL-safe)
- [ ] Avatar upload or Gravatar
- [ ] Track count and total plays stats
- [ ] SEO-friendly profile pages
- [ ] Tests written and passing
- [ ] Quality gates pass

---

## Plan

1. **Step 1**: Database schema
   - Files: `supabase/migrations/`
   - Actions: Add profiles table (username, bio, avatar_url)

2. **Step 2**: Profile page
   - Files: `app/user/[username]/page.tsx`
   - Actions: Profile header, track grid, stats

3. **Step 3**: Edit profile
   - Files: `app/settings/profile/page.tsx`
   - Actions: Form for username, bio, avatar

4. **Step 4**: Avatar handling
   - Files: `lib/storage/avatar.ts`
   - Actions: Upload to Supabase Storage or use Gravatar

5. **Step 5**: Link from track cards
   - Files: `components/explore/ExploreTrackCard.tsx`
   - Actions: Creator name links to profile

6. **Step 6**: SEO metadata
   - Files: `app/user/[username]/page.tsx`
   - Actions: Profile-specific meta tags, OG images

---

## Notes

- Username validation: lowercase, alphanumeric, 3-20 chars
- Reserved usernames: admin, explore, settings, api, etc.
- Could add follow system later
- Consider verification badges for notable creators

---

## Links

- File: `app/settings/page.tsx`
- Gravatar: https://gravatar.com/
