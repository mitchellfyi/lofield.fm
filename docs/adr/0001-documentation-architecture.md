# ADR 0001: Documentation Architecture

**Status**: Accepted  
**Date**: 2025-12-15  
**Deciders**: Product, Engineering  
**Related**: Spec 12A

## Context

Lofield Studio lacked a unified documentation structure. Docs were scattered across README, AGENTS.md, CLAUDE.md, and ad-hoc comments. This made it hard for:

- New developers to get started
- AI agents to find correct patterns
- Team members to maintain consistency
- Anyone to understand system architecture

### Problems with Previous State

1. **Duplication**: Setup instructions repeated in multiple files
2. **No single source of truth**: Conflicting information in different docs
3. **Poor discoverability**: No index or table of contents
4. **Inconsistent format**: Each doc had different structure
5. **No cross-linking**: Docs existed in isolation
6. **Agent confusion**: AI agents couldn't find security/RLS/usage patterns

## Decision

We will implement a **centralized documentation architecture** under `/docs` with:

### Structure

```
/docs
  ├── INDEX.md (table of contents)
  ├── setup/ (getting started, env vars, Supabase)
  ├── architecture/ (system overview, data flow)
  ├── security/ (secrets, RLS, storage)
  ├── providers/ (OpenAI, ElevenLabs)
  ├── usage/ (tracking, costs)
  ├── runbook/ (troubleshooting, common failures)
  ├── agents/ (AI agent playbook)
  └── adr/ (architecture decision records)
```

### Standard Format

Every doc must include:

- **Purpose**: 1-2 line summary
- **Audience**: Human, AI agent, or both
- **Last updated**: Date
- **Related docs**: Links to at least 2 related docs

### Cross-Linking

- README → `/docs/INDEX.md`, `/docs/setup/QUICKSTART.md`
- AGENTS.md → `/docs/agents/AGENT_PLAYBOOK.md`, `/docs/INDEX.md`
- CLAUDE.md → `/docs/INDEX.md`, `/docs/runbook/TROUBLESHOOTING.md`
- All docs → `/docs/INDEX.md`

## Alternatives Considered

### Option 1: Wiki (Rejected)

**Pros**:

- Easy to edit via web UI
- Built-in search

**Cons**:

- Not in version control
- Harder to review changes
- Separate from code
- Requires extra tool

### Option 2: Inline Comments Only (Rejected)

**Pros**:

- Docs live next to code

**Cons**:

- No high-level overview
- Hard to find specific info
- No cross-linking
- Poor for onboarding

### Option 3: External Docs Site (Rejected)

**Pros**:

- Professional appearance
- Good search/navigation

**Cons**:

- Extra maintenance overhead
- Docs drift from code
- Requires separate deployment
- Overkill for current scale

### Option 4: Markdown in `/docs` (Selected)

**Pros**:

- ✅ Version controlled
- ✅ Reviewable via PRs
- ✅ Lives with code
- ✅ Easy to edit
- ✅ Portable (works everywhere)
- ✅ No extra tools

**Cons**:

- No fancy UI (acceptable trade-off)
- Manual cross-linking (mitigated by standards)

## Consequences

### Positive

1. **Single source of truth**: `/docs/INDEX.md` is canonical
2. **Faster onboarding**: New devs can generate first track in 15 minutes
3. **Better AI agent performance**: Agents find patterns without guessing
4. **Easier maintenance**: All docs in one place, consistent format
5. **Improved quality**: PR reviews catch doc drift

### Negative

1. **Maintenance burden**: Docs must be kept up-to-date
2. **Initial effort**: Creating all docs upfront (one-time cost)
3. **Manual linking**: Need to maintain cross-links (mitigated by conventions)

### Neutral

1. **Documentation as code**: Treat docs like code (review, test, deploy)
2. **Ownership**: Docs owned by same team as code

## Implementation

### Phase 1: Create Structure (This ADR)

- ✅ Create `/docs` directory structure
- ✅ Create `INDEX.md` with TOC
- ✅ Create setup docs (QUICKSTART, ENVIRONMENT, SUPABASE)
- ✅ Create architecture docs (OVERVIEW, DATA_FLOW)
- ✅ Create security docs (SECRETS, RLS, STORAGE)
- ✅ Create provider docs (OPENAI, ELEVENLABS)
- ✅ Create usage docs (TRACKING, COSTS)
- ✅ Create runbook docs (TROUBLESHOOTING, COMMON_FAILURES)
- ✅ Create agent docs (AGENT_PLAYBOOK)
- ✅ Create ADR template and ADR 0001
- ✅ Update README, AGENTS.md, CLAUDE.md with links

### Phase 2: Validation (Next)

- [ ] Test with new developer (15-minute setup goal)
- [ ] Test with AI agent (verify pattern discovery)
- [ ] Get feedback and iterate

### Phase 3: Maintenance (Ongoing)

- [ ] Update docs when code changes
- [ ] Add new ADRs for significant decisions
- [ ] Review docs quarterly for accuracy

## Metrics

### Success Criteria

1. **New dev onboarding**: Can set up and generate first track in <15 minutes using docs only
2. **Agent accuracy**: AI agents find correct patterns for secrets, RLS, usage tracking
3. **Doc coverage**: Every doc in `INDEX.md` exists and has required metadata
4. **Cross-linking**: Every doc links to at least 2 related docs

### Measurements

- Time to first track (new developer)
- Agent error rate (incorrect assumptions about patterns)
- Doc completeness (% of docs with required metadata)
- Link coverage (% of docs with working cross-links)

## Related Documentation

- [Back to Index](../INDEX.md)
- [Documentation Index](../INDEX.md)
- [Quick Start Guide](../setup/QUICKSTART.md)
- [Agent Playbook](../agents/AGENT_PLAYBOOK.md)
