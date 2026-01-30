"use client";

import { useCallback, useMemo } from "react";
import { midiToNoteName } from "@/lib/hooks/useMIDI";

interface MIDIKeyboardProps {
  /** Currently pressed notes (Set of MIDI note numbers) */
  activeNotes: Set<number>;
  /** Starting note (MIDI number, default 48 = C3) */
  startNote?: number;
  /** Number of octaves to display (default 2) */
  octaves?: number;
  /** Callback when a key is clicked */
  onNoteOn?: (note: number, velocity: number) => void;
  /** Callback when a key is released */
  onNoteOff?: (note: number) => void;
  /** Show note labels on keys */
  showLabels?: boolean;
  /** Height of the keyboard in pixels */
  height?: number;
}

interface KeyProps {
  note: number;
  isBlack: boolean;
  isActive: boolean;
  showLabel: boolean;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

function Key({
  note,
  isBlack,
  isActive,
  showLabel,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
}: KeyProps) {
  const noteName = midiToNoteName(note);
  const isC = note % 12 === 0;

  if (isBlack) {
    return (
      <button
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        className={`absolute z-10 rounded-b-sm transition-all duration-75 ${
          isActive ? "bg-cyan-400 shadow-lg shadow-cyan-500/50" : "bg-slate-800 hover:bg-slate-700"
        }`}
        style={{
          width: "60%",
          height: "60%",
          left: "70%",
          transform: "translateX(-50%)",
        }}
        title={noteName}
      >
        {showLabel && (
          <span
            className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-medium ${
              isActive ? "text-slate-900" : "text-slate-500"
            }`}
          >
            {noteName}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      className={`relative flex-1 rounded-b-sm border-r border-slate-700 last:border-r-0 transition-all duration-75 ${
        isActive ? "bg-cyan-400 shadow-inner" : "bg-slate-100 hover:bg-slate-200"
      }`}
      title={noteName}
    >
      {showLabel && (isC || isActive) && (
        <span
          className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-medium ${
            isActive ? "text-slate-900" : "text-slate-500"
          }`}
        >
          {noteName}
        </span>
      )}
    </button>
  );
}

/**
 * Visual MIDI keyboard component
 * Shows pressed notes and allows mouse input
 */
export function MIDIKeyboard({
  activeNotes,
  startNote = 48, // C3
  octaves = 2,
  onNoteOn,
  onNoteOff,
  showLabels = true,
  height = 80,
}: MIDIKeyboardProps) {
  // Calculate all notes to display
  const notes = useMemo(() => {
    const result: { note: number; isBlack: boolean }[] = [];
    const blackKeyIndices = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

    for (let octave = 0; octave < octaves; octave++) {
      for (let i = 0; i < 12; i++) {
        const note = startNote + octave * 12 + i;
        const isBlack = blackKeyIndices.includes(i);
        result.push({ note, isBlack });
      }
    }
    // Add final C of the last octave
    result.push({ note: startNote + octaves * 12, isBlack: false });

    return result;
  }, [startNote, octaves]);

  // Separate white and black keys
  const whiteKeys = useMemo(() => notes.filter((n) => !n.isBlack), [notes]);
  const blackKeys = useMemo(() => notes.filter((n) => n.isBlack), [notes]);

  // Get the position index for a black key
  const getBlackKeyPosition = useCallback(
    (note: number) => {
      const noteInOctave = note % 12;
      const octaveOffset = Math.floor((note - startNote) / 12);
      const whiteKeysBeforeNote =
        octaveOffset * 7 + [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6][noteInOctave];
      return whiteKeysBeforeNote;
    },
    [startNote]
  );

  const handleNoteOn = useCallback(
    (note: number) => {
      onNoteOn?.(note, 0.8); // Default velocity
    },
    [onNoteOn]
  );

  const handleNoteOff = useCallback(
    (note: number) => {
      onNoteOff?.(note);
    },
    [onNoteOff]
  );

  const whiteKeyWidth = 100 / whiteKeys.length;

  return (
    <div
      className="relative rounded-lg bg-slate-950 border border-cyan-500/20 overflow-hidden"
      style={{ height }}
    >
      {/* White keys */}
      <div className="flex h-full">
        {whiteKeys.map(({ note }) => (
          <Key
            key={note}
            note={note}
            isBlack={false}
            isActive={activeNotes.has(note)}
            showLabel={showLabels}
            onMouseDown={() => handleNoteOn(note)}
            onMouseUp={() => handleNoteOff(note)}
            onMouseLeave={() => {
              if (activeNotes.has(note)) handleNoteOff(note);
            }}
          />
        ))}
      </div>

      {/* Black keys */}
      {blackKeys.map(({ note }) => {
        const position = getBlackKeyPosition(note);
        return (
          <div
            key={note}
            className="absolute top-0"
            style={{
              left: `${position * whiteKeyWidth}%`,
              width: `${whiteKeyWidth}%`,
              height: "60%",
            }}
          >
            <Key
              note={note}
              isBlack={true}
              isActive={activeNotes.has(note)}
              showLabel={showLabels}
              onMouseDown={() => handleNoteOn(note)}
              onMouseUp={() => handleNoteOff(note)}
              onMouseLeave={() => {
                if (activeNotes.has(note)) handleNoteOff(note);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
