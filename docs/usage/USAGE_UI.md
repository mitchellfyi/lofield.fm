# Usage UI

**Purpose**: Documentation for the `/usage` page - what it shows, how it works, and data sources  
**Audience**: Developers  
**Last updated**: 2025-12-15

## Overview

The `/usage` page provides users with visibility into their API usage and costs. It displays:

1. **ElevenLabs subscription info**: Current tier, quota usage, next reset
2. **Daily usage stats**: Cost breakdown by day and provider
3. **Event list**: Detailed usage events with costs

**Route**: `/app/usage/page.tsx`

## Page Structure

### Layout

```
+---------------------------+
| ElevenLabs Subscription   |
| - Tier: Creator           |
| - Used: 25,000 / 100,000  |
| - Next reset: 2025-01-15  |
+---------------------------+
| Daily Usage Chart         |
| (Bar chart: cost per day) |
+---------------------------+
| Usage Events Table        |
| Date | Provider | Cost    |
| ...                       |
+---------------------------+
```

## Components

### 1. ElevenLabs Subscription Card

**Purpose**: Show user's current ElevenLabs subscription status.

**Data source**: `GET /api/usage/elevenlabs/subscription`

**Displayed fields**:
- **Tier**: `Free`, `Starter`, `Creator`, `Pro`, or `Custom`
- **Character usage**: `{used} / {limit}` characters
- **Next reset**: Date when quota resets (monthly)
- **Can extend**: Whether user can purchase additional characters

**Example**:
```typescript
{
  tier: "Creator",
  characterCount: 25000,
  characterLimit: 100000,
  nextCharacterCountResetUnix: 1737849600,
  canExtendCharacterLimit: true
}
```

**Caching**: Results cached for 10 minutes to reduce API calls.

**Error handling**:
- If API key not configured: Show "Add ElevenLabs API key in Settings"
- If API call fails: Show "Unable to fetch subscription info"

### 2. Daily Usage Chart

**Purpose**: Visualize usage costs over time.

**Data source**: Aggregated from `usage_events` table (client-side query)

**Chart type**: Bar chart with:
- **X-axis**: Date (last 30 days by default)
- **Y-axis**: Total cost (USD)
- **Series**: Stacked bars for OpenAI vs ElevenLabs

**Query**:
```typescript
const { data: dailyUsage } = await supabase
  .from('usage_events')
  .select('created_at, provider, estimated_cost_usd')
  .gte('created_at', startDate.toISOString())
  .lte('created_at', endDate.toISOString())
  .order('created_at', { ascending: true });

// Group by date and provider
const grouped = dailyUsage.reduce((acc, event) => {
  const date = new Date(event.created_at).toISOString().split('T')[0];
  if (!acc[date]) acc[date] = { openai: 0, elevenlabs: 0 };
  acc[date][event.provider] += event.estimated_cost_usd;
  return acc;
}, {});
```

**Interactivity** (future):
- Click bar to drill down to events for that day
- Hover to see exact costs
- Date range picker (7 days, 30 days, 90 days, all time)

### 3. Usage Events Table

**Purpose**: List individual usage events with details.

**Data source**: `usage_events` table (client-side query)

**Columns**:
| Column       | Description                              |
| ------------ | ---------------------------------------- |
| Date         | `created_at` formatted (e.g., "Dec 15")  |
| Provider     | `openai` or `elevenlabs` with icon       |
| Model        | `gpt-4o`, `eleven_multilingual_v2`, etc. |
| Action       | `refine`, `generate`                     |
| Usage        | Tokens (OpenAI) or Characters (ElevenLabs)|
| Cost         | `estimated_cost_usd` formatted as $0.0001|

**Query**:
```typescript
const { data: events } = await supabase
  .from('usage_events')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(100);
```

**Pagination**: Show last 100 events, with "Load more" button.

**Filtering** (future):
- Filter by provider (OpenAI, ElevenLabs)
- Filter by date range
- Filter by chat or track

## Default Date Range

**Default**: Last 30 days

**Configurable**: User can select:
- Last 7 days
- Last 30 days
- Last 90 days
- All time
- Custom range (date picker)

**Query parameter**:
```
/usage?from=2024-12-01&to=2024-12-15
```

**Implementation**:
```typescript
const searchParams = useSearchParams();
const from = searchParams.get('from') || 
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const to = searchParams.get('to') || new Date().toISOString();
```

## Filters

### Provider Filter

**UI**: Checkbox or dropdown to select OpenAI, ElevenLabs, or both.

**Query**:
```typescript
let query = supabase
  .from('usage_events')
  .select('*');

if (selectedProviders.includes('openai')) {
  query = query.eq('provider', 'openai');
}
// ... similar for elevenlabs
```

### Chat/Track Filter

**Future enhancement**: Show usage for a specific chat or track.

**UI**: Dropdown or search box to select chat/track.

**Query**:
```typescript
const { data } = await supabase
  .from('usage_events')
  .select('*')
  .eq('chat_id', chatId) // or track_id
  .order('created_at', { ascending: false });
```

## Drill-Down Behavior

### Future: Click Event Row

**Action**: Click a usage event row to see full details.

**Modal content**:
- Event ID
- Timestamp
- Provider and model
- Action type
- Full usage metadata (tokens, characters)
- Cost breakdown (input vs output for OpenAI)
- Associated chat/track (with link)

### Future: Click Chart Bar

**Action**: Click a bar in the daily chart.

**Behavior**: Filter events table to show only events from that day.

## Data Sources

### API Endpoints

1. **`GET /api/usage/elevenlabs/subscription`**
   - Returns: ElevenLabs subscription info
   - Cache: 10 minutes
   - Auth: Required

2. **`GET /api/usage/elevenlabs/stats`** (optional)
   - Returns: Daily usage stats from ElevenLabs API
   - Cache: 3 hours
   - Auth: Required

### Database Queries

1. **usage_events table**:
   ```typescript
   const { data } = await supabase
     .from('usage_events')
     .select('*')
     .gte('created_at', startDate)
     .lte('created_at', endDate)
     .order('created_at', { ascending: false });
   ```

2. **usage_daily_rollups table** (future):
   ```typescript
   const { data } = await supabase
     .from('usage_daily_rollups')
     .select('*')
     .eq('user_id', userId)
     .gte('date', startDate)
     .lte('date', endDate)
     .order('date', { ascending: true });
   ```

## Performance Considerations

### Large Event Counts

**Problem**: Users with thousands of events may experience slow queries.

**Solutions**:
1. **Pagination**: Load 100 events at a time
2. **Date range limits**: Encourage shorter date ranges
3. **Daily rollups**: Pre-aggregate data for faster queries (future)
4. **Indexes**: Ensure `usage_events(user_id, created_at)` index exists

### Caching

**ElevenLabs subscription**: Cached for 10 minutes (in-memory or Redis).

**Daily usage stats**: Cached for 3 hours.

**Why caching**:
- Reduces API calls to ElevenLabs
- Improves page load time
- Avoids hitting rate limits

## Error States

### No API Key Configured

**Condition**: User has not added ElevenLabs API key.

**Display**:
```
⚠️ ElevenLabs API key not configured.
[Add API key in Settings →]
```

### API Call Failed

**Condition**: ElevenLabs API returns error (401, 429, etc.).

**Display**:
```
❌ Unable to fetch subscription info.
Please check your API key or try again later.
```

### No Usage Events

**Condition**: `usage_events` table has no rows for user.

**Display**:
```
No usage events yet.
Start a chat to see your usage here.
```

## Example Implementation

```typescript
// /app/usage/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function UsagePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  // Fetch usage events
  const { data: events } = await supabase
    .from('usage_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  
  // Fetch ElevenLabs subscription (server action or API call)
  const subscription = await fetchElevenLabsSubscription(session.user.id);
  
  return (
    <div>
      <SubscriptionCard subscription={subscription} />
      <DailyUsageChart events={events} />
      <UsageEventsTable events={events} />
    </div>
  );
}
```

## Future Enhancements

1. **Export to CSV**: Download usage events as CSV for external analysis
2. **Budget alerts**: Notify when monthly cost exceeds threshold
3. **Cost forecasting**: Predict end-of-month cost based on current usage
4. **Provider comparison**: Side-by-side cost comparison (OpenAI vs ElevenLabs)
5. **Action group drill-down**: Show all events in an action group (refine + generate)

## Related Documentation

- [Back to Index](../INDEX.md)
- [Usage Model](./USAGE_MODEL.md)
- [Usage Tracking](./TRACKING.md)
- [Cost Model](./COSTS.md)
- [ElevenLabs Integration](../providers/ELEVENLABS.md)

## Relevant Code

- `/app/usage/page.tsx` - Usage page component
- `/app/api/usage/elevenlabs/subscription/route.ts` - Subscription API endpoint
- `/app/api/usage/elevenlabs/stats/route.ts` - Stats API endpoint
- `/lib/usage-api-helpers.ts` - Usage API helper functions
- `/supabase/migrations/0005_usage_events.sql` - Usage events table
- `/supabase/migrations/0008_usage_daily_rollups.sql` - Daily rollups table
