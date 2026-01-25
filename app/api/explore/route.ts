import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { ExploreResponse, PublicTrack, ExploreSortOption } from "@/lib/types/explore";

export const runtime = "nodejs";

// Cache filter options for 5 minutes
let filterOptionsCache: {
  genres: string[];
  tags: string[];
  bpm_range: { min: number; max: number };
  cached_at: number;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/explore
 * Fetch public tracks with optional filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const genre = searchParams.get("genre") || undefined;
    const tagsParam = searchParams.get("tags");
    const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;
    const bpmMin = searchParams.get("bpm_min")
      ? parseInt(searchParams.get("bpm_min")!, 10)
      : undefined;
    const bpmMax = searchParams.get("bpm_max")
      ? parseInt(searchParams.get("bpm_max")!, 10)
      : undefined;
    const sort = (searchParams.get("sort") as ExploreSortOption) || "popular";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = await createServiceClient();

    // Build query for public tracks
    let query = supabase.from("tracks").select("*", { count: "exact" }).eq("privacy", "public");

    // Apply filters
    if (genre) {
      query = query.eq("genre", genre);
    }

    if (tags && tags.length > 0) {
      // Match any of the provided tags
      query = query.overlaps("tags", tags);
    }

    if (bpmMin !== undefined) {
      query = query.gte("bpm", bpmMin);
    }

    if (bpmMax !== undefined) {
      query = query.lte("bpm", bpmMax);
    }

    // Apply sorting
    switch (sort) {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "popular":
        query = query
          .order("is_featured", { ascending: false })
          .order("plays", { ascending: false })
          .order("created_at", { ascending: false });
        break;
      case "random":
        // For random, we'll fetch more and shuffle client-side
        // Supabase doesn't support random ordering natively
        query = query.order("created_at", { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: tracks, error, count } = await query;

    if (error) {
      console.error("Error fetching explore tracks:", error);
      return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 });
    }

    // Transform to PublicTrack (ensure no user data leaks)
    let publicTracks: PublicTrack[] = (tracks || []).map((track: Record<string, unknown>) => ({
      id: track.id,
      name: track.name,
      current_code: track.current_code,
      bpm: track.bpm,
      genre: track.genre,
      tags: track.tags || [],
      ai_tags: track.ai_tags || [],
      plays: track.plays || 0,
      is_featured: track.is_featured || false,
      is_system: track.is_system || false,
      created_at: track.created_at,
    }));

    // Shuffle if random sort requested
    if (sort === "random") {
      publicTracks = shuffleArray(publicTracks);
    }

    // Get filter options (with caching)
    const filterOptions = await getFilterOptions(supabase);

    const response: ExploreResponse = {
      tracks: publicTracks,
      total: count || 0,
      genres: filterOptions.genres,
      tags: filterOptions.tags,
      bpm_range: filterOptions.bpm_range,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in explore API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Get available filter options (genres, tags, BPM range)
 * Results are cached for performance
 */
async function getFilterOptions(supabase: Awaited<ReturnType<typeof createServiceClient>>) {
  // Return cached if still valid
  if (filterOptionsCache && Date.now() - filterOptionsCache.cached_at < CACHE_TTL_MS) {
    return filterOptionsCache;
  }

  // Fetch distinct genres
  const { data: genreData } = await supabase
    .from("tracks")
    .select("genre")
    .eq("privacy", "public")
    .not("genre", "is", null);

  const genres = [
    ...new Set((genreData || []).map((t: { genre: string | null }) => t.genre).filter(Boolean)),
  ].sort() as string[];

  // Fetch all tags and aggregate
  const { data: tagData } = await supabase.from("tracks").select("tags").eq("privacy", "public");

  const allTags = (tagData || []).flatMap((t: { tags: string[] | null }) => t.tags || []);
  const tagCounts = allTags.reduce(
    (acc: Record<string, number>, tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Sort tags by frequency, take top 50
  const tags = (Object.entries(tagCounts) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([tag]) => tag);

  // Get BPM range
  const { data: bpmData } = await supabase
    .from("tracks")
    .select("bpm")
    .eq("privacy", "public")
    .not("bpm", "is", null);

  const bpms = (bpmData || [])
    .map((t: { bpm: number | null }) => t.bpm)
    .filter(Boolean) as number[];
  const bpm_range = {
    min: bpms.length > 0 ? Math.min(...bpms) : 40,
    max: bpms.length > 0 ? Math.max(...bpms) : 200,
  };

  // Cache the results
  filterOptionsCache = {
    genres,
    tags,
    bpm_range,
    cached_at: Date.now(),
  };

  return filterOptionsCache;
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
