# Task: Create Genre-Specific Landing Pages

## Metadata

| Field       | Value                         |
| ----------- | ----------------------------- |
| ID          | `001-004-genre-landing-pages` |
| Status      | `todo`                        |
| Priority    | `001` Critical                |
| Created     | `2026-01-29 21:25`            |
| Started     |                               |
| Completed   |                               |
| Blocked By  |                               |
| Blocks      |                               |
| Assigned To |                               |
| Assigned At |                               |

---

## Context

Genre-specific landing pages target long-tail SEO keywords like "lofi beat maker online" or "ambient music generator". Each genre page showcases relevant presets and tracks.

**Problem Statement:**

- **Who**: Users searching for specific music creation needs
- **What**: No targeted pages for different genres/use cases
- **Why**: Generic homepage doesn't rank for specific queries
- **Current workaround**: Single homepage, explore page filtering

**Marketing Impact**: HIGH - captures intent-based search traffic

---

## Acceptance Criteria

- [ ] Landing pages for top genres: Lo-Fi, Ambient, House, Techno, Hip-Hop, Jazz
- [ ] Each page has unique SEO title/description
- [ ] Featured presets for that genre
- [ ] Example tracks in that genre
- [ ] Genre-specific copy/benefits
- [ ] "Start Creating [Genre]" CTA
- [ ] Internal linking from explore/homepage
- [ ] Indexed in sitemap
- [ ] Tests written and passing
- [ ] Quality gates pass

---

## Plan

1. **Step 1**: Create genre page template
   - Files: `app/genres/[genre]/page.tsx`
   - Actions: Dynamic page with genre-specific content

2. **Step 2**: Define genre content
   - Files: `lib/content/genres.ts`
   - Actions: Title, description, keywords, featured presets for each genre

3. **Step 3**: Build page layout
   - Files: `app/genres/[genre]/page.tsx`
   - Actions: Hero, preset grid, example tracks, CTA

4. **Step 4**: Add SEO metadata
   - Files: `app/genres/[genre]/page.tsx`
   - Actions: generateMetadata with genre-specific meta tags

5. **Step 5**: Internal linking
   - Files: `app/page.tsx`, `app/explore/page.tsx`
   - Actions: Links to genre pages from homepage and explore

6. **Step 6**: Add to sitemap
   - Files: `app/sitemap.ts`
   - Actions: Include all genre pages

---

## Target Keywords

- "lofi beat maker online free"
- "ambient music generator"
- "make techno beats online"
- "house music creator"
- "hip hop beat maker"
- "jazz music generator AI"

---

## Notes

- Start with 6 genres, expand based on search volume
- Consider sub-genres later (e.g., "dark techno", "deep house")
- Add related genres section for cross-linking
- Track page performance in Google Search Console

---

## Links

- Keyword research: Google Keyword Planner, Ahrefs
