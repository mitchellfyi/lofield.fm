# OpenAI Integration

**Purpose**: How Lofield Studio integrates with OpenAI for chat and prompt refinement  
**Audience**: Developers  
**Last updated**: 2025-12-15

## Overview

Lofield Studio uses OpenAI's GPT-4o model for conversational prompt refinement. Users chat with the AI to iterate on lo-fi track ideas before generating audio.

## Architecture

### API Key Management

- **Per-user keys**: Each user provides their own OpenAI API key
- **Storage**: Keys stored in Supabase Vault (encrypted)
- **Access**: Retrieved server-side only (never sent to client)
- **Fallback**: Optional `OPENAI_API_KEY` env var for development

See [Secrets Management](../security/SECRETS.md) for details.

### Streaming Chat

Lofield Studio uses the **Vercel AI SDK** for streaming OpenAI responses:

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

const result = streamText({
  model: openai('gpt-4o'),
  messages: [...],
});
```

## Implementation Details

### Client-Side (`useChat` hook)

Located in chat UI components:

```typescript
import { useChat } from '@ai-sdk/react';

export default function ChatPanel() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <form onSubmit={handleSubmit}>
      <input value={input} onChange={handleInputChange} />
      <button type="submit" disabled={isLoading}>Send</button>
      <div>
        {messages.map(msg => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>
    </form>
  );
}
```

**What happens**:

1. User types message and submits
2. `useChat` sends POST to `/api/chat`
3. Server streams response chunks
4. `useChat` updates `messages` array in real-time
5. UI displays streaming response

### Server-Side (API Route)

Located in `/app/api/chat/route.ts`:

```typescript
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // 1. Validate session
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Fetch user's OpenAI key from Vault
  const { data: openaiKey } = await supabaseAdmin.rpc("get_user_secret", {
    user_id: session.user.id,
    secret_name: "openai",
  });

  const apiKey = openaiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response("OpenAI API key not configured", { status: 400 });
  }

  // 3. Parse request body
  const { messages, chatId } = await request.json();

  // 4. Stream OpenAI response
  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    system: "You are a helpful assistant for lo-fi music prompt creation.",
  });

  // 5. Save messages and log usage (after stream completes)
  result.then(async (completion) => {
    // Save user message
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "user",
      content: messages[messages.length - 1].content,
    });

    // Save assistant message
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "assistant",
      content: completion.text,
    });

    // Log usage event
    await supabase.from("usage_events").insert({
      user_id: session.user.id,
      chat_id: chatId,
      provider: "openai",
      model: "gpt-4o",
      action_type: "refine",
      tokens: completion.usage.totalTokens,
      estimated_cost_usd: calculateCost(completion.usage),
    });
  });

  // Return streaming response
  return result.toDataStreamResponse();
}
```

## Model Configuration

### Current Model

- **Model**: `gpt-4o` (GPT-4 Optimized)
- **Context window**: 128K tokens
- **Max output**: 4096 tokens
- **Pricing** (as of 2025-12-15):
  - Input: $2.50 per 1M tokens
  - Output: $10.00 per 1M tokens

### System Prompt

Located in `/app/api/chat/route.ts`:

```typescript
const systemPrompt = `You are a helpful assistant for lo-fi music prompt creation.
Help users refine their ideas into clear, detailed prompts for music generation.
Focus on mood, tempo, instrumentation, and atmosphere.`;
```

**Future enhancement**: Make system prompt configurable per chat or user.

## Usage Tracking

Every OpenAI API call logs a `usage_events` record:

| Field                | Value                              |
| -------------------- | ---------------------------------- |
| `user_id`            | From session                       |
| `chat_id`            | Current chat ID                    |
| `provider`           | `'openai'`                         |
| `model`              | `'gpt-4o'`                         |
| `action_type`        | `'refine'`                         |
| `tokens`             | Total tokens (input + output)      |
| `estimated_cost_usd` | Calculated from `provider_pricing` |

See [Usage Tracking](../usage/TRACKING.md) for details.

## Cost Calculation

### Token Counting

OpenAI returns token counts in the response:

```typescript
{
  usage: {
    promptTokens: 150,
    completionTokens: 50,
    totalTokens: 200
  }
}
```

### Cost Formula

```typescript
function calculateCost(usage: {
  promptTokens: number;
  completionTokens: number;
}) {
  const inputCostPer1M = 2.5; // USD
  const outputCostPer1M = 10.0; // USD

  const inputCost = (usage.promptTokens / 1_000_000) * inputCostPer1M;
  const outputCost = (usage.completionTokens / 1_000_000) * outputCostPer1M;

  return inputCost + outputCost;
}
```

**Note**: Pricing is stored in the `provider_pricing` table and queried at runtime.

## Error Handling

### Rate Limits

OpenAI enforces rate limits per user/organization. If exceeded:

```typescript
try {
  const result = await streamText({ ... });
} catch (error) {
  if (error.status === 429) {
    return new Response('Rate limit exceeded. Please try again later.', { status: 429 });
  }
  throw error;
}
```

### Invalid API Key

If the key is invalid or revoked:

```typescript
try {
  const result = await streamText({ ... });
} catch (error) {
  if (error.status === 401) {
    return new Response('Invalid OpenAI API key. Please update in Settings.', { status: 400 });
  }
  throw error;
}
```

### Sanitizing Errors

Never log full error objects (may contain API keys in headers):

```typescript
console.error("OpenAI call failed:", {
  message: error.message,
  status: error.status,
  // DO NOT log: headers, request, apiKey
});
```

## Testing

### Local Development

1. Set `OPENAI_API_KEY` in `.env.local` (fallback)
2. Or save a key in Settings page (Vault)
3. Start a chat and send a message
4. Verify response streams correctly

### Integration Tests

Future: Add tests for:

- API key retrieval from Vault
- Streaming response handling
- Usage event logging

## Related Documentation

- [Back to Index](../INDEX.md)
- [ElevenLabs Integration](./ELEVENLABS.md)
- [Secrets Management](../security/SECRETS.md)
- [Usage Tracking](../usage/TRACKING.md)
- [Data Flow](../architecture/DATA_FLOW.md)
