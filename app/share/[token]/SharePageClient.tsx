"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { validateRawToneCode } from "@/lib/audio/llmContract";
import { getAudioRuntime, type PlayerState, type RuntimeEvent } from "@/lib/audio/runtime";
import { ReadonlyCodePanel } from "@/components/studio/ReadonlyCodePanel";
import { ConsolePanel } from "@/components/studio/ConsolePanel";
import type { PublicTrackData } from "@/lib/types/share";

interface SharePageClientProps {
  track: PublicTrackData;
}

export function SharePageClient({ track }: SharePageClientProps) {
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [error, setError] = useState("");
  const [runtimeEvents, setRuntimeEvents] = useState<RuntimeEvent[]>([]);
  const runtimeRef = useRef(getAudioRuntime());
  const lastPlayedCodeRef = useRef<string>("");

  // Subscribe to runtime state changes
  useEffect(() => {
    const runtime = runtimeRef.current;
    const unsubscribe = runtime.subscribe(() => {
      setPlayerState(runtime.getState());
      setRuntimeEvents(runtime.getEvents());
    });
    return unsubscribe;
  }, []);

  const playCode = useCallback(async () => {
    const validation = validateRawToneCode(track.current_code);
    if (!validation.valid) {
      setError(`Code validation failed: ${validation.errors.map((e) => e.message).join(", ")}`);
      return;
    }

    try {
      const runtime = runtimeRef.current;
      lastPlayedCodeRef.current = track.current_code;
      await runtime.play(track.current_code);
      setError("");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to play: ${errorMsg}`);
    }
  }, [track.current_code]);

  const stop = () => {
    try {
      const runtime = runtimeRef.current;
      runtime.stop();
      setError("");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to stop: ${errorMsg}`);
    }
  };

  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";

  return (
    <div
      className="flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden"
      style={{ height: "100vh" }}
    >
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-4 py-4 border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-cyan-300">{track.name}</h1>
            {track.author_name && <p className="text-sm text-slate-400">by {track.author_name}</p>}
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20"
          >
            Create Your Own
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col p-4 gap-4">
          {/* Code Display */}
          <div className="flex-1 min-h-0 bg-slate-900/50 border border-cyan-500/20 rounded-lg overflow-hidden">
            <ReadonlyCodePanel code={track.current_code} />
          </div>

          {/* Player Controls */}
          <div className="bg-slate-900/50 border border-cyan-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={playCode}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-base bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 hover:from-cyan-500 hover:via-cyan-400 hover:to-cyan-500 disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:shadow-none border border-cyan-500/30 disabled:border-slate-600"
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Initializing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      {isPlaying ? (
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      ) : (
                        <path d="M8 5v14l11-7z" />
                      )}
                    </svg>
                    {isPlaying ? "Restart" : "Play"}
                  </>
                )}
              </button>

              <button
                onClick={stop}
                disabled={!isPlaying}
                className="px-8 py-4 rounded-lg font-bold text-base bg-gradient-to-r from-slate-800/90 via-slate-700/90 to-slate-800/90 hover:from-slate-700/90 hover:via-slate-600/90 hover:to-slate-700/90 disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-cyan-100 hover:text-white transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 disabled:shadow-none border border-cyan-500/30 hover:border-cyan-500/50 disabled:border-slate-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z" />
                </svg>
              </button>
            </div>

            {/* Console */}
            <div className="mt-4">
              <ConsolePanel events={runtimeEvents} error={error} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-3 border-t border-cyan-500/20 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center text-xs text-slate-500">
          Created with{" "}
          <Link href="/" className="text-cyan-400 hover:text-cyan-300">
            LoField Music Lab
          </Link>
        </div>
      </footer>
    </div>
  );
}
