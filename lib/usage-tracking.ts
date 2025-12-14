import { getServiceRoleClient } from "@/lib/supabase/admin";

export type UsageEventData = {
  userId: string;
  occurredAt?: Date;
  
  // Attribution
  chatId?: string;
  chatMessageId?: string;
  trackId?: string;
  actionGroupId: string; // Required - generated per UI action
  actionType: string; // e.g. 'refine_prompt', 'generate_track', 'fetch_eleven_subscription'
  
  // Provider details
  provider: "openai" | "elevenlabs";
  providerOperation?: string; // e.g. 'responses.streamText', 'music.compose'
  providerRequestId?: string; // Provider's request/response ID
  model?: string;
  
  // OpenAI metrics
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  
  // ElevenLabs metrics
  creditsUsed?: number;
  creditsBalance?: number;
  creditsLimit?: number;
  audioSeconds?: number;
  audioBytes?: number;
  
  // Cost
  costUsd?: number;
  costNotes?: string;
  
  // Outcome
  status: "ok" | "error";
  httpStatus?: number;
  errorCode?: string;
  errorMessage?: string;
  latencyMs?: number;
  raw?: Record<string, unknown>; // Sanitized response/headers metadata
};

/**
 * Log a usage event for API calls to OpenAI or ElevenLabs
 * This should be called after every provider API call
 */
export async function logUsageEvent(data: UsageEventData): Promise<void> {
  const supabaseAdmin = getServiceRoleClient();

  try {
    const { error } = await supabaseAdmin.from("usage_events").insert({
      user_id: data.userId,
      occurred_at: data.occurredAt?.toISOString() ?? new Date().toISOString(),
      
      // Attribution
      chat_id: data.chatId ?? null,
      chat_message_id: data.chatMessageId ?? null,
      track_id: data.trackId ?? null,
      action_group_id: data.actionGroupId,
      action_type: data.actionType,
      
      // Provider
      provider: data.provider,
      provider_operation: data.providerOperation ?? null,
      provider_request_id: data.providerRequestId ?? null,
      model: data.model ?? null,
      
      // OpenAI metrics
      input_tokens: data.inputTokens ?? null,
      output_tokens: data.outputTokens ?? null,
      total_tokens: data.totalTokens ?? null,
      
      // ElevenLabs metrics
      credits_used: data.creditsUsed ?? null,
      credits_balance: data.creditsBalance ?? null,
      credits_limit: data.creditsLimit ?? null,
      audio_seconds: data.audioSeconds ?? null,
      audio_bytes: data.audioBytes ?? null,
      
      // Cost
      cost_usd: data.costUsd ?? null,
      cost_notes: data.costNotes ?? null,
      
      // Outcome
      status: data.status,
      http_status: data.httpStatus ?? null,
      error_code: data.errorCode ?? null,
      error_message: data.errorMessage ?? null,
      latency_ms: data.latencyMs ?? null,
      raw: data.raw ?? null,
    });

    if (error) {
      // Don't throw - usage tracking failures shouldn't break the main flow
      console.error("Failed to log usage event", {
        userId: data.userId,
        actionType: data.actionType,
        provider: data.provider,
        error: error.message,
        // Don't log the full error object to avoid exposing sensitive data
      });
    }
  } catch (err) {
    // Catch and log, but don't throw
    console.error("Exception while logging usage event", {
      userId: data.userId,
      actionType: data.actionType,
      provider: data.provider,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

/**
 * Calculate OpenAI cost based on token usage and pricing
 * Returns cost in USD and a note about the pricing used
 */
export async function calculateOpenAICost(params: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  occurredAt?: Date;
}): Promise<{ costUsd: number | null; costNotes: string | null }> {
  const { model, inputTokens, outputTokens, occurredAt } = params;
  const supabaseAdmin = getServiceRoleClient();
  
  const queryDate = occurredAt ?? new Date();
  
  // Query provider_pricing for the model and date
  const { data: pricing, error } = await supabaseAdmin
    .from("provider_pricing")
    .select("price_input_per_1k, price_output_per_1k, effective_from")
    .eq("provider", "openai")
    .eq("model", model)
    .lte("effective_from", queryDate.toISOString().split("T")[0])
    .or(`effective_to.is.null,effective_to.gte.${queryDate.toISOString().split("T")[0]}`)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error || !pricing) {
    // Pricing not found - still record tokens but leave cost null
    return { 
      costUsd: null, 
      costNotes: `No pricing data found for model ${model}` 
    };
  }
  
  const { price_input_per_1k, price_output_per_1k, effective_from } = pricing;
  
  if (!price_input_per_1k || !price_output_per_1k) {
    return { 
      costUsd: null, 
      costNotes: `Incomplete pricing data for model ${model}` 
    };
  }
  
  // Calculate cost
  const inputCost = (inputTokens / 1000) * price_input_per_1k;
  const outputCost = (outputTokens / 1000) * price_output_per_1k;
  const totalCost = inputCost + outputCost;
  
  return {
    costUsd: totalCost,
    costNotes: `Computed from pricing effective ${effective_from}`,
  };
}
