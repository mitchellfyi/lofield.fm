/**
 * Script to seed preset tracks into the database
 * Run with: npx tsx scripts/seed-presets.ts
 *
 * Alternatively, use the API endpoint:
 * curl -X POST /api/admin/seed-presets -H "Authorization: Bearer $ADMIN_SECRET"
 */

import { createClient } from "@supabase/supabase-js";
import { PRESETS } from "../lib/audio/presets/index";

// Featured preset IDs - only these will be marked as featured on the explore page
const FEATURED_PRESET_IDS = ["lofi-chill", "chillwave", "nu-disco"];

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedPresets() {
  console.log(`Seeding ${PRESETS.length} presets...`);

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
      const isFeatured = FEATURED_PRESET_IDS.includes(preset.id);
      const { error } = await supabase
        .from("tracks")
        .update({
          current_code: preset.code,
          bpm: preset.bpm,
          genre: preset.genre,
          tags: preset.tags,
          privacy: "public",
          is_system: true,
          is_featured: isFeatured,
        })
        .eq("id", existing.id);

      if (error) {
        console.error(`Failed to update preset "${preset.name}":`, error.message);
      } else {
        console.log(`Updated preset: ${preset.name}`);
      }
    } else {
      // Insert new preset
      // Note: We need a user_id, so we'll use a system user or make it nullable
      // For now, we'll skip user_id since it should be optional for system tracks
      const isFeatured = FEATURED_PRESET_IDS.includes(preset.id);
      const { error } = await supabase.from("tracks").insert({
        name: preset.name,
        current_code: preset.code,
        bpm: preset.bpm,
        genre: preset.genre,
        tags: preset.tags,
        ai_tags: [], // No AI tags for manually created presets
        plays: 0,
        privacy: "public",
        is_system: true,
        is_featured: isFeatured,
        // user_id is intentionally omitted - handled by default/policy
      });

      if (error) {
        console.error(`Failed to insert preset "${preset.name}":`, error.message);
      } else {
        console.log(`Inserted preset: ${preset.name}`);
      }
    }
  }

  console.log("Done seeding presets!");
}

seedPresets().catch(console.error);
