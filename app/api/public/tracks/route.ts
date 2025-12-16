import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/public/tracks - List public tracks
 *
 * This endpoint allows anyone (including anonymous users) to browse public tracks.
 *
 * Query parameters:
 * - search: Full-text search query (optional)
 * - artist: Filter by artist name (optional)
 * - genre: Filter by genre (optional)
 * - bpmMin: Minimum BPM (optional)
 * - bpmMax: Maximum BPM (optional)
 * - limit: Results per page (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * Returns:
 * - tracks: Array of public track objects
 * - total: Total count of matching tracks
 * - limit: Results per page
 * - offset: Current offset
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const search = searchParams.get("search") || undefined;
  const artist = searchParams.get("artist") || undefined;
  const genre = searchParams.get("genre") || undefined;
  const bpmMin = searchParams.get("bpmMin")
    ? parseInt(searchParams.get("bpmMin")!, 10)
    : undefined;
  const bpmMax = searchParams.get("bpmMax")
    ? parseInt(searchParams.get("bpmMax")!, 10)
    : undefined;

  // Pagination
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const limit = limitParam
    ? Math.min(parseInt(limitParam, 10), 100)
    : 20;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  // Validate pagination parameters
  if (isNaN(limit) || limit < 1) {
    return NextResponse.json(
      { error: "Invalid limit parameter" },
      { status: 400 }
    );
  }
  if (isNaN(offset) || offset < 0) {
    return NextResponse.json(
      { error: "Invalid offset parameter" },
      { status: 400 }
    );
  }

  try {
    // Build query - start with public tracks only
    let query = supabase
      .from("tracks")
      .select(
        `
        id,
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
        created_at,
        published_at
      `,
        { count: "exact" }
      )
      .eq("visibility", "public")
      .eq("status", "ready");

    // Apply filters
    if (search) {
      // Full-text search using search_tsv
      query = query.textSearch("search_tsv", search, {
        type: "websearch",
        config: "english",
      });
    }

    if (artist) {
      query = query.eq("artist_name", artist);
    }

    if (genre) {
      query = query.eq("genre", genre);
    }

    if (bpmMin !== undefined) {
      query = query.gte("bpm", bpmMin);
    }

    if (bpmMax !== undefined) {
      query = query.lte("bpm", bpmMax);
    }

    // Order by published_at (most recent first)
    query = query.order("published_at", { ascending: false, nullsFirst: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: tracks, error, count } = await query;

    if (error) {
      console.error("Error fetching public tracks:", error);
      return NextResponse.json(
        { error: "Failed to fetch tracks" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tracks: tracks || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error("Unexpected error in public tracks API:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
