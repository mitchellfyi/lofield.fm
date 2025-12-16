import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/public/tracks - List public tracks with search and filtering
 *
 * This endpoint allows anyone (including anonymous users) to browse public tracks.
 *
 * Query parameters:
 * - q: Full-text search query (optional)
 * - artist: Filter by artist name (optional)
 * - genre: Filter by genre (optional)
 * - bpm_min: Minimum BPM (optional)
 * - bpm_max: Maximum BPM (optional)
 * - energy_min: Minimum energy 0-100 (optional)
 * - energy_max: Maximum energy 0-100 (optional)
 * - focus_min: Minimum focus 0-100 (optional)
 * - focus_max: Maximum focus 0-100 (optional)
 * - chill_min: Minimum chill 0-100 (optional)
 * - chill_max: Maximum chill 0-100 (optional)
 * - tags: Comma-separated tags (optional)
 * - instrumentation: Comma-separated instruments (optional)
 * - sort: Sort order - newest, bpm_asc, bpm_desc (default: newest)
 * - cursor: Pagination cursor (optional)
 * - limit: Results per page (default: 30, max: 100)
 *
 * Returns:
 * - items: Array of public track objects
 * - nextCursor: Cursor for next page (null if no more results)
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const q = searchParams.get("q") || undefined;
  const artist = searchParams.get("artist") || undefined;
  const genre = searchParams.get("genre") || undefined;
  const bpmMin = searchParams.get("bpm_min")
    ? parseInt(searchParams.get("bpm_min")!, 10)
    : undefined;
  const bpmMax = searchParams.get("bpm_max")
    ? parseInt(searchParams.get("bpm_max")!, 10)
    : undefined;

  // Mood filters
  const energyMin = searchParams.get("energy_min")
    ? parseInt(searchParams.get("energy_min")!, 10)
    : undefined;
  const energyMax = searchParams.get("energy_max")
    ? parseInt(searchParams.get("energy_max")!, 10)
    : undefined;
  const focusMin = searchParams.get("focus_min")
    ? parseInt(searchParams.get("focus_min")!, 10)
    : undefined;
  const focusMax = searchParams.get("focus_max")
    ? parseInt(searchParams.get("focus_max")!, 10)
    : undefined;
  const chillMin = searchParams.get("chill_min")
    ? parseInt(searchParams.get("chill_min")!, 10)
    : undefined;
  const chillMax = searchParams.get("chill_max")
    ? parseInt(searchParams.get("chill_max")!, 10)
    : undefined;

  // Array filters (comma-separated)
  const tagsParam = searchParams.get("tags");
  const tags = tagsParam
    ? tagsParam.split(",").map((t) => t.trim())
    : undefined;
  const instrumentationParam = searchParams.get("instrumentation");
  const instrumentation = instrumentationParam
    ? instrumentationParam.split(",").map((i) => i.trim())
    : undefined;

  // Sorting
  const sort = searchParams.get("sort") || "newest";
  if (!["newest", "bpm_asc", "bpm_desc"].includes(sort)) {
    return NextResponse.json(
      {
        error: "Invalid sort parameter. Must be: newest, bpm_asc, or bpm_desc",
      },
      { status: 400 }
    );
  }

  // Pagination (cursor-based)
  const cursor = searchParams.get("cursor") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 30;

  // Validate limit parameter
  if (isNaN(limit) || limit < 1) {
    return NextResponse.json(
      { error: "Invalid limit parameter" },
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
        metadata,
        created_at,
        published_at
      `
      )
      .eq("visibility", "public")
      .eq("status", "ready");

    // Apply full-text search
    if (q) {
      query = query.textSearch("search_tsv", q, {
        type: "websearch",
        config: "english",
      });
    }

    // Apply filters
    if (artist) {
      query = query.ilike("artist_name", `%${artist}%`);
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

    // Mood filters
    if (energyMin !== undefined) {
      query = query.gte("mood_energy", energyMin);
    }
    if (energyMax !== undefined) {
      query = query.lte("mood_energy", energyMax);
    }
    if (focusMin !== undefined) {
      query = query.gte("mood_focus", focusMin);
    }
    if (focusMax !== undefined) {
      query = query.lte("mood_focus", focusMax);
    }
    if (chillMin !== undefined) {
      query = query.gte("mood_chill", chillMin);
    }
    if (chillMax !== undefined) {
      query = query.lte("mood_chill", chillMax);
    }

    // Tags filter (check if any tag is in the metadata->tags array)
    if (tags && tags.length > 0) {
      // Use JSONB overlaps operator to check if any requested tag exists in the array
      // This checks if the arrays share any elements
      query = query.overlaps("metadata->tags", tags);
    }

    // Instrumentation filter (check if any instrument is in the metadata->instrumentation array)
    if (instrumentation && instrumentation.length > 0) {
      // Use JSONB overlaps operator to check if any requested instrument exists in the array
      query = query.overlaps("metadata->instrumentation", instrumentation);
    }

    // Apply sorting
    switch (sort) {
      case "bpm_asc":
        query = query.order("bpm", { ascending: true, nullsFirst: false });
        break;
      case "bpm_desc":
        query = query.order("bpm", { ascending: false, nullsFirst: false });
        break;
      case "newest":
      default:
        query = query.order("published_at", {
          ascending: false,
          nullsFirst: false,
        });
        break;
    }

    // Apply cursor-based pagination
    if (cursor) {
      // Cursor is a base64-encoded combination of sort field value and id
      try {
        const decodedCursor = JSON.parse(
          Buffer.from(cursor, "base64").toString("utf-8")
        );
        const { value, id } = decodedCursor;

        // Validate cursor ID is a valid UUID format (prevents injection)
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!id || typeof id !== "string" || !uuidRegex.test(id)) {
          throw new Error("Invalid cursor ID format");
        }

        // Apply cursor filter based on sort direction
        if (sort === "bpm_asc") {
          // Validate BPM value is a safe number (not null for BPM sorting)
          if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new Error("Invalid cursor value for BPM sort");
          }
          // Supabase client properly escapes these values in the query builder
          // The validation above ensures they are safe types before interpolation
          query = query.or(`bpm.gt.${value},and(bpm.eq.${value},id.gt.${id})`);
        } else if (sort === "bpm_desc") {
          // Validate BPM value is a safe number (not null for BPM sorting)
          if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new Error("Invalid cursor value for BPM sort");
          }
          // Supabase client properly escapes these values in the query builder
          query = query.or(`bpm.lt.${value},and(bpm.eq.${value},id.gt.${id})`);
        } else {
          // newest (published_at desc)
          // Validate date value is a valid ISO timestamp
          if (typeof value !== "string") {
            throw new Error("Invalid cursor value for date sort");
          }
          if (isNaN(Date.parse(value))) {
            throw new Error("Invalid cursor date format");
          }
          // Supabase client properly escapes these values in the query builder
          query = query.or(
            `published_at.lt.${value},and(published_at.eq.${value},id.gt.${id})`
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid cursor parameter" },
          { status: 400 }
        );
      }
    }

    // Fetch one extra to determine if there are more results
    query = query.limit(limit + 1);

    const { data: tracks, error } = await query;

    if (error) {
      console.error("Error fetching public tracks:", error);
      return NextResponse.json(
        { error: "Failed to fetch tracks" },
        { status: 500 }
      );
    }

    // Check if there are more results
    const hasMore = tracks && tracks.length > limit;
    const items = hasMore ? tracks.slice(0, limit) : tracks || [];

    // Generate next cursor if there are more results
    let nextCursor = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      let cursorValue;
      if (sort === "bpm_asc" || sort === "bpm_desc") {
        cursorValue = lastItem.bpm;
        // Skip cursor generation if BPM is null to avoid invalid cursors
        if (cursorValue === null || cursorValue === undefined) {
          // Don't generate cursor for null values - client should handle edge case
          return NextResponse.json({
            items,
            nextCursor: null,
          });
        }
      } else {
        cursorValue = lastItem.published_at;
      }
      const cursorData = { value: cursorValue, id: lastItem.id };
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString("base64");
    }

    return NextResponse.json({
      items,
      nextCursor,
    });
  } catch (err) {
    console.error("Unexpected error in public tracks API:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
