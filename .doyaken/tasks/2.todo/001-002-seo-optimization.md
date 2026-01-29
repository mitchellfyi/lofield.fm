# Task: SEO Optimization (Meta, Sitemap, Structured Data)

## Metadata

| Field       | Value                      |
| ----------- | -------------------------- |
| ID          | `001-002-seo-optimization` |
| Status      | `todo`                     |
| Priority    | `001` Critical             |
| Created     | `2026-01-29 21:25`         |
| Started     |                            |
| Completed   |                            |
| Blocked By  |                            |
| Blocks      |                            |
| Assigned To |                            |
| Assigned At |                            |

---

## Context

Search engine visibility is critical for organic growth. The app needs proper SEO fundamentals: meta descriptions, structured data, sitemap, and optimized page titles.

**Problem Statement:**

- **Who**: Potential users searching for music creation tools
- **What**: Poor search visibility, missing SEO fundamentals
- **Why**: Organic search is free, sustainable traffic source
- **Current workaround**: Rely only on direct traffic and social shares

**Marketing Impact**: HIGH - organic search compounds over time

---

## Acceptance Criteria

- [ ] Unique, descriptive titles for all pages
- [ ] Meta descriptions on all pages (150-160 chars)
- [ ] Dynamic sitemap.xml including public tracks
- [ ] robots.txt properly configured
- [ ] Structured data (JSON-LD) for:
  - [ ] WebSite schema on homepage
  - [ ] MusicRecording schema on track pages
  - [ ] SoftwareApplication schema
- [ ] Canonical URLs set correctly
- [ ] Mobile-friendly validation passes
- [ ] Core Web Vitals in green
- [ ] Tests written and passing
- [ ] Quality gates pass

---

## Plan

1. **Step 1**: Audit current SEO state
   - Actions: Run Lighthouse, check Google Search Console

2. **Step 2**: Add page-level metadata
   - Files: `app/layout.tsx`, `app/*/page.tsx`
   - Actions: generateMetadata for each page with title, description

3. **Step 3**: Create dynamic sitemap
   - Files: `app/sitemap.ts`
   - Actions: Include static pages + all public tracks

4. **Step 4**: Add robots.txt
   - Files: `app/robots.ts`
   - Actions: Allow crawling, point to sitemap

5. **Step 5**: Add structured data
   - Files: `components/seo/JsonLd.tsx`
   - Actions: WebSite, MusicRecording, SoftwareApplication schemas

6. **Step 6**: Performance optimization
   - Actions: Check Core Web Vitals, optimize LCP, CLS, FID

---

## Notes

- Use Next.js generateMetadata for type-safe meta tags
- Public tracks should have unique meta descriptions
- Consider genre-specific landing pages later
- Track indexed pages in Google Search Console

---

## Links

- Next.js Metadata: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- Schema.org MusicRecording: https://schema.org/MusicRecording
- Google Search Console: https://search.google.com/search-console
