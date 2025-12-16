# Pricing Model

**Purpose**: How provider_pricing is populated, how to update it safely, and pricing maintenance  
**Audience**: Developers and operations  
**Last updated**: 2025-12-15

## Overview

The `provider_pricing` table stores pricing information for OpenAI and ElevenLabs. This data is used to calculate `estimated_cost_usd` in usage events.

**Key principles**:

- **Historical accuracy**: Never delete old pricing, only add new rows
- **Effective dates**: Use `effective_date` to track pricing changes over time
- **Manual updates**: Pricing is updated manually when providers change rates

## Schema

### provider_pricing Table

| Column               | Type      | Required | Description                       |
| -------------------- | --------- | -------- | --------------------------------- |
| `id`                 | UUID      | Yes      | Primary key (auto-generated)      |
| `provider`           | TEXT      | Yes      | `'openai'` or `'elevenlabs'`      |
| `model`              | TEXT      | Yes      | Model name (e.g., `'gpt-4o'`)     |
| `input_cost_per_1m`  | NUMERIC   | No       | OpenAI: cost per 1M input tokens  |
| `output_cost_per_1m` | NUMERIC   | No       | OpenAI: cost per 1M output tokens |
| `cost_per_character` | NUMERIC   | No       | ElevenLabs: cost per character    |
| `effective_date`     | DATE      | Yes      | When this pricing took effect     |
| `created_at`         | TIMESTAMP | Yes      | Row creation time (auto-set)      |

**Location**: `/supabase/migrations/0007_provider_pricing.sql`  
**RLS**: Public read-only (no `user_id`), service role for writes

**Unique constraint**: `(provider, model, effective_date)` - prevents duplicate pricing for same model on same date

## Current Pricing (as of 2025-12-15)

### OpenAI

```sql
INSERT INTO provider_pricing (provider, model, input_cost_per_1m, output_cost_per_1m, effective_date)
VALUES
  ('openai', 'gpt-4o', 2.50, 10.00, '2024-01-01'),
  ('openai', 'gpt-4-turbo', 3.00, 12.00, '2024-01-01'),
  ('openai', 'gpt-3.5-turbo', 0.50, 1.50, '2024-01-01');
```

**Notes**:

- Pricing is per 1 million tokens
- Input tokens are cheaper than output tokens
- Verify current pricing at [openai.com/pricing](https://openai.com/pricing)

### ElevenLabs

```sql
INSERT INTO provider_pricing (provider, model, cost_per_character, effective_date)
VALUES
  ('elevenlabs', 'eleven_multilingual_v2', 0.00022, '2024-01-01'),
  ('elevenlabs', 'eleven_turbo_v2', 0.00018, '2024-01-01'),
  ('elevenlabs', 'eleven_monolingual_v1', 0.00020, '2024-01-01');
```

**Notes**:

- Pricing is per character
- Calculated from Creator tier ($22/month for 100k characters = $0.00022/char)
- Actual cost depends on user's subscription tier
- Verify current pricing at [elevenlabs.io/pricing](https://elevenlabs.io/pricing)

## Adding New Pricing

### When to Add

Add new pricing when:

1. Provider announces a price change
2. New model is introduced
3. Promotional pricing ends

### How to Add

**Steps**:

1. **Create migration file**:

   ```bash
   touch supabase/migrations/NNNN_update_pricing.sql
   ```

2. **Add new pricing row** (never update existing):

   ```sql
   -- Example: OpenAI increases GPT-4o pricing
   INSERT INTO provider_pricing (provider, model, input_cost_per_1m, output_cost_per_1m, effective_date)
   VALUES ('openai', 'gpt-4o', 3.00, 12.00, '2025-02-01');
   ```

3. **Run migration locally**:

   ```bash
   pnpm db:migrate
   ```

4. **Verify pricing**:

   ```sql
   SELECT * FROM provider_pricing
   WHERE provider = 'openai' AND model = 'gpt-4o'
   ORDER BY effective_date DESC;
   ```

5. **Deploy migration**:
   - Commit and push to main
   - Vercel deploys automatically
   - Run `pnpm db:migrate` in production (if needed)

### Example: Price Increase

**Scenario**: OpenAI increases GPT-4o pricing on Feb 1, 2025.

**Migration**:

```sql
-- Migration: 0009_update_openai_pricing.sql
-- Update OpenAI GPT-4o pricing effective 2025-02-01

INSERT INTO provider_pricing (
  provider,
  model,
  input_cost_per_1m,
  output_cost_per_1m,
  effective_date
)
VALUES (
  'openai',
  'gpt-4o',
  3.00,  -- was 2.50
  12.00, -- was 10.00
  '2025-02-01'
);

-- Comment: Old pricing (2.50/10.00) still exists with effective_date '2024-01-01'
-- This ensures historical cost calculations remain accurate
```

**Result**:

- Old events (before Feb 1) calculated with old pricing
- New events (after Feb 1) calculated with new pricing

## Querying Pricing

### Latest Pricing for a Model

```sql
SELECT * FROM provider_pricing
WHERE provider = 'openai'
  AND model = 'gpt-4o'
ORDER BY effective_date DESC
LIMIT 1;
```

**Returns**: Most recent pricing for GPT-4o

### Pricing at a Specific Date

```sql
SELECT * FROM provider_pricing
WHERE provider = 'openai'
  AND model = 'gpt-4o'
  AND effective_date <= '2025-01-15'
ORDER BY effective_date DESC
LIMIT 1;
```

**Returns**: Pricing that was in effect on Jan 15, 2025

### All Pricing History

```sql
SELECT
  provider,
  model,
  input_cost_per_1m,
  output_cost_per_1m,
  cost_per_character,
  effective_date
FROM provider_pricing
ORDER BY provider, model, effective_date DESC;
```

**Use case**: Audit pricing changes over time

## Safe Update Practices

### ✅ Do

1. **Add new rows** for pricing changes (never UPDATE)
2. **Set effective_date** to when pricing actually changes
3. **Test locally** before deploying
4. **Document changes** in migration comments
5. **Verify** old events still calculate correctly

### ❌ Don't

1. **UPDATE existing rows** (breaks historical calculations)
2. **DELETE old pricing** (needed for historical accuracy)
3. **Backdate effective_date** unless correcting a mistake
4. **Forget to test** cost calculations after adding pricing

## Cost Calculation with Pricing

### Example: Calculate Cost for Event

```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function calculateCost(
  provider: string,
  model: string,
  usage: { tokens?: number; characters?: number },
  eventDate: Date
) {
  const supabase = await createServerSupabaseClient();

  // Fetch pricing in effect on event date
  const { data: pricing } = await supabase
    .from("provider_pricing")
    .select("*")
    .eq("provider", provider)
    .eq("model", model)
    .lte("effective_date", eventDate.toISOString().split("T")[0])
    .order("effective_date", { ascending: false })
    .limit(1)
    .single();

  if (!pricing) {
    console.warn(`No pricing found for ${provider}:${model} on ${eventDate}`);
    return 0;
  }

  if (provider === "openai" && usage.tokens) {
    // Simplified: assume 50/50 split input/output
    const inputTokens = usage.tokens * 0.5;
    const outputTokens = usage.tokens * 0.5;

    const inputCost = (inputTokens / 1_000_000) * pricing.input_cost_per_1m;
    const outputCost = (outputTokens / 1_000_000) * pricing.output_cost_per_1m;

    return inputCost + outputCost;
  }

  if (provider === "elevenlabs" && usage.characters) {
    return usage.characters * pricing.cost_per_character;
  }

  return 0;
}
```

## Troubleshooting

### Cost Calculations Are Wrong

**Symptoms**:

- Costs suddenly change for old events
- Costs don't match provider bills

**Possible causes**:

1. Pricing row was updated instead of added
2. `effective_date` is incorrect
3. Query doesn't filter by date properly

**Solutions**:

1. Check pricing history:
   ```sql
   SELECT * FROM provider_pricing ORDER BY created_at;
   ```
2. Verify `effective_date` matches provider's announcement
3. Ensure cost calculation uses `effective_date` filter

### No Pricing Found for Model

**Symptoms**:

- Warnings in logs: "No pricing found for provider:model"
- Costs are $0.00

**Solutions**:

1. Add pricing for the new model:
   ```sql
   INSERT INTO provider_pricing (provider, model, cost_per_character, effective_date)
   VALUES ('elevenlabs', 'new_model', 0.00022, CURRENT_DATE);
   ```
2. Backfill events with correct costs (if necessary)

### Pricing Accidentally Deleted

**Symptoms**:

- Historical cost calculations fail
- Old events have missing pricing

**Solutions**:

1. **Restore from backup** (Supabase automatic backups)
2. **Re-run migration** to recreate pricing rows
3. **Verify** events recalculate correctly

## Monitoring Pricing Changes

### Manual Checks

**Frequency**: Monthly or when providers announce changes

**Sources**:

- OpenAI: [openai.com/pricing](https://openai.com/pricing)
- ElevenLabs: [elevenlabs.io/pricing](https://elevenlabs.io/pricing)

### Automated Alerts (Future)

**Idea**: Script to check provider APIs for pricing changes and alert team.

**Implementation**:

1. Fetch pricing from provider API (if available)
2. Compare with latest `provider_pricing` row
3. Send notification if mismatch

## Related Documentation

- [Back to Index](../INDEX.md)
- [Usage Model](./USAGE_MODEL.md)
- [Cost Model](./COSTS.md)
- [Provider Flows](../architecture/FLOWS.md)

## Relevant Code

- `/supabase/migrations/0007_provider_pricing.sql` - Pricing table schema and initial data
- `/lib/usage-tracking.ts` - Cost calculation helpers
- `/app/api/chat/route.ts` - OpenAI cost calculation
- `/lib/elevenlabs.ts` - ElevenLabs cost calculation
