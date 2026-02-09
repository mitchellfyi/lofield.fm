# Add Audio Export/Download Feature

## Summary

Enable users to export their generated tracks as audio files (MP3/WAV) that they can download and use elsewhere.

## Why

Currently users can only play tracks in the browser. Export functionality would:

- Let users keep their creations
- Enable sharing tracks on social media or other platforms
- Add significant value for content creators

## Acceptance Criteria

- [ ] Add "Export" button to the studio interface
- [ ] Support MP3 and WAV export formats
- [ ] Show progress indicator during export
- [ ] Handle export for tracks with multiple layers
- [ ] Test export works correctly across browsers

## Technical Notes

- Use Tone.js `Recorder` class or Web Audio API's `MediaRecorder`
- Consider using `lamejs` for MP3 encoding client-side
- May need to play track in accelerated time for faster exports

## Priority

Medium - High value feature, moderate complexity
