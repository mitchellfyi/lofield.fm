# Task: Add Dynamic Social Share Cards (OG Images)

## Metadata

| Field       | Value                        |
| ----------- | ---------------------------- |
| ID          | `001-001-social-share-cards` |
| Status      | `todo`                       |
| Priority    | `001` Critical               |
| Created     | `2026-01-29 21:25`           |
| Started     |                              |
| Completed   |                              |
| Blocked By  |                              |
| Blocks      |                              |
| Assigned To |                              |
| Assigned At |                              |

---

## Context

When users share tracks on Twitter, Discord, or other platforms, there's no visual preview. Dynamic OG images showing track info (name, genre, BPM, waveform) would dramatically increase click-through rates and make sharing more appealing.

**Problem Statement:**

- **Who**: Users sharing tracks, potential new users seeing shared links
- **What**: Shared links have no visual preview or look generic
- **Why**: Visual previews get 2-3x more engagement than text-only links
- **Current workaround**: None - links look plain

**Marketing Impact**: HIGH - every shared track becomes a visual ad for lofield.fm

---

## Acceptance Criteria

- [ ] Dynamic OG images generated for each public track
- [ ] Image includes: track name, genre, BPM, waveform visualization, lofield.fm branding
- [ ] Proper Open Graph meta tags on track pages
- [ ] Twitter Card meta tags (summary_large_image)
- [ ] Discord embed shows rich preview
- [ ] Images cached/CDN for performance
- [ ] Fallback image for tracks without custom preview
- [ ] Tests written and passing
- [ ] Quality gates pass

---

## Plan

1. **Step 1**: Create OG image generation API
   - Files: `app/api/og/[trackId]/route.tsx`
   - Actions: Use @vercel/og or Satori for dynamic image generation

2. **Step 2**: Design OG image template
   - Files: `app/api/og/[trackId]/route.tsx`
   - Actions: Layout with track info, waveform, branding

3. **Step 3**: Add meta tags to track pages
   - Files: `app/track/[id]/page.tsx` or shared track pages
   - Actions: Dynamic generateMetadata with og:image URL

4. **Step 4**: Add waveform to OG image
   - Files: `lib/og/waveform.ts`
   - Actions: Generate static waveform SVG from track code analysis

5. **Step 5**: Caching strategy
   - Files: API route headers
   - Actions: Cache-Control headers, consider Vercel Edge caching

6. **Step 6**: Test on platforms
   - Actions: Test with Twitter Card Validator, Facebook Debugger, Discord

---

## Notes

- @vercel/og uses Satori under the hood, supports JSX
- Keep image generation fast (<500ms) for good UX
- Standard OG image size: 1200x630px
- Consider adding share count tracking later

---

## Links

- @vercel/og: https://vercel.com/docs/functions/og-image-generation
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- Facebook Debugger: https://developers.facebook.com/tools/debug/
