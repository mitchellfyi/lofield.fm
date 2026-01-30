"use client";

import { useState } from "react";
import { useMIDI, midiToNoteName, type MIDICCEvent } from "@/lib/hooks/useMIDI";

interface MIDISettingsProps {
  /** Callback when a note is played (for connecting to synths) */
  onNote?: (note: number, velocity: number, isNoteOn: boolean) => void;
  /** Callback when MIDI is enabled/disabled */
  onEnabledChange?: (enabled: boolean) => void;
  /** Show compact mode (just icon + dropdown) */
  compact?: boolean;
}

export function MIDISettings({ onNote, onEnabledChange, compact = false }: MIDISettingsProps) {
  const {
    supported,
    hasPermission,
    requestPermission,
    devices,
    selectedDeviceId,
    selectDevice,
    activeNotes,
    lastEvent,
    error,
    onNote: registerNoteHandler,
  } = useMIDI();

  const [isExpanded, setIsExpanded] = useState(false);

  // Register note handler when provided
  useState(() => {
    if (!onNote) return;
    const unsubscribe = registerNoteHandler((event) => {
      onNote(event.note, event.velocity, event.type === "noteon");
    });
    return unsubscribe;
  });

  const handleConnect = async () => {
    const success = await requestPermission();
    if (success) {
      onEnabledChange?.(true);
    }
  };

  const handleDeviceChange = (deviceId: string) => {
    selectDevice(deviceId || null);
    onEnabledChange?.(!!deviceId);
  };

  // Compact mode - just shows icon and dropdown
  if (compact) {
    if (!supported) {
      return null;
    }

    return (
      <div className="relative">
        <button
          onClick={() => (hasPermission ? setIsExpanded(!isExpanded) : handleConnect())}
          className={`p-2 rounded-lg transition-colors ${
            selectedDeviceId
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
              : "bg-slate-800/50 text-slate-400 hover:text-slate-300 border border-slate-600/50 hover:border-slate-500/50"
          }`}
          title={selectedDeviceId ? "MIDI Connected" : "Connect MIDI"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          {activeNotes.size > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>

        {isExpanded && hasPermission && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-cyan-500/30 rounded-lg shadow-xl z-50 p-3">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
              MIDI Device
            </div>
            <select
              value={selectedDeviceId || ""}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white"
            >
              <option value="">None</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
            {selectedDeviceId && lastEvent && (
              <div className="mt-2 text-xs text-slate-400">
                Last:{" "}
                {lastEvent.type === "noteon"
                  ? `Note ${midiToNoteName(lastEvent.note)}`
                  : lastEvent.type === "noteoff"
                    ? `Off ${midiToNoteName(lastEvent.note)}`
                    : `CC ${(lastEvent as MIDICCEvent).controller}`}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full panel mode
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
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
            MIDI
          </div>
          {selectedDeviceId && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[9px] font-medium">
              Connected
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
          {!supported ? (
            <div className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded">
              Web MIDI is not supported in this browser. Try Chrome or Edge.
            </div>
          ) : !hasPermission ? (
            <button
              onClick={handleConnect}
              className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded transition-colors"
            >
              Enable MIDI Access
            </button>
          ) : (
            <>
              {/* Device selector */}
              <div>
                <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Input Device
                </label>
                <select
                  value={selectedDeviceId || ""}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">None (disconnected)</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name} {device.manufacturer ? `(${device.manufacturer})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Connection status */}
              {devices.length === 0 && (
                <div className="text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded">
                  No MIDI devices found. Connect a device and refresh.
                </div>
              )}

              {/* Active notes display */}
              {selectedDeviceId && (
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Active Notes
                  </label>
                  <div className="min-h-[24px] px-2 py-1 bg-slate-800 rounded text-xs text-cyan-400 font-mono">
                    {activeNotes.size > 0 ? (
                      Array.from(activeNotes)
                        .map((n) => midiToNoteName(n))
                        .join(" ")
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </div>
                </div>
              )}

              {/* Last event */}
              {selectedDeviceId && lastEvent && (
                <div className="text-xs text-slate-400">
                  Last event:{" "}
                  <span className="text-slate-300">
                    {lastEvent.type === "noteon"
                      ? `Note On: ${midiToNoteName(lastEvent.note)} (vel: ${Math.round(lastEvent.velocity * 127)})`
                      : lastEvent.type === "noteoff"
                        ? `Note Off: ${midiToNoteName(lastEvent.note)}`
                        : `CC ${(lastEvent as MIDICCEvent).controller}: ${Math.round((lastEvent as MIDICCEvent).value * 127)}`}
                  </span>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded">{error}</div>
          )}
        </div>
      )}
    </div>
  );
}
