import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PRESETS } from "@/lib/audio/presets/index";

export const runtime = "nodejs";

/**
 * POST /api/admin/seed-presets
 * Seeds preset tracks into the database
 * Protected by admin secret (for deployment scripts)
 */
export async function POST(request: Request) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get("authorization");
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      return NextResponse.json({ error: "Admin secret not configured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServiceClient();
    const results: { name: string; status: "created" | "updated" | "error"; error?: string }[] = [];

    for (const preset of PRESETS) {
      // Check if preset already exists by name and is_system flag
      const { data: existing } = await supabase
        .from("tracks")
        .select("id")
        .eq("name", preset.name)
        .eq("is_system", true)
        .single();

      if (existing) {
        // Update existing preset
        const { error } = await supabase
          .from("tracks")
          .update({
            current_code: preset.code,
            bpm: preset.bpm,
            genre: preset.genre,
            tags: preset.tags,
            privacy: "public",
            is_system: true,
            is_featured: true,
          })
          .eq("id", existing.id);

        if (error) {
          results.push({ name: preset.name, status: "error", error: error.message });
        } else {
          results.push({ name: preset.name, status: "updated" });
        }
      } else {
        // Insert new preset (project_id is nullable for system tracks after migration)
        const { error } = await supabase.from("tracks").insert({
          name: preset.name,
          current_code: preset.code,
          bpm: preset.bpm,
          genre: preset.genre,
          tags: preset.tags,
          ai_tags: [],
          plays: 0,
          privacy: "public",
          is_system: true,
          is_featured: true,
          // project_id is null for system tracks
        });

        if (error) {
          results.push({
            name: preset.name,
            status: "error",
            error: error.message,
          });
        } else {
          results.push({ name: preset.name, status: "created" });
        }
      }
    }

    const created = results.filter((r) => r.status === "created").length;
    const updated = results.filter((r) => r.status === "updated").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      message: `Seeded ${created} new presets, updated ${updated}, ${errors} errors`,
      results,
    });
  } catch (error) {
    console.error("Error seeding presets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
