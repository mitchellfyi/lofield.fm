# LoField Music Lab

**Create lofi beats using natural language.** Just describe what you want, and AI generates the music for you.

[Try it live](https://lofield.fm) | [View on GitHub](https://github.com/your-repo)

---

## What is LoField?

LoField Music Lab is a browser-based music studio that lets you create chill lofi beats through conversation. No music theory required. No complex DAWs to learn. Just type what you want and hear it instantly.

```
"make a chill lofi beat at 90 bpm with a jazzy rhodes"
```

The AI writes the code. You hear the music. Tweak it, save it, share it.

## Features

### Chat-to-Music
Describe your beat in plain English. The AI generates Tone.js code that plays immediately in your browser. Want to change something? Just ask:

- *"add more swing"*
- *"make the drums quieter"*
- *"give it a vinyl crackle vibe"*

### Live Performance Controls
Real-time sliders for instant tweaks:
- **BPM** (60-200)
- **Swing** (0-100%)
- **Filter** (lowpass cutoff)
- **Reverb** & **Delay** wet mix

Changes apply instantly while the track plays.

### Multi-Layer Composition
Build complex arrangements with multiple audio layers:
- Add drum, bass, melody, and pad layers
- Mute/solo individual layers
- Drag-and-drop reordering
- Each layer has its own code

### Record Your Performance
Capture your live parameter changes (knob twists, slider moves) as automation:
- Hit record while playing
- Tweak any control
- Automation is saved and can be replayed
- Export with automation baked into the audio

### Full Version History
Never lose your work:
- Every AI-generated change is saved as a revision
- Browse and compare past versions with diff view
- One-click revert to any previous state
- Undo/redo with Cmd+Z / Cmd+Shift+Z

### Export & Share
- **Export to WAV** - Render 30s to 10min of audio
- **Share links** - Public URLs for anyone to play your track
- **Code export** - Copy the Tone.js code to use anywhere

### Professional Code Editor
Full-featured IDE experience:
- Syntax highlighting for JavaScript/Tone.js
- Live mode - code changes play immediately
- Error detection before playback
- Dark theme optimized for focus

### 32-Bar Arrangement Timeline
Visual timeline showing:
- Current playback position
- Section markers (A/B/C/D intro-build-drop-breakdown)
- Beat and bar counters

## Tech Stack

- **Next.js 16** with App Router
- **React 19** with Server Components
- **Tone.js** for audio synthesis
- **AI SDK** with OpenAI (GPT-4o, GPT-4o Mini, GPT-4 Turbo)
- **Supabase** for auth, database, and storage
- **CodeMirror 6** for code editing
- **Tailwind CSS 4** for styling
- **Vercel** for hosting

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase account (free tier works)
- An OpenAI API key (users bring their own)

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/your-repo/lofield.fm
   cd lofield.fm
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env.local` and fill in:
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # API Key Encryption
   API_KEY_ENCRYPTION_SECRET=  # Generate with: openssl rand -hex 32

   # Development fallback (optional)
   OPENAI_API_KEY=sk-...  # Only used in development when no user key

   # Error tracking (optional)
   SENTRY_DSN=
   ```

3. **Run database migrations**
   ```bash
   npx supabase db push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open the studio**

   Navigate to http://localhost:3000/studio

### API Keys

LoField uses a "bring your own key" (BYOK) model:
- Users provide their own OpenAI API key
- Keys are encrypted with AES-256-GCM before storage
- Keys never leave the user's account
- In development, falls back to `OPENAI_API_KEY` env var

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | TypeScript type checking |
| `npm run quality` | Run all quality checks |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |

## Project Structure

```
app/
├── studio/         # Main music studio
├── share/[token]/  # Public share pages
├── settings/       # User settings
├── auth/           # Sign in/up flows
├── admin/          # Admin dashboard
└── api/            # API routes (chat, tracks, etc.)

components/
├── studio/         # Studio UI components
├── auth/           # Authentication components
└── settings/       # Settings components

lib/
├── audio/          # Tone.js runtime, validation
├── hooks/          # React hooks
├── types/          # TypeScript types
└── export/         # Audio export utilities

prompts/            # AI system prompts
supabase/           # Database migrations
```

## AI Model Selection

Choose your preferred model in the studio:

| Model | Speed | Quality | Cost |
|-------|-------|---------|------|
| GPT-4o Mini | Fast | Good | Low |
| GPT-4o | Medium | Best | High |
| GPT-4 Turbo | Medium | Great | Medium |

Your selection persists across sessions.

## Browser Support

- **Desktop**: Chrome, Firefox, Safari, Edge (latest)
- **Mobile**: iOS Safari, Chrome for Android
  - Responsive single-column layout with tabs
  - Touch-optimized controls (44px minimum targets)
  - PWA support ("Add to Home Screen")

**Note**: Audio requires user interaction to start (browser security policy).

## Privacy

- **No tracking cookies** - Vercel Analytics uses privacy-preserving hashed IDs
- **Your keys, your data** - API keys are encrypted and never shared
- **Local storage** - Model preferences stored in browser
- **Shareable, not public** - Tracks are private unless you create a share link

## Contributing

Contributions welcome! Please read the contributing guidelines before submitting PRs.

## License

MIT

---

Built with Tone.js and GPT-4o. Made for the lofi community.
