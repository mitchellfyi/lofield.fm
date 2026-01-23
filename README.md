# LoField Music Lab

## Strudel MVP

A Next.js application for generating lofi beats through chat using Strudel live coding.

### Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and configure:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `API_KEY_ENCRYPTION_SECRET` - Generate with `openssl rand -hex 32`
   - `OPENAI_API_KEY` - (Optional) Fallback for development only
3. Run Supabase migrations: `npx supabase db push`
4. `npm run dev`
5. Open http://localhost:3000/studio

### Usage

1. Click "Init Audio" (required once for browser audio) or simply click "Play" - audio will initialize automatically on first play
2. Click "Play" to hear the default beat
3. Chat "make a lofi beat at 90bpm" to generate new code
4. Follow-up messages tweak the same track

### AI Model Selection

Select your preferred AI model from the dropdown in the top bar:

- **GPT-4o Mini** (default) - Fast and affordable, great for most tasks
- **GPT-4o** - Most capable, best for complex music generation
- **GPT-4 Turbo** - Powerful with large context window

Your selection persists in localStorage across sessions.

### API Key Management

Users must provide their own OpenAI API key to use the chat feature:

1. **First-time use**: A modal prompts you to enter your API key
2. **Settings page**: Access via the gear icon in the top bar to manage your key
3. **Security**: Keys are encrypted at rest using AES-256-GCM
4. **Privacy**: Your key is stored in your user account, never shared

In development mode (`NODE_ENV=development`), the app falls back to the server's `OPENAI_API_KEY` env var if no user key is set. In production, a user key is always required.

## Audio Initialization & Known Quirks

### Reliable Strudel Player

The Strudel audio engine has been enhanced with a reliable state machine to provide predictable behavior:

#### Player States

- **idle**: Initial state, audio not initialized
- **loading**: Initializing audio engine (brief)
- **ready**: Audio initialized, ready to play
- **playing**: Currently playing audio
- **error**: Error occurred during initialization or playback

#### Behavior

- **First Play**: Clicking "Play" for the first time automatically initializes audio (requires user gesture per browser policies)
- **Explicit Init**: You can also click "Init Audio" to initialize before playing
- **Re-running Code**: If already playing, clicking "Play" stops and restarts with the current code
- **Error Handling**: Runtime errors are captured and displayed with clear messages
- **Console Panel**: Track the last 10 runtime events (init, play, stop, success, failures) for diagnostics

#### Known Quirks

- Browser audio requires a user gesture (click/tap) to initialize - this is a web standard security feature
- Hot reload during development may require re-initializing audio
- The runtime maintains a singleton instance to prevent multiple initializations
- Strudel library is loaded from CDN and must complete loading before use

### Use with Claude

`claude  --allow-dangerously-skip-permissions   --chrome  --dangerously-skip-permissions --model opus --permission-mode dontAsk`
