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

### Mobile Browser Support

The studio is designed to work on mobile devices with a responsive layout:

- **Responsive Design**: Single-column layout with tab switching (Chat/Code) on screens < 768px
- **Touch Targets**: All interactive elements meet the 44px minimum for accessibility
- **iOS Safari**: Special handling for AudioContext interruptions (phone calls, Siri, backgrounding)
- **Virtual Keyboard**: Layout adjusts properly when the on-screen keyboard appears

**Mobile-specific notes:**

- iOS Safari may require tapping the Play button again if audio is interrupted by a phone call or Siri
- Code editing is functional but optimized for desktop; consider using desktop for extended sessions
- The app supports "Add to Home Screen" as a progressive web app (PWA)

### Analytics

LoField Music Lab uses [Vercel Analytics](https://vercel.com/docs/analytics) to understand how users interact with the application.

- **Privacy-friendly**: No cookies used; visitors identified via privacy-preserving hashed IDs
- **What's tracked**: Page views, top pages, referrers, device types, and geographic regions
- **Data access**: View analytics in the [Vercel Dashboard](https://vercel.com/dashboard) under your project's Analytics tab
- **Production only**: Analytics are automatically enabled when deployed to Vercel; no data is collected in local development

The Analytics component is loaded in the root layout (`app/layout.tsx`) and requires no additional configuration.

### Use with Claude

`claude --dangerously-skip-permissions --model opus --permission-mode bypassPermissions`
