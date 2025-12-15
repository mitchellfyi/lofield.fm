import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DateRangeSchema,
  parseDateRange,
  validateDateRange,
  type ProviderSummary,
  type ModelSummary,
} from "@/lib/usage-api-helpers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/usage/summary?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns aggregated usage summary grouped by provider and model
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
      .lte("occurred_at", endTimestamp);

    if (error) {
      console.error("Failed to fetch usage events for summary", {
        userId,
        error: error.message,
      });
      return NextResponse.json(
        { error: "Failed to fetch usage summary" },
        { status: 500 }
      );
    }

    // Aggregate by provider
    const providerMap = new Map<string, ProviderSummary>();
    const modelMap = new Map<string, ModelSummary>();
    const chatIds = new Set<string>();
    const trackIds = new Set<string>();
    let refineActions = 0;
    let generateActions = 0;

    for (const event of events) {
      const provider = event.provider as "openai" | "elevenlabs";

      // Track unique chats and tracks
      if (event.chat_id) chatIds.add(event.chat_id);
      if (event.track_id) trackIds.add(event.track_id);

      // Track action types
      if (event.action_type === "refine_prompt") refineActions++;
      if (event.action_type === "generate_track") generateActions++;

      // Aggregate by provider
      if (!providerMap.has(provider)) {
        providerMap.set(provider, {
          provider,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          creditsUsed: 0,
          audioSeconds: 0,
          requestCount: 0,
          costUsd: 0,
          costUsdUnknownCount: 0,
          errorCount: 0,
          errorRate: 0,
        });
      }

      const providerStats = providerMap.get(provider)!;
      providerStats.requestCount++;

      if (event.status === "error") {
        providerStats.errorCount++;
      }

      if (provider === "openai") {
        providerStats.inputTokens =
          (providerStats.inputTokens ?? 0) + (event.input_tokens ?? 0);
        providerStats.outputTokens =
          (providerStats.outputTokens ?? 0) + (event.output_tokens ?? 0);
        providerStats.totalTokens =
          (providerStats.totalTokens ?? 0) + (event.total_tokens ?? 0);
      } else if (provider === "elevenlabs") {
        providerStats.creditsUsed =
          (providerStats.creditsUsed ?? 0) + (event.credits_used ?? 0);
        providerStats.audioSeconds =
          (providerStats.audioSeconds ?? 0) + (event.audio_seconds ?? 0);
      }

      if (event.cost_usd != null) {
        providerStats.costUsd += event.cost_usd;
      } else {
        providerStats.costUsdUnknownCount++;
      }

      // Aggregate by model (if model is specified)
      if (event.model) {
        const modelKey = `${provider}:${event.model}`;
        if (!modelMap.has(modelKey)) {
          modelMap.set(modelKey, {
            model: event.model,
            provider,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            creditsUsed: 0,
            audioSeconds: 0,
            requestCount: 0,
            costUsd: 0,
            costUsdUnknownCount: 0,
          });
        }

        const modelStats = modelMap.get(modelKey)!;
        modelStats.requestCount++;

        if (provider === "openai") {
          modelStats.inputTokens =
            (modelStats.inputTokens ?? 0) + (event.input_tokens ?? 0);
          modelStats.outputTokens =
            (modelStats.outputTokens ?? 0) + (event.output_tokens ?? 0);
          modelStats.totalTokens =
            (modelStats.totalTokens ?? 0) + (event.total_tokens ?? 0);
        } else if (provider === "elevenlabs") {
          modelStats.creditsUsed =
            (modelStats.creditsUsed ?? 0) + (event.credits_used ?? 0);
          modelStats.audioSeconds =
            (modelStats.audioSeconds ?? 0) + (event.audio_seconds ?? 0);
        }

        if (event.cost_usd != null) {
          modelStats.costUsd += event.cost_usd;
        } else {
          modelStats.costUsdUnknownCount++;
        }
      }
    }

    // Calculate error rates
    for (const providerStats of providerMap.values()) {
      providerStats.errorRate =
        providerStats.requestCount > 0
          ? providerStats.errorCount / providerStats.requestCount
          : 0;
    }

    // Sort models by request count (top N)
    const topModels = Array.from(modelMap.values())
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 10); // Top 10 models

    return NextResponse.json({
      byProvider: Array.from(providerMap.values()),
      topModels,
      counts: {
        chatsTouched: chatIds.size,
        tracksGenerated: trackIds.size,
        refineActions,
        generateActions,
      },
    });
  } catch (error) {
    console.error("Exception in usage summary endpoint", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
