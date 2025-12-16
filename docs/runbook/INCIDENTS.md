# Incident Response

**Purpose**: Procedures for responding to security incidents and operational failures  
**Audience**: Developers and operations team  
**Last updated**: 2025-12-15

## Overview

This document outlines response procedures for critical incidents in Lofield Studio. Follow these procedures to minimize impact and restore service quickly.

## Severity Levels

| Level  | Description                           | Response Time | Examples                                |
| ------ | ------------------------------------- | ------------- | --------------------------------------- |
| **P0** | Complete service outage               | Immediate     | Database down, Vercel deployment failed |
| **P1** | Critical security breach or data leak | < 15 minutes  | API key exposed, RLS bypass             |
| **P2** | Degraded service or feature broken    | < 1 hour      | Provider API failing, UI broken         |
| **P3** | Minor issue, workaround available     | < 4 hours     | Slow queries, UI glitch                 |

## Incident Response Procedures

### What to Do If Secrets Leak

**Severity**: P1 (Critical)

#### Symptoms

- API key, service role key, or database password exposed in:
  - Git commit history
  - Logs
  - Public error messages
  - Third-party service

#### Immediate Actions (< 15 minutes)

1. **Revoke the compromised secret immediately**:
   - **OpenAI/ElevenLabs user key**: User can regenerate in provider dashboard
   - **Service role key**: Generate new key in Supabase Dashboard → Settings → API
   - **Database password**: Reset in Supabase Dashboard → Database → Connection pooling

2. **Remove secret from exposure point**:
   - **Git commit**: Use `git filter-branch` or BFG Repo-Cleaner (see below)
   - **Logs**: Purge logs in Vercel/Supabase dashboards
   - **Public error**: Take app offline temporarily if needed

3. **Update secret in secure locations**:
   - **Vercel**: Update environment variables in Vercel Dashboard
   - **Local dev**: Update `.env.local` (never commit)
   - **Vault**: Update user secrets via admin client

4. **Redeploy application**:
   ```bash
   # Force redeploy to pick up new secrets
   git commit --allow-empty -m "Force redeploy with new secrets"
   git push origin main
   ```

#### Git History Cleanup

**If secret was committed to git**:

```bash
# Option 1: BFG Repo-Cleaner (recommended)
# Download from https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .env.local --no-blob-protection
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Option 2: git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/secret/file" \
  --prune-empty --tag-name-filter cat -- --all

git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (coordinate with team!)
git push --force --all
```

**⚠️ Warning**: Force pushing rewrites history. Coordinate with all team members.

#### Post-Incident (< 1 day)

1. **Audit recent activity**:
   - Check provider dashboards for unauthorized usage
   - Review database logs for suspicious queries
   - Check Vercel logs for unusual traffic

2. **Document incident**:
   - What was leaked?
   - How long was it exposed?
   - What actions were taken?
   - Was any unauthorized usage detected?

3. **Prevent recurrence**:
   - Add pre-commit hooks to prevent secret commits
   - Review logging practices
   - Update documentation with lessons learned

### What to Do If RLS Breaks

**Severity**: P1 (Critical - potential data leak)

#### Symptoms

- Users can see other users' data
- Queries return rows that should be blocked by RLS
- RLS policy error in logs

#### Immediate Actions (< 15 minutes)

1. **Verify the issue**:

   ```sql
   -- In Supabase SQL Editor
   SET LOCAL ROLE authenticated;
   SET LOCAL request.jwt.claims.sub TO 'user-uuid-1';
   SELECT * FROM chats; -- Should only return user-uuid-1's chats
   RESET ROLE;

   SET LOCAL ROLE authenticated;
   SET LOCAL request.jwt.claims.sub TO 'user-uuid-2';
   SELECT * FROM chats; -- Should only return user-uuid-2's chats
   RESET ROLE;
   ```

2. **If cross-user access confirmed, take immediate action**:
   - **Option A**: Disable affected feature in app (comment out UI, return 503)
   - **Option B**: If severe, enable maintenance mode (Vercel)

3. **Identify the broken policy**:

   ```sql
   -- List policies for affected table
   SELECT * FROM pg_policies WHERE tablename = 'chats';
   ```

4. **Write fix migration**:

   ```sql
   -- Example: Fix broken chat policy
   DROP POLICY IF EXISTS "broken_policy" ON chats;

   CREATE POLICY "users_view_own_chats"
     ON chats FOR SELECT
     USING (auth.uid() = user_id);
   ```

5. **Test fix locally**:

   ```bash
   pnpm db:migrate
   # Run RLS tests as shown in step 1
   ```

6. **Deploy fix**:

   ```bash
   git add supabase/migrations/NNNN_fix_rls_policy.sql
   git commit -m "Fix RLS policy for chats table"
   git push origin main

   # Run migration in production
   pnpm db:migrate
   ```

7. **Re-enable feature/app**

#### Post-Incident (< 1 day)

1. **Audit for data leakage**:

   ```sql
   -- Check if any cross-user queries succeeded (requires query logs)
   -- Contact Supabase support if query logging is enabled
   ```

2. **Notify affected users** (if data was accessed):
   - Determine scope of exposure
   - Draft notification email
   - Coordinate with legal/compliance team

3. **Add RLS tests**:
   - Write automated tests for RLS policies
   - Add to CI/CD pipeline

### What to Do If Costs Spike

**Severity**: P2 (Degraded service, potential cost impact)

#### Symptoms

- Sudden increase in provider API usage
- Users report unexpected charges
- Unusual traffic patterns in logs

#### Immediate Actions (< 1 hour)

1. **Identify the source**:

   ```sql
   -- Check recent usage events
   SELECT
     user_id,
     provider,
     COUNT(*) AS event_count,
     SUM(estimated_cost_usd) AS total_cost
   FROM usage_events
   WHERE created_at >= NOW() - INTERVAL '1 hour'
   GROUP BY user_id, provider
   ORDER BY total_cost DESC
   LIMIT 10;
   ```

2. **Determine cause**:
   - **Single user**: Runaway loop or abuse?
   - **All users**: App bug or provider outage?
   - **Specific provider**: Rate limit issue?

3. **Mitigate immediately**:
   - **If user abuse**: Temporarily revoke their API key from Vault
     ```sql
     -- Delete user's secret
     DELETE FROM vault.secrets WHERE id = (
       SELECT openai_secret_id FROM user_secrets WHERE user_id = 'abusive-user-id'
     );
     ```
   - **If app bug**: Disable affected feature or deploy fix
   - **If provider issue**: Contact provider support

4. **Add usage limits** (if not existing):

   ```typescript
   // Example: Rate limit API calls per user
   import { RateLimiter } from "@/lib/rate-limiting";

   const limiter = new RateLimiter({
     tokensPerInterval: 100,
     interval: "hour",
   });

   if (!(await limiter.check(userId))) {
     return NextResponse.json(
       { error: "Rate limit exceeded" },
       { status: 429 }
     );
   }
   ```

#### Post-Incident (< 1 day)

1. **Analyze costs**:
   - Total unexpected cost
   - Which users/chats contributed most
   - Root cause analysis

2. **Communicate with affected users**:
   - Explain what happened
   - Clarify who is responsible for costs (users pay providers directly)

3. **Implement safeguards**:
   - Per-user rate limits
   - Budget alerts
   - Usage quotas

## Database Incident Procedures

### Database Connection Issues

**Severity**: P0 (Service outage)

#### Symptoms

- "Connection refused" errors
- "Too many connections" errors
- Slow queries or timeouts

#### Actions

1. **Check Supabase status**:
   - Visit [status.supabase.com](https://status.supabase.com)
   - Check for ongoing incidents

2. **Verify connection pooling**:

   ```env
   # Ensure using pooler for serverless
   SUPABASE_DB_URL=postgresql://postgres...@aws-0-region.pooler.supabase.com:6543/postgres
   ```

3. **Check connection limits**:
   - Supabase Dashboard → Database → Connection Pooling
   - Increase pool size if needed

4. **Restart app** (if temporary issue):
   - Redeploy on Vercel
   - Connections should reset

### Migration Failure

**Severity**: P1 (Potential data inconsistency)

#### Symptoms

- Migration fails mid-execution
- Database in inconsistent state
- App errors due to missing tables/columns

#### Actions

1. **Do not rollback** (not supported):
   - PostgreSQL migrations are not transactional by default
   - Partial changes may have been applied

2. **Assess damage**:

   ```sql
   -- Check which tables exist
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';

   -- Check which migrations ran
   SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
   ```

3. **Write corrective migration**:

   ```sql
   -- Example: If migration partially created a table
   DROP TABLE IF EXISTS incomplete_table;

   -- Then recreate correctly
   CREATE TABLE complete_table (
     id UUID PRIMARY KEY,
     -- ... correct schema
   );
   ```

4. **Test locally, then deploy**:
   ```bash
   pnpm db:migrate
   # Verify schema is correct
   git add supabase/migrations/NNNN_fix_migration.sql
   git commit -m "Fix failed migration"
   git push origin main
   pnpm db:migrate # In production
   ```

## Vercel Deployment Incidents

### Build Failure

**Severity**: P2 (Prevents deployment)

#### Symptoms

- Vercel build fails with error
- No new deployment created

#### Actions

1. **Check build logs**:
   - Vercel Dashboard → Deployments → [Failed Build] → Build Logs

2. **Common causes**:
   - TypeScript errors → Run `pnpm typecheck` locally
   - Missing dependencies → Check `package.json`
   - Environment variables → Verify in Vercel settings

3. **Fix and redeploy**:

   ```bash
   # Fix issues locally
   pnpm verify

   # Commit and push
   git add .
   git commit -m "Fix build issues"
   git push origin main
   ```

### Production Outage

**Severity**: P0 (Service down)

#### Symptoms

- App returns 500 errors
- Vercel shows "Application Error"

#### Actions

1. **Check Vercel logs**:
   - Vercel Dashboard → Deployments → [Latest] → Function Logs

2. **Rollback to last working deployment**:
   - Vercel Dashboard → Deployments → [Working Deployment] → Promote to Production

3. **Investigate root cause**:
   - Review recent commits
   - Check for environmental changes (env vars, Supabase migrations)

4. **Fix and redeploy**:
   ```bash
   git revert <bad-commit>
   git push origin main
   ```

## Communication Templates

### Internal Notification

```
🚨 [P1] Incident: API Key Exposed in Git

Status: In Progress
Detected: 2025-12-15 10:30 UTC
Owner: @developer-name

Actions taken:
- [x] Key revoked in OpenAI dashboard
- [x] New key generated and updated in Vercel
- [x] Redeployed application
- [ ] Git history cleanup in progress
- [ ] Audit of provider usage underway

ETA to resolution: 1 hour

Updates will be posted here every 30 minutes.
```

### User Notification (if needed)

```
Subject: Security Notice - API Key Rotation

Dear Lofield Studio User,

We're writing to inform you of a security incident that occurred on [date].

What happened:
[Brief description of incident]

What we did:
- Immediately revoked compromised credentials
- Updated security measures
- Audited for unauthorized access

Impact to you:
[Describe any impact - usually none for most incidents]

What you should do:
- [Any required actions, or "No action required"]

We take security seriously and are implementing additional measures to prevent this in the future.

If you have questions, please reply to this email.

The Lofield Studio Team
```

## Escalation

### When to Escalate

- Data breach affecting >10 users
- Prolonged outage (>2 hours)
- Unable to resolve within severity response time
- Media attention or public discussion

### Escalation Contacts

- **Technical Lead**: [contact info]
- **Security Team**: [contact info]
- **Legal/Compliance**: [contact info]

## Post-Incident Review

After every P0/P1 incident:

1. **Document timeline** (within 24 hours)
2. **Root cause analysis** (within 3 days)
3. **Action items** to prevent recurrence
4. **Team retrospective**

**Template**: See `/docs/runbook/incident-template.md` (future)

## Related Documentation

- [Back to Index](../INDEX.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Security Model](../security/SECURITY_MODEL.md)
- [Secrets Management](../security/SECRETS.md)
- [RLS Policies](../security/RLS.md)

## Relevant Code

- `/lib/supabase/admin.ts` - Admin operations for incident response
- `/supabase/migrations/` - Database migrations
- `/.github/workflows/` - CI/CD configuration (future)
- `/scripts/` - Operational scripts (future)
