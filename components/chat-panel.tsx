"use client";

import { createClient } from "@/lib/supabase/client";
import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";

const supabase = createClient();

type Props = {
  userEmail?: string;
};

export function ChatPanel({ userEmail }: Props) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
    useChat({
      api: "/api/chat",
    });

  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState("");
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function saveSecrets() {
    setSaveState("saving");
    setErrorMessage(null);
    const response = await fetch("/api/settings/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openaiApiKey, elevenlabsApiKey }),
    });

    if (response.ok) {
      setSaveState("saved");
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = setTimeout(() => setSaveState("idle"), 2000);
    } else {
      const data = await response.json().catch(() => null);
      setErrorMessage(data?.error ?? "Could not save secrets");
      setSaveState("error");
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-xl backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-700">
            Authenticated
          </p>
          <h2 className="text-xl font-semibold text-slate-900">
            {userEmail ? `Signed in as ${userEmail}` : "Signed in"}
          </h2>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </div>

      <div className="grid gap-4 rounded-xl border border-emerald-50 bg-emerald-50/60 p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-800">
            OpenAI API key
          </label>
          <input
            type="password"
            className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none focus:border-emerald-500"
            placeholder="sk-..."
            value={openaiApiKey}
            onChange={(event) => setOpenaiApiKey(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-800">
            ElevenLabs API key
          </label>
          <input
            type="password"
            className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none focus:border-emerald-500"
            placeholder="eleven-..."
            value={elevenlabsApiKey}
            onChange={(event) => setElevenlabsApiKey(event.target.value)}
          />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saveState === "saving"}
            onClick={saveSecrets}
          >
            {saveState === "saving" ? "Saving..." : "Save provider keys"}
          </button>
          {saveState === "saved" && (
            <p className="text-sm text-emerald-700">Saved</p>
          )}
          {saveState === "error" && (
            <p className="text-sm text-red-600">
              {errorMessage ?? "Failed to save keys"}
            </p>
          )}
        </div>
        <p className="sm:col-span-2 text-xs text-slate-600">
          Keys are stored with Supabase Vault and never sent back to the browser
          after saving.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Chat
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              Vercel AI SDK streaming (per-user OpenAI key)
            </h3>
          </div>
          {isLoading && (
            <button
              type="button"
              onClick={stop}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Stop
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 max-h-96 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-slate-600">
              Start a conversation to refine prompts, then generate tracks.
            </p>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {message.role === "assistant" ? "Assistant" : "You"}
              </p>
              <p className="whitespace-pre-wrap text-sm text-slate-800">
                {message.content}
              </p>
            </div>
          ))}
        </div>

        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-slate-800">Message</label>
          <textarea
            name="prompt"
            className="min-h-[120px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none focus:border-emerald-500"
            placeholder="Ask the assistant to refine your lo-fi brief..."
            value={input}
            onChange={handleInputChange}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Uses the OpenAI key saved above (or `OPENAI_API_KEY` as fallback).
            </p>
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? "Streaming..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
