# Usage Tracking

**Purpose**: How Lofield Studio tracks provider API usage and attributes costs  
**Audience**: Developers  
**Last updated**: 2025-12-15

## Overview

Every OpenAI and ElevenLabs API call is logged to the `usage_events` table with attribution (user, chat, track) and cost estimation. This enables:
- **Transparency**: Users see their API usage and costs
- **Attribution**: Link costs to specific chats and tracks
- **Debugging**: Trace provider calls for troubleshooting

## Data Model

### usage_events Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique event ID |
| `user_id` | UUID | User who triggered the call |
| `chat_id` | UUID | Associated chat (if applicable) |
| `track_id` | UUID | Associated track (if applicable) |
| `provider` | TEXT | `'openai'` or `'elevenlabs'` |
| `model` | TEXT | Model name (e.g., `'gpt-4o'`) |
| `action_type` | TEXT | `'refine'`, `'generate'`, etc. |
| `action_group_id` | UUID | Groups related actions (e.g., refine + generate) |
| `tokens` | INTEGER | Token count (OpenAI) |
| `characters` | INTEGER | Character count (ElevenLabs) |
| `estimated_cost_usd` | NUMERIC | Estimated cost in USD |
| `created_at` | TIMESTAMP | Event timestamp |

### usage_daily_rollups Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique rollup ID |
| `user_id` | UUID | User |
| `date` | DATE | Date (UTC) |
| `provider` | TEXT | `'openai'` or `'elevenlabs'` |
| `total_cost_usd` | NUMERIC | Sum of costs for the day |
| `event_count` | INTEGER | Number of events |
| `created_at` | TIMESTAMP | Rollup timestamp |

**Note**: Daily rollups are not yet automated. Future enhancement: cron job to aggregate.

## Tracking Flow

### 1. Provider API Call

Every provider call follows this pattern:

```typescript
// Before call: prepare metadata
const actionGroupId = crypto.randomUUID(); // Correlate multi-step actions

// Make API call
const result = await providerAPI.call({ ... });

// After call: extract usage data
const usage = {
  tokens: result.usage?.totalTokens, // OpenAI
  characters: prompt.length,         // ElevenLabs
};

// Calculate cost
const cost = calculateCost(usage, provider, model);

// Log event
await supabase.from('usage_events').insert({
  user_id: session.user.id,
  chat_id: chatId,
  track_id: trackId,
  provider,
  model,
  action_type: 'refine', // or 'generate'
  action_group_id: actionGroupId,
  tokens: usage.tokens,
  characters: usage.characters,
  estimated_cost_usd: cost,
});
```

### 2. Cost Calculation

Costs are calculated from the `provider_pricing` table:

```typescript
async function calculateCost(
  usage: { tokens?: number; characters?: number },
  provider: string,
  model: string
) {
  // Fetch pricing for the provider and model
  const { data: pricing } = await supabase
    .from('provider_pricing')
    .select('*')
    .eq('provider', provider)
    .eq('model', model)
    .single();

  if (!pricing) {
    console.warn(`No pricing found for ${provider}:${model}`);
    return 0;
  }

  if (provider === 'openai') {
    const inputCost = (usage.tokens! * pricing.input_cost_per_1m) / 1_000_000;
    const outputCost = (usage.tokens! * pricing.output_cost_per_1m) / 1_000_000;
    return inputCost + outputCost;
  }

  if (provider === 'elevenlabs') {
    return (usage.characters! * pricing.cost_per_character);
  }

  return 0;
}
```

**Note**: Simplified example. Actual implementation may differ.

### 3. Action Group ID

The `action_group_id` correlates multi-step operations:

**Example**: User refines a prompt (OpenAI) then generates a track (ElevenLabs):

```typescript
const actionGroupId = crypto.randomUUID();

// Refine step
await supabase.from('usage_events').insert({
  action_group_id: actionGroupId,
  action_type: 'refine',
  provider: 'openai',
  // ...
});

// Generate step
await supabase.from('usage_events').insert({
  action_group_id: actionGroupId,
  action_type: 'generate',
  provider: 'elevenlabs',
  // ...
});
```

**Benefit**: Query events by `action_group_id` to see total cost of a user action.

## Querying Usage

### User's Total Usage

```sql
select
  provider,
  sum(estimated_cost_usd) as total_cost,
  count(*) as event_count
from usage_events
where user_id = '...'
group by provider;
```

### Daily Usage

```sql
select
  date_trunc('day', created_at) as day,
  provider,
  sum(estimated_cost_usd) as total_cost,
  count(*) as event_count
from usage_events
where user_id = '...'
group by day, provider
order by day desc;
```

### Usage by Chat

```sql
select
  chat_id,
  sum(estimated_cost_usd) as total_cost,
  count(*) as event_count
from usage_events
where user_id = '...'
  and chat_id is not null
group by chat_id;
```

### Usage by Track

```sql
select
  track_id,
  sum(estimated_cost_usd) as total_cost,
  count(*) as event_count
from usage_events
where user_id = '...'
  and track_id is not null
group by track_id;
```

## UI Display

### Usage Page

The `/usage` page displays:
- **ElevenLabs subscription info**: Character quota, remaining, next reset
- **Daily usage**: Bar chart of costs by day
- **Breakdown**: Table of events with provider, model, cost

**Data sources**:
1. `GET /api/usage/elevenlabs/subscription` - Cached for 10 minutes
2. `GET /api/usage/elevenlabs/stats` - Cached for 3 hours
3. `usage_events` table - Queried in real-time

## Provider Pricing

### provider_pricing Table

Stores current pricing for each provider and model:

| Column | Type | Description |
|--------|------|-------------|
| `provider` | TEXT | `'openai'` or `'elevenlabs'` |
| `model` | TEXT | Model name |
| `input_cost_per_1m` | NUMERIC | OpenAI: cost per 1M input tokens |
| `output_cost_per_1m` | NUMERIC | OpenAI: cost per 1M output tokens |
| `cost_per_character` | NUMERIC | ElevenLabs: cost per character |
| `effective_date` | DATE | When pricing took effect |

**Example rows**:

```sql
-- OpenAI GPT-4o
insert into provider_pricing (provider, model, input_cost_per_1m, output_cost_per_1m, effective_date)
values ('openai', 'gpt-4o', 2.50, 10.00, '2024-01-01');

-- ElevenLabs Multilingual v2
insert into provider_pricing (provider, model, cost_per_character, effective_date)
values ('elevenlabs', 'eleven_multilingual_v2', 0.00022, '2024-01-01');
```

### Updating Pricing

Pricing is updated manually when providers change rates:

1. Insert new row with updated pricing and new `effective_date`
2. Keep old rows for historical accuracy
3. Query uses latest pricing by `effective_date`

## Limitations

### Estimated Costs

Costs are **estimates** based on:
- Provider pricing tables (may lag behind actual pricing)
- Simplified calculations (e.g., not accounting for volume discounts)

**Recommendation**: Users should verify costs in their provider dashboards.

### Daily Rollups

Currently **not automated**. Future enhancement:
- Cron job (e.g., daily at midnight UTC) to aggregate `usage_events` into `usage_daily_rollups`
- Speeds up queries for historical data

### No Alerts

No alerts for high usage or quota limits. Future enhancement:
- Email/notification when user approaches quota
- Budget limits per user

## Related Documentation

- [Back to Index](../INDEX.md)
- [Cost Model](./COSTS.md)
- [OpenAI Integration](../providers/OPENAI.md)
- [ElevenLabs Integration](../providers/ELEVENLABS.md)
