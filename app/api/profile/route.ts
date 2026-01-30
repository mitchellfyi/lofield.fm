import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateUsername, validateBio, type ProfileUpdate } from "@/lib/types/profile";

export const runtime = "nodejs";

/**
 * GET /api/profile
 * Get current user's profile
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error in profile API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ProfileUpdate = await request.json();

    // Validate username if provided
    if (body.username !== undefined) {
      const validation = validateUsername(body.username);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Check if username is already taken
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", body.username.toLowerCase())
        .neq("id", user.id)
        .single();

      if (existing) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
      }

      body.username = body.username.toLowerCase();
    }

    // Validate bio if provided
    if (body.bio !== undefined) {
      const validation = validateBio(body.bio);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    // Update profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .update(body)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error in profile API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
