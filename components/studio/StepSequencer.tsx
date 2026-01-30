"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  createDefaultTracks,
  createTrack,
  generateSequencerCode,
  DRUM_SOUNDS,
  type SequencerTrack,
  type DrumSound,
} from "@/lib/audio/sequencerCodeGen";
import { useTransportState } from "@/lib/audio/useVisualization";

interface StepSequencerProps {
  /** Callback when code is generated and ready to copy */
  onCopyCode?: (code: string) => void;
  /** Initial BPM (default 120) */
  initialBpm?: number;
  /** Initial step count (default 16) */
  initialSteps?: number;
  /** Compact mode for smaller screens */
  compact?: boolean;
}

interface StepButtonProps {
  active: boolean;
  velocity: number;
  isCurrentStep: boolean;
  onClick: () => void;
  onVelocityChange: (velocity: number) => void;
}

function StepButton({
  active,
  velocity,
  isCurrentStep,
  onClick,
  onVelocityChange,
}: StepButtonProps) {
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startVelocityRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) {
      // Right click - start velocity drag
      e.preventDefault();
      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      startVelocityRef.current = velocity;
    } else {
      // Left click - toggle
      onClick();
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaY = startYRef.current - e.clientY;
      const deltaVelocity = deltaY / 100;
      const newVelocity = Math.max(0.1, Math.min(1, startVelocityRef.current + deltaVelocity));
      onVelocityChange(newVelocity);
    },
    [onVelocityChange]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <button
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-6 h-8 rounded-sm transition-all duration-75 border ${
        active
          ? "border-cyan-400/50"
          : isCurrentStep
            ? "border-amber-400/50 bg-amber-500/10"
            : "border-slate-600/50 hover:border-slate-500"
      }`}
      title={active ? `Velocity: ${Math.round(velocity * 100)}%` : "Click to enable"}
    >
      {/* Velocity fill */}
      {active && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-cyan-500 rounded-sm transition-all"
          style={{ height: `${velocity * 100}%` }}
        />
      )}
      {/* Current step indicator */}
      {isCurrentStep && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
      )}
    </button>
  );
}

/**
 * Visual step sequencer for creating drum patterns
 */
export function StepSequencer({
  onCopyCode,
  initialBpm = 120,
  initialSteps = 16,
  compact = false,
}: StepSequencerProps) {
  const [tracks, setTracks] = useState<SequencerTrack[]>(() => createDefaultTracks(initialSteps));
  const [bpm, setBpm] = useState(initialBpm);
  const [stepCount, setStepCount] = useState(initialSteps);
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Transport state for playhead position
  const transport = useTransportState();
  const currentStep = transport.playing ? Math.floor(transport.beat % stepCount) : -1;

  // Toggle a step
  const toggleStep = useCallback((trackId: string, stepIndex: number) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;
        const newSteps = [...track.steps];
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          active: !newSteps[stepIndex].active,
        };
        return { ...track, steps: newSteps };
      })
    );
  }, []);

  // Update velocity for a step
  const updateVelocity = useCallback((trackId: string, stepIndex: number, velocity: number) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;
        const newSteps = [...track.steps];
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          velocity,
          active: true, // Auto-enable when adjusting velocity
        };
        return { ...track, steps: newSteps };
      })
    );
  }, []);

  // Add a new track
  const addTrack = useCallback(
    (sound: DrumSound) => {
      setTracks((prev) => [...prev, createTrack(sound, stepCount)]);
    },
    [stepCount]
  );

  // Remove a track
  const removeTrack = useCallback((trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  }, []);

  // Clear all steps in a track
  const clearTrack = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;
        return {
          ...track,
          steps: track.steps.map((s) => ({ ...s, active: false })),
        };
      })
    );
  }, []);

  // Change step count
  const changeStepCount = useCallback((newCount: number) => {
    setStepCount(newCount);
    setTracks((prev) =>
      prev.map((track) => {
        const newSteps = [...track.steps];
        while (newSteps.length < newCount) {
          newSteps.push({ active: false, velocity: 0.8 });
        }
        return { ...track, steps: newSteps.slice(0, newCount) };
      })
    );
  }, []);

  // Generate and copy code
  const handleCopyCode = useCallback(() => {
    const code = generateSequencerCode(tracks, bpm);
    navigator.clipboard.writeText(code);
    onCopyCode?.(code);
  }, [tracks, bpm, onCopyCode]);

  // Available sounds that aren't already in use
  const availableSounds = Object.keys(DRUM_SOUNDS).filter(
    (sound) => !tracks.some((t) => t.sound === sound)
  ) as DrumSound[];

  return (
    <div className="rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 border-b border-cyan-500/20 bg-slate-900/50 hover:bg-slate-900/70 transition-colors flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
          <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
            Step Sequencer
          </div>
          {tracks.some((t) => t.steps.some((s) => s.active)) && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[9px] font-medium">
              {tracks.filter((t) => t.steps.some((s) => s.active)).length} active
            </span>
          )}
        </div>
        <svg
          className={`w-3 h-3 text-cyan-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* BPM */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase">BPM</span>
              <input
                type="number"
                value={bpm}
                onChange={(e) =>
                  setBpm(Math.max(60, Math.min(200, parseInt(e.target.value) || 120)))
                }
                className="w-16 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white text-center"
                min={60}
                max={200}
              />
            </div>

            {/* Step count */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase">Steps</span>
              <select
                value={stepCount}
                onChange={(e) => changeStepCount(parseInt(e.target.value))}
                className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white"
              >
                <option value={8}>8</option>
                <option value={16}>16</option>
                <option value={32}>32</option>
              </select>
            </div>

            {/* Add track */}
            {availableSounds.length > 0 && (
              <select
                value=""
                onChange={(e) => addTrack(e.target.value as DrumSound)}
                className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white"
              >
                <option value="">+ Add Track</option>
                {availableSounds.map((sound) => (
                  <option key={sound} value={sound}>
                    {DRUM_SOUNDS[sound].label}
                  </option>
                ))}
              </select>
            )}

            {/* Copy code */}
            <button
              onClick={handleCopyCode}
              className="ml-auto px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded transition-colors"
            >
              Copy Code
            </button>
          </div>

          {/* Grid */}
          <div className="space-y-2 overflow-x-auto">
            {/* Beat markers */}
            <div className="flex items-center gap-1 pl-20">
              {Array.from({ length: stepCount }).map((_, i) => (
                <div
                  key={i}
                  className={`w-6 text-center text-[9px] ${
                    i % 4 === 0 ? "text-slate-300 font-medium" : "text-slate-500"
                  }`}
                >
                  {i % 4 === 0 ? i / 4 + 1 : "·"}
                </div>
              ))}
            </div>

            {/* Tracks */}
            {tracks.map((track) => (
              <div key={track.id} className="flex items-center gap-2">
                {/* Track label */}
                <div className="w-16 flex items-center gap-1">
                  <span className="text-xs text-slate-300 truncate">{track.name}</span>
                </div>

                {/* Track controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => clearTrack(track.id)}
                    className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors"
                    title="Clear track"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                  {tracks.length > 1 && (
                    <button
                      onClick={() => removeTrack(track.id)}
                      className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove track"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Steps */}
                <div className="flex gap-1">
                  {track.steps.map((step, stepIndex) => (
                    <div
                      key={stepIndex}
                      className={stepIndex % 4 === 0 && stepIndex > 0 ? "ml-1" : ""}
                    >
                      <StepButton
                        active={step.active}
                        velocity={step.velocity}
                        isCurrentStep={currentStep === stepIndex}
                        onClick={() => toggleStep(track.id, stepIndex)}
                        onVelocityChange={(v) => updateVelocity(track.id, stepIndex, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Help text */}
          <div className="text-[10px] text-slate-500">
            Click to toggle • Right-click + drag to adjust velocity
          </div>
        </div>
      )}
    </div>
  );
}
