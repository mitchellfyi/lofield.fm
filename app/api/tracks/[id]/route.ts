import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

type Params = {
  params: Promise<{ id: string }>;
};

// Schema for track update
const UpdateTrackSchema = z.object({
  visibility: z.enum(["public", "unlisted", "private"]).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).nullable().optional(),
  genre: z.string().max(100).optional(),
  bpm: z.number().int().min(20).max(300).optional(),
  metadata: z
    .object({
      tags: z.array(z.string()).optional(),
      genre: z.string().optional(),
      bpm: z.number().optional(),
      mood: z
        .object({
          energy: z.number().min(0).max(1).optional(),
          focus: z.number().min(0).max(1).optional(),
          chill: z.number().min(0).max(1).optional(),
        })
        .optional(),
      instrumentation: z.array(z.string()).optional(),
      key: z.string().nullable().optional(),
      time_signature: z.string().nullable().optional(),
    })
    .optional(),
});

/**
 * PATCH /api/tracks/[id] - Update track visibility and metadata
 *
 * This endpoint allows track owners to:
 * - Change visibility (public, unlisted, private)
 * - Update title, description
 * - Correct metadata (genre, bpm, tags, etc.)
 *
 * Security:
 * - Only the track owner can update their tracks
 * - published_at is set automatically when changing to public/unlisted
 * - published_at is cleared when changing to private
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id: trackId } = await params;
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate input
  const validation = UpdateTrackSchema.safeParse(body);
  if (!validation.success) {
    // Sanitize error details for production - only return field names
    const fieldErrors = validation.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    return NextResponse.json(
      {
        error: "Invalid input",
        fields: fieldErrors,
      },
      { status: 400 }
    );
  }

  const updates = validation.data;

  // Check if user owns the track
  const { data: track, error: trackError } = await supabase
    .from("tracks")
    .select("id, user_id, visibility, published_at")
    .eq("id", trackId)
    .single();

  if (trackError || !track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  if (track.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build update object
  const updateData: Record<string, unknown> = {};

  if (updates.title !== undefined) {
    updateData.title = updates.title;
  }

  if (updates.description !== undefined) {
    updateData.description = updates.description;
  }

  if (updates.genre !== undefined) {
    updateData.genre = updates.genre;
  }

  if (updates.bpm !== undefined) {
    updateData.bpm = updates.bpm;
  }

  if (updates.metadata !== undefined) {
    updateData.metadata = updates.metadata;
  }

  // Handle visibility change and published_at timestamp
  if (updates.visibility !== undefined) {
    updateData.visibility = updates.visibility;

    // Set published_at when changing to public or unlisted
    if (updates.visibility === "public" || updates.visibility === "unlisted") {
      // Only set if not already published (preserve existing timestamp)
      if (!track.published_at) {
        updateData.published_at = new Date().toISOString();
      }
      // If already published, keep the existing timestamp
    } else if (updates.visibility === "private") {
      // Clear published_at when changing to private
      updateData.published_at = null;
    }
  }

  // Update the track
  const { data: updatedTrack, error: updateError } = await supabase
    .from("tracks")
    .update(updateData)
    .eq("id", trackId)
    .select(
      `
      id,
      title,
      description,
      visibility,
      published_at,
      genre,
      bpm,
      metadata,
      updated_at
    `
    )
    .single();

  if (updateError || !updatedTrack) {
    console.error("Failed to update track", {
      trackId,
      error: updateError?.message,
    });
    return NextResponse.json(
      { error: "Failed to update track" },
      { status: 500 }
    );
  }

  return NextResponse.json(updatedTrack);
}
