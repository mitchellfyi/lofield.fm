# Task: Drag-to-Reorder Layers

## Metadata

| Field       | Value                        |
| ----------- | ---------------------------- |
| ID          | `004-002-layer-drag-reorder` |
| Status      | `doing`                      |
| Priority    | `004` Low                    |
| Created     | `2026-01-24 14:55`           |
| Started     | `2026-01-25 20:26`           |
| Completed   |                              |
| Blocked By  |                              |
| Blocks      |                              |
| Assigned To | `worker-1` |
| Assigned At | `2026-01-25 20:26` |

---

## Context

Follow-up from task 003-007-multi-track-support. The multi-track layer system is functional but lacks drag-to-reorder capability for organizing layers visually.

Users should be able to drag layers to reorder them in the LayersPanel. This is a UX enhancement that improves workflow when working with multiple layers.

---

## Acceptance Criteria

- [ ] Layers can be dragged to reorder in the LayersPanel
- [ ] Visual feedback during drag (drop indicator, ghost element)
- [ ] Order persists after drag completes
- [ ] Order affects playback order (layers combine in displayed order)
- [ ] Keyboard accessibility for reordering (optional)
- [ ] Tests for drag reorder functionality
- [ ] Quality gates pass

---

## Plan

### Implementation Plan (Generated 2026-01-25 20:30)

#### Gap Analysis
| Criterion | Status | Gap |
|-----------|--------|-----|
| Layers can be dragged to reorder in the LayersPanel | **no** | No drag-drop functionality exists - need to add from scratch |
| Visual feedback during drag (drop indicator, ghost element) | **no** | Needs drag styling, drop indicators, and ghost/preview element |
| Order persists after drag completes | **no** | Need to call `onLayersChange` with reordered array |
| Order affects playback order (layers combine in displayed order) | **yes** | `combineLayers()` in `lib/audio/layerCombiner.ts` already processes layers in array order - playback order = display order |
| Keyboard accessibility for reordering (optional) | **no** | Not implemented but marked optional |
| Tests for drag reorder functionality | **no** | Need to add new test cases |
| Quality gates pass | **pending** | Will verify after implementation |

#### Library Selection: @dnd-kit/core
Rationale (per task notes):
- More modern than react-beautiful-dnd (which is deprecated and no longer maintained)
- Built-in accessibility support (keyboard navigation, screen readers)
- Tree-shakeable - only imports what we need
- Works well with React 19

#### Files to Modify

1. **`package.json`** - Add @dnd-kit dependencies
   - Add `@dnd-kit/core` for drag-drop primitives
   - Add `@dnd-kit/sortable` for sortable list utilities
   - Add `@dnd-kit/utilities` for CSS transform utilities

2. **`components/studio/LayersPanel.tsx`** - Add drag-drop context
   - Import DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors
   - Import SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy
   - Import arrayMove utility for reordering
   - Wrap layers list in DndContext + SortableContext
   - Add handleDragEnd function to reorder layers and call onLayersChange
   - Pass drag state to LayerRow for visual feedback

3. **`components/studio/LayerRow.tsx`** - Make rows draggable
   - Import useSortable from @dnd-kit/sortable
   - Import CSS transform utilities
   - Accept new props: `id` (for sortable), `isDragging` (for styling)
   - Apply sortable attributes and listeners to row container
   - Add drag handle element (optional - could make whole row draggable)
   - Add visual feedback styles:
     - Opacity/scale change when dragging
     - Border/highlight when dragging over
     - Drop indicator line between items

4. **`components/studio/__tests__/LayersPanel.test.ts`** - Add drag tests
   - Test: layers array reorders when handleDragEnd called
   - Test: first layer to last position works correctly
   - Test: last layer to first position works correctly
   - Test: arrayMove utility function works correctly
   - Test: onLayersChange called with reordered array

5. **`components/studio/__tests__/LayerRow.test.ts`** - Add drag props tests
   - Test: dragging state affects visual styles
   - Test: drag handle is accessible (aria attributes)
   - Test: sortable attributes are applied

#### Implementation Order
1. Install @dnd-kit packages (package.json)
2. Update LayerRow to be sortable (add useSortable hook and visual feedback)
3. Update LayersPanel to provide drag context (DndContext + SortableContext + handleDragEnd)
4. Add tests for the new functionality
5. Run quality gates to verify

#### CSS Styling Plan
```css
/* When dragging an item */
.layer-row--dragging {
  opacity: 0.8;
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.4);
}

/* Drop indicator line */
.drop-indicator {
  height: 2px;
  background: linear-gradient(to right, transparent, cyan, transparent);
}
```

#### Accessibility Considerations
- Keyboard support: Arrow keys to navigate, Space/Enter to pick up/drop
- Screen reader announcements: "Grabbed item", "Moved to position X", "Dropped"
- Focus management: Return focus to moved item after drop
- @dnd-kit provides most of this out of the box

#### Test Plan
- [ ] Unit: `handleDragEnd` correctly reorders layers array
- [ ] Unit: Moving first to last position preserves all other items
- [ ] Unit: Moving last to first position preserves all other items
- [ ] Unit: LayerRow receives and applies isDragging prop correctly
- [ ] Unit: LayerRow receives and applies sortable transform correctly
- [ ] Integration: Full drag reorder updates combined code for playback

#### Docs to Update
- None required (internal UI feature, no public API changes)

---

## Work Log

### 2026-01-25 20:31 - Implementation Complete

**Changes Made:**

1. **package.json** - Installed @dnd-kit packages
   - Commit: `85791f9` - "chore: Add @dnd-kit packages for layer drag reorder"
   - Added: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

2. **components/studio/LayerRow.tsx** - Made rows sortable
   - Commit: `bd3ae48` - "feat: Make LayerRow sortable with drag handle"
   - Added useSortable hook from @dnd-kit/sortable
   - Added drag handle with grip icon (8 dots)
   - Applied transform and transition styles for smooth dragging
   - Added visual feedback: opacity-80, scale-[1.02], shadow-lg when dragging
   - Added isDragging prop for external control

3. **components/studio/LayersPanel.tsx** - Added drag context
   - Commit: `f148a0c` - "feat: Add drag-drop context to LayersPanel"
   - Wrapped layers in DndContext and SortableContext
   - Added PointerSensor with 5px activation distance
   - Added KeyboardSensor for accessibility (arrow keys)
   - Implemented handleDragEnd with arrayMove utility
   - Order persists through onLayersChange callback

**Quality Checks:**
- ESLint: ✅ Pass
- TypeScript: ✅ Pass
- All 2048 tests: ✅ Pass

**Next:** Test phase (add unit tests for drag reorder functionality)

### 2026-01-25 20:30 - Planning Complete

**Gap Analysis Findings:**
- No drag-drop functionality exists - must be built from scratch
- Key insight: `combineLayers()` in `lib/audio/layerCombiner.ts` already processes layers in array order, so playback order matches display order automatically - no additional work needed there
- Existing tests are logic-only (no component rendering) - will follow same pattern

**Library Decision:** @dnd-kit/core (not react-beautiful-dnd)
- react-beautiful-dnd is deprecated and unmaintained
- @dnd-kit is modern, accessible, and works with React 19
- Packages needed: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

**Files identified for modification:**
1. package.json - add dependencies
2. LayersPanel.tsx - wrap in DndContext, add handleDragEnd
3. LayerRow.tsx - use useSortable hook, add drag handle and visual feedback
4. LayersPanel.test.ts - add reorder logic tests
5. LayerRow.test.ts - add drag state tests

**Ready for implementation phase.**

---

### 2026-01-25 20:26 - Triage Complete

- Dependencies: ✅ Parent task 003-007-multi-track-support is complete in done/
- Task clarity: Clear - well-defined acceptance criteria for drag-to-reorder functionality
- Ready to proceed: Yes
- Notes:
  - Both target files exist: LayersPanel.tsx and LayerRow.tsx
  - Plan mentions two library options (@dnd-kit/core vs react-beautiful-dnd)
  - Notes recommend @dnd-kit/core as more modern and accessible - this is good guidance
  - All acceptance criteria are specific and testable

---

## Testing Evidence

_(empty - task not started)_

---

## Notes

- Consider using @dnd-kit/core as it's more modern and accessible
- Layer order affects combined code output order
- May need touch support for mobile

---

## Links

- Parent task: 003-007-multi-track-support
- `components/studio/LayersPanel.tsx`
- `components/studio/LayerRow.tsx`
