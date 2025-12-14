import { getUserSecretStatus } from "@/lib/secrets";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Schema for user_settings JSONB fields
const ElevenMusicDefaultsSchema = z
  .object({
    length_ms: z.number().int().min(1000).max(600000).optional(),
    instrumental: z.boolean().optional(),
  })
  .passthrough();

const PromptDefaultsSchema = z
  .object({
    genre: z.string().max(100).optional(),
    bpm: z.number().int().min(40).max(220).optional(),
    mood: z
      .object({
        energy: z.number().min(0).max(1).optional(),
        focus: z.number().min(0).max(1).optional(),
        chill: z.number().min(0).max(1).optional(),
      })
      .optional(),
  })
  .passthrough();

// PATCH request body schema
const PatchSettingsSchema = z.object({
  artist_name: z.string().max(100).optional(),
  openai_model: z.string().max(100).optional(),
  eleven_music_defaults: ElevenMusicDefaultsSchema.optional(),
  prompt_defaults: PromptDefaultsSchema.optional(),
});

// GET /api/settings - returns non-sensitive settings + boolean flags
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const supabaseAdmin = getServiceRoleClient();

  // Get profile data
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("artist_name")
    .eq("id", userId)
    .maybeSingle();

  // Get user settings
  const { data: settings } = await supabaseAdmin
    .from("user_settings")
    .select("openai_model, eleven_music_defaults, prompt_defaults")
    .eq("user_id", userId)
    .maybeSingle();

  // Get secret status (has keys, not the actual keys)
  const secretStatus = await getUserSecretStatus(userId);

  return NextResponse.json({
    artist_name: profile?.artist_name ?? null,
    openai_model: settings?.openai_model ?? "gpt-4.1-mini",
    eleven_music_defaults: settings?.eleven_music_defaults ?? {
      length_ms: 240000,
      instrumental: true,
    },
    prompt_defaults: settings?.prompt_defaults ?? {},
    hasOpenAIKey: secretStatus.hasOpenAIKey,
    hasElevenLabsKey: secretStatus.hasElevenLabsKey,
  });
}

// PATCH /api/settings - updates profiles and user_settings
export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = PatchSettingsSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { artist_name, openai_model, eleven_music_defaults, prompt_defaults } =
    parseResult.data;
  const userId = session.user.id;
  const supabaseAdmin = getServiceRoleClient();

  // Update profile if artist_name provided
  if (artist_name !== undefined) {
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: userId, artist_name, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("Failed to update profile");
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }
  }

  // Update user_settings if any settings fields provided
  if (
    openai_model !== undefined ||
    eleven_music_defaults !== undefined ||
    prompt_defaults !== undefined
  ) {
    // Build the update object
    const settingsUpdate: Record<string, unknown> = { user_id: userId };
    if (openai_model !== undefined) settingsUpdate.openai_model = openai_model;
    if (eleven_music_defaults !== undefined)
      settingsUpdate.eleven_music_defaults = eleven_music_defaults;
    if (prompt_defaults !== undefined)
      settingsUpdate.prompt_defaults = prompt_defaults;

    const { error: settingsError } = await supabaseAdmin
      .from("user_settings")
      .upsert(settingsUpdate, { onConflict: "user_id" });

    if (settingsError) {
      console.error("Failed to update settings");
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
