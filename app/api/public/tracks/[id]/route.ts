import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/public/tracks/[id] - Get public track detail
 *
 * This endpoint allows anyone (including anonymous users) to view details
 * of a public or unlisted track.
 *
 * Returns:
 * - Track object with full details including metadata
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id: trackId } = await params;
  const supabase = await createServerSupabaseClient();

  try {
    // Get current user (may be null for anonymous users)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get track - RLS policies will handle access control
    // Public and unlisted tracks are readable by anyone
    // Private tracks are only readable by owner
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select(
        `
        id,
        user_id,
        title,
        description,
        artist_name,
        genre,
        bpm,
        mood_energy,
        mood_focus,
        mood_chill,
        length_ms,
        instrumental,
        final_prompt,
        metadata,
        visibility,
        status,
        created_at,
        published_at
      `
      )
      .eq("id", trackId)
      .single();

    if (trackError || !track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Verify track is public or unlisted (RLS should handle this, but explicit check)
    if (!["public", "unlisted"].includes(track.visibility)) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Add ownership flag instead of exposing user_id
    const isOwner = user ? track.user_id === user.id : false;

    // Remove user_id from response to protect privacy
    const { user_id, ...trackWithoutUserId } = track;

    return NextResponse.json({
      ...trackWithoutUserId,
      is_owner: isOwner,
    });
  } catch (err) {
    console.error("Unexpected error in public track detail API:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
