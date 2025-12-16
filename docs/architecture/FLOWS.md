# Provider Flows

**Purpose**: End-to-end flows for OpenAI (refine) and ElevenLabs (generate) with usage tracking  
**Audience**: Developers  
**Last updated**: 2025-12-15

## Overview

This document details the complete request/response flows for:

1. **Refine flow**: OpenAI chat completion for prompt refinement
2. **Generate flow**: ElevenLabs audio generation
3. **Usage attribution**: How usage_events are written and linked

## Refine Flow (OpenAI)

### User Journey

1. User types a message describing their lo-fi track idea
2. Message streams back from OpenAI in real-time
3. User iterates on the prompt through conversation
4. Final refined prompt is ready for generation

### Technical Flow

```
[Browser]
  ↓ User types message
  ↓ useChat.handleSubmit()
  ↓ POST /api/chat { messages, chatId }
  ↓
[Server: /app/api/chat/route.ts]
  ↓ Validate session (createServerSupabaseClient)
  ↓ If unauthorized → return 401
  ↓
  ↓ Fetch user's OpenAI key from Vault
  ↓   - Query user_secrets for openai_secret_id
  ↓   - Decrypt via decrypt_secret() function
  ↓   - Fallback to OPENAI_API_KEY env var if not found
  ↓ If no key → return 400
  ↓
  ↓ Create or load chat record
  ↓   - If chatId provided: verify ownership
  ↓   - If new: INSERT INTO chats
  ↓
  ↓ Save user message
  ↓   - INSERT INTO messages (chat_id, role='user', content)
  ↓
  ↓ Stream OpenAI response
  ↓   - streamText({ model: openai('gpt-4o'), messages })
  ↓   - System prompt: "You are a helpful assistant for lo-fi music prompt creation."
  ↓
  ↓ [Streaming response to browser...]
  ↓
  ↓ After stream completes:
  ↓   - Extract usage (promptTokens, completionTokens)
  ↓   - Calculate cost from provider_pricing table
  ↓   - INSERT INTO messages (chat_id, role='assistant', content)
  ↓   - INSERT INTO usage_events (see below)
  ↓
[Browser]
  ↓ useChat updates messages array
  ↓ Display streaming response in UI
```

### Usage Event (Refine)

After OpenAI call completes:

```typescript
// Calculate cost
const { data: pricing } = await supabase
  .from('provider_pricing')
  .select('*')
  .eq('provider', 'openai')
  .eq('model', 'gpt-4o')
  .single();

const inputCost = (usage.promptTokens / 1_000_000) * pricing.input_cost_per_1m;
const outputCost = (usage.completionTokens / 1_000_000) * pricing.output_cost_per_1m;
const totalCost = inputCost + outputCost;

// Log usage event
await supabase.from('usage_events').insert({
  user_id: session.user.id,
  chat_id: chatId,
  provider: 'openai',
  model: 'gpt-4o',
  action_type: 'refine',
  action_group_id: actionGroupId, // Generated at start of request
  tokens: usage.promptTokens + usage.completionTokens,
  estimated_cost_usd: totalCost,
});
```

### Example Request/Response

**Request**:
```http
POST /api/chat HTTP/1.1
Content-Type: application/json
Cookie: sb-access-token=...

{
  "messages": [
    { "role": "user", "content": "Create a chill lo-fi beat with rainy vibes" }
  ],
  "chatId": "chat-uuid-or-null"
}
```

**Response** (streaming):
```
data: {"text":"Sure"}
data: {"text":"! I"}
data: {"text":" can"}
...
data: {"text":" help you refine that. Let's add some details..."}
```

## Generate Flow (ElevenLabs)

### User Journey

1. User has a refined prompt from chat
2. User clicks "Generate Track"
3. Audio file is generated and saved
4. User can play the track

### Technical Flow

```
[Browser]
  ↓ User clicks Generate
  ↓ Server Action: generateTrack(prompt, chatId)
  ↓
[Server: Server Action or API Route]
  ↓ Validate session
  ↓ If unauthorized → throw error
  ↓
  ↓ Fetch user's ElevenLabs key from Vault
  ↓   - Query user_secrets for elevenlabs_secret_id
  ↓   - Decrypt via decrypt_secret() function
  ↓   - Fallback to ELEVENLABS_API_KEY env var
  ↓ If no key → throw error
  ↓
  ↓ Initialize ElevenLabs client
  ↓   - new ElevenLabsClient({ apiKey })
  ↓
  ↓ Fetch user's voice preference (optional)
  ↓   - Query user_settings for default_voice_id
  ↓   - Fallback to default voice
  ↓
  ↓ Call ElevenLabs API
  ↓   - client.textToSpeech.convert({
  ↓       voiceId,
  ↓       text: prompt,
  ↓       modelId: 'eleven_multilingual_v2'
  ↓     })
  ↓   - Receive audio stream/buffer
  ↓
  ↓ Upload to Supabase Storage
  ↓   - Generate trackId (UUID)
  ↓   - Path: tracks/{userId}/{trackId}.mp3
  ↓   - supabaseAdmin.storage.from('tracks').upload(path, audio)
  ↓
  ↓ Save track metadata
  ↓   - INSERT INTO tracks (id, user_id, chat_id, prompt, model, voice_id, file_path)
  ↓
  ↓ Log usage event
  ↓   - INSERT INTO usage_events (see below)
  ↓
  ↓ Return trackId to browser
  ↓
[Browser]
  ↓ Fetch signed URL for playback
  ↓   - supabase.storage.from('tracks').createSignedUrl(path, 3600)
  ↓ Display audio player with signed URL
```

### Usage Event (Generate)

After ElevenLabs call completes:

```typescript
// Calculate cost
const { data: pricing } = await supabase
  .from('provider_pricing')
  .select('*')
  .eq('provider', 'elevenlabs')
  .eq('model', 'eleven_multilingual_v2')
  .single();

const cost = prompt.length * pricing.cost_per_character;

// Log usage event
await supabase.from('usage_events').insert({
  user_id: session.user.id,
  chat_id: chatId,
  track_id: trackId,
  provider: 'elevenlabs',
  model: 'eleven_multilingual_v2',
  action_type: 'generate',
  action_group_id: actionGroupId, // Same as refine if part of same flow
  characters: prompt.length,
  estimated_cost_usd: cost,
});
```

### Example Request/Response

**Request** (Server Action):
```typescript
generateTrack({
  prompt: "A chill lo-fi beat with gentle rain sounds, 80 BPM, warm piano chords",
  chatId: "chat-uuid",
  voiceId: "voice-uuid",
});
```

**Response**:
```typescript
{
  trackId: "track-uuid",
  filePath: "tracks/user-uuid/track-uuid.mp3",
  duration_ms: 180000, // 3 minutes
}
```

## Action Group Attribution

### Multi-Step Flow

When a user refines a prompt and then generates a track, both actions are correlated with an `action_group_id`:

```typescript
// At the start of the refine request
const actionGroupId = crypto.randomUUID();

// Refine usage event
await supabase.from('usage_events').insert({
  action_group_id: actionGroupId,
  action_type: 'refine',
  provider: 'openai',
  // ...
});

// Later, when user generates track (pass actionGroupId from refine)
await supabase.from('usage_events').insert({
  action_group_id: actionGroupId, // Same ID
  action_type: 'generate',
  provider: 'elevenlabs',
  // ...
});
```

### Querying by Action Group

Get total cost of a user action (refine + generate):

```sql
SELECT
  action_group_id,
  SUM(estimated_cost_usd) AS total_cost,
  ARRAY_AGG(action_type ORDER BY created_at) AS actions
FROM usage_events
WHERE user_id = 'user-uuid'
  AND action_group_id IS NOT NULL
GROUP BY action_group_id
ORDER BY MAX(created_at) DESC;
```

## Error Handling

### OpenAI Errors

**Rate Limit (429)**:
```typescript
try {
  const result = await streamText({ ... });
} catch (error) {
  if (error.status === 429) {
    return NextResponse.json(
      { error: 'OpenAI rate limit exceeded. Please try again in a few seconds.' },
      { status: 429 }
    );
  }
  throw error;
}
```

**Invalid API Key (401)**:
```typescript
if (error.status === 401) {
  return NextResponse.json(
    { error: 'Invalid OpenAI API key. Please update your key in Settings.' },
    { status: 400 }
  );
}
```

**Sanitized Logging**:
```typescript
console.error('OpenAI call failed:', {
  message: error.message,
  status: error.status,
  userId: session.user.id,
  chatId,
  // DO NOT log: headers, apiKey, full request/response
});
```

### ElevenLabs Errors

**Character Quota Exceeded (429)**:
```typescript
try {
  const audio = await client.textToSpeech.convert({ ... });
} catch (error) {
  if (error.status === 429 || error.message.includes('quota')) {
    throw new Error('ElevenLabs character quota exceeded. Please check your subscription.');
  }
  throw error;
}
```

**Invalid API Key (401)**:
```typescript
if (error.status === 401) {
  throw new Error('Invalid ElevenLabs API key. Please update your key in Settings.');
}
```

**Sanitized Logging**:
```typescript
console.error('ElevenLabs call failed:', {
  message: error.message,
  status: error.status,
  userId: session.user.id,
  trackId,
  promptLength: prompt.length,
  // DO NOT log: headers, apiKey, prompt content
});
```

## Usage Tracking Details

### When Events Are Written

1. **After OpenAI stream completes**: Tokens and cost are available in the completion response
2. **After ElevenLabs returns audio**: Character count is known from prompt length
3. **Never on error**: Failed API calls do not log usage events (avoid double-counting retries)

### Cost Calculation Accuracy

**Estimates vs Actuals**:
- Our `estimated_cost_usd` is calculated from `provider_pricing` table
- Actual costs depend on:
  - Provider's current pricing (may change)
  - Volume discounts (not modeled)
  - Subscription tiers (ElevenLabs)
- **Recommendation**: Users should verify costs in provider dashboards

### Data Retention

- `usage_events`: Kept indefinitely (small row size, valuable for audit)
- `usage_daily_rollups`: Kept indefinitely (pre-aggregated, fast queries)
- Future: Implement archival/purge policy for very old events

## Example: Complete Refine → Generate Flow

```typescript
// 1. User starts chat
const chatId = crypto.randomUUID();
await supabase.from('chats').insert({ id: chatId, user_id: userId });

// 2. User sends first message (refine)
const actionGroupId = crypto.randomUUID();

// ... OpenAI call ...
// Log refine usage
await supabase.from('usage_events').insert({
  user_id: userId,
  chat_id: chatId,
  provider: 'openai',
  model: 'gpt-4o',
  action_type: 'refine',
  action_group_id: actionGroupId,
  tokens: 250,
  estimated_cost_usd: 0.00125,
});

// 3. User clicks Generate
const trackId = crypto.randomUUID();

// ... ElevenLabs call ...
// Log generate usage
await supabase.from('usage_events').insert({
  user_id: userId,
  chat_id: chatId,
  track_id: trackId,
  provider: 'elevenlabs',
  model: 'eleven_multilingual_v2',
  action_type: 'generate',
  action_group_id: actionGroupId, // Same as refine
  characters: 80,
  estimated_cost_usd: 0.0176,
});

// Total cost for this user action: $0.00125 + $0.0176 = $0.01885
```

## Related Documentation

- [Back to Index](../INDEX.md)
- [OpenAI Integration](../providers/OPENAI.md)
- [ElevenLabs Integration](../providers/ELEVENLABS.md)
- [Usage Tracking](../usage/TRACKING.md)
- [Data Flow](./DATA_FLOW.md)

## Relevant Code

- `/app/api/chat/route.ts` - OpenAI streaming chat endpoint
- `/lib/elevenlabs.ts` - ElevenLabs client wrapper
- `/lib/usage-tracking.ts` - Usage event logging helpers
- `/lib/supabase/admin.ts` - Admin client for Vault access
- `/supabase/migrations/0005_usage_events.sql` - Usage events table
- `/supabase/migrations/0007_provider_pricing.sql` - Provider pricing table
