# LoField Music Lab

## Strudel MVP

A Next.js application for generating lofi beats through chat using Strudel live coding.

### Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and add your `OPENAI_API_KEY`
3. `npm run dev`
4. Open http://localhost:3000/strudel

### Usage
1. Click "Init Audio" (required once for browser audio) or simply click "Play" - audio will initialize automatically on first play
2. Click "Play" to hear the default beat
3. Chat "make a lofi beat at 90bpm" to generate new code
4. Follow-up messages tweak the same track

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
