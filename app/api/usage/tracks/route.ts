import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DateRangeSchema,
  parseDateRange,
  validateDateRange,
  type TrackSummary,
} from "@/lib/usage-api-helpers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/usage/tracks?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns per-track usage breakdown
 * Includes events linked by track_id or action_group_id (for refine->generate flows)
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
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
    // Fetch usage events for the date range
    const { data: events, error } = await supabase
      .from("usage_events")
      .select("*")
      .eq("user_id", userId)
      .gte("occurred_at", startTimestamp)
      .lte("occurred_at", endTimestamp);

    if (error) {
      console.error("Failed to fetch usage events for tracks", {
        userId,
        error: error.message,
      });
      return NextResponse.json(
        { error: "Failed to fetch track usage" },
        { status: 500 }
      );
    }

    // Build a map of action_group_id -> track_id for attribution
    const actionGroupToTrack = new Map<string, string>();
    for (const event of events) {
      if (event.track_id && event.action_group_id) {
        actionGroupToTrack.set(event.action_group_id, event.track_id);
      }
    }

    // Group by track_id (including action_group_id attribution)
    const trackMap = new Map<
      string,
      {
        openaiTokens: number;
        elevenAudioSeconds: number;
        elevenCredits: number;
        totalCost: number;
      }
    >();

    for (const event of events) {
      // Determine which track this event belongs to
      let trackId = event.track_id;

      // If no direct track_id, check if this action_group_id maps to a track
      if (!trackId && event.action_group_id) {
        trackId = actionGroupToTrack.get(event.action_group_id);
      }

      if (!trackId) continue;

      if (!trackMap.has(trackId)) {
        trackMap.set(trackId, {
          openaiTokens: 0,
          elevenAudioSeconds: 0,
          elevenCredits: 0,
          totalCost: 0,
        });
      }

      const trackStats = trackMap.get(trackId)!;

      // Aggregate OpenAI metrics
      if (event.provider === "openai") {
        trackStats.openaiTokens += event.total_tokens ?? 0;
      }

      // Aggregate ElevenLabs metrics
      if (event.provider === "elevenlabs") {
        trackStats.elevenAudioSeconds += event.audio_seconds ?? 0;
        trackStats.elevenCredits += event.credits_used ?? 0;
      }

      // Aggregate cost
      if (event.cost_usd != null) {
        trackStats.totalCost += event.cost_usd;
      }
    }

    // Fetch track details
    const trackIds = Array.from(trackMap.keys());
    const { data: tracks, error: tracksError } = await supabase
      .from("tracks")
      .select("id, title, chat_id, length_ms")
      .in("id", trackIds);

    if (tracksError) {
      console.error("Failed to fetch track details", {
        userId,
        error: tracksError.message,
      });
      return NextResponse.json(
        { error: "Failed to fetch track details" },
        { status: 500 }
      );
    }

    // Build track summaries
    const trackSummaries: TrackSummary[] = tracks.map((track) => {
      const stats = trackMap.get(track.id)!;
      return {
        trackId: track.id,
        title: track.title,
        chatId: track.chat_id,
        lengthMs: track.length_ms,
        openaiTokensUsed: stats.openaiTokens,
        elevenAudioSeconds: stats.elevenAudioSeconds,
        elevenCredits: stats.elevenCredits,
        totalCost: stats.totalCost,
      };
    });

    // Sort by total cost (highest first)
    trackSummaries.sort((a, b) => b.totalCost - a.totalCost);

    return NextResponse.json({
      tracks: trackSummaries,
    });
  } catch (error) {
    console.error("Exception in tracks usage endpoint", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
