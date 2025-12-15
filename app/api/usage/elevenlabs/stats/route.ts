import { getElevenLabsKeyForUser } from "@/lib/secrets";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUsageStats } from "@/lib/elevenlabs";
import { logUsageEvent } from "@/lib/usage-tracking";
import { elevenLabsCache, getUsageStatsCacheKey, CACHE_TTL } from "@/lib/cache";
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";

/**
 * GET /api/usage/elevenlabs/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Fetch ElevenLabs daily usage stats for a date range
 * Cached for 3 hours per user and date range to avoid hammering the API
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
  const actionGroupId = randomUUID();

  // Parse query parameters
  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      {
        error: "Missing required query parameters: startDate and endDate",
      },
      { status: 400 }
    );
  }

  // Validate date formats (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return NextResponse.json(
      {
        error: "Invalid date format. Use YYYY-MM-DD",
      },
      { status: 400 }
    );
  }

  // Check cache first
  const cacheKey = getUsageStatsCacheKey(userId, startDate, endDate);
  const cached = elevenLabsCache.get(cacheKey);
  if (cached) {
    return NextResponse.json({
      ok: true,
      stats: cached,
      cached: true,
    });
  }

  // Get ElevenLabs key
  const elevenLabsKey = await getElevenLabsKeyForUser(userId);
  if (!elevenLabsKey) {
    return NextResponse.json(
      {
        error:
          "Missing ElevenLabs API key. Please add your key in Settings to view usage stats.",
      },
      { status: 400 }
    );
  }

  // Convert dates to unix timestamps (milliseconds)
  const startUnix = new Date(startDate).getTime();
  const endUnix = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1; // End of day

  const startTime = Date.now();

  try {
    // Fetch usage stats from ElevenLabs
    const stats = await getUsageStats(elevenLabsKey, startUnix, endUnix);
    const latencyMs = Date.now() - startTime;

    // Cache the result
    elevenLabsCache.set(cacheKey, stats, CACHE_TTL.USAGE_STATS);

    // Log usage event
    await logUsageEvent({
      userId,
      actionGroupId,
      actionType: "fetch_eleven_usage",
      provider: "elevenlabs",
      providerOperation: "usage.characterStats",
      status: "ok",
      latencyMs,
      raw: {
        startDate,
        endDate,
        dataPoints: stats.dailyUsage.length,
      },
    });

    return NextResponse.json({
      ok: true,
      stats,
      cached: false,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log usage event with error
    await logUsageEvent({
      userId,
      actionGroupId,
      actionType: "fetch_eleven_usage",
      provider: "elevenlabs",
      providerOperation: "usage.characterStats",
      status: "error",
      errorMessage,
      latencyMs,
    });

    return NextResponse.json(
      {
        error: "Failed to fetch ElevenLabs usage stats",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
