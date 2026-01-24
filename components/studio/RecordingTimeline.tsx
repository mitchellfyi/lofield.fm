"use client";

import { useMemo, useState } from "react";
import {
  type Recording,
  type RecordingEvent,
  EVENT_TYPE_COLORS,
  TWEAK_PARAM_COLORS,
  formatRecordingTime,
} from "@/lib/types/recording";
import type { TweaksConfig } from "@/lib/types/tweaks";
import { useTransportState } from "@/lib/audio/useVisualization";

interface RecordingTimelineProps {
  /** The recording to visualize */
  recording: Recording | null;
  /** Current playback position in ms (for playhead) */
  currentTimeMs?: number;
  /** Callback when an event is selected for editing */
  onSelectEvent?: (event: RecordingEvent) => void;
  /** Callback when an event is deleted */
  onDeleteEvent?: (eventId: string) => void;
  /** Whether the timeline is interactive */
  interactive?: boolean;
}

/**
 * Get the display color for a recording event
 */
function getEventColor(event: RecordingEvent): string {
  if (event.type === "tweak" && event.param) {
    return TWEAK_PARAM_COLORS[event.param as keyof TweaksConfig];
  }
  return EVENT_TYPE_COLORS[event.type];
}

/**
 * Get a human-readable label for an event
 */
function getEventLabel(event: RecordingEvent): string {
  switch (event.type) {
    case "tweak":
      return `${event.param}: ${event.oldValue} → ${event.newValue}`;
    case "layer_mute":
      return `Mute: ${event.newValue ? "On" : "Off"}`;
    case "layer_volume":
      return `Volume: ${event.newValue}`;
    case "layer_solo":
      return `Solo: ${event.newValue ? "On" : "Off"}`;
    default:
      return "Unknown event";
  }
}

export function RecordingTimeline({
  recording,
  currentTimeMs,
  onSelectEvent,
  onDeleteEvent,
  interactive = true,
}: RecordingTimelineProps) {
  const transport = useTransportState();
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Use transport seconds if no explicit currentTimeMs provided
  const playheadMs = currentTimeMs ?? (transport.playing ? transport.seconds * 1000 : 0);

  // Group events by time proximity for better visualization
  const eventGroups = useMemo(() => {
    if (!recording || recording.events.length === 0) return [];

    const groups: Array<{
      startMs: number;
      endMs: number;
      events: RecordingEvent[];
    }> = [];

    const sortedEvents = [...recording.events].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
    const groupThresholdMs = recording.duration_ms / 100; // 1% of duration

    for (const event of sortedEvents) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && event.timestamp_ms - lastGroup.endMs < groupThresholdMs) {
        lastGroup.events.push(event);
        lastGroup.endMs = event.timestamp_ms;
      } else {
        groups.push({
          startMs: event.timestamp_ms,
          endMs: event.timestamp_ms,
          events: [event],
        });
      }
    }

    return groups;
  }, [recording]);

  if (!recording || recording.events.length === 0) {
    return (
      <div className="h-12 rounded-lg bg-slate-900/50 border border-slate-700/50 flex items-center justify-center">
        <span className="text-xs text-slate-500">No recorded events</span>
      </div>
    );
  }

  const durationMs = recording.duration_ms;
  const playheadPercent = Math.min(100, (playheadMs / durationMs) * 100);

  const handleEventClick = (event: RecordingEvent) => {
    if (!interactive) return;
    setSelectedEventId(event.id === selectedEventId ? null : event.id);
    onSelectEvent?.(event);
  };

  const handleDeleteClick = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!interactive || !onDeleteEvent) return;
    onDeleteEvent(eventId);
    if (selectedEventId === eventId) {
      setSelectedEventId(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* Timeline bar */}
      <div className="relative h-10 rounded-lg bg-slate-900/50 border border-cyan-500/20 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-slate-700/30 last:border-r-0"
            />
          ))}
        </div>

        {/* Event markers */}
        {eventGroups.map((group, groupIndex) => {
          const leftPercent = (group.startMs / durationMs) * 100;

          return (
            <div
              key={groupIndex}
              className="absolute top-1 bottom-1 flex flex-col justify-center gap-0.5"
              style={{ left: `${leftPercent}%` }}
            >
              {group.events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  onMouseEnter={() => setHoveredEventId(event.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-150
                    ${interactive ? "cursor-pointer hover:scale-150" : "cursor-default"}
                    ${event.id === selectedEventId ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-150" : ""}
                    ${event.id === hoveredEventId && event.id !== selectedEventId ? "scale-125" : ""}
                  `}
                  style={{ backgroundColor: getEventColor(event) }}
                  title={getEventLabel(event)}
                />
              ))}
            </div>
          );
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 transition-all duration-75"
          style={{ left: `${playheadPercent}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-cyan-400" />
        </div>
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
        <span>00:00</span>
        <span>{formatRecordingTime(durationMs / 2)}</span>
        <span>{formatRecordingTime(durationMs)}</span>
      </div>

      {/* Selected event details */}
      {selectedEventId && interactive && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-cyan-500/20">
          {(() => {
            const event = recording.events.find((e) => e.id === selectedEventId);
            if (!event) return null;
            return (
              <>
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getEventColor(event) }}
                />
                <span className="text-xs text-slate-300 flex-1 truncate">
                  {getEventLabel(event)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {formatRecordingTime(event.timestamp_ms)}
                </span>
                {onDeleteEvent && (
                  <button
                    onClick={(e) => handleDeleteClick(e, event.id)}
                    className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete event"
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
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Event legend */}
      {recording.events.length > 0 && (
        <div className="flex flex-wrap gap-3 text-[10px]">
          {Object.entries(
            recording.events.reduce(
              (acc, event) => {
                const key = event.type === "tweak" ? event.param || "tweak" : event.type;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            )
          ).map(([key, count]) => {
            const event = recording.events.find(
              (e) => (e.type === "tweak" ? e.param === key : e.type === key)
            );
            if (!event) return null;
            return (
              <div key={key} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getEventColor(event) }}
                />
                <span className="text-slate-400 capitalize">{key}</span>
                <span className="text-slate-500">({count})</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
