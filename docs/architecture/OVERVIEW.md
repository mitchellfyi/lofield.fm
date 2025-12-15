# System Overview

**Purpose**: High-level architecture and technology stack for Lofield Studio  
**Audience**: Developers and technical stakeholders  
**Last updated**: 2025-12-15

## What Lofield Studio Does

Lofield Studio is a web app for creating lo-fi music tracks through an AI-powered conversational interface:

1. Users sign in with Google or GitHub
2. They save their OpenAI and ElevenLabs API keys (encrypted, server-side)
3. They chat with an AI to refine track prompts
4. The system generates audio files and stores them securely
5. Users can view usage statistics and costs

## Technology Stack

### Frontend

- **Next.js 15**: App Router with Server Components and Server Actions
- **React 19**: UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Styling and design system
- **Vercel AI SDK**: Streaming chat UI (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`)

### Backend

- **Next.js API Routes**: RESTful endpoints and webhooks
- **Server Actions**: Form submissions and mutations
- **Vercel**: Serverless deployment platform

### Database & Storage

- **Supabase Postgres**: Primary database with Row Level Security (RLS)
- **Supabase Auth**: OAuth (Google, GitHub)
- **Supabase Storage**: Private bucket for audio files
- **Supabase Vault**: Encrypted per-user API key storage

### AI/ML Providers

- **OpenAI**: GPT-4o for chat completions and prompt refinement
- **ElevenLabs**: Text-to-speech and audio generation

## Architecture Principles

### Security First

- **No secrets in browser**: All API keys stored server-side in Vault
- **Row Level Security**: Database enforces user isolation at the data layer
- **Principle of least privilege**: Service role key used only where necessary
- **Signed URLs**: Storage files accessed via time-limited signed URLs

### Cost Transparency

- **Usage tracking**: Every provider API call logged to `usage_events`
- **Attribution**: Events linked to chat_id, track_id, user_id
- **Daily rollups**: Aggregated usage for reporting and cost analysis

### Serverless-Friendly

- **Stateless**: No session state on servers
- **Connection pooling**: Supabase handles database connections
- **Edge-ready**: Can run on Vercel Edge Runtime where appropriate

### Developer Experience

- **Type safety**: TypeScript everywhere, Zod validation at boundaries
- **Local development**: Works with local or hosted Supabase
- **Fast feedback**: `pnpm verify` runs all checks in <30 seconds
- **Clear patterns**: Consistent file structure and naming conventions

## System Components

### User-Facing Pages

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Main chat interface | Yes |
| `/settings` | API key management | Yes |
| `/usage` | Usage stats and costs | Yes |
| `/auth/callback` | OAuth redirect handler | No |

### API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Stream OpenAI chat responses |
| `/api/settings/secrets` | POST | Store provider API keys in Vault |
| `/api/usage/elevenlabs/subscription` | GET | Fetch ElevenLabs subscription info |
| `/api/usage/elevenlabs/stats` | GET | Fetch ElevenLabs daily usage stats |

### Server Actions

Server actions handle form submissions and mutations:
- Profile updates
- Chat management
- Track generation

### Background Jobs

Currently none. Future considerations:
- Usage rollup aggregation (could be cron-triggered)
- Cleanup of old tracks/chats

## Data Model

### Core Entities

```
User (Supabase Auth)
  ├─ Profile (profiles table)
  ├─ Settings (user_settings table)
  ├─ Secrets (Vault: openai, elevenlabs)
  ├─ Chats
  │   └─ Messages
  └─ Tracks
      └─ Audio File (Storage)
```

### Usage Tracking

```
usage_events
  ├─ user_id
  ├─ chat_id / track_id
  ├─ action_type (refine, generate, etc.)
  ├─ provider (openai, elevenlabs)
  ├─ model
  ├─ tokens/characters/cost
  └─ timestamp

usage_daily_rollups
  ├─ user_id
  ├─ date
  ├─ provider
  ├─ total_cost
  └─ event_count
```

See [Data Flow](./DATA_FLOW.md) for request/response flows.

## Deployment Architecture

### Vercel (Production)

```
GitHub (main branch)
  └─> Vercel Build
       ├─ Next.js Build
       ├─ Serverless Functions (API routes)
       └─> Deploy to Edge Network
```

### Supabase (Database/Storage)

```
Supabase Cloud
  ├─ Postgres (primary + pooler)
  ├─ Auth (OAuth providers)
  ├─ Storage (tracks bucket)
  └─ Vault (encrypted secrets)
```

### CI/CD Pipeline

1. **PR opened**: GitHub Actions runs `pnpm verify` + build
2. **Vercel preview**: Automatic preview deployment for each PR
3. **Merge to main**: Automatic production deployment
4. **Migrations**: Manual, run via `pnpm db:migrate` before deploy

## Key Design Decisions

See [Architecture Decision Records](../adr/) for detailed rationale:

- **ADR 0001**: Documentation architecture (this spec)
- Future: Provider abstraction, usage tracking model, etc.

## Scalability Considerations

### Current Scale

- **Expected users**: <1000 concurrent
- **Database**: Supabase free/pro tier (sufficient for <100k rows)
- **Storage**: Supabase storage (1GB free, pay-as-you-grow)
- **Vercel**: Serverless auto-scales

### Bottlenecks

1. **Supabase connection limits**: Mitigated by pooling and Supabase's built-in handling
2. **Provider API rate limits**: Per-user keys means limits are per-user, not app-wide
3. **Storage costs**: Audio files accumulate; consider cleanup policy for old tracks

### Future Optimizations

- **Caching**: Add Redis/Upstash for frequently-accessed data (subscription info, pricing)
- **CDN**: Serve static audio files via CDN if files become shareable
- **Database indexes**: Add indexes if query patterns show bottlenecks

## Related Documentation

- [Back to Index](../INDEX.md)
- [Data Flow](./DATA_FLOW.md)
- [Secrets Management](../security/SECRETS.md)
- [Usage Tracking](../usage/TRACKING.md)
