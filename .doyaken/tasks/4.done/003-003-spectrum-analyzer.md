# Task: Add Real-time Spectrum Analyzer

## Metadata

| Field       | Value                       |
| ----------- | --------------------------- |
| ID          | `003-003-spectrum-analyzer` |
| Status      | `todo`                      |
| Priority    | `003` Medium                |
| Created     | `2026-01-29 21:20`          |
| Started     |                             |
| Completed   |                             |
| Blocked By  |                             |
| Blocks      |                             |
| Assigned To |                             |
| Assigned At |                             |

---

## Context

Visual feedback helps users understand their audio output. A spectrum analyzer shows frequency content in real-time, helping users understand EQ, identify muddiness, and see the impact of their changes.

**Problem Statement:**

- **Who**: Users creating and mixing audio
- **What**: No visual representation of frequency content
- **Why**: Spectrum analyzers are standard in audio software
- **Current workaround**: Listen-only, no visual feedback

**Impact**: Medium - improves understanding and mixing decisions

---

## Acceptance Criteria

- [ ] Real-time FFT visualization during playback
- [ ] Logarithmic frequency scale (20Hz - 20kHz)
- [ ] dB amplitude scale
- [ ] Smooth animation (60fps target)
- [ ] Frequency labels on axis
- [ ] Peak hold option
- [ ] Toggleable in UI (doesn't take space when off)
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Step 1**: Create analyzer component
   - Files: `components/studio/SpectrumAnalyzer.tsx`
   - Actions: Canvas-based visualization, FFT data handling

2. **Step 2**: Connect to Tone.js audio
   - Files: `lib/audio/analyzerBridge.ts`
   - Actions: Tone.Analyser integration, data extraction

3. **Step 3**: Implement visualization
   - Files: `components/studio/SpectrumAnalyzer.tsx`
   - Actions: Log scale, bar/line visualization, peak hold

4. **Step 4**: Add toggle and placement
   - Files: `components/studio/Studio.tsx` or relevant layout
   - Actions: Toggle button, responsive placement

5. **Step 5**: Performance optimization
   - Files: `components/studio/SpectrumAnalyzer.tsx`
   - Actions: RequestAnimationFrame, throttling, canvas optimization

6. **Step 6**: Write tests
   - Files: `components/studio/__tests__/SpectrumAnalyzer.test.ts`
   - Coverage: Data processing, render performance, toggle state

---

## Notes

- Use Tone.Analyser or Tone.FFT
- Consider WebGL for better performance if needed
- Keep CPU usage minimal when not visible
- Could add waveform oscilloscope view as Phase 2

---

## Links

- Tone.Analyser: https://tonejs.github.io/docs/14.7.77/Analyser
- Canvas performance: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
