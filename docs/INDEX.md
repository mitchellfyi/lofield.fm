# Documentation Index

**Purpose**: Central table of contents for all Lofield Studio documentation  
**Audience**: Both humans and AI agents  
**Last updated**: 2025-12-15

## Start Here

- [Quick Start Guide](./setup/QUICKSTART.md) - Get up and running in 15 minutes
- [Agent Playbook](./agents/AGENT_PLAYBOOK.md) - How AI agents should work in this repo
- [Troubleshooting](./runbook/TROUBLESHOOTING.md) - Common issues and solutions
- [Security Model](./security/SECURITY_MODEL.md) - Security architecture overview
- [System Overview](./architecture/OVERVIEW.md) - High-level architecture

## Common Tasks

### Add a Table

1. Create migration: `/supabase/migrations/NNNN_add_table.sql`
2. Enable RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
3. Add policies for SELECT, INSERT, UPDATE, DELETE
4. Add `updated_at` trigger (if applicable)
5. Run locally: `pnpm db:migrate`
6. Test RLS: `SET LOCAL ROLE authenticated;`
7. Deploy: Run migration in production before code deploy

**See**: [Migration Change](./agents/CHANGE_TYPES.md#migration-change)

### Change RLS Policy

1. Create migration to DROP and recreate policy
2. Test locally with `SET LOCAL ROLE authenticated;`
3. Run in production: `pnpm db:migrate`
4. Verify no cross-user access

**See**: [RLS Guide](./security/RLS.md), [Incidents](./runbook/INCIDENTS.md#what-to-do-if-rls-breaks)

### Add Provider API Call

1. Fetch user's API key from Vault (server-side only)
2. Call provider API (OpenAI, ElevenLabs)
3. Extract usage metadata (tokens, characters)
4. Calculate cost from `provider_pricing` table
5. Log to `usage_events` table
6. Handle errors (401, 429, etc.)
7. Never log API keys or headers

**See**: [Provider Change](./agents/CHANGE_TYPES.md#provider-change), [Provider Flows](./architecture/FLOWS.md)

### Add UI Panel

1. Decide: Server Component or Client Component
2. Create component file in `/app` or `/components`
3. Add `'use client'` if interactive
4. Fetch data (Server: async/await, Client: hooks)
5. Test locally: `pnpm dev`
6. Run verification: `pnpm verify`

**See**: [UI Change](./agents/CHANGE_TYPES.md#ui-change)

### Deploy to Production

1. **If migration**: Run `pnpm db:migrate` in production first
2. Create PR and get approval
3. Merge to `main` branch
4. Vercel auto-deploys (< 2 minutes)
5. Verify: Test critical paths in production
6. Monitor: Check Vercel logs for errors

**See**: [Releases](./runbook/RELEASES.md)

## Setup & Getting Started

- [Quick Start Guide](./setup/QUICKSTART.md) - First-time setup and your first track
- [Environment Variables](./setup/ENV_VARS.md) - Required and optional env vars
- [Supabase Setup](./setup/SUPABASE.md) - Database, auth, storage, and vault configuration

## Architecture & Design

- [System Overview](./architecture/OVERVIEW.md) - High-level architecture and tech stack
- [Data Model](./architecture/DATA_MODEL.md) - Database schema, tables, and relationships
- [Data Flow](./architecture/DATA_FLOW.md) - Request flows and data lifecycle
- [Provider Flows](./architecture/FLOWS.md) - OpenAI and ElevenLabs integration flows
- [Architecture Decisions](./architecture/DECISIONS.md) - Summary of ADRs and key decisions
- [Architecture Decision Records](./adr/) - Historical design decisions

## Security

- [Security Model](./security/SECURITY_MODEL.md) - Comprehensive security architecture
- [Secrets Management](./security/SECRETS.md) - How API keys are stored and accessed
- [Row Level Security (RLS)](./security/RLS.md) - Database access control patterns
- [Storage Policies](./security/STORAGE.md) - File upload and access controls

## Provider Integrations

- [OpenAI Integration](./providers/OPENAI.md) - Chat completion and prompt refinement
- [ElevenLabs Integration](./providers/ELEVENLABS.md) - Audio generation and subscription tracking

## Usage & Costs

- [Usage Model](./usage/USAGE_MODEL.md) - Usage tracking schema and cost calculation
- [Usage Tracking](./usage/TRACKING.md) - How we track provider API usage
- [Usage UI](./usage/USAGE_UI.md) - Documentation for the /usage page
- [Cost Model](./usage/COSTS.md) - Credits, pricing, and cost attribution
- [Pricing Management](./usage/PRICING.md) - How to update provider pricing safely

## Operations & Runbook

- [Troubleshooting](./runbook/TROUBLESHOOTING.md) - Common issues and solutions
- [Common Failures](./runbook/COMMON_FAILURES.md) - Known failure modes and fixes
- [Incidents](./runbook/INCIDENTS.md) - Incident response procedures
- [Releases](./runbook/RELEASES.md) - Release and deployment process

## Agent Guidelines

- [Agent Playbook](./agents/AGENT_PLAYBOOK.md) - Best practices for AI agents working in this codebase
- [Repo Gotchas](./agents/REPO_GOTCHAS.md) - Common mistakes to avoid
- [Change Types](./agents/CHANGE_TYPES.md) - Playbooks for different types of changes

## Architecture Decision Records (ADRs)

- [ADR Template](./adr/0000-template.md) - Template for new ADRs
- [ADR 0001: Documentation Architecture](./adr/0001-documentation-architecture.md) - This documentation system
- [ADR 0001: Supabase RLS and Vault](./adr/0001-supabase-rls-and-vault.md) - Security architecture
- [ADR 0002: Usage Events and Cost Model](./adr/0002-usage-events-and-cost-model.md) - Usage tracking design
- [ADR 0003: Vercel Deploy Strategy](./adr/0003-vercel-deploy-strategy.md) - Deployment architecture

## Related Documentation

- [README.md](../README.md) - Project overview and quick start
- [AGENTS.md](../AGENTS.md) - Agent operating manual
- [CLAUDE.md](../CLAUDE.md) - Claude Code context
- [GitHub Copilot Instructions](../.github/copilot-instructions.md) - Copilot-specific rules
