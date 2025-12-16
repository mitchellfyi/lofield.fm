# Data Model

**Purpose**: Comprehensive database schema documentation for Lofield Studio  
**Audience**: Developers  
**Last updated**: 2025-12-15

## Overview

Lofield Studio uses PostgreSQL (Supabase) with Row Level Security (RLS) to enforce user data isolation. The schema supports:

- User authentication and profiles
- Conversational chat for prompt refinement
- Track generation and storage
- Provider API usage tracking and cost attribution
- Per-user API key storage (Vault)

## Entity Relationship Diagram (Text)

```
auth.users (Supabase Auth)
  ├── profiles (1:1)
  ├── user_settings (1:1)
  ├── user_secrets (1:1) → vault.secrets (many:1)
  ├── chats (1:many)
  │   ├── messages (1:many)
  │   └── tracks (1:many)
  ├── tracks (1:many)
  ├── usage_events (1:many)
  └── usage_daily_rollups (1:many)

provider_pricing (reference data, no user_id)
```

## Core Tables

### auth.users

**Managed by Supabase Auth**. Contains user authentication data.

| Column       | Type      | Description           |
| ------------ | --------- | --------------------- |
| `id`         | UUID      | Primary key           |
| `email`      | TEXT      | User email            |
| `created_at` | TIMESTAMP | Account creation time |

**Location**: Managed by Supabase, not in migrations  
**RLS**: Managed by Supabase Auth

### profiles

**Purpose**: User profile data and metadata.

| Column         | Type      | Description                    |
| -------------- | --------- | ------------------------------ |
| `user_id`      | UUID      | FK to auth.users, primary key  |
| `display_name` | TEXT      | User's display name (optional) |
| `avatar_url`   | TEXT      | Profile picture URL (optional) |
| `created_at`   | TIMESTAMP | Profile creation time          |
| `updated_at`   | TIMESTAMP | Last update time               |

**Location**: `/supabase/migrations/0001_init.sql`  
**RLS**: Enabled, users can only access their own profile  
**Why it exists**: Separates mutable profile data from immutable auth data

### user_settings

**Purpose**: Per-user application settings and preferences.

| Column             | Type      | Description                   |
| ------------------ | --------- | ----------------------------- |
| `user_id`          | UUID      | FK to auth.users, primary key |
| `default_voice_id` | TEXT      | ElevenLabs voice preference   |
| `created_at`       | TIMESTAMP | Settings creation time        |
| `updated_at`       | TIMESTAMP | Last update time              |

**Location**: `/supabase/migrations/0001_init.sql`  
**RLS**: Enabled, users can only access their own settings  
**Why it exists**: Configurable preferences for track generation

### user_secrets

**Purpose**: Maps users to their encrypted API keys in Vault.

| Column                 | Type      | Description                    |
| ---------------------- | --------- | ------------------------------ |
| `user_id`              | UUID      | FK to auth.users, primary key  |
| `openai_secret_id`     | UUID      | FK to vault.secrets (optional) |
| `elevenlabs_secret_id` | UUID      | FK to vault.secrets (optional) |
| `created_at`           | TIMESTAMP | Record creation time           |
| `updated_at`           | TIMESTAMP | Last update time               |

**Location**: `/supabase/migrations/0001_init.sql`  
**RLS**: Enabled, users can only access their own secret references  
**Why it exists**: Links users to encrypted secrets without exposing the secrets themselves

### vault.secrets

**Purpose**: Encrypted storage for API keys (managed by `supabase_vault` extension).

| Column       | Type      | Description                       |
| ------------ | --------- | --------------------------------- |
| `id`         | UUID      | Primary key                       |
| `name`       | TEXT      | Secret name (unused in our model) |
| `secret`     | TEXT      | Encrypted secret value            |
| `created_at` | TIMESTAMP | Creation time                     |
| `updated_at` | TIMESTAMP | Last update time                  |

**Location**: Managed by Vault extension, helpers in `/supabase/migrations/0004_vault_helpers.sql`  
**RLS**: Not applicable (service role only)  
**Why it exists**: PostgreSQL-native encrypted storage for secrets

## Chat and Messages

### chats

**Purpose**: Conversation threads for prompt refinement.

| Column       | Type      | Description           |
| ------------ | --------- | --------------------- |
| `id`         | UUID      | Primary key           |
| `user_id`    | UUID      | FK to auth.users      |
| `title`      | TEXT      | Chat title (optional) |
| `created_at` | TIMESTAMP | Chat creation time    |
| `updated_at` | TIMESTAMP | Last message time     |

**Location**: `/supabase/migrations/0001_init.sql`  
**RLS**: Enabled, users can only access their own chats  
**Why it exists**: Groups related messages in a conversation

### messages

**Purpose**: Individual chat messages (user and assistant).

| Column       | Type      | Description               |
| ------------ | --------- | ------------------------- |
| `id`         | UUID      | Primary key               |
| `chat_id`    | UUID      | FK to chats               |
| `role`       | TEXT      | `'user'` or `'assistant'` |
| `content`    | TEXT      | Message text              |
| `created_at` | TIMESTAMP | Message creation time     |

**Location**: `/supabase/migrations/0001_init.sql`  
**RLS**: Enabled, users can only access messages in their chats (indirect via chat_id)  
**Why it exists**: Stores conversation history for context and display

## Tracks

### tracks

**Purpose**: Generated audio tracks with metadata.

| Column        | Type      | Description                        |
| ------------- | --------- | ---------------------------------- |
| `id`          | UUID      | Primary key                        |
| `user_id`     | UUID      | FK to auth.users                   |
| `chat_id`     | UUID      | FK to chats (optional)             |
| `prompt`      | TEXT      | Text used to generate track        |
| `model`       | TEXT      | ElevenLabs model name              |
| `voice_id`    | TEXT      | ElevenLabs voice ID                |
| `file_path`   | TEXT      | Storage path: `{user_id}/{id}.mp3` |
| `duration_ms` | INTEGER   | Track duration in milliseconds     |
| `created_at`  | TIMESTAMP | Track creation time                |

**Location**: `/supabase/migrations/0001_init.sql`  
**RLS**: Enabled, users can only access their own tracks  
**Why it exists**: Metadata for generated audio files; links to Storage

## Usage Tracking

### usage_events

**Purpose**: Logs every provider API call with attribution and cost.

| Column               | Type      | Description                            |
| -------------------- | --------- | -------------------------------------- |
| `id`                 | UUID      | Primary key                            |
| `user_id`            | UUID      | FK to auth.users                       |
| `chat_id`            | UUID      | FK to chats (optional)                 |
| `track_id`           | UUID      | FK to tracks (optional)                |
| `provider`           | TEXT      | `'openai'` or `'elevenlabs'`           |
| `model`              | TEXT      | Model name (e.g., `'gpt-4o'`)          |
| `action_type`        | TEXT      | `'refine'`, `'generate'`, etc.         |
| `action_group_id`    | UUID      | Groups related actions (optional)      |
| `tokens`             | INTEGER   | Token count (OpenAI, optional)         |
| `characters`         | INTEGER   | Character count (ElevenLabs, optional) |
| `estimated_cost_usd` | NUMERIC   | Estimated cost in USD                  |
| `created_at`         | TIMESTAMP | Event timestamp                        |

**Location**: `/supabase/migrations/0005_usage_events.sql`  
**RLS**: Enabled, users can only access their own usage events  
**Why it exists**: Provides transparency, attribution, and debugging for provider API calls

**Key fields explained**:

- `action_type`: Distinguishes between refine (OpenAI) and generate (ElevenLabs) calls
- `action_group_id`: Correlates multi-step operations (e.g., refine then generate)
- `tokens` vs `characters`: Different usage units for different providers

### usage_daily_rollups

**Purpose**: Pre-aggregated daily usage summaries for faster queries.

| Column           | Type      | Description                  |
| ---------------- | --------- | ---------------------------- |
| `id`             | UUID      | Primary key                  |
| `user_id`        | UUID      | FK to auth.users             |
| `date`           | DATE      | Date (UTC)                   |
| `provider`       | TEXT      | `'openai'` or `'elevenlabs'` |
| `total_cost_usd` | NUMERIC   | Sum of costs for the day     |
| `event_count`    | INTEGER   | Number of events             |
| `created_at`     | TIMESTAMP | Rollup creation time         |
| `updated_at`     | TIMESTAMP | Last update time             |

**Location**: `/supabase/migrations/0008_usage_daily_rollups.sql`  
**RLS**: Enabled, users can only access their own rollups  
**Why it exists**: Speeds up historical usage queries by pre-aggregating daily totals

**Note**: Currently not populated automatically. Future: cron job to aggregate.

### provider_pricing

**Purpose**: Reference table for provider pricing (used to calculate costs).

| Column               | Type      | Description                                  |
| -------------------- | --------- | -------------------------------------------- |
| `id`                 | UUID      | Primary key                                  |
| `provider`           | TEXT      | `'openai'` or `'elevenlabs'`                 |
| `model`              | TEXT      | Model name                                   |
| `input_cost_per_1m`  | NUMERIC   | OpenAI: cost per 1M input tokens (optional)  |
| `output_cost_per_1m` | NUMERIC   | OpenAI: cost per 1M output tokens (optional) |
| `cost_per_character` | NUMERIC   | ElevenLabs: cost per character (optional)    |
| `effective_date`     | DATE      | When pricing took effect                     |
| `created_at`         | TIMESTAMP | Row creation time                            |

**Location**: `/supabase/migrations/0007_provider_pricing.sql`  
**RLS**: Public read-only (no user_id)  
**Why it exists**: Centralized pricing data for cost calculations

**Example rows**:

```sql
-- OpenAI GPT-4o
INSERT INTO provider_pricing (provider, model, input_cost_per_1m, output_cost_per_1m, effective_date)
VALUES ('openai', 'gpt-4o', 2.50, 10.00, '2024-01-01');

-- ElevenLabs Multilingual v2
INSERT INTO provider_pricing (provider, model, cost_per_character, effective_date)
VALUES ('elevenlabs', 'eleven_multilingual_v2', 0.00022, '2024-01-01');
```

## Storage Buckets

### tracks (Supabase Storage)

**Purpose**: Stores generated audio files.

**Path structure**: `tracks/{user_id}/{track_id}.mp3`

**Location**: Created in `/supabase/migrations/0003_storage.sql`  
**RLS**: Storage policies enforce user isolation (users can only access files in their own folder)

**Example file path**: `tracks/a1b2c3d4-e5f6-7890-abcd-ef1234567890/track-uuid.mp3`

## Relationships and Foreign Keys

### One-to-One

- `auth.users` ↔ `profiles` (user_id)
- `auth.users` ↔ `user_settings` (user_id)
- `auth.users` ↔ `user_secrets` (user_id)

### One-to-Many

- `auth.users` → `chats` (user_id)
- `chats` → `messages` (chat_id)
- `chats` → `tracks` (chat_id, optional)
- `auth.users` → `tracks` (user_id)
- `auth.users` → `usage_events` (user_id)
- `auth.users` → `usage_daily_rollups` (user_id)

### No Foreign Keys (Reference Data)

- `provider_pricing` (standalone reference table)

## Indexes

Key indexes for performance:

```sql
-- usage_events: query by user and date
CREATE INDEX idx_usage_events_user_created
  ON usage_events(user_id, created_at DESC);

-- usage_events: query by chat or track
CREATE INDEX idx_usage_events_chat ON usage_events(chat_id);
CREATE INDEX idx_usage_events_track ON usage_events(track_id);

-- messages: query by chat
CREATE INDEX idx_messages_chat_created
  ON messages(chat_id, created_at ASC);

-- tracks: query by user
CREATE INDEX idx_tracks_user_created
  ON tracks(user_id, created_at DESC);
```

**Location**: Defined in migration files alongside table definitions

## Triggers

### updated_at Triggers

Auto-update `updated_at` timestamp on row changes:

```sql
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
```

**Applied to**:

- `profiles`
- `user_settings`
- `user_secrets`
- `chats`
- `usage_daily_rollups`

**Location**: `/supabase/migrations/0001_init.sql`

## Data Lifecycle

### User Signup

1. User authenticates via OAuth → `auth.users` row created (Supabase)
2. Trigger creates `profiles` row
3. Trigger creates `user_settings` row (with defaults)
4. Trigger creates `user_secrets` row (initially empty)

### Adding API Keys

1. User submits keys via `/settings`
2. Server stores in `vault.secrets` via admin client
3. Server updates `user_secrets` with secret IDs

### Chat Flow

1. User starts chat → `chats` row created
2. User sends message → `messages` row created (role: `'user'`)
3. OpenAI responds → `messages` row created (role: `'assistant'`)
4. Usage logged → `usage_events` row created

### Track Generation

1. User generates track → ElevenLabs API called
2. Audio uploaded → File in `tracks/` storage bucket
3. Metadata saved → `tracks` row created
4. Usage logged → `usage_events` row created

### Daily Rollup (Future)

1. Cron job runs at midnight UTC
2. Aggregates previous day's `usage_events`
3. Inserts/updates `usage_daily_rollups`

## Related Documentation

- [Back to Index](../INDEX.md)
- [System Overview](./OVERVIEW.md)
- [Data Flow](./DATA_FLOW.md)
- [Row Level Security (RLS)](../security/RLS.md)

## Relevant Code

- `/supabase/migrations/0001_init.sql` - Core tables (profiles, chats, messages, tracks)
- `/supabase/migrations/0002_rls.sql` - RLS policies for all tables
- `/supabase/migrations/0003_storage.sql` - Storage buckets and policies
- `/supabase/migrations/0004_vault_helpers.sql` - Vault helper functions
- `/supabase/migrations/0005_usage_events.sql` - Usage events table
- `/supabase/migrations/0006_usage_counters.sql` - Usage counter helpers
- `/supabase/migrations/0007_provider_pricing.sql` - Provider pricing table
- `/supabase/migrations/0008_usage_daily_rollups.sql` - Daily rollup table
- `/lib/supabase/admin.ts` - Admin client for Vault access
- `/lib/supabase/server.ts` - Server-side client with session
- `/lib/supabase/client.ts` - Browser client
