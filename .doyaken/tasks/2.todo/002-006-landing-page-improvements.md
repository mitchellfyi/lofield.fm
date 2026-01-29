# Task: Improve Landing Page for Conversion

## Metadata

| Field       | Value                               |
| ----------- | ----------------------------------- |
| ID          | `002-006-landing-page-improvements` |
| Status      | `todo`                              |
| Priority    | `002` High                          |
| Created     | `2026-01-29 21:25`                  |
| Started     |                                     |
| Completed   |                                     |
| Blocked By  |                                     |
| Blocks      |                                     |
| Assigned To |                                     |
| Assigned At |                                     |

---

## Context

The landing page is the first impression for new visitors. It needs to clearly communicate value, showcase capabilities, and drive users to try the product.

**Problem Statement:**

- **Who**: First-time visitors to lofield.fm
- **What**: Landing page may not effectively convert visitors
- **Why**: Unclear value prop, missing social proof, weak CTAs
- **Current workaround**: Hope users figure it out

**Marketing Impact**: HIGH - landing page is top of funnel, affects all conversions

---

## Acceptance Criteria

- [ ] Clear headline and value proposition
- [ ] Demo video or animated showcase of the product
- [ ] Feature highlights with icons/screenshots
- [ ] Example tracks playing inline (audio previews)
- [ ] Social proof (user count, track count, testimonials)
- [ ] Genre quick-links
- [ ] Strong CTA ("Start Creating Free")
- [ ] Fast loading (<2s LCP)
- [ ] Mobile-optimized
- [ ] Tests written and passing
- [ ] Quality gates pass

---

## Plan

1. **Step 1**: Audit current landing page
   - Actions: Identify missing elements, weak copy

2. **Step 2**: Write compelling copy
   - Files: `app/page.tsx`
   - Actions: Headline, subhead, feature descriptions

3. **Step 3**: Add feature showcase
   - Files: `components/landing/Features.tsx`
   - Actions: 3-4 key features with icons and brief descriptions

4. **Step 4**: Add social proof
   - Files: `components/landing/SocialProof.tsx`
   - Actions: Stats (tracks created, users), testimonials if available

5. **Step 5**: Add inline audio previews
   - Files: `components/landing/AudioShowcase.tsx`
   - Actions: Featured tracks with mini players

6. **Step 6**: Optimize performance
   - Actions: Image optimization, lazy loading, font loading

---

## Headline Ideas

- "Create Music with AI. No Experience Needed."
- "Describe Your Sound. AI Does the Rest."
- "From Idea to Beat in Seconds"
- "The AI-Powered Music Studio in Your Browser"

---

## Notes

- A/B test headlines if possible
- Consider video background or animated hero
- Add analytics to track CTA clicks
- Compare to successful landing pages (Amper, AIVA, Soundful)

---

## Links

- File: `app/page.tsx`
- Landing page inspiration: https://lapa.ninja/
