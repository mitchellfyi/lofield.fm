# ElevenLabs Integration

**Purpose**: How Lofield Studio integrates with ElevenLabs for audio generation and usage tracking  
**Audience**: Developers  
**Last updated**: 2025-12-15

## Overview

Lofield Studio uses ElevenLabs for text-to-speech audio generation. After refining prompts with OpenAI, users generate lo-fi tracks using ElevenLabs' API.

## Architecture

### API Key Management

- **Per-user keys**: Each user provides their own ElevenLabs API key
- **Storage**: Keys stored in Supabase Vault (encrypted)
- **Access**: Retrieved server-side only (never sent to client)
- **Fallback**: Optional `ELEVENLABS_API_KEY` env var for development

See [Secrets Management](../security/SECRETS.md) for details.

### SDK

Lofield Studio uses the official **ElevenLabs JavaScript SDK**:

```typescript
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const client = new ElevenLabsClient({
  apiKey: userApiKey,
});
```

## Audio Generation

### Generate Track

Located in server actions or API routes:

```typescript
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function generateTrack(prompt: string, chatId: string) {
  // 1. Validate session
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  // 2. Fetch user's ElevenLabs key from Vault
  const { data: elevenLabsKey } = await supabaseAdmin.rpc('get_user_secret', {
    user_id: session.user.id,
    secret_name: 'elevenlabs',
  });

  const apiKey = elevenLabsKey || process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  // 3. Initialize ElevenLabs client
  const client = new ElevenLabsClient({ apiKey });

  // 4. Generate audio
  const audio = await client.textToSpeech.convert({
    voiceId: 'default-voice-id',
    text: prompt,
    modelId: 'eleven_multilingual_v2',
  });

  // 5. Upload to Supabase Storage
  const trackId = crypto.randomUUID();
  const filePath = `${session.user.id}/${trackId}.mp3`;

  await supabaseAdmin.storage
    .from('tracks')
    .upload(filePath, audio, { contentType: 'audio/mpeg' });

  // 6. Save track record
  await supabase.from('tracks').insert({
    id: trackId,
    user_id: session.user.id,
    chat_id: chatId,
    prompt,
    model: 'eleven_multilingual_v2',
    voice_id: 'default-voice-id',
    file_path: filePath,
  });

  // 7. Log usage event
  await supabase.from('usage_events').insert({
    user_id: session.user.id,
    track_id: trackId,
    chat_id: chatId,
    provider: 'elevenlabs',
    model: 'eleven_multilingual_v2',
    action_type: 'generate',
    characters: prompt.length,
    estimated_cost_usd: calculateCost(prompt.length),
  });

  return { trackId, filePath };
}
```

## Usage Tracking

### Subscription Info

ElevenLabs provides subscription details via the API:

**Endpoint**: `GET /api/usage/elevenlabs/subscription`

```typescript
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export async function getSubscriptionInfo(apiKey: string) {
  const client = new ElevenLabsClient({ apiKey });

  const subscription = await client.user.getSubscription();

  return {
    tier: subscription.tier,
    characterCount: subscription.character_count,
    characterLimit: subscription.character_limit,
    canExtendCharacterLimit: subscription.can_extend_character_limit,
    nextCharacterCountResetUnix: subscription.next_character_count_reset_unix,
  };
}
```

**Caching**: Results cached for 10 minutes to reduce API calls.

### Daily Usage Stats

**Endpoint**: `GET /api/usage/elevenlabs/stats`

```typescript
export async function getDailyUsageStats(apiKey: string, startDate: string, endDate: string) {
  const client = new ElevenLabsClient({ apiKey });

  const usage = await client.user.getUsage({
    startDate,
    endDate,
  });

  return usage.usage.map(day => ({
    date: day.date,
    characterCount: day.character_count,
  }));
}
```

**Caching**: Results cached for 3 hours.

## Cost Calculation

### Pricing Model

ElevenLabs charges by character count. Pricing varies by tier:

| Tier | Characters/month | Price |
|------|------------------|-------|
| Free | 10,000 | $0 |
| Starter | 30,000 | $5/month |
| Creator | 100,000 | $22/month |
| Pro | 500,000 | $99/month |

**Note**: Pricing stored in `provider_pricing` table.

### Cost Formula

```typescript
function calculateCost(characterCount: number, tier: string) {
  // Simplified: assumes pay-per-character model
  // Actual pricing depends on subscription tier and overages

  const costPerCharacter = 0.00022; // Example: $0.22 per 1000 characters

  return characterCount * costPerCharacter;
}
```

**Future enhancement**: Query `provider_pricing` table for accurate per-tier costs.

## Models and Voices

### Supported Models

- `eleven_monolingual_v1`: English only, fast
- `eleven_multilingual_v1`: 29 languages
- `eleven_multilingual_v2`: Improved quality, 29 languages
- `eleven_turbo_v2`: Fastest, good quality

**Current default**: `eleven_multilingual_v2`

### Voice Selection

Future feature: Allow users to select from available voices.

Current: Uses a default voice ID configured in the app.

## Error Handling

### Rate Limits

ElevenLabs enforces character limits per subscription:

```typescript
try {
  const audio = await client.textToSpeech.convert({ ... });
} catch (error) {
  if (error.status === 429 || error.message.includes('quota')) {
    return { error: 'Character limit exceeded. Please upgrade your ElevenLabs plan.' };
  }
  throw error;
}
```

### Invalid API Key

```typescript
try {
  const audio = await client.textToSpeech.convert({ ... });
} catch (error) {
  if (error.status === 401) {
    return { error: 'Invalid ElevenLabs API key. Please update in Settings.' };
  }
  throw error;
}
```

### Sanitizing Errors

Never log full error objects:

```typescript
console.error('ElevenLabs call failed:', {
  message: error.message,
  status: error.status,
  // DO NOT log: headers, request, apiKey
});
```

## Usage Events

Every ElevenLabs API call logs a `usage_events` record:

| Field | Value |
|-------|-------|
| `user_id` | From session |
| `track_id` | Generated track ID |
| `chat_id` | Associated chat ID |
| `provider` | `'elevenlabs'` |
| `model` | Model used (e.g., `'eleven_multilingual_v2'`) |
| `action_type` | `'generate'` |
| `characters` | Length of prompt text |
| `estimated_cost_usd` | Calculated cost |

See [Usage Tracking](../usage/TRACKING.md) for details.

## Testing

### Local Development

1. Set `ELEVENLABS_API_KEY` in `.env.local` (fallback)
2. Or save a key in Settings page (Vault)
3. Generate a track
4. Verify audio file is created and stored

### Integration Tests

Future: Add tests for:
- API key retrieval from Vault
- Audio generation and upload
- Usage event logging
- Subscription info fetching

## Related Documentation

- [Back to Index](../INDEX.md)
- [OpenAI Integration](./OPENAI.md)
- [Secrets Management](../security/SECRETS.md)
- [Usage Tracking](../usage/TRACKING.md)
- [Storage Policies](../security/STORAGE.md)
