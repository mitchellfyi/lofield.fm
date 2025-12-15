"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";
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
    instrumentation?: string[];
    key?: string | null;
    time_signature?: string | null;
  };
  length_ms: number;
  instrumental: boolean;
  status: "draft" | "generating" | "ready" | "failed";
  error?: { message?: string; suggestion?: string; type?: string } | null;
  storage_path: string | null;
  created_at: string;
};

type Props = {
  userEmail: string;
};

export function StudioShell({
  userEmail: _userEmail, // keeping prop for interface but marking unused
}: Props) {
  void _userEmail; // Suppress unused warning
  const supabase = useMemo(() => createClient(), []);

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

  const handleCreateChat = useCallback(async () => {
    const response = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New track" }),
    });

    if (!response.ok) {
      console.error("Failed to create chat");
      return;
    }

    const { chat } = (await response.json()) as { chat?: { id: string } };
    if (!chat?.id) return;

    setSelectedChatId(chat.id);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    setSelectedTrackId(null);
  }, []);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  function handleTrackGenerated(trackId: string) {
    // Refresh to load the new track FIRST
    handleRefresh();
    // Then select it after a tiny delay to ensure list is populated
    setTimeout(() => {
      setSelectedTrackId(trackId);
    }, 100);
  }

  // Check if there's a draft_spec in any message
  const hasDraftSpec = messages.some((m) => m.draft_spec != null);

  return (
    <div className="flex h-full flex-col">
      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel A: Chat list sidebar */}
        <div className="w-64 flex-shrink-0">
          <ChatListSidebar
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            onCreateChat={handleCreateChat}
            refreshKey={refreshKey}
          />
        </div>

        {/* Panel B: Prompt builder */}
        <div className="flex-1 overflow-hidden">
          <PromptBuilder
            chatId={selectedChatId}
            chatTitle={selectedChat?.title ?? "New Track"}
            messages={messages}
            onRefresh={handleRefresh}
            hasDraftSpec={hasDraftSpec}
            onTrackGenerated={handleTrackGenerated}
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
