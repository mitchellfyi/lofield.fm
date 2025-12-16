# ADR 0003: Vercel Deploy Strategy

**Status**: Accepted  
**Date**: 2025-12-15  
**Deciders**: Engineering Team  
**Related**: Deployment, Infrastructure

## Context

Lofield Studio needed a deployment strategy that supports:

1. **Automatic deployment** - Deploy on every merge to main
2. **Preview environments** - Test PRs before merging
3. **Minimal operations overhead** - No server management
4. **Cost-effective** - Pay-as-you-go pricing
5. **Global distribution** - Low latency for users

### Constraints

- **Next.js App Router** - Must support Server Components, Server Actions
- **Serverless-friendly** - No long-running processes
- **Database migrations** - Must handle manual migrations separately from code deploys
- **Environment variables** - Secure storage for secrets

## Decision

We will deploy to **Vercel** using automatic deployments with serverless functions.

### Deployment Model

1. **Production**: Automatic deployment on merge to `main`
2. **Preview**: Automatic deployment for every PR
3. **Local**: `pnpm dev` for development

### Infrastructure

```
GitHub Repository
  ├─ Feature Branch → Vercel Preview Deploy
  └─ main Branch → Vercel Production Deploy

Vercel
  ├─ Serverless Functions (API routes, Server Actions)
  ├─ Edge Network (static assets)
  └─ Environment Variables (secrets)

Supabase
  ├─ Database (manual migrations)
  └─ Storage (separate from Vercel)
```

### Migration Strategy

**Key principle**: Migrations run **before** code deployment.

1. **Developer runs migration locally** (test)
2. **Developer runs migration in production** (manual)
3. **Then** merge PR to trigger code deployment
4. Ensures code never depends on schema that doesn't exist yet

## Alternatives Considered

### Option 1: Traditional VPS (Rejected)

**Pros**: Full control, predictable costs

**Cons**:

- ❌ Requires server management
- ❌ Manual scaling
- ❌ No automatic deploys
- ❌ Higher ops burden

**Why rejected**: Too much operational overhead for small team

### Option 2: AWS Lambda + API Gateway (Rejected)

**Pros**: Highly scalable, pay-per-use

**Cons**:

- ❌ Complex setup (IAM, CloudFormation, etc.)
- ❌ No built-in preview environments
- ❌ Separate static hosting needed
- ❌ More configuration required

**Why rejected**: Too complex for current needs

### Option 3: Netlify (Rejected)

**Pros**: Similar to Vercel, good DX

**Cons**:

- ❌ Less Next.js optimization (Vercel owns Next.js)
- ❌ Weaker Server Components support
- ❌ Smaller edge network

**Why rejected**: Vercel is better for Next.js specifically

### Option 4: Vercel (Selected)

**Pros**:

- ✅ Built for Next.js (same team)
- ✅ Automatic preview deployments
- ✅ Global edge network
- ✅ Zero-config scaling
- ✅ Simple CI/CD
- ✅ Environment variable management

**Cons**:

- Vendor lock-in (mitigated by Next.js portability)
- Cold start latency (acceptable for our use case)

**Why selected**: Best Next.js support, minimal configuration, great developer experience

## Consequences

### Positive

1. **Zero-config scaling**: Auto-scales from 0 to N users
2. **Automatic deployments**: Merge to main = instant deploy
3. **Preview URLs**: Every PR gets a unique URL for testing
4. **Global distribution**: Low latency via edge network
5. **Simple rollback**: Promote previous deployment via dashboard

### Negative

1. **Vendor lock-in**: Tied to Vercel platform (mitigated: Next.js is portable)
2. **Cold starts**: Serverless functions may have latency spikes (acceptable for our use case)
3. **Limited control**: Can't customize infrastructure deeply

### Neutral

1. **Serverless architecture**: No persistent state on servers
2. **Pay-as-you-go pricing**: Cost scales with usage

## Implementation

### Phase 1: Initial Setup

1. **Connect GitHub repo** to Vercel
2. **Configure build settings**:
   - Build command: `pnpm build`
   - Output directory: `.next`
   - Install command: `pnpm install`

3. **Set environment variables** in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Optional: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY` (dev fallbacks)

4. **Configure domain** (e.g., `lofield.studio`)

### Phase 2: Deployment Workflow

**Developer workflow**:

1. Create feature branch
2. Push to GitHub
3. Vercel creates preview deployment
4. Test in preview
5. Get PR approval
6. **Run database migrations** (if any)
7. Merge to main
8. Vercel deploys to production
9. Verify deployment

**Migration workflow**:

```bash
# Before merging code
SUPABASE_DB_URL="..." pnpm db:migrate

# Then merge PR
git merge feature-branch
git push origin main
# Vercel auto-deploys
```

### Phase 3: Monitoring

1. **Deployment notifications**: Monitor Vercel dashboard
2. **Error tracking**: Check Vercel Function Logs
3. **Post-deploy checks**:
   - Production URL loads
   - Sign in works
   - Critical features functional

### Success Criteria

1. **100% uptime goal**: < 0.1% downtime per month
2. **Deploy speed**: < 2 minutes from merge to live
3. **Preview accuracy**: Preview matches production environment
4. **Rollback time**: < 5 minutes to previous version

## Notes

### Future Considerations

- **Canary deployments**: Roll out to 10% of users first
- **E2E tests in CI**: Run Playwright tests before deploying
- **Custom edge functions**: Use Vercel Edge Runtime for faster cold starts
- **Multi-region database**: Consider Supabase read replicas

### Migration Safety

Key principle: **Never deploy code that depends on schema changes before running migrations**.

**Example** (correct):

1. Create migration: `0009_add_new_column.sql`
2. Run migration in production: `pnpm db:migrate`
3. Merge code that uses `new_column`

**Example** (wrong):

1. Merge code that uses `new_column`
2. Vercel deploys
3. App crashes (column doesn't exist yet)
4. Run migration (too late)

## Related Documentation

- [Back to Index](../INDEX.md)
- [Releases and Deployment](../runbook/RELEASES.md)
- [Incidents](../runbook/INCIDENTS.md)
- [System Overview](../architecture/OVERVIEW.md)

## Relevant Code

- `/package.json` - Build scripts
- `/next.config.ts` - Next.js configuration
- `/vercel.json` - Vercel configuration (if exists)
- `/.github/workflows/` - CI configuration (future)
