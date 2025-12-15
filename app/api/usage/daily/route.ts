import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DateRangeSchema,
  DailyGroupBySchema,
  parseDateRange,
  validateDateRange,
  type DailyMetrics,
} from "@/lib/usage-api-helpers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/usage/daily?start=YYYY-MM-DD&end=YYYY-MM-DD&groupBy=provider|model|action_type
 * Returns daily breakdown of usage metrics
 *
 * Response:
 * - groupBy: The dimension used for grouping (provider, model, or action_type)
 * - daily: Array of daily metrics, each containing:
 *   - date: YYYY-MM-DD in UTC
 *   - provider/model/actionType: Group value (based on groupBy parameter)
 *   - requestCount, errorCount, costUsd
 *   - OpenAI: inputTokens, outputTokens, totalTokens
 *   - ElevenLabs: creditsUsed, audioSeconds
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
  const dateParseResult = DateRangeSchema.safeParse({
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });

  if (!dateParseResult.success) {
    return NextResponse.json(
      {
        error: "Invalid date parameters",
        details: dateParseResult.error.flatten(),
      },
      { status: 400 }
    );
  }

  const groupByParam = searchParams.get("groupBy") ?? "provider";
  const groupByResult = DailyGroupBySchema.safeParse(groupByParam);

  if (!groupByResult.success) {
    return NextResponse.json(
      {
        error:
          "Invalid groupBy parameter. Must be one of: provider, model, action_type",
      },
      { status: 400 }
    );
  }

  const { start, end } = dateParseResult.data;
  const groupBy = groupByResult.data;

  // Validate date range
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
      .lte("occurred_at", endTimestamp)
      .order("occurred_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch usage events for daily breakdown", {
        userId,
        error: error.message,
      });
      return NextResponse.json(
        { error: "Failed to fetch daily usage" },
        { status: 500 }
      );
    }

    // Group by date + groupBy dimension
    const dailyMap = new Map<string, DailyMetrics>();

    for (const event of events) {
      // Extract date in UTC (YYYY-MM-DD)
      const occurredAt = new Date(event.occurred_at);
      const dateKey = occurredAt.toISOString().split("T")[0];

      // Build composite key based on groupBy parameter
      let compositeKey = dateKey;
      let groupValue: string | undefined;

      if (groupBy === "provider") {
        compositeKey = `${dateKey}:${event.provider}`;
        groupValue = event.provider;
      } else if (groupBy === "model") {
        compositeKey = `${dateKey}:${event.model ?? "unknown"}`;
        groupValue = event.model ?? "unknown";
      } else if (groupBy === "action_type") {
        compositeKey = `${dateKey}:${event.action_type}`;
        groupValue = event.action_type;
      }

      if (!dailyMap.has(compositeKey)) {
        const metrics: DailyMetrics = {
          date: dateKey,
          requestCount: 0,
          costUsd: 0,
          errorCount: 0,
        };

        if (groupBy === "provider") {
          metrics.provider = groupValue;
        } else if (groupBy === "model") {
          metrics.model = groupValue;
        } else if (groupBy === "action_type") {
          metrics.actionType = groupValue;
        }

        dailyMap.set(compositeKey, metrics);
      }

      const metrics = dailyMap.get(compositeKey)!;
      metrics.requestCount++;

      if (event.status === "error") {
        metrics.errorCount++;
      }

      // Aggregate OpenAI metrics
      if (event.provider === "openai") {
        metrics.inputTokens =
          (metrics.inputTokens ?? 0) + (event.input_tokens ?? 0);
        metrics.outputTokens =
          (metrics.outputTokens ?? 0) + (event.output_tokens ?? 0);
        metrics.totalTokens =
          (metrics.totalTokens ?? 0) + (event.total_tokens ?? 0);
      }

      // Aggregate ElevenLabs metrics
      if (event.provider === "elevenlabs") {
        metrics.creditsUsed =
          (metrics.creditsUsed ?? 0) + (event.credits_used ?? 0);
        metrics.audioSeconds =
          (metrics.audioSeconds ?? 0) + (event.audio_seconds ?? 0);
      }

      // Aggregate cost
      if (event.cost_usd != null) {
        metrics.costUsd += event.cost_usd;
      }
    }

    // Convert to array and sort by date
    const dailyMetrics = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      groupBy,
      daily: dailyMetrics,
    });
  } catch (error) {
    console.error("Exception in daily usage endpoint", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
