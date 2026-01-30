# Architecture Overview

This document describes the high-level architecture of lofield.fm, an AI-powered live coding music studio.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Studio    │  │   Explore   │  │   Settings  │              │
│  │   Editor    │  │   Browse    │  │   Profile   │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────┴────────────────┴────────────────┴──────┐              │
│  │              React Hooks / Context            │              │
│  │    (useProjects, useTracks, usePlayQueue)     │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
│  ┌──────────────────────┴────────────────────────┐              │
│  │              Audio Runtime (Strudel)          │              │
│  │         Web Audio API / Pattern Engine        │              │
│  └───────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                    API Routes (Next.js)
                              │
┌─────────────────────────────┴─────────────────────────────────┐
│                         Backend                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Supabase   │  │   OpenAI    │  │  Anthropic  │            │
│  │  Auth + DB  │  │   API       │  │   API       │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└───────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Strudel** - Live coding audio engine (TidalCycles port)

### Backend

- **Supabase** - Authentication, PostgreSQL database, Row Level Security
- **OpenAI/Anthropic APIs** - AI chat assistance

### Infrastructure

- **Vercel** - Hosting and deployment
- **GitHub Actions** - CI/CD pipeline

## Directory Structure

```
lofield.fm/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   ├── auth/              # Authentication pages
│   ├── explore/           # Public track browser
│   ├── favorites/         # User's liked tracks
│   ├── settings/          # User settings
│   ├── studio/            # Main editor
│   └── user/[username]/   # Public user profiles
│
├── components/            # React components
│   ├── explore/          # Explore page components
│   ├── settings/         # Settings components
│   ├── studio/           # Studio editor components
│   ├── ui/               # Shared UI components
│   └── usage/            # Usage tracking components
│
├── lib/                   # Shared utilities
│   ├── audio/            # Strudel integration
│   ├── hooks/            # Custom React hooks
│   ├── supabase/         # Supabase client setup
│   ├── types/            # TypeScript type definitions
│   └── usage/            # Usage tracking logic
│
├── supabase/             # Database migrations
│   └── migrations/       # SQL migration files
│
└── docs/                 # Documentation
```

## Key Components

### Audio Runtime (`lib/audio/`)

The audio engine wraps Strudel (a JavaScript port of TidalCycles):

- **runtime.ts** - Singleton pattern for audio playback state
- **useVisualization.ts** - React hooks for transport state
- **codeTransformer.ts** - Code preprocessing and validation
- **llmContract.ts** - Code extraction from AI responses

### Authentication Flow

```
User → Sign In Page → Supabase Auth → Session Cookie → Middleware
                                                           │
                                                     Route Protection
                                                           │
                                              Protected Page / API
```

1. User signs in via Supabase Auth (email/password or OAuth)
2. Session stored in HTTP-only cookie
3. Middleware validates session on each request
4. API routes verify authentication via Supabase client

### Data Model

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   profiles  │────<│   projects  │────<│   tracks    │
│             │     │             │     │             │
│  username   │     │  name       │     │  name       │
│  bio        │     │  user_id    │     │  code       │
│  avatar_url │     │             │     │  privacy    │
└─────────────┘     └─────────────┘     │  genre      │
                                        │  bpm        │
                                        │  tags       │
                                        └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────┐
                    │                          │                  │
              ┌─────┴─────┐            ┌───────┴───────┐   ┌──────┴──────┐
              │ revisions │            │  track_likes  │   │ recordings  │
              │           │            │               │   │             │
              │  code     │            │  user_id      │   │  events     │
              │  message  │            │  track_id     │   │  duration   │
              └───────────┘            └───────────────┘   └─────────────┘
```

### Key Patterns

#### Optimistic Updates

The like button uses optimistic updates for instant feedback:

1. Update UI immediately
2. Send API request
3. Rollback on error

#### Server-Sent Events (SSE)

AI chat responses stream via SSE:

1. Client opens SSE connection
2. Server streams tokens as they arrive
3. Client updates UI incrementally

#### Row Level Security (RLS)

Supabase RLS policies enforce:

- Users can only access their own projects/tracks
- Public tracks are viewable by anyone
- Profiles with usernames are publicly viewable

## Security

### Authentication

- Supabase Auth with secure session cookies
- OAuth providers (GitHub, Google)
- Email verification

### Authorization

- RLS policies at database level
- API route authentication checks
- Admin-only endpoints

### Input Validation

- Zod schemas for request validation
- Code validation before execution
- Rate limiting on API endpoints

### Headers

Security headers added via middleware:

- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

## Performance

### Caching

- Filter options cached for 5 minutes
- Featured tracks cached with revalidation
- Static pages pre-rendered at build time

### Rate Limiting

- Play count rate limited (1 per track per hour per user)
- AI chat rate limited (20 requests/minute)
- Token usage limits per user tier

### Optimization

- Code splitting via Next.js dynamic imports
- Image optimization via next/image
- Database indexes on frequently queried columns

## Error Handling

### Client-Side

- React Error Boundaries for component failures
- Toast notifications for user-facing errors
- Retry logic for transient failures

### Server-Side

- Consistent error response format
- Detailed logging in development
- Graceful degradation (cached data on failure)

## Testing

- **Unit Tests** - Vitest for business logic
- **E2E Tests** - Playwright for user flows
- **Type Checking** - TypeScript strict mode
- **Linting** - ESLint with React hooks rules

## Deployment

```
git push → GitHub Actions → Tests → Build → Vercel Deploy
```

1. Push to main branch
2. GitHub Actions runs tests
3. If tests pass, Vercel builds
4. Vercel deploys to production
