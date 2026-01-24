# Task: Drag-to-Reorder Layers

## Metadata

| Field       | Value                        |
| ----------- | ---------------------------- |
| ID          | `004-002-layer-drag-reorder` |
| Status      | `todo`                       |
| Priority    | `004` Low                    |
| Created     | `2026-01-24 14:55`           |
| Started     |                              |
| Completed   |                              |
| Blocked By  |                              |
| Blocks      |                              |
| Assigned To |                              |
| Assigned At |                              |

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

1. Install react-beautiful-dnd or @dnd-kit/core
2. Wrap LayersPanel layer list in DragDropContext
3. Make LayerRow draggable
4. Handle onDragEnd to reorder layers array
5. Add drop indicator styling
6. Test drag functionality
7. Update component tests

---

## Work Log

_(empty - task not started)_

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
