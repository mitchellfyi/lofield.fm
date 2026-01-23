# MISSION.md - lofield.fm

## Vision

**lofield.fm** is a creative platform where anyone can make music through conversation. No musical training required—just describe what you want to hear, and AI brings it to life using live-coded patterns.

## Core Purpose

Democratize music creation by combining:
- **Conversational AI** - Natural language interface for music generation
- **Strudel Live Coding** - Powerful pattern-based music engine
- **Instant Feedback** - Hear changes immediately as you iterate

## Target Users

1. **Curious beginners** - People who want to make beats but don't know where to start
2. **Creative experimenters** - Musicians exploring algorithmic/generative approaches
3. **Lofi enthusiasts** - Producers looking for quick inspiration and starting points
4. **Educators** - Teaching music programming concepts interactively

## Product Principles

### 1. Immediate Gratification
Users should hear music within 30 seconds of landing. No signup walls, no tutorials—just play.

### 2. Conversational First
Chat is the primary interface. Code is visible for learning but optional to touch.

### 3. Safe Experimentation
Undo is always available. Nothing is lost. Break things freely.

### 4. Progressive Disclosure
Start simple, reveal power over time. Beginners see chat + play. Power users get multi-track, presets, exports.

### 5. Shareable Creations
Every beat deserves an audience. One-click sharing, embeddable players, social previews.

## Success Metrics

- **Engagement**: Time spent creating (sessions > 5 minutes)
- **Creation**: Tracks saved per user
- **Sharing**: Shared links created and clicked
- **Retention**: Users returning within 7 days
- **Conversion**: Free → paid tier (when applicable)

## Technical Foundation

- **Frontend**: Next.js 16 with React 19
- **AI**: Vercel AI SDK with OpenAI (user-provided keys)
- **Audio Engine**: Strudel (@strudel/web)
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Hosting**: Vercel Edge

## Non-Goals (For Now)

- Full DAW replacement (we're a sketchpad, not a studio)
- MIDI hardware support (focus on accessibility first)
- Collaborative real-time editing (complex, defer)
- Marketplace for beats (legal/licensing complexity)

## Roadmap Priorities

### Phase 1: Foundation ✅
- [x] Basic chat → Strudel code generation
- [x] Play/stop controls
- [x] Code editor for manual tweaks

### Phase 2: Reliability
- [ ] Quality gates and CI
- [ ] Structured AI output with validation
- [ ] User API key management
- [ ] Authentication (Supabase)

### Phase 3: Persistence
- [ ] Save tracks to database
- [ ] Version history and revert
- [ ] User profiles

### Phase 4: Sharing & Discovery
- [ ] Shareable public links
- [ ] Preset/template library
- [ ] Export options (audio, code)

### Phase 5: Power Features
- [ ] Multi-track support
- [ ] Real-time parameter tweaks
- [ ] Undo/redo system
- [ ] Mobile experience

### Phase 6: Production Readiness
- [ ] Rate limiting and quotas
- [ ] Observability and error tracking
- [ ] Cost controls

## Guiding Question

> "Can someone with zero music experience make a beat they're proud of in under 5 minutes?"

If the answer isn't yes, we have work to do.
