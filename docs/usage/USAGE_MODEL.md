# Usage Model

**Purpose**: Comprehensive guide to usage_events schema, cost calculation, and usage tracking architecture  
**Audience**: Developers  
**Last updated**: 2025-12-15

## Overview

The usage model tracks every provider API call to provide:
- **Transparency**: Users see their API usage and costs
- **Attribution**: Link costs to specific chats and tracks
- **Debugging**: Trace provider calls for troubleshooting
- **Analytics**: Understand usage patterns

## Usage Events Schema

### usage_events Table

Primary table for tracking all provider API calls:

| Column               | Type      | Required | Description                                     |
| -------------------- | --------- | -------- | ----------------------------------------------- |
| `id`                 | UUID      | Yes      | Primary key (auto-generated)                    |
| `user_id`            | UUID      | Yes      | FK to auth.users - who made the call            |
| `chat_id`            | UUID      | No       | FK to chats - associated chat (if applicable)   |
| `track_id`           | UUID      | No       | FK to tracks - associated track (if applicable) |
| `provider`           | TEXT      | Yes      | `'openai'` or `'elevenlabs'`                    |
| `model`              | TEXT      | Yes      | Model name (e.g., `'gpt-4o'`)                   |
| `action_type`        | TEXT      | Yes      | `'refine'`, `'generate'`, etc.                  |
| `action_group_id`    | UUID      | No       | Groups related actions                          |
| `tokens`             | INTEGER   | No       | Token count (OpenAI only)                       |
| `characters`         | INTEGER   | No       | Character count (ElevenLabs only)               |
| `estimated_cost_usd` | NUMERIC   | Yes      | Estimated cost in USD                           |
| `created_at`         | TIMESTAMP | Yes      | Event timestamp (auto-set)                      |

**Location**: `/supabase/migrations/0005_usage_events.sql`  
**RLS**: Enabled, users can only see their own events

### Field Details

#### `provider`

Valid values:
- `'openai'` - OpenAI API calls (chat completions)
- `'elevenlabs'` - ElevenLabs API calls (text-to-speech)

#### `model`

Provider-specific model identifiers:

**OpenAI**:
- `'gpt-4o'` - GPT-4 Optimized (current default)
- `'gpt-4-turbo'` - GPT-4 Turbo (if used)
- `'gpt-3.5-turbo'` - GPT-3.5 Turbo (if used)

**ElevenLabs**:
- `'eleven_multilingual_v2'` - Multilingual v2 (current default)
- `'eleven_turbo_v2'` - Turbo v2 (fastest)
- `'eleven_monolingual_v1'` - English-only

#### `action_type`

Describes what the API call did:

- `'refine'` - OpenAI chat completion to refine a prompt
- `'generate'` - ElevenLabs text-to-speech generation
- `'subscription_check'` - ElevenLabs subscription info fetch (future)
- `'balance_check'` - Provider balance/quota check (future)

#### `action_group_id`

**Purpose**: Correlate multi-step operations.

**Example**: User refines prompt (OpenAI), then generates track (ElevenLabs):

```typescript
const actionGroupId = crypto.randomUUID();

// Refine event
await supabase.from('usage_events').insert({
  action_group_id: actionGroupId,
  action_type: 'refine',
  provider: 'openai',
  // ...
});

// Generate event (same action_group_id)
await supabase.from('usage_events').insert({
  action_group_id: actionGroupId,
  action_type: 'generate',
  provider: 'elevenlabs',
  // ...
});
```

**Query by action group**:
```sql
SELECT
  action_group_id,
  SUM(estimated_cost_usd) AS total_cost,
  ARRAY_AGG(action_type ORDER BY created_at) AS actions
FROM usage_events
WHERE user_id = 'user-uuid'
  AND action_group_id IS NOT NULL
GROUP BY action_group_id;
```

#### `tokens` vs `characters`

- **`tokens`**: Used for OpenAI (input + output tokens)
- **`characters`**: Used for ElevenLabs (length of text prompt)

Only one is populated per event (based on provider).

## Cost Calculation

### Pricing Table (provider_pricing)

Reference table for provider pricing:

| Column               | Type    | Description                              |
| -------------------- | ------- | ---------------------------------------- |
| `provider`           | TEXT    | `'openai'` or `'elevenlabs'`             |
| `model`              | TEXT    | Model name                               |
| `input_cost_per_1m`  | NUMERIC | OpenAI: cost per 1M input tokens         |
| `output_cost_per_1m` | NUMERIC | OpenAI: cost per 1M output tokens        |
| `cost_per_character` | NUMERIC | ElevenLabs: cost per character           |
| `effective_date`     | DATE    | When pricing took effect                 |

**Location**: `/supabase/migrations/0007_provider_pricing.sql`

### Cost Calculation (OpenAI)

```typescript
async function calculateOpenAICost(usage: {
  promptTokens: number;
  completionTokens: number;
}, model: string) {
  // Fetch pricing
  const { data: pricing } = await supabase
    .from('provider_pricing')
    .select('*')
    .eq('provider', 'openai')
    .eq('model', model)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();
  
  if (!pricing) {
    console.warn(`No pricing found for openai:${model}`);
    return 0;
  }
  
  // Calculate cost
  const inputCost = (usage.promptTokens / 1_000_000) * pricing.input_cost_per_1m;
  const outputCost = (usage.completionTokens / 1_000_000) * pricing.output_cost_per_1m;
  
  return inputCost + outputCost;
}
```

**Example**:
- Model: `gpt-4o`
- Input tokens: 150
- Output tokens: 50
- Pricing: $2.50 per 1M input, $10.00 per 1M output
- Cost: `(150/1M * 2.5) + (50/1M * 10.0) = $0.000875`

### Cost Calculation (ElevenLabs)

```typescript
async function calculateElevenLabsCost(
  characters: number,
  model: string
) {
  // Fetch pricing
  const { data: pricing } = await supabase
    .from('provider_pricing')
    .select('*')
    .eq('provider', 'elevenlabs')
    .eq('model', model)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();
  
  if (!pricing) {
    console.warn(`No pricing found for elevenlabs:${model}`);
    return 0;
  }
  
  // Calculate cost
  return characters * pricing.cost_per_character;
}
```

**Example**:
- Model: `eleven_multilingual_v2`
- Characters: 500
- Pricing: $0.00022 per character
- Cost: `500 * 0.00022 = $0.11`

## Usage Logging Flow

### When to Log

**Log usage events**:
- ✅ After successful provider API call
- ✅ After extracting usage metadata (tokens, characters)
- ❌ NOT on failed calls (avoid double-counting retries)

### Example: OpenAI Refine

```typescript
// /app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(request: Request) {
  // ... validate session, fetch API key ...
  
  const actionGroupId = crypto.randomUUID();
  
  // Call OpenAI
  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
  });
  
  // After stream completes
  result.then(async (completion) => {
    // Calculate cost
    const cost = await calculateOpenAICost(
      completion.usage,
      'gpt-4o'
    );
    
    // Log usage event
    await supabase.from('usage_events').insert({
      user_id: session.user.id,
      chat_id: chatId,
      provider: 'openai',
      model: 'gpt-4o',
      action_type: 'refine',
      action_group_id: actionGroupId,
      tokens: completion.usage.totalTokens,
      estimated_cost_usd: cost,
    });
  });
  
  return result.toDataStreamResponse();
}
```

### Example: ElevenLabs Generate

```typescript
// Server action or API route
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export async function generateTrack(prompt: string, chatId: string) {
  // ... validate session, fetch API key ...
  
  const client = new ElevenLabsClient({ apiKey });
  const trackId = crypto.randomUUID();
  const actionGroupId = crypto.randomUUID(); // or pass from refine
  
  // Call ElevenLabs
  const audio = await client.textToSpeech.convert({
    voiceId: 'default-voice',
    text: prompt,
    modelId: 'eleven_multilingual_v2',
  });
  
  // Upload audio to storage
  // ... (see FLOWS.md) ...
  
  // Calculate cost
  const cost = await calculateElevenLabsCost(
    prompt.length,
    'eleven_multilingual_v2'
  );
  
  // Log usage event
  await supabase.from('usage_events').insert({
    user_id: session.user.id,
    chat_id: chatId,
    track_id: trackId,
    provider: 'elevenlabs',
    model: 'eleven_multilingual_v2',
    action_type: 'generate',
    action_group_id: actionGroupId,
    characters: prompt.length,
    estimated_cost_usd: cost,
  });
  
  return { trackId };
}
```

## Credits Rules

### Current Model: No Credits

Lofield Studio currently uses a **bring-your-own-API-key** model:
- Users pay providers directly
- No in-app credits or billing
- Costs are estimates for transparency

### Future: Credits System

If implementing an app-managed credits system:

**Design considerations**:
1. **Credit purchase**: Users buy credits upfront
2. **Deduction**: Each API call deducts credits based on cost
3. **Balance tracking**: `user_balances` table with `credits_remaining`
4. **Low balance alerts**: Notify when balance < threshold
5. **Refund policy**: Handle refunds for unused credits

**Schema (hypothetical)**:
```sql
CREATE TABLE user_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  credits_remaining NUMERIC NOT NULL DEFAULT 0,
  credits_purchased NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Deduct credits after usage event
UPDATE user_balances
SET credits_remaining = credits_remaining - :cost
WHERE user_id = :user_id;
```

## Known Unknowns

### Pricing Accuracy

**Known**:
- Provider returns exact token/character counts
- We have pricing table with rates

**Unknown**:
- Volume discounts (user-specific with provider)
- Subscription overages (ElevenLabs)
- Currency fluctuations (all costs in USD)
- Promotional credits (not tracked in our system)

**Mitigation**:
- Document estimates as estimates
- Link to provider dashboards for exact costs

### Daily Rollups

**Known**:
- Schema exists (`usage_daily_rollups`)
- Aggregation logic is straightforward

**Unknown**:
- Best time to run (midnight UTC? user timezone?)
- Backfill for missed days
- Performance impact on large datasets

**Status**: Not yet implemented. Manual queries suffice for now.

### Usage Alerts

**Known**:
- Users need alerts for high usage

**Unknown**:
- Threshold levels (per-user configurable?)
- Delivery method (email? in-app notification?)
- Frequency (daily summary? real-time?)

**Status**: Not implemented. Future enhancement.

## Related Documentation

- [Back to Index](../INDEX.md)
- [Usage Tracking](./TRACKING.md)
- [Cost Model](./COSTS.md)
- [Provider Flows](../architecture/FLOWS.md)
- [OpenAI Integration](../providers/OPENAI.md)
- [ElevenLabs Integration](../providers/ELEVENLABS.md)

## Relevant Code

- `/supabase/migrations/0005_usage_events.sql` - Usage events table
- `/supabase/migrations/0006_usage_counters.sql` - Usage counter helpers
- `/supabase/migrations/0007_provider_pricing.sql` - Provider pricing table
- `/supabase/migrations/0008_usage_daily_rollups.sql` - Daily rollups table
- `/lib/usage-tracking.ts` - Usage tracking helpers
- `/app/api/chat/route.ts` - OpenAI usage logging
- `/app/api/usage/` - Usage API endpoints
