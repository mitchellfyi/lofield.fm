# Documentation Index

**Purpose**: Central table of contents for all Lofield Studio documentation  
**Audience**: Both humans and AI agents  
**Last updated**: 2025-12-15

## Quick Links

- [Quick Start Guide](./setup/QUICKSTART.md) - Get up and running in 15 minutes
- [Agent Playbook](./agents/AGENT_PLAYBOOK.md) - How AI agents should work in this repo
- [Troubleshooting](./runbook/TROUBLESHOOTING.md) - Common issues and solutions

## Setup & Getting Started

- [Quick Start Guide](./setup/QUICKSTART.md) - First-time setup and your first track
- [Environment Variables](./setup/ENVIRONMENT.md) - Required and optional env vars
- [Supabase Setup](./setup/SUPABASE.md) - Database, auth, storage, and vault configuration

## Architecture & Design

- [System Overview](./architecture/OVERVIEW.md) - High-level architecture and tech stack
- [Data Flow](./architecture/DATA_FLOW.md) - Request flows and data lifecycle
- [Architecture Decision Records](./adr/) - Historical design decisions

## Security

- [Secrets Management](./security/SECRETS.md) - How API keys are stored and accessed
- [Row Level Security (RLS)](./security/RLS.md) - Database access control patterns
- [Storage Policies](./security/STORAGE.md) - File upload and access controls

## Provider Integrations

- [OpenAI Integration](./providers/OPENAI.md) - Chat completion and prompt refinement
- [ElevenLabs Integration](./providers/ELEVENLABS.md) - Audio generation and subscription tracking

## Usage & Costs

- [Usage Tracking](./usage/TRACKING.md) - How we track provider API usage
- [Cost Model](./usage/COSTS.md) - Credits, pricing, and cost attribution

## Operations & Runbook

- [Troubleshooting](./runbook/TROUBLESHOOTING.md) - Common issues and solutions
- [Common Failures](./runbook/COMMON_FAILURES.md) - Known failure modes and fixes

## Agent Guidelines

- [Agent Playbook](./agents/AGENT_PLAYBOOK.md) - Best practices for AI agents working in this codebase

## Related Documentation

- [README.md](../README.md) - Project overview and quick start
- [AGENTS.md](../AGENTS.md) - Agent operating manual
- [CLAUDE.md](../CLAUDE.md) - Claude Code context
- [GitHub Copilot Instructions](../.github/copilot-instructions.md) - Copilot-specific rules
