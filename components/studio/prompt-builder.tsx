"use client";

import { TextStreamChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useMemo, useState, useEffect, useRef, type FormEvent } from "react";

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

type StreamMessage = {
  id: string;
  role: string;
  parts?: Array<{ type: string; text?: string }>;
};

function convertStreamMessage(msg: StreamMessage): Message {
  const parts = msg.parts ?? [];
  const textContent = parts
    .filter(
      (part): part is { type: "text"; text: string } =>
        part.type === "text" && typeof part.text === "string"
    )
    .map((part) => part.text)
    .join("");

  return {
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: textContent,
    created_at: new Date().toISOString(),
  };
}

export function PromptBuilder({
  chatId,
  chatTitle,
  messages,
  onRefresh,
  hasDraftSpec,
  onTrackGenerated,
}: Props) {
  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/chat",
        body: chatId ? { chat_id: chatId } : undefined,
      }),
    [chatId]
  );
  const {
    messages: streamMessages,
    sendMessage,
    status,
    stop,
    setMessages,
  } = useChat({
    transport,
    onFinish: () => {
      onRefresh();
    },
    onError: (err) => {
      setChatError(
        err instanceof Error ? err.message : "Failed to send chat message."
      );
    },
  });

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
  const [chatError, setChatError] = useState<string | null>(null);
  const [titleOverride, setTitleOverride] = useState("");

  // Clear stream messages when DB messages update (persistence catch-up)
  const prevMessagesLengthRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      if (streamMessages.length > 0) {
        setMessages([]);
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, streamMessages, setMessages]);

  const isLoading = status === "streaming" || status === "submitted";

  // Combine persisted messages with streaming messages
  const allMessages = useMemo(() => {
    // Show persisted messages first, then any streaming messages
    if (streamMessages.length > 0) {
      return [
        ...messages,
        ...streamMessages.map((msg) => convertStreamMessage(msg)),
      ];
    }
    return messages;
  }, [messages, streamMessages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) {
      setChatError("Message cannot be empty");
      return;
    }
    setChatError(null);
    sendMessage({ text: input }).catch((err) => {
      setChatError(
        err instanceof Error ? err.message : "Failed to send chat message."
      );
    });
    setInput("");
  }

  async function handleRefine() {
    if (!chatId) return;

    setRefineStatus("loading");
    setRefineError(null);

    const promptSpec = {
      title: title || undefined,
      genre: genre || undefined,
      bpm,
      mood: { energy: energy / 100, focus: focus / 100, chill: chill / 100 },
      instrumentation: instrumentation.length > 0 ? instrumentation : undefined,
      length_ms: lengthMins * 60 * 1000,
      instrumental,
    };
    const refineMessage =
      input.trim() ||
      "Refine the track prompt using the current controls and draft.";

    try {
      const response = await fetch(`/api/chats/${chatId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: refineMessage,
          controls: promptSpec,
          latest_draft: null,
        }),
      });

      if (response.ok) {
        // Consume the stream to ensure server-side persistence completes
        if (response.body) {
          const reader = response.body.getReader();
          while (true) {
            const { done } = await reader.read();
            if (done) break;
          }
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
  }, [allMessages, isLoading]); // Scroll on new messages or loading state change

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
        {allMessages.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No messages yet. Use the prompt builder below to refine your track
            idea.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {allMessages.map((message) => (
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
        {(generateError || refineError || chatError) && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">Error</p>
            {generateError && (
              <p className="mt-1 text-sm text-red-700">{generateError}</p>
            )}
            {refineError && (
              <p className="mt-1 text-sm text-red-700">{refineError}</p>
            )}
            {chatError && (
              <p className="mt-1 text-sm text-red-700">{chatError}</p>
            )}
          </div>
        )}

        {/* Free-form chat input */}
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Chat with AI to refine your prompt..."
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "..." : "Send"}
            </button>
            {isLoading && (
              <button
                type="button"
                onClick={stop}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                Stop
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
