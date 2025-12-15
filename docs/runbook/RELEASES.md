# Releases and Deployment

**Purpose**: How releases happen, deployment process, and rollback procedures  
**Audience**: Developers and operations  
**Last updated**: 2025-12-15

## Overview

Lofield Studio follows a **continuous deployment** model using Vercel. Every commit to `main` triggers an automatic production deployment.

**Key principles**:
- **Preview deployments** for every PR
- **Automatic production deployment** on merge to `main`
- **Manual database migrations** before code deployment
- **Rollback** via Vercel dashboard (no force push needed)

## Deployment Architecture

```
GitHub Repository
  ├─ Feature Branches → Vercel Preview Deployments
  └─ main Branch → Vercel Production Deployment

Supabase Database
  ├─ Manual migrations (pnpm db:migrate)
  └─ No automatic migration on deployment
```

## Deployment Flow

### 1. Feature Development

**Developer workflow**:

1. **Create feature branch**:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Develop and test locally**:
   ```bash
   pnpm dev  # Run app at localhost:3003
   pnpm verify  # Format, lint, typecheck, test
   ```

3. **Push to GitHub**:
   ```bash
   git push origin feature/new-feature
   ```

4. **Open Pull Request**:
   - GitHub automatically triggers Vercel preview deployment
   - Preview URL: `lofield-app-<git-hash>.vercel.app`

5. **Review preview deployment**:
   - Test feature in preview environment
   - Preview uses production Supabase (be careful!)

6. **CI checks** (GitHub Actions):
   - `pnpm verify` (format:check, lint, typecheck, test)
   - Build check (Next.js build)
   - Status must be passing before merge

### 2. Production Deployment

**Merge workflow**:

1. **PR approved and merged** to `main`

2. **Vercel automatically**:
   - Detects push to `main`
   - Triggers build
   - Runs `pnpm build`
   - Deploys to production: `lofield.studio` (or custom domain)

3. **Production deployment completes** (typically <2 minutes)

4. **Verify deployment**:
   - Check [lofield.studio](https://lofield.studio) (or production URL)
   - Test critical flows (sign in, create chat, generate track)
   - Monitor Vercel logs for errors

### 3. Database Migrations

**Important**: Migrations are **manual** and should run **before** code deployment.

#### Migration Workflow

1. **Create migration file**:
   ```bash
   # Naming: NNNN_description.sql (sequential number)
   touch supabase/migrations/0009_add_new_table.sql
   ```

2. **Write migration**:
   ```sql
   -- Add new table
   CREATE TABLE new_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Enable RLS
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
   
   -- Add policies
   CREATE POLICY "users_view_own"
     ON new_table FOR SELECT
     USING (auth.uid() = user_id);
   ```

3. **Test locally**:
   ```bash
   pnpm db:migrate
   # Verify schema in local Supabase
   ```

4. **Run migration in production** (before merging code):
   ```bash
   # Option 1: Direct database URL
   SUPABASE_DB_URL="postgresql://..." pnpm db:migrate
   
   # Option 2: Supabase CLI push
   SUPABASE_PROJECT_REF="..." SUPABASE_ACCESS_TOKEN="..." pnpm db:migrate
   ```

5. **Verify migration succeeded**:
   - Check Supabase Dashboard → Database → Tables
   - Run test query in SQL Editor

6. **Then merge code** that depends on migration

#### Migration Best Practices

**✅ Do**:
- Run migrations before deploying code that depends on schema changes
- Make migrations idempotent where possible (`CREATE TABLE IF NOT EXISTS`)
- Test migrations locally first
- Include RLS policies in the same migration as table creation
- Use descriptive migration file names

**❌ Don't**:
- Deploy code before running migrations (will break app)
- Rollback migrations (write a new migration to undo instead)
- Skip testing migrations locally
- Forget to enable RLS on new tables

## Vercel Configuration

### Build Settings

Located in `vercel.json` (if exists) or Vercel Dashboard → Settings → Build & Development:

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

### Environment Variables

Set in Vercel Dashboard → Settings → Environment Variables:

**Production**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY` (fallback keys)

**Preview**:
- Same as production (shared Supabase instance)
- Consider using separate Supabase project for staging (future)

**Note**: `SUPABASE_DB_URL` is **not** set in Vercel (migrations run separately).

### Deployment Protection

**Future enhancement**: Add deployment protection rules:
- Require passing CI checks
- Require manual approval before production deploy
- Slack notifications on deployment

## Rollback Procedures

### Rollback to Previous Deployment

**When**: Production deployment breaks the app.

**Steps**:

1. **Identify working deployment**:
   - Vercel Dashboard → Deployments
   - Find last successful deployment before the breaking change

2. **Promote to production**:
   - Click on working deployment
   - Click "Promote to Production"
   - Confirm rollback

3. **Verify rollback**:
   - Check production URL
   - Test critical features

4. **Fix issue**:
   - Revert problematic commit locally
   - Or fix the issue and redeploy

**Time to rollback**: < 5 minutes

### Rollback Database Migration

**Important**: Cannot rollback migrations automatically (no force push in Supabase).

**Instead**: Write a new migration to undo changes.

**Steps**:

1. **Write undo migration**:
   ```sql
   -- Example: Undo table creation
   DROP TABLE IF EXISTS new_table;
   ```

2. **Test locally**:
   ```bash
   pnpm db:migrate
   # Verify schema is correct
   ```

3. **Run in production**:
   ```bash
   SUPABASE_DB_URL="..." pnpm db:migrate
   ```

4. **Redeploy code**:
   - Revert code changes that depended on migration
   - Merge to `main`

## CI/CD Pipeline

### Current: GitHub Actions (Basic)

**On Pull Request**:
- Run `pnpm verify` (format:check, lint, typecheck, test)
- Report status to GitHub PR

**On Merge to Main**:
- Vercel automatic deployment

**Location**: `.github/workflows/ci.yml` (if exists)

### Future Enhancements

1. **E2E tests**: Run Playwright/Cypress tests before deployment
2. **Database migration checks**: Verify migrations are idempotent
3. **Security scans**: Run CodeQL or Snyk
4. **Deployment notifications**: Slack/Discord webhooks
5. **Canary deployments**: Roll out to 10% of users first

## Release Notes

### Current: Commit Messages

**Practice**: Use descriptive commit messages that explain changes.

**Example**:
```
Add usage tracking for ElevenLabs API calls

- Log character count and estimated cost
- Link events to track_id for attribution
- Update usage page to display ElevenLabs stats
```

### Future: Automated Changelog

**Tool**: Use `conventional-commits` and `standard-version` to auto-generate changelog.

**Example**:
```bash
pnpm standard-version
# Generates CHANGELOG.md with changes since last release
```

## Monitoring

### Post-Deployment Monitoring

**Immediately after deployment**:

1. **Check Vercel logs** (first 5 minutes):
   - Vercel Dashboard → Deployments → [Latest] → Function Logs
   - Look for errors or warnings

2. **Test critical paths**:
   - Sign in flow
   - Create chat + send message
   - Generate track
   - View usage page

3. **Monitor error rates** (first hour):
   - Vercel Analytics (if enabled)
   - Supabase logs
   - Look for spike in errors

### Ongoing Monitoring

**Tools** (future):
- **Sentry**: Error tracking and alerting
- **LogRocket**: Session replay for debugging
- **Uptime monitoring**: Pingdom or UptimeRobot

## Hotfix Process

**When**: Critical bug in production that cannot wait for regular release.

**Steps**:

1. **Create hotfix branch** from `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/critical-bug-fix
   ```

2. **Fix the issue**:
   ```bash
   # Make minimal changes
   # Test locally with pnpm verify
   ```

3. **Push and create PR**:
   ```bash
   git push origin hotfix/critical-bug-fix
   # Open PR, mark as urgent
   ```

4. **Fast-track review**:
   - Get approval from at least one reviewer
   - Merge immediately

5. **Vercel auto-deploys** to production

6. **Verify fix** in production

**Time to hotfix**: 15-30 minutes (depending on urgency)

## Deployment Checklist

**Before merging to main**:

- [ ] All CI checks passing
- [ ] `pnpm verify` passes locally
- [ ] Database migrations run in production (if any)
- [ ] Preview deployment tested
- [ ] PR approved by at least one reviewer
- [ ] No known security vulnerabilities

**After deployment**:

- [ ] Production URL loads
- [ ] Sign in works
- [ ] Critical features tested
- [ ] No errors in Vercel logs
- [ ] Monitor for first hour

## Troubleshooting Deployments

### Build Fails on Vercel

**Symptoms**: Vercel build fails, no deployment created.

**Solutions**:
1. Check build logs for specific error
2. Run `pnpm build` locally to reproduce
3. Fix TypeScript errors, missing dependencies, etc.
4. Push fix and Vercel will retry

### Deployment Succeeds but App is Broken

**Symptoms**: Deployment shows success, but app returns errors.

**Solutions**:
1. Check Vercel Function Logs for runtime errors
2. Verify environment variables are set
3. Check if database migration is needed
4. Rollback to previous deployment
5. Fix issue and redeploy

### Migration Fails in Production

**Symptoms**: Migration command errors, database in inconsistent state.

**Solutions**:
1. Check migration syntax
2. Verify using primary (non-pooler) connection
3. Write corrective migration
4. See [Incident Response](./INCIDENTS.md) for details

## Related Documentation

- [Back to Index](../INDEX.md)
- [Incidents](./INCIDENTS.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Supabase Setup](../setup/SUPABASE.md)

## Relevant Code

- `/package.json` - Build scripts
- `/vercel.json` - Vercel configuration (if exists)
- `/.github/workflows/` - CI configuration (if exists)
- `/supabase/migrations/` - Database migrations
