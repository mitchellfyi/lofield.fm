import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrack, updateTrack, deleteTrack } from "@/lib/tracks";
import { updateTrackSchema } from "@/lib/schemas/tracks";

export const runtime = "nodejs";

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: Get a single track by ID
export async function GET(_req: Request, context: RouteContext) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const track = await getTrack(userId, id);

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    return NextResponse.json({ track });
  } catch (error) {
    console.error("Error fetching track:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update a track
export async function PUT(req: Request, context: RouteContext) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const result = updateTrackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const updates: { name?: string; current_code?: string } = {};
    if (result.data.name !== undefined) {
      updates.name = result.data.name;
    }
    if (result.data.current_code !== undefined) {
      updates.current_code = result.data.current_code;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const track = await updateTrack(userId, id, updates);

    return NextResponse.json({ track });
  } catch (error) {
    console.error("Error updating track:", error);
    const message = error instanceof Error ? error.message : "Failed to update track";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Delete a track
export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await deleteTrack(userId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting track:", error);
    const message = error instanceof Error ? error.message : "Failed to delete track";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
