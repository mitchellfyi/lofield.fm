import { NextResponse } from "next/server";
import { getSharedTrack } from "@/lib/share";
import { isValidShareToken } from "@/lib/share/token";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ token: string }>;
}

// GET: Fetch a publicly shared track by token (no auth required)
export async function GET(_req: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

    // Validate token format
    if (!isValidShareToken(token)) {
      return NextResponse.json({ error: "Invalid share token" }, { status: 400 });
    }

    const track = await getSharedTrack(token);

    if (!track) {
      return NextResponse.json({ error: "Track not found or not shared" }, { status: 404 });
    }

    return NextResponse.json({ track });
  } catch (error) {
    console.error("Error fetching shared track:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
