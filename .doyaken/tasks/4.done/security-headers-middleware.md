# Add Security Headers Middleware

**Priority:** HIGH
**Category:** Security
**Source:** Periodic Review 2026-01-30

## Problem

The application lacks standard security headers that protect against common web vulnerabilities.

## Required Headers

- `X-Content-Type-Options: nosniff` - Prevent MIME type sniffing
- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection (legacy browsers)
- `Referrer-Policy: strict-origin-when-cross-origin` - Control referrer information
- `Content-Security-Policy` - Restrict resource loading (with audio exceptions)

## Implementation

1. Create `middleware.ts` in project root
2. Add security headers to all responses
3. Configure CSP to allow audio playback (Web Audio API, blob URLs)
4. Test that all pages load correctly with new headers

## Files to Create/Modify

- `middleware.ts` (new)

## Acceptance Criteria

- [ ] All security headers present in responses
- [ ] CSP configured without breaking audio playback
- [ ] No console errors from blocked resources
- [ ] Security scanner shows improved score
