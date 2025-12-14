"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { ChatListSidebar } from "./chat-list-sidebar";
import { PromptBuilder } from "./prompt-builder";
import { TrackPlayer } from "./track-player";

type Chat = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  draft_spec?: Record<string, unknown> | null;
  created_at: string;
};

type Track = {
  id: string;
  title: string;
  description: string;
  final_prompt: string;
  metadata: {
    genre?: string;
    bpm?: number;
    mood?: {
      energy?: number;
      focus?: number;
      chill?: number;
    };
    tags?: string[];
  };
  length_ms: number;
  instrumental: boolean;
  status: "draft" | "generating" | "ready" | "failed";
  error?: { message?: string } | null;
  storage_path: string | null;
  created_at: string;
};

type Props = {
  userId: string;
  userEmail: string;
};

export function StudioShell({ userEmail }: Props) {
  const supabase = createClient();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load chat details when selected - using useEffect with IIFE for async data fetching
  useEffect(() => {
    let isCancelled = false;

    async function fetchData() {
      if (!selectedChatId) {
        if (!isCancelled) {
          setSelectedChat(null);
          setMessages([]);
          setTracks([]);
        }
        return;
      }

      // Load chat
      const { data: chatData } = await supabase
        .from("chats")
        .select("*")
        .eq("id", selectedChatId)
        .single();

      if (!isCancelled && chatData) {
        setSelectedChat(chatData);
      }

      // Load messages
      const { data: messagesData } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_id", selectedChatId)
        .order("created_at", { ascending: true });

      if (!isCancelled && messagesData) {
        setMessages(messagesData);
      }

      // Load tracks
      const { data: tracksData } = await supabase
        .from("tracks")
        .select("*")
        .eq("chat_id", selectedChatId)
        .order("created_at", { ascending: false });

      if (!isCancelled && tracksData) {
        setTracks(tracksData);
      }
    }

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [selectedChatId, refreshKey, supabase]);

  async function handleCreateChat() {
    const { data, error } = await supabase
      .from("chats")
      .insert({ title: "New chat" })
      .select()
      .single();

    if (!error && data) {
      setSelectedChatId(data.id);
      setRefreshKey((k) => k + 1);
    }
  }

  function handleSelectChat(chatId: string) {
    setSelectedChatId(chatId);
    setSelectedTrackId(null);
  }

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  // Check if there's a draft_spec in any message
  const hasDraftSpec = messages.some((m) => m.draft_spec != null);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-emerald-700">
            Lofield Studio
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{userEmail}</span>
          <a
            href="/settings"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Settings
          </a>
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel A: Chat list sidebar */}
        <div className="w-64 flex-shrink-0">
          <ChatListSidebar
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            onCreateChat={handleCreateChat}
          />
        </div>

        {/* Panel B: Prompt builder */}
        <div className="flex-1 overflow-hidden">
          <PromptBuilder
            chatId={selectedChatId}
            chatTitle={selectedChat?.title ?? "New Chat"}
            messages={messages}
            onRefresh={handleRefresh}
            hasDraftSpec={hasDraftSpec}
          />
        </div>

        {/* Panel C: Track player */}
        <div className="w-80 flex-shrink-0">
          <TrackPlayer
            tracks={tracks}
            selectedTrackId={selectedTrackId}
            onSelectTrack={setSelectedTrackId}
          />
        </div>
      </div>
    </div>
  );
}
