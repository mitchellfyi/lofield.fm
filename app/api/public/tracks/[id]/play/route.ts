import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

// Constants
const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour for public tracks

/**
 * GET /api/public/tracks/[id]/play - Generate a signed URL for public track playback
 *
 * This endpoint:
 * 1. Validates track is public or unlisted (or owned by user)
 * 2. Verifies track is ready for playback
 * 3. Returns a signed URL (1 hour expiry) to the Storage object
 *
 * Security:
 * - Anyone can get signed URLs for public/unlisted tracks
 * - Users can get signed URLs for their own private tracks
 * - Signed URLs expire after 1 hour
 * - RLS policies on storage enforce visibility rules
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id: trackId } = await params;
  const supabase = await createServerSupabaseClient();

  // Get current user (may be null for anonymous users)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  // Get track and check visibility
  const { data: track, error: trackError } = await supabase
    .from("tracks")
    .select("id, user_id, storage_path, status, visibility")
    .eq("id", trackId)
    .single();

  if (trackError || !track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  // Check access: allow if public/unlisted OR if user owns the track
  const hasAccess =
    ["public", "unlisted"].includes(track.visibility) ||
    (userId && track.user_id === userId);

  if (!hasAccess) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
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

  // Generate signed URL (1 hour expiration for public tracks)
  const { data: signedData, error: signedError } = await supabase.storage
    .from("tracks")
    .createSignedUrl(track.storage_path, SIGNED_URL_EXPIRY_SECONDS);

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
    expiresAt: new Date(
      Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000
    ).toISOString(),
  });
}
