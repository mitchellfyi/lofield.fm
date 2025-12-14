import { getServiceRoleClient } from "@/lib/supabase/admin";

export type UsageEventData = {
  userId: string;
  chatId?: string;
  trackId?: string;
  actionType: "refine" | "generate" | "regenerate";
  actionGroupId?: string;
  provider: "openai" | "elevenlabs";
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  error?: Record<string, unknown>;
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
      chat_id: data.chatId ?? null,
      track_id: data.trackId ?? null,
      action_type: data.actionType,
      action_group_id: data.actionGroupId ?? null,
      provider: data.provider,
      model: data.model,
      input_tokens: data.inputTokens ?? null,
      output_tokens: data.outputTokens ?? null,
      total_tokens: data.totalTokens ?? null,
      duration_ms: data.durationMs ?? null,
      error: data.error ?? null,
    });

    if (error) {
      // Don't throw - usage tracking failures shouldn't break the main flow
      console.error("Failed to log usage event", {
        userId: data.userId,
        actionType: data.actionType,
        provider: data.provider,
        // Don't log the full error object to avoid exposing sensitive data
      });
    }
  } catch {
    // Catch and log, but don't throw
    console.error("Exception while logging usage event", {
      userId: data.userId,
      actionType: data.actionType,
      provider: data.provider,
    });
  }
}
