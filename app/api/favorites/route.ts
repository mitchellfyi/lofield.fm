import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PublicTrack } from "@/lib/types/explore";

export const runtime = "nodejs";

/**
 * GET /api/favorites
 * Get current user's liked tracks
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's liked track IDs
    const { data: likes, error: likesError } = await supabase
      .from("track_likes")
      .select("track_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (likesError) {
      console.error("Error fetching likes:", likesError);
      return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
    }

    if (!likes || likes.length === 0) {
      return NextResponse.json({ tracks: [], total: 0 });
    }

    const trackIds = likes.map((l) => l.track_id);

    // Fetch the tracks (only public ones)
    const { data: tracks, error: tracksError } = await supabase
      .from("tracks")
      .select("*")
      .in("id", trackIds)
      .eq("privacy", "public");

    if (tracksError) {
      console.error("Error fetching tracks:", tracksError);
      return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 });
    }

    // Sort tracks by the order of likes (most recent first)
    const trackMap = new Map(tracks?.map((t) => [t.id, t]) || []);
    const sortedTracks = trackIds
      .map((id) => trackMap.get(id))
      .filter((t): t is NonNullable<typeof t> => t !== undefined);

    // Transform to PublicTrack
    const publicTracks: PublicTrack[] = sortedTracks.map((track: Record<string, unknown>) => ({
      id: track.id as string,
      name: track.name as string,
      current_code: track.current_code as string,
      bpm: track.bpm as number | null,
      genre: track.genre as string | null,
      tags: (track.tags as string[]) || [],
      ai_tags: (track.ai_tags as string[]) || [],
      plays: (track.plays as number) || 0,
      like_count: (track.like_count as number) || 0,
      is_featured: (track.is_featured as boolean) || false,
      is_system: (track.is_system as boolean) || false,
      created_at: track.created_at as string,
    }));

    return NextResponse.json({
      tracks: publicTracks,
      total: publicTracks.length,
    });
  } catch (error) {
    console.error("Error in favorites API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
