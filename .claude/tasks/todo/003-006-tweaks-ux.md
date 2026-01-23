# Task: Tweaks UX - Quick Parameter Sliders

## Metadata

| Field | Value |
|-------|-------|
| ID | `003-006-tweaks-ux` |
| Status | `todo` |
| Priority | `003` Medium |
| Created | `2026-01-23 12:00` |
| Started | |
| Completed | |
| Blocked By | |
| Blocks | |
| Assigned To | |
| Assigned At | |

---

## Context

Users want quick, visual controls to tweak their beats without typing code or chatting. Sliders for common parameters provide immediate feedback and encourage experimentation.

- BPM: tempo control
- Swing: groove feel
- Density: note frequency
- Filter: brightness/darkness
- Drum balance: kick vs snare vs hats
- Effects: delay, reverb amount

---

## Acceptance Criteria

- [ ] Collapsible "Tweaks" panel in UI
- [ ] BPM slider (60-200, updates setcps)
- [ ] Swing slider (0-100%)
- [ ] Master filter slider (lowpass cutoff)
- [ ] Reverb/delay amount sliders
- [ ] Changes apply in real-time while playing
- [ ] Visual feedback (current value display)
- [ ] Reset to defaults button
- [ ] Tweaks persist with track save
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Create tweaks panel component**
   - Files: `components/tweaks/tweaks-panel.tsx`
   - Collapsible sidebar or bottom panel
   - Slider components

2. **Create individual slider components**
   - Files: `components/tweaks/bpm-slider.tsx`, etc.
   - Range input with value display
   - Debounced updates

3. **Implement BPM control**
   - Modify setcps() in code
   - Or use Strudel's global controls

4. **Implement effect controls**
   - Use Strudel's global parameters if available
   - Or inject wrapper code

5. **Add persistence**
   - Store tweak values with track
   - Apply on load

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

- Need to research Strudel's runtime parameter control
- May need to wrap user code to inject controls
- Consider MIDI controller support in future

---

## Links

- Strudel docs: parameters and controls
