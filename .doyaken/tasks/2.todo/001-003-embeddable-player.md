# Task: Create Embeddable Track Player Widget

## Metadata

| Field       | Value                       |
| ----------- | --------------------------- |
| ID          | `001-003-embeddable-player` |
| Status      | `todo`                      |
| Priority    | `001` Critical              |
| Created     | `2026-01-29 21:25`          |
| Started     |                             |
| Completed   |                             |
| Blocked By  |                             |
| Blocks      |                             |
| Assigned To |                             |
| Assigned At |                             |

---

## Context

Allow users to embed their tracks on external sites (blogs, portfolios, forums). Like SoundCloud or Spotify embeds, this creates viral distribution and brings traffic back to lofield.fm.

**Problem Statement:**

- **Who**: Creators wanting to showcase tracks on their websites
- **What**: No way to embed tracks outside of lofield.fm
- **Why**: Embeds spread content virally and drive new user acquisition
- **Current workaround**: Share links only, no inline playback

**Marketing Impact**: VERY HIGH - every embed is a backlink + player on external site

---

## Acceptance Criteria

- [ ] Compact player widget (iframe-based)
- [ ] Player shows: track name, play/pause, progress bar, lofield.fm branding
- [ ] "Copy Embed Code" button on track pages
- [ ] Multiple sizes: small (300x80), medium (400x120), large (500x150)
- [ ] Customizable colors (light/dark theme)
- [ ] "Open in lofield.fm" link in player
- [ ] Works on any website (CORS, iframe sandbox)
- [ ] Responsive within container
- [ ] Tests written and passing
- [ ] Quality gates pass

---

## Plan

1. **Step 1**: Create embed player page
   - Files: `app/embed/[trackId]/page.tsx`
   - Actions: Minimal player UI, no navigation, just audio + controls

2. **Step 2**: Style embed player
   - Files: `app/embed/[trackId]/page.tsx`, styles
   - Actions: Compact design, theme options via query params

3. **Step 3**: Add embed code generator
   - Files: `components/share/EmbedCodeGenerator.tsx`
   - Actions: Size picker, theme picker, copy button

4. **Step 4**: Add to share modal/page
   - Files: `app/track/[id]/page.tsx` or share modal
   - Actions: "Embed" tab alongside "Share Link"

5. **Step 5**: Handle iframe security
   - Files: `app/embed/[trackId]/page.tsx`
   - Actions: X-Frame-Options, CSP headers for embedding

6. **Step 6**: Write tests
   - Files: E2E tests
   - Coverage: Embed loads, plays, links back to main site

---

## Notes

- Keep embed bundle small for fast loading on external sites
- Consider tracking embed plays separately
- Add "Made with lofield.fm" branding for attribution
- Could add oEmbed support later for automatic embeds

---

## Links

- SoundCloud Embed: https://developers.soundcloud.com/docs/api/html5-widget
- oEmbed spec: https://oembed.com/
