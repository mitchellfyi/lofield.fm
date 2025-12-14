import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/tracks/[id]/play - Generate a signed URL for track playback
 *
 * This endpoint:
 * 1. Validates authentication
 * 2. Verifies track ownership (user owns the track)
 * 3. Returns a short-lived signed URL (60 seconds) to the Storage object
 *
 * Security:
 * - User can only get signed URLs for their own tracks
 * - Signed URLs expire after 60 seconds
 * - RLS policies on storage already enforce user isolation
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id: trackId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get track and verify ownership
  const { data: track, error: trackError } = await supabase
    .from("tracks")
    .select("id, user_id, storage_path, status")
    .eq("id", trackId)
    .single();

  if (trackError || !track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  // Verify ownership (redundant with RLS, but explicit check)
  if (track.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify track is ready
  if (track.status !== "ready") {
    return NextResponse.json(
      { error: "Track is not ready for playback" },
      { status: 400 }
    );
  }

  // Verify storage path exists
  if (!track.storage_path) {
    return NextResponse.json(
      { error: "Track file not found" },
      { status: 404 }
    );
  }

  // Generate signed URL (60 second expiration)
  const { data: signedData, error: signedError } = await supabase.storage
    .from("tracks")
    .createSignedUrl(track.storage_path, 60);

  if (signedError || !signedData) {
    console.error("Failed to create signed URL", {
      trackId,
      error: signedError?.message,
    });
    return NextResponse.json(
      { error: "Failed to generate playback URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl: signedData.signedUrl,
    expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
  });
}
