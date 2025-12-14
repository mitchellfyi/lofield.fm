"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Chat = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  track_count?: number;
};

type Props = {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => void;
};

export function ChatListSidebar({
  selectedChatId,
  onSelectChat,
  onCreateChat,
}: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  useEffect(() => {
    let isCancelled = false;

    async function fetchChats() {
      setLoading(true);
      const { data: chatsData, error } = await supabase
        .from("chats")
        .select("id, title, created_at, updated_at")
        .order("updated_at", { ascending: false });

      if (!isCancelled) {
        if (!error && chatsData) {
          // Fetch all tracks in a single query, then count by chat_id
          const chatIds = chatsData.map((chat) => chat.id);

          // Skip track query if there are no chats
          if (chatIds.length === 0) {
            setChats(chatsData);
            setLoading(false);
            return;
          }

          const { data: tracksData } = await supabase
            .from("tracks")
            .select("chat_id")
            .in("chat_id", chatIds);

          // Count tracks per chat
          const trackCountByChat = (tracksData ?? []).reduce(
            (acc, track) => {
              acc[track.chat_id] = (acc[track.chat_id] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );

          // Merge track counts with chats
          const chatsWithCounts = chatsData.map((chat) => ({
            ...chat,
            track_count: trackCountByChat[chat.id] ?? 0,
          }));

          setChats(chatsWithCounts);
        }
        setLoading(false);
      }
    }

    fetchChats();

    return () => {
      isCancelled = true;
    };
  }, [supabase]);

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Chats</h2>
        <button
          onClick={onCreateChat}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
        >
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
        />
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            Loading chats...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            {searchQuery
              ? "No chats match your search"
              : "No chats yet. Create one to get started!"}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredChats.map((chat) => (
              <li key={chat.id}>
                <button
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full px-4 py-3 text-left transition ${
                    selectedChatId === chat.id
                      ? "bg-emerald-50 text-emerald-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <p className="truncate text-sm font-medium">{chat.title}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {new Date(chat.updated_at).toLocaleDateString()}
                    </span>
                    <span>
                      {chat.track_count ?? 0} track
                      {chat.track_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
