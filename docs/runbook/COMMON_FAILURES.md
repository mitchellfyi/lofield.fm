# Common Failures

**Purpose**: Known failure modes and how to fix them  
**Audience**: Developers and operators  
**Last updated**: 2025-12-15

## Provider API Failures

### OpenAI Rate Limit Exceeded

**Failure Mode**: User exceeds OpenAI rate limits (RPM, TPM, TPD)

**Symptoms**:
- API returns 429 status
- Error message: "Rate limit exceeded"

**Impact**: User cannot refine prompts

**Immediate Fix**:
1. Display user-friendly error: "OpenAI rate limit exceeded. Please wait and try again."
2. No retry (user must wait for rate limit window to reset)

**Prevention**:
- Use tier-based rate limits from OpenAI dashboard
- Future: Implement client-side rate limiting/throttling

**Root Cause**: User's OpenAI API key has rate limits based on their account tier

### ElevenLabs Character Quota Exceeded

**Failure Mode**: User exceeds monthly character quota

**Symptoms**:
- API returns 429 or quota error
- Error message includes "quota" or "limit"

**Impact**: User cannot generate tracks

**Immediate Fix**:
1. Display error: "ElevenLabs character limit exceeded. Upgrade your plan or wait for monthly reset."
2. Show quota info from `/usage` page

**Prevention**:
- Display quota usage prominently in UI
- Warn users when approaching limit (future)

**Root Cause**: User's ElevenLabs subscription tier has monthly character limits

### Provider API Key Revoked

**Failure Mode**: User's API key is revoked or expired

**Symptoms**:
- API returns 401 status
- Error message: "Invalid API key" or "Unauthorized"

**Impact**: User cannot use provider services

**Immediate Fix**:
1. Display error: "Invalid API key. Please update in Settings."
2. Redirect user to `/settings`

**Prevention**:
- Validate key format before saving
- Periodically check key validity (future)

**Root Cause**: User revoked key in provider dashboard or key expired

## Database Failures

### Connection Pool Exhausted

**Failure Mode**: Supabase connection pool is full

**Symptoms**:
- Database queries hang or timeout
- Error: "remaining connection slots are reserved"

**Impact**: App cannot execute queries

**Immediate Fix**:
1. Use Supabase pooled connection (port 6543) for serverless functions
2. Ensure connections are closed after use

**Prevention**:
- Use Supabase client libraries (handle pooling automatically)
- Avoid manual connection management

**Root Cause**: Too many concurrent connections or connections not closed

### RLS Policy Too Restrictive

**Failure Mode**: User cannot access their own data due to RLS policy bug

**Symptoms**:
- Queries return empty results
- User sees "no data" when they should see their records

**Impact**: User cannot see/edit their data

**Immediate Fix**:
1. Verify user is authenticated: `auth.uid()` returns UUID
2. Check `user_id` matches session user ID
3. Review RLS policy conditions

**Long-term Fix**:
- Add RLS tests to catch policy bugs
- Use consistent policy patterns (see [RLS docs](../security/RLS.md))

**Root Cause**: RLS policy condition doesn't match actual data or session

### Migration Rollback Not Possible

**Failure Mode**: Migration applied but needs to be reverted

**Symptoms**:
- Schema change breaks app
- Need to undo migration

**Impact**: App may be broken until fix deployed

**Immediate Fix**:
1. **Cannot rollback**: Supabase migrations are forward-only
2. Write a new migration to undo changes:
   ```sql
   -- Undo table addition
   drop table if exists new_table;

   -- Undo column addition
   alter table existing_table drop column if exists new_column;
   ```
3. Deploy fix migration

**Prevention**:
- Test migrations locally before pushing to production
- Use `if exists` and `if not exists` for idempotency
- Keep migrations small and atomic

**Root Cause**: Migration not tested before deployment

## Authentication Failures

### OAuth Provider Outage

**Failure Mode**: Google or GitHub OAuth is down

**Symptoms**:
- Users cannot sign in
- OAuth redirect fails or times out

**Impact**: Users cannot access app

**Immediate Fix**:
1. Display status message: "Authentication provider is experiencing issues. Please try again later."
2. Check provider status pages:
   - Google: [status.cloud.google.com](https://status.cloud.google.com)
   - GitHub: [githubstatus.com](https://githubstatus.com)

**Prevention**:
- Support multiple OAuth providers (already done: Google + GitHub)
- Consider email/password auth as backup (not implemented)

**Root Cause**: Third-party OAuth provider outage

### Session Cookie Not Set

**Failure Mode**: User signs in but session cookie not persisted

**Symptoms**:
- User redirected after OAuth but immediately signed out
- Session is null after `/auth/callback`

**Impact**: Users cannot stay signed in

**Immediate Fix**:
1. Check cookie settings in Supabase Dashboard → Auth → URL Configuration
2. Ensure site URL matches app domain
3. Verify redirect URL is whitelisted

**Prevention**:
- Test auth flow in dev and staging before production deploy
- Monitor auth callback errors

**Root Cause**: Misconfigured site URL or redirect URL

## Storage Failures

### Storage Bucket Full

**Failure Mode**: Supabase storage quota exceeded

**Symptoms**:
- Upload fails with quota error
- Error message: "Storage quota exceeded"

**Impact**: Users cannot upload tracks

**Immediate Fix**:
1. Upgrade Supabase plan for more storage
2. Delete old/unused files to free space

**Prevention**:
- Monitor storage usage in Supabase Dashboard
- Implement file cleanup policy (future)

**Root Cause**: Too many files stored, exceeded plan limits

### File Upload Timeout

**Failure Mode**: Large file upload times out

**Symptoms**:
- Upload hangs or returns timeout error
- Large audio files fail to upload

**Impact**: Users cannot save large tracks

**Immediate Fix**:
1. Increase serverless function timeout (Vercel: max 60s on Pro plan)
2. Optimize file size before upload (compress audio)

**Prevention**:
- Set max file size limits
- Use client-side upload for large files (future)

**Root Cause**: File too large or slow network

## Deployment Failures

### Vercel Build Timeout

**Failure Mode**: Build exceeds Vercel timeout limit

**Symptoms**:
- Build fails with timeout error (10 minutes on free, 45 on Pro)

**Impact**: Cannot deploy new code

**Immediate Fix**:
1. Optimize build process (remove unused dependencies)
2. Upgrade Vercel plan for longer timeout

**Prevention**:
- Keep dependencies lean
- Use incremental builds where possible

**Root Cause**: Build process too slow or complex

### Environment Variable Missing

**Failure Mode**: Required env var not set in production

**Symptoms**:
- Runtime error: "Missing environment variable X"
- Features fail (e.g., can't fetch API keys)

**Impact**: App broken in production

**Immediate Fix**:
1. Add missing env var in Vercel Dashboard → Settings → Environment Variables
2. Redeploy

**Prevention**:
- Document all required env vars (see [Environment Variables](../setup/ENVIRONMENT.md))
- Use env var validation at build time

**Root Cause**: Env var not configured in Vercel

## Monitoring & Alerts

### No Monitoring (Current State)

**Limitation**: No proactive monitoring or alerts currently implemented

**Risks**:
- Failures discovered by users, not monitoring
- No visibility into error rates or performance

**Future Enhancements**:
1. **Error tracking**: Sentry or similar
2. **Performance monitoring**: Vercel Analytics or New Relic
3. **Uptime monitoring**: UptimeRobot or Pingdom
4. **Logs**: Centralized logging (Datadog, Logtail)

## Related Documentation

- [Back to Index](../INDEX.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [System Overview](../architecture/OVERVIEW.md)
- [RLS](../security/RLS.md)
- [Storage Policies](../security/STORAGE.md)
