import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { headers } from "next/headers";

export const runtime = "nodejs";

// Simple in-memory rate limiting
// In production, use Redis or similar
const playRecords = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour per track per fingerprint
const MAX_RECORDS = 10000; // Prevent unbounded memory growth

// Clean up old records periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [key, timestamp] of playRecords.entries()) {
      if (now - timestamp > RATE_LIMIT_MS) {
        playRecords.delete(key);
      }
    }
  },
  5 * 60 * 1000
); // Clean every 5 minutes

/**
 * POST /api/explore/play
 * Increment play count for a track (rate-limited)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trackId } = body;

    if (!trackId || typeof trackId !== "string") {
      return NextResponse.json({ error: "Track ID is required" }, { status: 400 });
    }

    // Create fingerprint from IP and user agent
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";
    const fingerprint = `${ip}-${userAgent.slice(0, 50)}`;

    // Check rate limit
    const rateKey = `${trackId}:${fingerprint}`;
    const lastPlay = playRecords.get(rateKey);

    if (lastPlay && Date.now() - lastPlay < RATE_LIMIT_MS) {
      // Already counted recently, skip but don't error
      return NextResponse.json({ success: true, counted: false });
    }

    // Record this play (with size limit to prevent memory leak)
    if (playRecords.size >= MAX_RECORDS) {
      // Evict oldest entries when at capacity
      const entries = Array.from(playRecords.entries());
      entries.sort((a, b) => a[1] - b[1]); // Sort by timestamp
      const toDelete = entries.slice(0, Math.floor(MAX_RECORDS * 0.1)); // Delete oldest 10%
      for (const [key] of toDelete) {
        playRecords.delete(key);
      }
    }
    playRecords.set(rateKey, Date.now());

    // Increment play count in database
    const supabase = await createServiceClient();

    // Fetch current play count
    const { data: track } = await supabase
      .from("tracks")
      .select("plays")
      .eq("id", trackId)
      .eq("privacy", "public")
      .single();

    if (track) {
      // Increment and update
      const currentPlays = (track.plays as number) || 0;
      await supabase
        .from("tracks")
        .update({ plays: currentPlays + 1 })
        .eq("id", trackId);
    }

    return NextResponse.json({ success: true, counted: true });
  } catch (error) {
    console.error("Error incrementing play count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
