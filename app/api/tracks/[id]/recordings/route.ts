import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecordings, createRecording as createRecordingService } from "@/lib/tracks";
import { createRecordingSchema } from "@/lib/schemas/tracks";

export const runtime = "nodejs";

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// GET: List recordings for a track
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await params;

    const recordings = await getRecordings(userId, trackId);

    return NextResponse.json({ recordings });
  } catch (error) {
    console.error("Error fetching recordings:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// POST: Create a new recording
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await params;
    const body = await req.json();

    // Validate with track_id from URL
    const result = createRecordingSchema.safeParse({ ...body, track_id: trackId });

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const recording = await createRecordingService(
      userId,
      trackId,
      result.data.duration_ms,
      result.data.events,
      result.data.name
    );

    return NextResponse.json({ recording }, { status: 201 });
  } catch (error) {
    console.error("Error creating recording:", error);
    const message = error instanceof Error ? error.message : "Failed to create recording";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
