import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DateRangeSchema,
  parseDateRange,
  validateDateRange,
  type ChatSummary,
} from "@/lib/usage-api-helpers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/usage/chats?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns per-chat usage breakdown
 *
 * Response:
 * - chats: Array of chat summaries, sorted by last activity (most recent first)
 *   - chatId, title, lastActivity
 *   - openaiTokens, openaiCost
 *   - elevenCredits
 *   - tracksCount: Number of unique tracks created in this chat
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const { searchParams } = request.nextUrl;

  // Validate query parameters
  const parseResult = DateRangeSchema.safeParse({
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: parseResult.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { start, end } = parseResult.data;

  if (!validateDateRange(start, end)) {
    return NextResponse.json(
      { error: "End date must not be before start date" },
      { status: 400 }
    );
  }

  const { startTimestamp, endTimestamp } = parseDateRange(start, end);

  try {
    // Fetch usage events for the date range, grouped by chat
    const { data: events, error } = await supabase
      .from("usage_events")
      .select("*")
      .eq("user_id", userId)
      .gte("occurred_at", startTimestamp)
      .lte("occurred_at", endTimestamp)
      .not("chat_id", "is", null);

    if (error) {
      console.error("Failed to fetch usage events for chats", {
        userId,
        error: error.message,
      });
      return NextResponse.json(
        { error: "Failed to fetch chat usage" },
        { status: 500 }
      );
    }

    // Group by chat_id
    const chatMap = new Map<
      string,
      {
        openaiTokens: number;
        openaiCost: number;
        elevenCredits: number;
        trackIds: Set<string>;
        lastActivity: string;
      }
    >();

    for (const event of events) {
      const chatId = event.chat_id;
      if (!chatId) continue;

      if (!chatMap.has(chatId)) {
        chatMap.set(chatId, {
          openaiTokens: 0,
          openaiCost: 0,
          elevenCredits: 0,
          trackIds: new Set(),
          lastActivity: event.occurred_at,
        });
      }

      const chatStats = chatMap.get(chatId)!;

      // Update last activity
      if (event.occurred_at > chatStats.lastActivity) {
        chatStats.lastActivity = event.occurred_at;
      }

      // Track unique tracks
      if (event.track_id) {
        chatStats.trackIds.add(event.track_id);
      }

      // Aggregate OpenAI metrics
      if (event.provider === "openai") {
        chatStats.openaiTokens += event.total_tokens ?? 0;
        if (event.cost_usd != null) {
          chatStats.openaiCost += event.cost_usd;
        }
      }

      // Aggregate ElevenLabs metrics
      if (event.provider === "elevenlabs") {
        chatStats.elevenCredits += event.credits_used ?? 0;
      }
    }

    // Fetch chat titles
    const chatIds = Array.from(chatMap.keys());
    const { data: chats, error: chatsError } = await supabase
      .from("chats")
      .select("id, title")
      .in("id", chatIds);

    if (chatsError) {
      console.error("Failed to fetch chat titles", {
        userId,
        error: chatsError.message,
      });
      return NextResponse.json(
        { error: "Failed to fetch chat details" },
        { status: 500 }
      );
    }

    // Build chat summaries (only include chats with events)
    const chatSummaries: ChatSummary[] = chats
      .filter((chat) => chatMap.has(chat.id))
      .map((chat) => {
        const stats = chatMap.get(chat.id)!;
        return {
          chatId: chat.id,
          title: chat.title,
          lastActivity: stats.lastActivity,
          openaiTokens: stats.openaiTokens,
          openaiCost: stats.openaiCost,
          elevenCredits: stats.elevenCredits,
          tracksCount: stats.trackIds.size,
        };
      });

    // Sort by last activity (most recent first)
    chatSummaries.sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    return NextResponse.json({
      chats: chatSummaries,
    });
  } catch (error) {
    console.error("Exception in chats usage endpoint", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
