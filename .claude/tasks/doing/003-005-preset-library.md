# Task: Preset Library with Starter Patterns and Genre Templates

## Metadata

| Field       | Value                    |
| ----------- | ------------------------ |
| ID          | `003-005-preset-library` |
| Status      | `todo`                   |
| Priority    | `003` Medium             |
| Created     | `2026-01-23 12:00`       |
| Started     |                          |
| Completed   |                          |
| Blocked By  |                          |
| Blocks      |                          |
| Assigned To | `worker-1` |
| Assigned At | `2026-01-24 12:37` |

---

## Context

New users need inspiration and starting points. A preset library with genre templates (lofi, ambient, techno, etc.) and starter patterns makes the app more accessible and fun.

- Current: single hardcoded default pattern
- Need: library of curated presets
- Categories: genre, mood, complexity
- One-click load to editor

---

## Acceptance Criteria

- [ ] Preset data structure: name, category, description, code, tags
- [ ] At least 10 curated presets across genres
- [ ] Preset browser UI (grid or list view)
- [ ] Filter by category/tag
- [ ] Search presets
- [ ] Preview preset (play without loading)
- [ ] "Load" button replaces current code
- [ ] Confirmation if unsaved changes exist
- [ ] Tests written and passing
- [ ] Quality gates pass
- [ ] Changes committed with task reference

---

## Plan

1. **Create preset data**
   - Files: `lib/presets.ts` or `data/presets.json`
   - Curated presets with metadata
   - Categories: lofi, ambient, techno, house, experimental

2. **Create preset browser**
   - Files: `components/presets/preset-browser.tsx`
   - Grid layout with cards
   - Category tabs/filters
   - Search input

3. **Add preview functionality**
   - Hover or button to play preview
   - Stop on mouse leave or cancel

4. **Integrate with editor**
   - Files: `app/strudel/page.tsx`
   - Load preset replaces code
   - Unsaved changes warning

5. **Create preset card component**
   - Files: `components/presets/preset-card.tsx`
   - Name, description, tags
   - Preview and load buttons

---

## Work Log

(To be filled during execution)

---

## Testing Evidence

(To be filled during execution)

---

## Notes

Preset ideas:

- Lofi chill hop
- Ambient drone
- 4-on-floor house
- Breakbeat
- Minimal techno
- Jazz fusion
- Vaporwave
- Synthwave
- Drum & bass
- Ambient rain

---

## Links

- Strudel examples: https://strudel.cc/examples/
