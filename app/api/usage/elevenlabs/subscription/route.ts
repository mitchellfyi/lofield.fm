import { getElevenLabsKeyForUser } from "@/lib/secrets";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/elevenlabs";
import { logUsageEvent } from "@/lib/usage-tracking";
import {
  elevenLabsCache,
  getSubscriptionCacheKey,
  CACHE_TTL,
} from "@/lib/cache";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * GET /api/usage/elevenlabs/subscription
 * Fetch ElevenLabs subscription info (credits balance and limits)
 * Cached for 10 minutes per user to avoid hammering the API
 */
export async function GET() {
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

  // Check cache first
  const cacheKey = getSubscriptionCacheKey(userId);
  const cached = elevenLabsCache.get(cacheKey);
  if (cached) {
    return NextResponse.json({
      ok: true,
      subscription: cached,
      cached: true,
    });
  }

  // Get ElevenLabs key
  const elevenLabsKey = await getElevenLabsKeyForUser(userId);
  if (!elevenLabsKey) {
    return NextResponse.json(
      {
        error:
          "Missing ElevenLabs API key. Please add your key in Settings to view subscription info.",
      },
      { status: 400 }
    );
  }

  const startTime = Date.now();

  try {
    // Fetch subscription info from ElevenLabs
    const subscription = await getSubscription(elevenLabsKey);
    const latencyMs = Date.now() - startTime;

    // Cache the result
    elevenLabsCache.set(cacheKey, subscription, CACHE_TTL.SUBSCRIPTION);

    // Log usage event
    await logUsageEvent({
      userId,
      actionGroupId,
      actionType: "fetch_eleven_subscription",
      provider: "elevenlabs",
      providerOperation: "user.subscription",
      status: "ok",
      latencyMs,
      creditsBalance: subscription.creditsRemaining,
      creditsLimit: subscription.creditsLimitCurrentPeriod,
      creditsUsed: subscription.creditsUsedCurrentPeriod,
      raw: {
        tier: subscription.tier,
        status: subscription.status,
        nextResetUnix: subscription.nextResetUnix,
      },
    });

    return NextResponse.json({
      ok: true,
      subscription,
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
      actionType: "fetch_eleven_subscription",
      provider: "elevenlabs",
      providerOperation: "user.subscription",
      status: "error",
      errorMessage,
      latencyMs,
    });

    return NextResponse.json(
      {
        error: "Failed to fetch ElevenLabs subscription info",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
