# ADR 0002: Usage Events and Cost Model

**Status**: Accepted  
**Date**: 2025-12-15  
**Deciders**: Engineering Team  
**Related**: Providers, Usage Tracking

## Context

Lofield Studio uses a bring-your-own-API-key model where users pay OpenAI and ElevenLabs directly. We needed to:

1. **Provide transparency** - Users should see their API usage and costs
2. **Enable attribution** - Link costs to specific chats and tracks
3. **Support debugging** - Trace provider API calls for troubleshooting
4. **Calculate estimates** - Show estimated costs before users check provider dashboards

### Problem Statement

Without usage tracking:

- Users have no visibility into their costs within the app
- Can't attribute costs to specific chats or tracks
- Can't debug why a track generation failed
- No data for analytics or optimization

## Decision

We will implement an **event-based usage tracking system** that logs every provider API call with full attribution.

### Core Components

1. **`usage_events` table**: Logs every API call with:
   - User ID, chat ID, track ID (attribution)
   - Provider (OpenAI, ElevenLabs)
   - Model, action type
   - Usage units (tokens, characters)
   - Estimated cost (USD)
   - Action group ID (correlates multi-step operations)

2. **`provider_pricing` table**: Reference data for cost calculation:
   - Provider and model pricing
   - Effective date (historical pricing)

3. **`usage_daily_rollups` table**: Pre-aggregated daily summaries:
   - Speeds up historical queries
   - Future: Automated by cron job

### Implementation Pattern

```typescript
// After provider API call
await supabase.from("usage_events").insert({
  user_id: session.user.id,
  chat_id: chatId,
  provider: "openai",
  model: "gpt-4o",
  action_type: "refine",
  action_group_id: actionGroupId,
  tokens: usage.total_tokens,
  estimated_cost_usd: calculateCost(usage),
});
```

## Alternatives Considered

### Option 1: No Tracking (Rejected)

**Pros**: Simple, no overhead

**Cons**:

- ❌ Zero visibility for users
- ❌ Can't debug provider issues
- ❌ Can't optimize costs

**Why rejected**: Users need transparency

### Option 2: Client-Side Tracking Only (Rejected)

**Pros**: No database writes

**Cons**:

- ❌ Can be skipped or manipulated
- ❌ Lost on browser close
- ❌ No server-side record

**Why rejected**: Unreliable

### Option 3: Third-Party Analytics Service (Rejected)

**Pros**: Professional features, no maintenance

**Cons**:

- ❌ Additional cost
- ❌ Data leaves our control
- ❌ Integration complexity

**Why rejected**: Overkill, data privacy concerns

### Option 4: Event-Based in Database (Selected)

**Pros**:

- ✅ Reliable (server-side)
- ✅ Queryable (SQL)
- ✅ Auditable (RLS-enforced)
- ✅ Cost-effective (included in Supabase)

**Cons**:

- Additional DB writes
- Manual cost calculation

**Why selected**: Best balance of reliability and simplicity

## Consequences

### Positive

1. **Full transparency**: Users see exact API usage and costs
2. **Granular attribution**: Costs linked to chats/tracks via IDs
3. **Debugging capability**: Trace provider calls with timestamps
4. **Historical data**: Query usage trends over time
5. **Cost optimization**: Identify expensive operations

### Negative

1. **Database overhead**: Every API call = extra INSERT
2. **Cost estimates only**: Not exact (users verify in provider dashboards)
3. **Manual aggregation**: Daily rollups not automated yet

### Neutral

1. **Event-driven**: Log after success, not on failure (avoid double-counting retries)
2. **Cost model**: Simple estimates, not accounting for volume discounts or subscription nuances

## Implementation

### Phase 1: Core Tables

1. **Create `usage_events` table** (`/supabase/migrations/0005_usage_events.sql`):
   - All fields with appropriate types
   - RLS enabled (users see only their events)
   - Indexes on user_id and created_at

2. **Create `provider_pricing` table** (`/supabase/migrations/0007_provider_pricing.sql`):
   - Provider, model, pricing fields
   - Public read-only (no RLS)

3. **Populate initial pricing**:
   - OpenAI: gpt-4o at $2.50/$10.00 per 1M tokens
   - ElevenLabs: $0.00022 per character (Creator tier)

### Phase 2: Logging Integration

1. **OpenAI integration** (`/app/api/chat/route.ts`):
   - After stream completes, extract usage
   - Calculate cost from pricing table
   - Insert usage_events row

2. **ElevenLabs integration** (server actions):
   - After audio generation, calculate cost
   - Insert usage_events row with character count

3. **Action group correlation**:
   - Generate `action_group_id` at start of request
   - Pass to all related API calls (refine + generate)

### Phase 3: UI Display

1. **Usage page** (`/app/usage/page.tsx`):
   - Query usage_events for current user
   - Display daily chart (cost per day)
   - Show event list with details

2. **ElevenLabs subscription** (`/api/usage/elevenlabs/subscription`):
   - Fetch quota and usage from ElevenLabs API
   - Cache for 10 minutes

### Success Criteria

1. **100% logging**: Every provider call logs an event
2. **Cost accuracy**: Within 5% of provider bills (estimates)
3. **Query performance**: Daily usage query < 1 second
4. **Attribution**: Every event has user_id, chat_id or track_id

## Notes

### Known Limitations

- **Cost estimates**: Not exact (volume discounts, subscription nuances)
- **Daily rollups**: Not automated (manual aggregation for now)
- **No alerts**: No warnings for high usage (future)

### Future Enhancements

- Cron job for daily rollup automation
- Budget alerts (email when monthly cost > threshold)
- Cost forecasting (predict end-of-month cost)
- Provider comparison (OpenAI vs ElevenLabs cost breakdown)

## Related Documentation

- [Back to Index](../INDEX.md)
- [Usage Model](../usage/USAGE_MODEL.md)
- [Usage Tracking](../usage/TRACKING.md)
- [Cost Model](../usage/COSTS.md)
- [Provider Flows](../architecture/FLOWS.md)

## Relevant Code

- `/supabase/migrations/0005_usage_events.sql` - Events table
- `/supabase/migrations/0007_provider_pricing.sql` - Pricing table
- `/supabase/migrations/0008_usage_daily_rollups.sql` - Rollups table
- `/lib/usage-tracking.ts` - Usage logging helpers
- `/app/api/chat/route.ts` - OpenAI usage logging
- `/app/usage/page.tsx` - Usage UI
