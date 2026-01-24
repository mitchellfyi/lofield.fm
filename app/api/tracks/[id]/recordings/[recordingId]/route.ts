import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getRecording,
  updateRecording as updateRecordingService,
  deleteRecording as deleteRecordingService,
} from "@/lib/tracks";
import { updateRecordingSchema } from "@/lib/schemas/tracks";

export const runtime = "nodejs";

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// GET: Get a specific recording
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; recordingId: string }> }
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId, recordingId } = await params;

    const recording = await getRecording(userId, trackId, recordingId);

    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    return NextResponse.json({ recording });
  } catch (error) {
    console.error("Error fetching recording:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// PUT: Update a recording
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; recordingId: string }> }
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId, recordingId } = await params;
    const body = await req.json();

    const result = updateRecordingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const recording = await updateRecordingService(userId, trackId, recordingId, result.data);

    return NextResponse.json({ recording });
  } catch (error) {
    console.error("Error updating recording:", error);
    const message = error instanceof Error ? error.message : "Failed to update recording";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE: Delete a recording
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; recordingId: string }> }
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId, recordingId } = await params;

    await deleteRecordingService(userId, trackId, recordingId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recording:", error);
    const message = error instanceof Error ? error.message : "Failed to delete recording";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
