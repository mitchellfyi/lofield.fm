import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getAllGenreSlugs } from "@/lib/content/genres";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lofield.fm";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/studio`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Genre landing pages
  const genrePages: MetadataRoute.Sitemap = getAllGenreSlugs().map((slug) => ({
    url: `${baseUrl}/genres/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Try to get public tracks for dynamic URLs
  let trackPages: MetadataRoute.Sitemap = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data: tracks } = await supabase
        .from("tracks")
        .select("id, updated_at")
        .eq("privacy", "public")
        .order("updated_at", { ascending: false })
        .limit(500);

      if (tracks) {
        trackPages = tracks.map((track) => ({
          url: `${baseUrl}/share/${track.id}`,
          lastModified: new Date(track.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
      }
    } catch {
      // Silently fail - sitemap will just have static pages
    }
  }

  return [...staticPages, ...genrePages, ...trackPages];
}
