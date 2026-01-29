# Task: Enhance Share Modal with One-Click Social Sharing

## Metadata

| Field       | Value                              |
| ----------- | ---------------------------------- |
| ID          | `001-005-share-modal-improvements` |
| Status      | `todo`                             |
| Priority    | `001` Critical                     |
| Created     | `2026-01-29 21:25`                 |
| Started     |                                    |
| Completed   |                                    |
| Blocked By  |                                    |
| Blocks      |                                    |
| Assigned To |                                    |
| Assigned At |                                    |

---

## Context

Making sharing frictionless encourages more shares. One-click buttons for Twitter, Discord, Reddit, and copy link make it easy for users to spread their creations.

**Problem Statement:**

- **Who**: Users who created a track they want to share
- **What**: Sharing requires manual copy-paste
- **Why**: Friction reduces sharing behavior
- **Current workaround**: Copy URL, manually paste into social platform

**Marketing Impact**: HIGH - reduces friction = more shares = more exposure

---

## Acceptance Criteria

- [ ] Share modal with clear "Share Track" header
- [ ] One-click share buttons: Twitter, Discord, Reddit, Facebook
- [ ] Copy link button with visual feedback ("Copied!")
- [ ] Pre-filled share text with track name and link
- [ ] Share analytics tracking (optional)
- [ ] QR code for mobile sharing
- [ ] Native share API on mobile (navigator.share)
- [ ] Tests written and passing
- [ ] Quality gates pass

---

## Plan

1. **Step 1**: Design share modal
   - Files: `components/share/ShareModal.tsx`
   - Actions: Clean layout with social buttons, copy link, embed tab

2. **Step 2**: Implement social share links
   - Files: `lib/share/socialLinks.ts`
   - Actions: Generate Twitter, Discord, Reddit, Facebook share URLs

3. **Step 3**: Add copy link functionality
   - Files: `components/share/ShareModal.tsx`
   - Actions: navigator.clipboard with toast feedback

4. **Step 4**: Add QR code generation
   - Files: `components/share/QRCode.tsx`
   - Actions: Generate QR code for track URL (use qrcode library)

5. **Step 5**: Native mobile share
   - Files: `lib/share/nativeShare.ts`
   - Actions: Use navigator.share on mobile with fallback

6. **Step 6**: Share analytics (optional)
   - Files: `app/api/analytics/share/route.ts`
   - Actions: Track which platforms users share to

---

## Share Text Templates

```
Twitter: "Check out this [genre] track I made with @lofieldFM 🎵 [link]"
Reddit: "I made this [genre] track using AI - lofield.fm"
Discord: "Just made this track on lofield.fm! [link]"
```

---

## Notes

- Keep modal fast, don't lazy-load social icons
- Consider gamification: "Share to unlock..." later
- Track viral coefficient: shares per user

---

## Links

- Twitter Intent: https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/overview
- navigator.share: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
