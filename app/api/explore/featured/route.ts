import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { PublicTrack } from "@/lib/types/explore";

export const runtime = "nodejs";

/**
 * Featured tracks response
 */
export interface FeaturedResponse {
  featured: PublicTrack[];
  trending: PublicTrack[];
  recent: PublicTrack[];
}

/**
 * GET /api/explore/featured
 * Fetch featured, trending, and recent tracks for the explore page header sections
 */
export async function GET() {
  try {
    const supabase = await createServiceClient();

    // Fetch featured tracks (staff picks)
    const { data: featuredData } = await supabase
      .from("tracks")
      .select("*")
      .eq("privacy", "public")
      .eq("is_featured", true)
      .order("plays", { ascending: false })
      .limit(8);

    // Fetch trending tracks (most plays, not featured, limit to recent 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: trendingData } = await supabase
      .from("tracks")
      .select("*")
      .eq("privacy", "public")
      .eq("is_featured", false)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .gt("plays", 0)
      .order("plays", { ascending: false })
      .limit(8);

    // Fetch recent tracks (newest, not featured, not already in trending)
    const trendingIds = (trendingData || []).map((t: Record<string, unknown>) => t.id);
    const { data: recentData } = await supabase
      .from("tracks")
      .select("*")
      .eq("privacy", "public")
      .eq("is_featured", false)
      .order("created_at", { ascending: false })
      .limit(16); // Fetch more to filter out trending

    // Filter out tracks that are already in trending
    const recentFiltered = (recentData || [])
      .filter((t: Record<string, unknown>) => !trendingIds.includes(t.id))
      .slice(0, 8);

    // Transform to PublicTrack
    const toPublicTrack = (track: Record<string, unknown>): PublicTrack => ({
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
    });

    const response: FeaturedResponse = {
      featured: (featuredData || []).map(toPublicTrack),
      trending: (trendingData || []).map(toPublicTrack),
      recent: recentFiltered.map(toPublicTrack),
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 5 minutes
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error in featured API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
