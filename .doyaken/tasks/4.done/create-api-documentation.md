# Create API Documentation

**Priority:** MEDIUM
**Category:** Documentation
**Source:** Periodic Review 2026-01-30

## Problem

No API reference documentation exists. Developers need to read code to understand endpoints.

## Required Documentation

### API.md Contents

1. **Authentication**
   - How auth works (Supabase)
   - Required headers
   - Error responses

2. **Endpoints**
   - `/api/explore` - List public tracks
   - `/api/explore/featured` - Featured/trending tracks
   - `/api/explore/play` - Track play counting
   - `/api/favorites` - User's liked tracks
   - `/api/tracks/[id]/like` - Like/unlike operations
   - `/api/profile` - User profile management
   - `/api/project/*` - Project CRUD
   - `/api/ai/*` - AI endpoints

3. **Request/Response Examples**
   - Sample requests with curl
   - Response schemas
   - Error formats

## Files to Create

- `docs/API.md`

## Acceptance Criteria

- [ ] All public endpoints documented
- [ ] Request/response examples provided
- [ ] Authentication requirements clear
- [ ] Error codes documented
