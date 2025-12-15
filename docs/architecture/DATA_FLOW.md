# Data Flow

**Purpose**: Request flows and data lifecycle through Lofield Studio  
**Audience**: Developers  
**Last updated**: 2025-12-15

## Authentication Flow

### Sign In

```mermaid
User Browser → Sign In Button
  → Supabase Auth (Google/GitHub OAuth)
  → OAuth Provider
  → User Grants Permission
  → Redirect to /auth/callback
  → Set Auth Cookie
  → Redirect to /
```

**Steps**:
1. User clicks "Sign In" button
2. App redirects to Supabase Auth with provider (Google or GitHub)
3. Supabase redirects to OAuth provider
4. User authorizes the app
5. OAuth provider redirects back to Supabase
6. Supabase redirects to `/auth/callback` with auth code
7. Callback handler exchanges code for session and sets cookie
8. User redirected to main app (`/`)

**Server-Side Session Check**:
- All protected pages use `createServerSupabaseClient()` (from `lib/supabase/server.ts`)
- This reads the auth cookie and validates the session
- If no session, redirects to sign-in

## Chat & Prompt Refinement Flow

### Streaming Chat (POST /api/chat)

```mermaid
User Browser → Send Message
  → POST /api/chat
  → Server: Validate Session
  → Server: Fetch User's OpenAI Key (Vault)
  → Server: Create Chat Record (if new)
  → Server: Save User Message to DB
  → Server: Call OpenAI API (streaming)
  → Server: Stream Response to Browser
  → Server: Save Assistant Message to DB
  → Server: Log Usage Event
  → Browser: Display Streamed Response
```

**Detailed Steps**:

1. **User types message** in chat UI
2. **Client sends POST** to `/api/chat` with message and optional chat_id
3. **Server validates session**:
   - Calls `supabase.auth.getSession()`
   - Returns 401 if unauthorized
4. **Server fetches OpenAI key**:
   - Calls `getSecret(userId, 'openai')` using admin client
   - Falls back to `OPENAI_API_KEY` env var if not found
5. **Server creates or loads chat**:
   - If `chat_id` provided, verify ownership and load
   - If new chat, insert into `chats` table
6. **Server saves user message**:
   - Insert into `messages` table with `role: 'user'`
7. **Server streams OpenAI response**:
   - Uses Vercel AI SDK `streamText()` with OpenAI provider
   - Streams chunks back to browser via Response stream
8. **Server saves assistant message**:
   - After stream completes, insert into `messages` with `role: 'assistant'`
9. **Server logs usage**:
   - Insert into `usage_events` with token count, cost, model, chat_id
10. **Browser displays response**:
    - Vercel AI SDK `useChat()` hook displays streamed text in real-time

## Track Generation Flow

### Generate Track (Server Action)

```mermaid
User Browser → Generate Track
  → Server Action: generateTrack()
  → Server: Validate Session
  → Server: Fetch ElevenLabs Key (Vault)
  → Server: Call ElevenLabs API
  → Server: Upload Audio to Supabase Storage
  → Server: Save Track Record to DB
  → Server: Log Usage Event
  → Browser: Receive Track URL
  → Browser: Display Player with Signed URL
```

**Detailed Steps**:

1. **User clicks Generate** with refined prompt
2. **Server action invoked** (e.g., `generateTrack()` from server component/action)
3. **Server validates session** (same as chat flow)
4. **Server fetches ElevenLabs key**:
   - Calls `getSecret(userId, 'elevenlabs')`
   - Falls back to `ELEVENLABS_API_KEY` env var if not found
5. **Server calls ElevenLabs API**:
   - Uses `@elevenlabs/elevenlabs-js` SDK
   - Passes prompt and voice settings
   - Receives audio stream or buffer
6. **Server uploads audio**:
   - Uploads to `tracks/{userId}/{trackId}.mp3` in Supabase Storage
   - Uses admin client for upload (bypasses RLS during upload)
7. **Server saves track record**:
   - Insert into `tracks` table with metadata (prompt, model, duration, etc.)
8. **Server logs usage**:
   - Insert into `usage_events` with character count, cost, model, track_id
9. **Server returns track data**:
   - Returns track_id and metadata to client
10. **Browser fetches signed URL**:
    - Calls `supabase.storage.from('tracks').createSignedUrl(path, 3600)`
    - URL valid for 1 hour
11. **Browser displays player**:
    - Renders HTML5 audio player with signed URL

## API Key Storage Flow

### Save API Keys (POST /api/settings/secrets)

```mermaid
User Browser → Submit Keys Form
  → POST /api/settings/secrets
  → Server: Validate Session
  → Server: Store Keys in Vault
  → Server: Return Success
  → Browser: Confirm Saved
```

**Detailed Steps**:

1. **User enters keys** in Settings page form
2. **Client sends POST** to `/api/settings/secrets` with `{ openai_key, elevenlabs_key }`
3. **Server validates session**
4. **Server validates input**:
   - Check key format (e.g., OpenAI keys start with `sk-`, ElevenLabs keys are alphanumeric)
5. **Server stores in Vault**:
   - Calls `setSecret(userId, 'openai', openai_key)` via admin client
   - Calls `setSecret(userId, 'elevenlabs', elevenlabs_key)`
   - Vault encrypts and stores in `vault.secrets` table
6. **Server returns success** (200 OK)
7. **Browser confirms** with success message

**Security Notes**:
- Keys are **never** sent back to the client after storage
- Keys are **never** logged or exposed in error messages
- Vault access requires service role key (server-only)

## Usage Tracking Flow

### Log Usage Event

Every provider API call triggers a usage event:

```mermaid
Provider API Call Completes
  → Extract Metadata (tokens, characters, model)
  → Calculate Cost
  → Insert into usage_events Table
  → (Optional) Trigger Daily Rollup
```

**Metadata Captured**:
- `user_id`: From session
- `chat_id` or `track_id`: Attribution
- `action_type`: `refine`, `generate`, etc.
- `provider`: `openai` or `elevenlabs`
- `model`: Model name (e.g., `gpt-4o`, `eleven_multilingual_v2`)
- `tokens` or `characters`: Usage units
- `estimated_cost_usd`: Calculated from `provider_pricing` table
- `action_group_id`: Correlates multi-step operations

**Daily Rollup**:
- Currently not automated
- Future: Cron job or trigger to aggregate `usage_events` into `usage_daily_rollups`

## Storage Access Flow

### Read Track Audio

```mermaid
User → Click Play
  → Client: Request Signed URL
  → Supabase Storage: Verify RLS
  → Supabase Storage: Generate Signed URL
  → Client: Fetch Audio via Signed URL
  → Browser: Play Audio
```

**Detailed Steps**:

1. **User clicks Play** on a track
2. **Client requests signed URL**:
   - `supabase.storage.from('tracks').createSignedUrl('tracks/{userId}/{trackId}.mp3', 3600)`
   - Uses user's auth token (anon key + session)
3. **Storage verifies ownership**:
   - Storage policies check if `auth.uid()` matches path prefix
4. **Storage returns signed URL**:
   - Time-limited (1 hour) URL with signature
5. **Client fetches audio**:
   - Direct HTTP request to signed URL (bypasses RLS)
6. **Browser plays audio**:
   - HTML5 `<audio>` element

## Error Handling

### General Pattern

All API routes and server actions follow this pattern:

```typescript
try {
  // 1. Validate session
  const session = await validateSession();
  if (!session) return { error: 'Unauthorized' };

  // 2. Validate input
  const validated = schema.parse(input);

  // 3. Perform operation
  const result = await doWork(validated);

  // 4. Return success
  return { data: result };
} catch (error) {
  // 5. Log sanitized error (no secrets, no headers)
  console.error('Operation failed:', sanitizeError(error));

  // 6. Return typed error
  return { error: 'Operation failed', details: error.message };
}
```

### Retry Logic

Currently none. Provider calls fail fast. Future considerations:
- Exponential backoff for rate limits
- Retry on transient network errors

## Related Documentation

- [Back to Index](../INDEX.md)
- [System Overview](./OVERVIEW.md)
- [Secrets Management](../security/SECRETS.md)
- [Usage Tracking](../usage/TRACKING.md)
- [Storage Policies](../security/STORAGE.md)
