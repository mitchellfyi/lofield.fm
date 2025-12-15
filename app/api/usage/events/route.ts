import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EventFiltersSchema } from "@/lib/usage-api-helpers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/usage/events?start=...&end=...&provider=&model=&chat_id=&track_id=&status=&page=&per_page=
 * Returns paginated raw usage events with optional filters (sanitised)
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

  // Parse and validate filters
  const parseResult = EventFiltersSchema.safeParse({
    start: searchParams.get("start"),
    end: searchParams.get("end"),
    provider: searchParams.get("provider"),
    model: searchParams.get("model"),
    chat_id: searchParams.get("chat_id"),
    track_id: searchParams.get("track_id"),
    status: searchParams.get("status"),
    page: searchParams.get("page"),
    per_page: searchParams.get("per_page"),
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

  const filters = parseResult.data;

  try {
    // Build query with filters
    let query = supabase
      .from("usage_events")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false });

    // Apply date range filter
    if (filters.start) {
      const startDate = new Date(`${filters.start}T00:00:00.000Z`);
      query = query.gte("occurred_at", startDate.toISOString());
    }

    if (filters.end) {
      const endDate = new Date(`${filters.end}T23:59:59.999Z`);
      query = query.lte("occurred_at", endDate.toISOString());
    }

    // Apply provider filter
    if (filters.provider) {
      query = query.eq("provider", filters.provider);
    }

    // Apply model filter
    if (filters.model) {
      query = query.eq("model", filters.model);
    }

    // Apply chat_id filter
    if (filters.chat_id) {
      query = query.eq("chat_id", filters.chat_id);
    }

    // Apply track_id filter
    if (filters.track_id) {
      query = query.eq("track_id", filters.track_id);
    }

    // Apply status filter
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    // Apply pagination
    const offset = (filters.page - 1) * filters.per_page;
    query = query.range(offset, offset + filters.per_page - 1);

    const { data: events, error, count } = await query;

    if (error) {
      console.error("Failed to fetch usage events", {
        userId,
        error: error.message,
      });
      return NextResponse.json(
        { error: "Failed to fetch usage events" },
        { status: 500 }
      );
    }

    // Sanitize events - remove sensitive data
    const sanitizedEvents = events.map((event) => ({
      id: event.id,
      occurredAt: event.occurred_at,
      chatId: event.chat_id,
      chatMessageId: event.chat_message_id,
      trackId: event.track_id,
      actionGroupId: event.action_group_id,
      actionType: event.action_type,
      provider: event.provider,
      providerOperation: event.provider_operation,
      model: event.model,
      inputTokens: event.input_tokens,
      outputTokens: event.output_tokens,
      totalTokens: event.total_tokens,
      creditsUsed: event.credits_used,
      creditsBalance: event.credits_balance,
      creditsLimit: event.credits_limit,
      audioSeconds: event.audio_seconds,
      audioBytes: event.audio_bytes,
      costUsd: event.cost_usd,
      costNotes: event.cost_notes,
      status: event.status,
      httpStatus: event.http_status,
      errorCode: event.error_code,
      errorMessage: event.error_message,
      latencyMs: event.latency_ms,
      // Exclude: provider_request_id, raw (may contain sensitive data)
    }));

    const totalPages = Math.ceil((count ?? 0) / filters.per_page);

    return NextResponse.json({
      events: sanitizedEvents,
      pagination: {
        page: filters.page,
        perPage: filters.per_page,
        totalCount: count ?? 0,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Exception in events usage endpoint", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
