"use client";

import {
  useMemo,
  useState,
  useEffect,
  useRef,
  startTransition,
  type FormEvent,
} from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  draft_spec?: DraftSpec | null;
  created_at: string;
};

type DraftSpec = {
  title?: string;
  genre?: string;
  bpm?: number;
  mood?: {
    energy?: number;
    focus?: number;
    chill?: number;
  };
  instrumentation?: string[];
  length_ms?: number;
  instrumental?: boolean;
  prompt_final?: string;
  description?: string;
};

type Props = {
  chatId: string | null;
  chatTitle: string;
  messages: Message[];
  onRefresh: () => void;
  hasDraftSpec: boolean;
  onTrackGenerated?: (trackId: string) => void;
};

const GENRE_PRESETS = [
  "Lo-fi Hip Hop",
  "Chillhop",
  "Jazz Hop",
  "Ambient",
  "Downtempo",
  "Trip Hop",
];

const INSTRUMENTATION_PRESETS = [
  "Piano",
  "Rhodes",
  "Guitar",
  "Bass",
  "Drums",
  "Vinyl crackle",
  "Rain sounds",
  "Lo-fi synth pads",
];

export function PromptBuilder({
  chatId,
  chatTitle,
  messages,
  onRefresh,
  hasDraftSpec,
  onTrackGenerated,
}: Props) {
  const [input, setInput] = useState("");

  // Prompt builder controls
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState(90);
  const [energy, setEnergy] = useState(50);
  const [focus, setFocus] = useState(50);
  const [chill, setChill] = useState(70);
  const [instrumentation, setInstrumentation] = useState<string[]>([]);
  const [lengthMins, setLengthMins] = useState(4);
  const [instrumental, setInstrumental] = useState(true);

  const [refineStatus, setRefineStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [generateStatus, setGenerateStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [titleOverride, setTitleOverride] = useState("");

  const [lastProcessedDraftId, setLastProcessedDraftId] = useState<
    string | null
  >(null);
  const [promptFinal, setPromptFinal] = useState("");

  // Sync UI controls with latest draft from messages
  const latestDraftMessage = useMemo(() => {
    return [...messages]
      .filter((m) => m.draft_spec)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
  }, [messages]);

  // Update UI controls when a new draft arrives from the database
  useEffect(() => {
    if (latestDraftMessage && latestDraftMessage.id !== lastProcessedDraftId) {
      const latestDraft = latestDraftMessage.draft_spec;
      if (latestDraft) {
        // Batch all state updates in a transition to avoid cascading renders
        startTransition(() => {
          setLastProcessedDraftId(latestDraftMessage.id);
          if (latestDraft.title) setTitle(latestDraft.title);
          if (latestDraft.genre) setGenre(latestDraft.genre);
          if (latestDraft.bpm) setBpm(latestDraft.bpm);
          if (latestDraft.mood) {
            // Draft mood values are 0-100, UI expects 0-100
            if (latestDraft.mood.energy !== undefined)
              setEnergy(Math.round(latestDraft.mood.energy));
            if (latestDraft.mood.focus !== undefined)
              setFocus(Math.round(latestDraft.mood.focus));
            if (latestDraft.mood.chill !== undefined)
              setChill(Math.round(latestDraft.mood.chill));
          }
          if (latestDraft.instrumentation)
            setInstrumentation(latestDraft.instrumentation);
          if (latestDraft.length_ms)
            setLengthMins(Math.round(latestDraft.length_ms / 60000));
          if (latestDraft.instrumental !== undefined)
            setInstrumental(latestDraft.instrumental);
          // Update prompt_final display
          if (latestDraft.prompt_final) {
            setPromptFinal(latestDraft.prompt_final);
          }
        });
      }
    }
  }, [latestDraftMessage, lastProcessedDraftId]);

  // Check if currently refining (used for loading state)
  const isLoading = refineStatus === "loading";

  /**
   * Handle free-form chat submission - now calls the refine endpoint
   * so that AI responses update UI controls with structured output
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!chatId) {
      setRefineError("Please select or create a chat first.");
      return;
    }
    if (!input.trim() || isLoading) {
      setRefineError("Message cannot be empty");
      return;
    }

    // Use the same logic as handleRefine but with the input message
    setRefineStatus("loading");
    setRefineError(null);

    const promptSpec = {
      title: title || undefined,
      genre: genre || undefined,
      bpm,
      mood: { energy, focus, chill },
      instrumentation: instrumentation.length > 0 ? instrumentation : undefined,
      length_ms: lengthMins * 60 * 1000,
      instrumental,
    };

    // Get latest draft from messages to provide context
    const currentLatestDraft = latestDraftMessage?.draft_spec ?? null;

    try {
      const response = await fetch(`/api/chats/${chatId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          controls: promptSpec,
          latest_draft: currentLatestDraft,
        }),
      });

      if (response.ok) {
        try {
          const data = await response.json();
          const { draft } = data;

          if (draft) {
            startTransition(() => {
              if (draft.title) setTitle(draft.title);
              if (draft.genre) setGenre(draft.genre);
              if (draft.bpm) setBpm(draft.bpm);
              if (draft.mood) {
                if (draft.mood.energy !== undefined)
                  setEnergy(Math.round(draft.mood.energy));
                if (draft.mood.focus !== undefined)
                  setFocus(Math.round(draft.mood.focus));
                if (draft.mood.chill !== undefined)
                  setChill(Math.round(draft.mood.chill));
              }
              if (draft.instrumentation)
                setInstrumentation(draft.instrumentation);
              if (draft.length_ms)
                setLengthMins(Math.round(draft.length_ms / 60000));
              if (draft.instrumental !== undefined)
                setInstrumental(draft.instrumental);
              if (draft.prompt_final) {
                setPromptFinal(draft.prompt_final);
              }
            });
          }
        } catch (parseError) {
          console.error("Failed to parse response", parseError);
        }

        setRefineStatus("success");
        setInput(""); // Clear input on success
        onRefresh();
        setTimeout(() => setRefineStatus("idle"), 2000);
      } else {
        setRefineStatus("error");
        const data = await response.json().catch(async () => {
          const text = await response.text().catch(() => "");
          return text ? { error: text } : null;
        });
        setRefineError(
          data?.error ?? "Failed to send message. Please try again."
        );
      }
    } catch (error) {
      setRefineStatus("error");
      setRefineError(
        error instanceof Error ? error.message : "Failed to send message."
      );
    }
  }

  async function handleRefine() {
    if (!chatId) return;

    setRefineStatus("loading");
    setRefineError(null);

    const promptSpec = {
      title: title || undefined,
      genre: genre || undefined,
      bpm,
      mood: { energy, focus, chill }, // Schema expects 0-100, UI already uses 0-100
      instrumentation: instrumentation.length > 0 ? instrumentation : undefined,
      length_ms: lengthMins * 60 * 1000,
      instrumental,
    };
    const refineMessage =
      input.trim() ||
      "Refine the track prompt using the current controls and draft.";

    // Get latest draft from messages to provide context
    const latestDraftMessage = [...messages]
      .filter((m) => m.draft_spec)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

    const latestDraft = latestDraftMessage?.draft_spec ?? null;

    try {
      const response = await fetch(`/api/chats/${chatId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: refineMessage,
          controls: promptSpec,
          latest_draft: latestDraft,
        }),
      });

      if (response.ok) {
        try {
          const data = await response.json();
          const { draft } = data;

          if (draft) {
            startTransition(() => {
              if (draft.title) setTitle(draft.title);
              if (draft.genre) setGenre(draft.genre);
              if (draft.bpm) setBpm(draft.bpm);
              if (draft.mood) {
                if (draft.mood.energy !== undefined)
                  setEnergy(Math.round(draft.mood.energy));
                if (draft.mood.focus !== undefined)
                  setFocus(Math.round(draft.mood.focus));
                if (draft.mood.chill !== undefined)
                  setChill(Math.round(draft.mood.chill));
              }
              if (draft.instrumentation)
                setInstrumentation(draft.instrumentation);
              if (draft.length_ms)
                setLengthMins(Math.round(draft.length_ms / 60000));
              if (draft.instrumental !== undefined)
                setInstrumental(draft.instrumental);
              if (draft.prompt_final) {
                setPromptFinal(draft.prompt_final);
              }
            });
          }
        } catch (e) {
          console.error("Failed to parse response", e);
        }

        setRefineStatus("success");
        onRefresh();
        setTimeout(() => setRefineStatus("idle"), 2000);
      } else {
        setRefineStatus("error");
        const data = await response.json().catch(async () => {
          const text = await response.text().catch(() => "");
          return text ? { error: text } : null;
        });
        setRefineError(
          data?.error ?? "Failed to refine prompt. Please try again."
        );
      }
    } catch (error) {
      setRefineStatus("error");
      setRefineError(
        error instanceof Error ? error.message : "Failed to refine prompt."
      );
    }
  }

  async function handleGenerate() {
    if (!chatId) return;

    // The button is disabled if no draft spec, but show a message for clarity
    if (!hasDraftSpec) {
      setGenerateStatus("error");
      setGenerateError("Please refine your prompt first to create a draft.");
      return;
    }

    setGenerateStatus("loading");
    setGenerateError(null);

    try {
      const requestBody = titleOverride ? { titleOverride: titleOverride } : {};

      const response = await fetch(`/api/chats/${chatId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        // Wait a bit to ensure server processing completes and DB is consistent
        // We'll wait a shorter time since we want feedback fast, but long enough for DB replication/consistency
        await new Promise((resolve) => setTimeout(resolve, 500));

        setGenerateStatus("success");
        onRefresh();
        // Notify parent of new track for auto-selection
        if (onTrackGenerated && data.track?.id) {
          onTrackGenerated(data.track.id);
        }
        // Clear title override after successful generation
        setTitleOverride("");
        setTimeout(() => setGenerateStatus("idle"), 2000);
      } else {
        setGenerateStatus("error");
        setGenerateError(
          data.error || "Failed to generate track. Please try again."
        );
        // Keep error visible longer for rate limits
        if (response.status === 429) {
          setTimeout(() => {
            setGenerateStatus("idle");
            setGenerateError(null);
          }, 10000);
        } else {
          setTimeout(() => {
            setGenerateStatus("idle");
            setGenerateError(null);
          }, 5000);
        }
      }
    } catch (error) {
      setGenerateStatus("error");
      setGenerateError(
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
      setTimeout(() => {
        setGenerateStatus("idle");
        setGenerateError(null);
      }, 5000);
    }
  }

  function toggleInstrumentation(preset: string) {
    setInstrumentation((prev) =>
      prev.includes(preset)
        ? prev.filter((p) => p !== preset)
        : [...prev, preset]
    );
  }

  // Scroll to bottom on messages change
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]); // Scroll on new messages or loading state change

  if (!chatId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50 p-8 text-center">
        <div className="max-w-md">
          <h2 className="text-xl font-semibold text-slate-800">
            Select or create a chat
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Choose a chat from the sidebar or create a new one to start building
            your lo-fi track prompt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Chat header */}
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{chatTitle}</h2>
        <p className="text-xs text-slate-500">
          Refine your prompt with AI, then generate your track
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No messages yet. Use the prompt builder below to refine your track
            idea.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg p-3 ${
                  message.role === "user"
                    ? "ml-8 bg-emerald-50 text-emerald-900"
                    : "mr-8 bg-slate-100 text-slate-800"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {message.role === "assistant" ? "Assistant" : "You"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {message.content}
                </p>
                {message.draft_spec && (
                  <div className="mt-2 rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
                    Draft spec saved ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt builder controls */}
      <div className="border-t border-slate-100 bg-slate-50 p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="track-title"
              className="text-xs font-medium text-slate-700"
            >
              Title (optional)
            </label>
            <input
              id="track-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Track title..."
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Genre */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="track-genre"
              className="text-xs font-medium text-slate-700"
            >
              Genre
            </label>
            <select
              id="track-genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Select genre...</option>
              {GENRE_PRESETS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* BPM */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="track-bpm"
              className="text-xs font-medium text-slate-700"
            >
              BPM: {bpm}
            </label>
            <input
              id="track-bpm"
              type="range"
              min={40}
              max={220}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-300"
            />
          </div>

          {/* Energy */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="track-energy"
              className="text-xs font-medium text-slate-700"
            >
              Energy: {energy}%
            </label>
            <input
              id="track-energy"
              type="range"
              min={0}
              max={100}
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-300"
            />
          </div>

          {/* Focus */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="track-focus"
              className="text-xs font-medium text-slate-700"
            >
              Focus: {focus}%
            </label>
            <input
              id="track-focus"
              type="range"
              min={0}
              max={100}
              value={focus}
              onChange={(e) => setFocus(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-300"
            />
          </div>

          {/* Chill */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="track-chill"
              className="text-xs font-medium text-slate-700"
            >
              Chill: {chill}%
            </label>
            <input
              id="track-chill"
              type="range"
              min={0}
              max={100}
              value={chill}
              onChange={(e) => setChill(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-300"
            />
          </div>

          {/* Length */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="track-length"
              className="text-xs font-medium text-slate-700"
            >
              Length: {lengthMins} min
            </label>
            <input
              id="track-length"
              type="range"
              min={1}
              max={10}
              value={lengthMins}
              onChange={(e) => setLengthMins(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-300"
            />
          </div>

          {/* Instrumental toggle */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700">Type</span>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="track-type"
                  checked={instrumental}
                  onChange={() => setInstrumental(true)}
                  className="h-4 w-4 border-slate-300 text-emerald-600"
                />
                <span className="text-sm text-slate-700">Instrumental</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="track-type"
                  checked={!instrumental}
                  onChange={() => setInstrumental(false)}
                  className="h-4 w-4 border-slate-300 text-emerald-600"
                />
                <span className="text-sm text-slate-700">With Vocals</span>
              </label>
            </div>
          </div>
        </div>

        {/* Instrumentation presets */}
        <div className="mt-4">
          <label className="text-xs font-medium text-slate-700">
            Instrumentation
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {INSTRUMENTATION_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => toggleInstrumentation(preset)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  instrumentation.includes(preset)
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Final prompt display */}
        {promptFinal && (
          <div className="mt-4">
            <label className="text-xs font-medium text-slate-700">
              Final Prompt (for ElevenLabs)
            </label>
            <div className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-sm text-emerald-900">{promptFinal}</p>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              This prompt is AI-generated based on your settings and will be
              used when generating the track. Refine again to update it.
            </p>
          </div>
        )}

        {/* Title override for generation */}
        {hasDraftSpec && (
          <div className="mt-4">
            <label
              htmlFor="title-override"
              className="text-xs font-medium text-slate-700"
            >
              Override title (optional)
            </label>
            <input
              id="title-override"
              type="text"
              value={titleOverride}
              onChange={(e) => setTitleOverride(e.target.value)}
              placeholder="Leave empty to use AI-generated title..."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        )}

        {/* CTAs */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleRefine}
            disabled={refineStatus === "loading"}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refineStatus === "loading"
              ? "Refining..."
              : refineStatus === "success"
                ? "Refined ✓"
                : "Refine with AI"}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generateStatus === "loading" || !hasDraftSpec}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={
              !hasDraftSpec ? "Refine your prompt first" : "Generate track"
            }
          >
            {generateStatus === "loading"
              ? "Generating..."
              : generateStatus === "success"
                ? "Generated ✓"
                : "Generate Track"}
          </button>
          {!hasDraftSpec && (
            <span className="text-xs text-slate-500">
              Refine first to enable generation
            </span>
          )}
        </div>

        {/* Error display */}
        {(generateError || refineError) && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">Error</p>
            {generateError && (
              <p className="mt-1 text-sm text-red-700">{generateError}</p>
            )}
            {refineError && (
              <p className="mt-1 text-sm text-red-700">{refineError}</p>
            )}
          </div>
        )}

        {/* Free-form chat input - uses refine endpoint for structured output */}
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your track idea or request changes..."
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !chatId}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
