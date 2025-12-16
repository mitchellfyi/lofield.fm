# Architecture Decisions

**Purpose**: Summary and index of Architecture Decision Records (ADRs)  
**Audience**: Developers and technical stakeholders  
**Last updated**: 2025-12-15

## Overview

This document summarizes major architecture decisions for Lofield Studio. Full ADRs are in the `/docs/adr/` directory.

## Key Decisions

### Security & Data Isolation

**Decision**: Use Supabase RLS and Vault for security-first architecture  
**Status**: Adopted  
**Details**: [ADR 0001 - Supabase RLS and Vault](../adr/0001-supabase-rls-and-vault.md)

**Why**:

- RLS enforces user data isolation at the database layer (defense in depth)
- Vault provides PostgreSQL-native encrypted storage for API keys
- Service role key usage is minimized and isolated to server-side code

**Trade-offs**:

- ✅ Strong security guarantees
- ✅ No risk of leaking user data across users
- ❌ Slightly more complex queries (RLS overhead)
- ❌ Requires careful policy design

### Usage Tracking & Cost Model

**Decision**: Track every provider API call with attribution  
**Status**: Adopted  
**Details**: [ADR 0002 - Usage Events and Cost Model](../adr/0002-usage-events-and-cost-model.md)

**Why**:

- Users need transparency into their API usage and costs
- Attribution to chats/tracks enables debugging and analytics
- `action_group_id` correlates multi-step operations

**Trade-offs**:

- ✅ Full visibility into provider API usage
- ✅ Cost estimates help users budget
- ❌ Additional DB writes for every API call
- ❌ Cost estimates may not match exact provider bills

### Deployment Strategy

**Decision**: Deploy to Vercel with serverless functions  
**Status**: Adopted  
**Details**: [ADR 0003 - Vercel Deploy Strategy](../adr/0003-vercel-deploy-strategy.md)

**Why**:

- Automatic scaling (no server management)
- Built-in CI/CD (merge to main → deploy)
- Edge network distribution (low latency)
- Preview deploys for every PR

**Trade-offs**:

- ✅ Zero-config scaling
- ✅ Simple deployment workflow
- ❌ Cold start latency for serverless functions
- ❌ Limited control over infrastructure

### Documentation Architecture

**Decision**: Agent-first documentation with concrete examples  
**Status**: Adopted  
**Details**: [ADR 0001 - Documentation Architecture](../adr/0001-documentation-architecture.md)

**Why**:

- AI agents are first-class contributors to this codebase
- Documentation must be machine-readable and unambiguous
- Every doc needs concrete examples and real file paths

**Trade-offs**:

- ✅ Agents can navigate and contribute effectively
- ✅ Reduces ambiguity for humans too
- ❌ Requires discipline to keep docs in sync with code

## Summary Table

| Topic              | Decision                                   | Status  | ADR                                                        |
| ------------------ | ------------------------------------------ | ------- | ---------------------------------------------------------- |
| Database Security  | RLS + Vault                                | Adopted | [0001](../adr/0001-supabase-rls-and-vault.md)              |
| Usage Tracking     | Event-based with attribution               | Adopted | [0002](../adr/0002-usage-events-and-cost-model.md)         |
| Deployment         | Vercel serverless                          | Adopted | [0003](../adr/0003-vercel-deploy-strategy.md)              |
| Documentation      | Agent-first with concrete examples         | Adopted | [0001](../adr/0001-documentation-architecture.md) (exists) |
| Provider Keys      | Per-user keys in Vault (not app-level)     | Adopted | Implicit in 0001                                           |
| Database           | Supabase (managed Postgres)                | Adopted | Implicit in 0001                                           |
| Frontend Framework | Next.js 15 App Router                      | Adopted | Implicit in 0003                                           |
| AI Providers       | OpenAI (refine) + ElevenLabs (generate)    | Adopted | No formal ADR yet                                          |
| State Management   | React Server Components (no Redux/Zustand) | Adopted | No formal ADR yet                                          |

## Decision-Making Process

### When to Write an ADR

Write an ADR when:

- Making a significant architectural choice (framework, database, deployment)
- Changing a core security or cost model
- Introducing a new external dependency (provider, library)
- Reversing a previous decision

### ADR Template

See [ADR 0000 - Template](../adr/0000-template.md) for the structure.

Key sections:

1. **Status**: Proposed, Accepted, Deprecated, Superseded
2. **Context**: What problem are we solving?
3. **Decision**: What did we decide?
4. **Consequences**: What are the trade-offs?
5. **Alternatives Considered**: What else did we evaluate?

## Future Decisions

Topics that may warrant ADRs:

- **Caching strategy**: Redis/Upstash for frequently-accessed data (subscription info, pricing)
- **File cleanup policy**: Archive or delete old tracks to manage storage costs
- **Real-time features**: WebSockets or Server-Sent Events for live updates
- **Multi-region deployment**: CDN for audio files, edge functions for API routes
- **Provider abstraction**: Pluggable provider architecture for future AI services

## Related Documentation

- [Back to Index](../INDEX.md)
- [System Overview](./OVERVIEW.md)
- [ADR Directory](../adr/)

## Relevant Code

- `/docs/adr/` - All Architecture Decision Records
- `/.github/copilot-instructions.md` - GitHub Copilot rules derived from ADRs
- `/.github/instructions/*.instructions.md` - Pattern-specific instructions
