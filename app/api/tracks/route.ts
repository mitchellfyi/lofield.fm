import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTracks, createTrack } from "@/lib/tracks";
import { createTrackSchema } from "@/lib/schemas/tracks";

export const runtime = "nodejs";

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// GET: List tracks for a project
export async function GET(req: Request) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    const tracks = await getTracks(userId, projectId);

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Error fetching tracks:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Create a new track
export async function POST(req: Request) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createTrackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const track = await createTrack(
      userId,
      result.data.project_id,
      result.data.name,
      result.data.current_code
    );

    return NextResponse.json({ track }, { status: 201 });
  } catch (error) {
    console.error("Error creating track:", error);
    const message = error instanceof Error ? error.message : "Failed to create track";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
