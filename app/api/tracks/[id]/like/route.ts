import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tracks/[id]/like
 * Check if current user has liked this track
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: trackId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ liked: false, like_count: 0 });
    }

    // Check if user has liked this track
    const { data: like } = await supabase
      .from("track_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("track_id", trackId)
      .single();

    // Get like count
    const { data: track } = await supabase
      .from("tracks")
      .select("like_count")
      .eq("id", trackId)
      .single();

    return NextResponse.json({
      liked: !!like,
      like_count: track?.like_count || 0,
    });
  } catch (error) {
    console.error("Error checking like status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/tracks/[id]/like
 * Like a track
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: trackId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if track exists and is public
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("id, privacy")
      .eq("id", trackId)
      .single();

    if (trackError || !track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.privacy !== "public") {
      return NextResponse.json({ error: "Cannot like private tracks" }, { status: 403 });
    }

    // Insert like (will fail silently if already exists due to unique constraint)
    const { error: likeError } = await supabase.from("track_likes").insert({
      user_id: user.id,
      track_id: trackId,
    });

    if (likeError && !likeError.message.includes("duplicate")) {
      console.error("Error liking track:", likeError);
      return NextResponse.json({ error: "Failed to like track" }, { status: 500 });
    }

    // Get updated like count
    const { data: updatedTrack } = await supabase
      .from("tracks")
      .select("like_count")
      .eq("id", trackId)
      .single();

    return NextResponse.json({
      liked: true,
      like_count: updatedTrack?.like_count || 0,
    });
  } catch (error) {
    console.error("Error in like API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/tracks/[id]/like
 * Unlike a track
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: trackId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete like
    const { error: deleteError } = await supabase
      .from("track_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("track_id", trackId);

    if (deleteError) {
      console.error("Error unliking track:", deleteError);
      return NextResponse.json({ error: "Failed to unlike track" }, { status: 500 });
    }

    // Get updated like count
    const { data: updatedTrack } = await supabase
      .from("tracks")
      .select("like_count")
      .eq("id", trackId)
      .single();

    return NextResponse.json({
      liked: false,
      like_count: updatedTrack?.like_count || 0,
    });
  } catch (error) {
    console.error("Error in unlike API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
