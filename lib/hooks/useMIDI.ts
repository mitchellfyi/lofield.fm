"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * MIDI input device info
 */
export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: "connected" | "disconnected";
}

/**
 * MIDI note event data
 */
export interface MIDINoteEvent {
  type: "noteon" | "noteoff";
  note: number; // MIDI note number (0-127)
  velocity: number; // 0-127, normalized to 0-1
  channel: number; // MIDI channel (0-15)
  timestamp: number;
}

/**
 * MIDI control change event data
 */
export interface MIDICCEvent {
  type: "cc";
  controller: number; // CC number (0-127)
  value: number; // 0-127, normalized to 0-1
  channel: number;
  timestamp: number;
}

export type MIDIEvent = MIDINoteEvent | MIDICCEvent;

/**
 * Return type for useMIDI hook
 */
export interface UseMIDIReturn {
  /** Whether Web MIDI is supported in this browser */
  supported: boolean;
  /** Whether we have permission to access MIDI devices */
  hasPermission: boolean;
  /** Request MIDI access permission */
  requestPermission: () => Promise<boolean>;
  /** Available MIDI input devices */
  devices: MIDIDevice[];
  /** Currently selected device ID */
  selectedDeviceId: string | null;
  /** Select a device by ID */
  selectDevice: (deviceId: string | null) => void;
  /** Currently pressed notes (for visual keyboard) */
  activeNotes: Set<number>;
  /** Last MIDI event received */
  lastEvent: MIDIEvent | null;
  /** Error message if any */
  error: string | null;
  /** Register a note event handler */
  onNote: (handler: (event: MIDINoteEvent) => void) => () => void;
  /** Register a CC event handler */
  onCC: (handler: (event: MIDICCEvent) => void) => () => void;
}

/**
 * Convert MIDI note number to frequency in Hz
 */
export function midiToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/**
 * Convert MIDI note number to note name (e.g., "C4", "F#3")
 */
export function midiToNoteName(note: number): string {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(note / 12) - 1;
  const noteName = noteNames[note % 12];
  return `${noteName}${octave}`;
}

/**
 * Check if Web MIDI API is supported
 */
export function isMIDISupported(): boolean {
  return typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;
}

/**
 * Hook for Web MIDI API integration
 * Provides device enumeration, note events, and CC events
 */
export function useMIDI(): UseMIDIReturn {
  const [supported] = useState(() => isMIDISupported());
  const [hasPermission, setHasPermission] = useState(false);
  const [devices, setDevices] = useState<MIDIDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [lastEvent, setLastEvent] = useState<MIDIEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const noteHandlersRef = useRef<Set<(event: MIDINoteEvent) => void>>(new Set());
  const ccHandlersRef = useRef<Set<(event: MIDICCEvent) => void>>(new Set());

  // Handle incoming MIDI messages
  const handleMIDIMessage = useCallback((event: MIDIMessageEvent) => {
    const [status, data1, data2] = event.data || [];
    if (status === undefined) return;

    const messageType = status & 0xf0;
    const channel = status & 0x0f;
    const timestamp = event.timeStamp;

    // Note On (0x90) with velocity > 0
    if (messageType === 0x90 && data2 > 0) {
      const noteEvent: MIDINoteEvent = {
        type: "noteon",
        note: data1,
        velocity: data2 / 127,
        channel,
        timestamp,
      };
      setActiveNotes((prev) => new Set([...prev, data1]));
      setLastEvent(noteEvent);
      noteHandlersRef.current.forEach((handler) => handler(noteEvent));
    }
    // Note Off (0x80) or Note On with velocity 0
    else if (messageType === 0x80 || (messageType === 0x90 && data2 === 0)) {
      const noteEvent: MIDINoteEvent = {
        type: "noteoff",
        note: data1,
        velocity: 0,
        channel,
        timestamp,
      };
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(data1);
        return next;
      });
      setLastEvent(noteEvent);
      noteHandlersRef.current.forEach((handler) => handler(noteEvent));
    }
    // Control Change (0xB0)
    else if (messageType === 0xb0) {
      const ccEvent: MIDICCEvent = {
        type: "cc",
        controller: data1,
        value: data2 / 127,
        channel,
        timestamp,
      };
      setLastEvent(ccEvent);
      ccHandlersRef.current.forEach((handler) => handler(ccEvent));
    }
  }, []);

  // Update device list from MIDI access
  const updateDevices = useCallback((access: MIDIAccess) => {
    const deviceList: MIDIDevice[] = [];
    access.inputs.forEach((input) => {
      deviceList.push({
        id: input.id,
        name: input.name || "Unknown Device",
        manufacturer: input.manufacturer || "Unknown",
        state: input.state,
      });
    });
    setDevices(deviceList);
  }, []);

  // Request MIDI access permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!supported) {
      setError("Web MIDI is not supported in this browser");
      return false;
    }

    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      midiAccessRef.current = access;
      setHasPermission(true);
      setError(null);
      updateDevices(access);

      // Listen for device connect/disconnect
      access.onstatechange = () => {
        updateDevices(access);
      };

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to access MIDI devices";
      setError(message);
      setHasPermission(false);
      return false;
    }
  }, [supported, updateDevices]);

  // Select a MIDI device
  const selectDevice = useCallback(
    (deviceId: string | null) => {
      const access = midiAccessRef.current;
      if (!access) return;

      // Disconnect from previous device
      if (selectedDeviceId) {
        const prevInput = access.inputs.get(selectedDeviceId);
        if (prevInput) {
          prevInput.onmidimessage = null;
        }
      }

      setSelectedDeviceId(deviceId);
      setActiveNotes(new Set());

      // Connect to new device
      if (deviceId) {
        const input = access.inputs.get(deviceId);
        if (input) {
          input.onmidimessage = handleMIDIMessage;
        }
      }
    },
    [selectedDeviceId, handleMIDIMessage]
  );

  // Register note event handler
  const onNote = useCallback((handler: (event: MIDINoteEvent) => void) => {
    noteHandlersRef.current.add(handler);
    return () => {
      noteHandlersRef.current.delete(handler);
    };
  }, []);

  // Register CC event handler
  const onCC = useCallback((handler: (event: MIDICCEvent) => void) => {
    ccHandlersRef.current.add(handler);
    return () => {
      ccHandlersRef.current.delete(handler);
    };
  }, []);

  // Auto-select first device when connected
  useEffect(() => {
    if (hasPermission && devices.length > 0 && !selectedDeviceId) {
      const connectedDevice = devices.find((d) => d.state === "connected");
      if (connectedDevice) {
        // Use setTimeout to avoid calling setState synchronously in effect
        const timer = setTimeout(() => {
          selectDevice(connectedDevice.id);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [hasPermission, devices, selectedDeviceId, selectDevice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (selectedDeviceId && midiAccessRef.current) {
        const input = midiAccessRef.current.inputs.get(selectedDeviceId);
        if (input) {
          input.onmidimessage = null;
        }
      }
    };
  }, [selectedDeviceId]);

  return {
    supported,
    hasPermission,
    requestPermission,
    devices,
    selectedDeviceId,
    selectDevice,
    activeNotes,
    lastEvent,
    error,
    onNote,
    onCC,
  };
}
