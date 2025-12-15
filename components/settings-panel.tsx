"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";

const supabase = createClient();

type Props = {
  userEmail: string;
};

type Settings = {
  artist_name: string | null;
  openai_model: string;
  eleven_music_defaults: {
    length_ms?: number;
    instrumental?: boolean;
  };
  prompt_defaults: {
    genre?: string;
    bpm?: number;
    mood?: {
      energy?: number;
      focus?: number;
      chill?: number;
    };
  };
  hasOpenAIKey: boolean;
  hasElevenLabsKey: boolean;
};

const DEFAULT_MODELS = [
  "gpt-4.1-mini",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
];

const GENRE_PRESETS = [
  "Lo-fi Hip Hop",
  "Chillhop",
  "Jazz Hop",
  "Ambient",
  "Downtempo",
  "Trip Hop",
];

export function SettingsPanel({ userEmail }: Props) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [artistName, setArtistName] = useState("");
  const [openaiModel, setOpenaiModel] = useState("gpt-4.1-mini");
  const [customModel, setCustomModel] = useState("");
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState("");
  const [lengthMs, setLengthMs] = useState(240000);
  const [instrumental, setInstrumental] = useState(true);
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState(90);
  const [energy, setEnergy] = useState(0.5);
  const [focus, setFocus] = useState(0.5);
  const [chill, setChill] = useState(0.7);

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchSettings() {
    const response = await fetch("/api/settings");
    if (response.ok) {
      const data = await response.json();
      setSettings(data);
      setArtistName(data.artist_name ?? "");
      const model = data.openai_model ?? "gpt-4.1-mini";
      if (DEFAULT_MODELS.includes(model)) {
        setOpenaiModel(model);
        setUseCustomModel(false);
      } else {
        setCustomModel(model);
        setUseCustomModel(true);
      }
      setLengthMs(data.eleven_music_defaults?.length_ms ?? 240000);
      setInstrumental(data.eleven_music_defaults?.instrumental ?? true);
      setGenre(data.prompt_defaults?.genre ?? "");
      setBpm(data.prompt_defaults?.bpm ?? 90);
      setEnergy(data.prompt_defaults?.mood?.energy ?? 0.5);
      setFocus(data.prompt_defaults?.mood?.focus ?? 0.5);
      setChill(data.prompt_defaults?.mood?.chill ?? 0.7);
    }
    setLoading(false);
  }

  useEffect(() => {
    // Load settings on mount - using IIFE for async operation
    (async () => {
      await fetchSettings();
    })();
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function saveSecrets() {
    if (!openaiApiKey && !elevenlabsApiKey) return;

    setSaveState("saving");
    setErrorMessage(null);
    const response = await fetch("/api/settings/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(openaiApiKey && { openaiApiKey }),
        ...(elevenlabsApiKey && { elevenlabsApiKey }),
      }),
    });

    if (response.ok) {
      setOpenaiApiKey("");
      setElevenlabsApiKey("");
      await fetchSettings();
      setSaveState("saved");
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setSaveState("idle"), 2000);
    } else {
      const data = await response.json().catch(() => null);
      setErrorMessage(data?.error ?? "Could not save secrets");
      setSaveState("error");
    }
  }

  async function saveSettings() {
    setSaveState("saving");
    setErrorMessage(null);

    const selectedModel = useCustomModel ? customModel : openaiModel;
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artist_name: artistName,
        openai_model: selectedModel,
        eleven_music_defaults: {
          length_ms: lengthMs,
          instrumental,
        },
        prompt_defaults: {
          genre: genre || undefined,
          bpm,
          mood: { energy, focus, chill },
        },
      }),
    });

    if (response.ok) {
      await fetchSettings();
      setSaveState("saved");
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setSaveState("idle"), 2000);
    } else {
      const data = await response.json().catch(() => null);
      setErrorMessage(data?.error ?? "Could not save settings");
      setSaveState("error");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-xl backdrop-blur">
        <p className="text-slate-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-xl backdrop-blur">
      {/* User Info */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-700">
            Account
          </p>
          <h2 className="text-xl font-semibold text-slate-900">{userEmail}</h2>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </div>

      {/* Profile Settings */}
      <section className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Profile</h3>
          <p className="text-sm text-slate-600">Your public artist identity</p>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-800">
            Artist Name
          </label>
          <input
            type="text"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600 shadow-inner outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            placeholder="Your artist name"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            maxLength={100}
          />
        </div>
      </section>

      {/* API Keys Section */}
      <section className="flex flex-col gap-4 rounded-xl border border-emerald-50 bg-emerald-50/60 p-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">API Keys</h3>
          <p className="text-sm text-slate-600">
            Keys are encrypted with Supabase Vault and never visible after
            saving
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-800">
              OpenAI API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                className="flex-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-slate-900 placeholder:text-emerald-700 shadow-inner outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                placeholder={
                  settings?.hasOpenAIKey ? "••••••••••••••••" : "sk-..."
                }
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
              />
              {settings?.hasOpenAIKey && (
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                  Saved
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-800">
              ElevenLabs API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                className="flex-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-slate-900 placeholder:text-emerald-700 shadow-inner outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                placeholder={
                  settings?.hasElevenLabsKey ? "••••••••••••••••" : "eleven-..."
                }
                value={elevenlabsApiKey}
                onChange={(e) => setElevenlabsApiKey(e.target.value)}
              />
              {settings?.hasElevenLabsKey && (
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={
              saveState === "saving" || (!openaiApiKey && !elevenlabsApiKey)
            }
            onClick={saveSecrets}
          >
            {saveState === "saving" ? "Saving..." : "Save API Keys"}
          </button>
          <p className="text-xs text-slate-600">
            Enter new keys to update. Leave empty to keep existing.
          </p>
        </div>
      </section>

      {/* OpenAI Model Settings */}
      <section className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">OpenAI Model</h3>
          <p className="text-sm text-slate-600">
            Select or specify a custom model
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomModel"
              checked={useCustomModel}
              onChange={(e) => setUseCustomModel(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="useCustomModel" className="text-sm text-slate-700">
              Use custom model name
            </label>
          </div>

          {useCustomModel ? (
            <input
              type="text"
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600 shadow-inner outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              placeholder="Custom model name (e.g., gpt-4-0125-preview)"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              maxLength={100}
            />
          ) : (
            <select
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600 shadow-inner outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              value={openaiModel}
              onChange={(e) => setOpenaiModel(e.target.value)}
            >
              {DEFAULT_MODELS.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>

      {/* ElevenLabs Default Settings */}
      <section className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            ElevenLabs Music Defaults
          </h3>
          <p className="text-sm text-slate-600">
            Default settings for music generation
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-800">
              Track Length (seconds): {Math.round(lengthMs / 1000)}s
            </label>
            <input
              type="range"
              min={30000}
              max={600000}
              step={30000}
              value={lengthMs}
              onChange={(e) => setLengthMs(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-300"
            />
            <p className="text-xs text-slate-500">30s - 10 minutes</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-800">
              Track Type
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="instrumental"
                  checked={instrumental}
                  onChange={() => setInstrumental(true)}
                  className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Instrumental</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="instrumental"
                  checked={!instrumental}
                  onChange={() => setInstrumental(false)}
                  className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">With Vocals</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Prompt Defaults */}
      <section className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Prompt Defaults
          </h3>
          <p className="text-sm text-slate-600">
            Default presets for track generation prompts
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-800">
              Genre Preset
            </label>
            <select
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600 shadow-inner outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="">Select a genre...</option>
              {GENRE_PRESETS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-800">
              BPM: {bpm}
            </label>
            <input
              type="range"
              min={40}
              max={220}
              step={5}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-300"
            />
            <p className="text-xs text-slate-500">40 - 220 BPM</p>
          </div>
        </div>

        {/* Mood Sliders */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-medium text-slate-800">Mood Presets</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-600">
                Energy: {Math.round(energy * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-600">
                Focus: {Math.round(focus * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={focus}
                onChange={(e) => setFocus(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-600">
                Chill: {Math.round(chill * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={chill}
                onChange={(e) => setChill(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Save Settings */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={saveState === "saving"}
          onClick={saveSettings}
        >
          {saveState === "saving" ? "Saving..." : "Save All Settings"}
        </button>
        {saveState === "saved" && (
          <p className="text-sm text-emerald-700">Settings saved!</p>
        )}
        {saveState === "error" && (
          <p className="text-sm text-red-600">
            {errorMessage ?? "Failed to save"}
          </p>
        )}
      </div>
    </div>
  );
}
