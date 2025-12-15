# Cost Model

**Purpose**: Credits, pricing assumptions, and cost attribution in Lofield Studio  
**Audience**: Developers and product managers  
**Last updated**: 2025-12-15

## Overview

Lofield Studio operates on a **bring-your-own-API-key** model. Users pay providers (OpenAI, ElevenLabs) directly. The app tracks usage and estimates costs for transparency.

## Pricing Assumptions

### OpenAI (GPT-4o)

**Model**: `gpt-4o`

| Usage Type | Cost (per 1M tokens) |
| ---------- | -------------------- |
| Input      | $2.50                |
| Output     | $10.00               |

**Example**:

- User sends 150 tokens (input)
- AI responds with 50 tokens (output)
- Cost: `(150 / 1_000_000) * $2.50 + (50 / 1_000_000) * $10.00 = $0.000875`

**Note**: Pricing as of 2025-12-15. Subject to change by OpenAI.

### ElevenLabs

**Model**: `eleven_multilingual_v2`

| Tier    | Characters/month | Monthly Cost | Cost per Character |
| ------- | ---------------- | ------------ | ------------------ |
| Free    | 10,000           | $0           | $0 (quota-based)   |
| Starter | 30,000           | $5           | ~$0.000167         |
| Creator | 100,000          | $22          | ~$0.00022          |
| Pro     | 500,000          | $99          | ~$0.000198         |

**Example**:

- User generates 500 characters of audio
- Cost (Creator tier): `500 * $0.00022 = $0.11`

**Note**: Pricing is subscription-based with character quotas. Overages may incur additional costs. Verify in ElevenLabs dashboard.

## Cost Attribution

### Per-User Costs

Each user pays for their own API usage. The app does **not** pool costs across users.

**Benefits**:

- No billing complexity for the app
- Users control their spending via provider accounts
- No revenue share or markup

**Trade-offs**:

- Users must manage API keys
- No centralized billing or invoicing

### Per-Chat Costs

Costs are attributed to specific chats via `usage_events.chat_id`:

**Example query**:

```sql
select
  chat_id,
  sum(estimated_cost_usd) as total_cost
from usage_events
where user_id = '...'
group by chat_id;
```

**Use case**: Show "This chat cost $0.50" in the UI.

### Per-Track Costs

Costs are attributed to specific tracks via `usage_events.track_id`:

**Example query**:

```sql
select
  track_id,
  sum(estimated_cost_usd) as total_cost
from usage_events
where user_id = '...'
group by track_id;
```

**Use case**: Show "This track cost $0.25 to generate" in the UI.

### Action Groups

Multi-step actions are correlated via `action_group_id`:

**Example**: User refines prompt 3 times (OpenAI) then generates (ElevenLabs):

```
action_group_id: abc-123
  ├─ refine #1: $0.001 (OpenAI)
  ├─ refine #2: $0.002 (OpenAI)
  ├─ refine #3: $0.001 (OpenAI)
  └─ generate: $0.11 (ElevenLabs)
Total: $0.114
```

**Use case**: Show "Total cost of this track creation: $0.114"

## Usage Limits

### Provider Limits

Providers enforce their own limits:

**OpenAI**:

- Rate limits (RPM, TPM, TPD) per API key
- Limits vary by account tier (free, pay-as-you-go, enterprise)

**ElevenLabs**:

- Character quotas per subscription tier
- Monthly resets

**App behavior**:

- If provider returns 429 (rate limit), display error to user
- No retry logic (yet)

### App Limits

Currently **none**. Future enhancements:

- Per-user budget limits (soft cap with warning)
- Admin-configurable quotas

## Cost Tracking Accuracy

### Estimates vs. Actual

The app provides **estimates** based on:

- `provider_pricing` table (manually updated)
- Token/character counts from provider responses

**Accuracy**:

- OpenAI: High (providers return exact token counts)
- ElevenLabs: High (character count is exact)

**Caveats**:

- Volume discounts not reflected
- Subscription overages not calculated
- Currency conversion not included (all costs in USD)

**Recommendation**: Users should verify costs in provider dashboards.

### Historical Pricing

The `provider_pricing` table includes `effective_date` to track pricing changes over time:

```sql
-- Old pricing
insert into provider_pricing (provider, model, input_cost_per_1m, output_cost_per_1m, effective_date)
values ('openai', 'gpt-4o', 3.00, 12.00, '2023-01-01');

-- New pricing
insert into provider_pricing (provider, model, input_cost_per_1m, output_cost_per_1m, effective_date)
values ('openai', 'gpt-4o', 2.50, 10.00, '2024-01-01');
```

**Benefit**: Calculate costs accurately for historical events.

## UI Display

### Usage Page (`/usage`)

Displays:

1. **ElevenLabs Subscription Info**:
   - Tier (Free, Starter, Creator, Pro)
   - Characters used / total quota
   - Next reset date
2. **Daily Usage Chart**:
   - Bar chart: cost per day
   - Breakdown by provider
3. **Event List**:
   - Recent events with provider, model, cost, timestamp

### Chat/Track Pages (Future)

Future enhancement: Show per-chat and per-track costs directly in the UI.

## Billing Model Considerations

### Current: BYOK (Bring Your Own Key)

**Pros**:

- Simple: no app-side billing
- Transparent: users see costs in provider dashboards
- Scalable: no payment processing overhead

**Cons**:

- Friction: users must sign up for provider accounts
- No app revenue (if desired)
- No centralized usage limits

### Alternative: App-Managed Keys

**Not implemented**. If we wanted to manage keys centrally:

**Pros**:

- Simpler onboarding (users don't need provider accounts)
- App can markup and generate revenue
- Centralized usage limits and billing

**Cons**:

- Billing complexity (invoicing, payment processing)
- Key management security risk
- Provider rate limits shared across users

## Related Documentation

- [Back to Index](../INDEX.md)
- [Usage Tracking](./TRACKING.md)
- [OpenAI Integration](../providers/OPENAI.md)
- [ElevenLabs Integration](../providers/ELEVENLABS.md)
