import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrackShareInfo, generateShare, updateSharePrivacy, revokeShare } from "@/lib/share";
import { buildShareUrl } from "@/lib/share/token";
import { updateShareSchema } from "@/lib/schemas/share";

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

// GET: Get share info for a track (requires auth + ownership)
export async function GET(_req: Request, context: RouteContext) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const track = await getTrackShareInfo(userId, id);

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const shareUrl = track.share_token ? buildShareUrl(track.share_token) : null;

    return NextResponse.json({
      shareUrl,
      shareToken: track.share_token,
      privacy: track.privacy,
      sharedAt: track.shared_at,
    });
  } catch (error) {
    console.error("Error fetching share info:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Generate a new share token (requires auth + ownership)
export async function POST(req: Request, context: RouteContext) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Optional: parse privacy from body
    let privacy: "private" | "unlisted" | "public" = "unlisted";
    try {
      const body = await req.json();
      if (body.privacy) {
        const result = updateShareSchema.safeParse(body);
        if (result.success) {
          privacy = result.data.privacy;
        }
      }
    } catch {
      // No body or invalid JSON, use default
    }

    const result = await generateShare(userId, id, privacy);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error generating share link:", error);
    const message = error instanceof Error ? error.message : "Failed to generate share link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: Update privacy setting (requires auth + ownership)
export async function PUT(req: Request, context: RouteContext) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const result = updateShareSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const updated = await updateSharePrivacy(userId, id, result.data.privacy);

    return NextResponse.json({
      success: true,
      privacy: updated.privacy,
    });
  } catch (error) {
    console.error("Error updating share privacy:", error);
    const message = error instanceof Error ? error.message : "Failed to update share privacy";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Revoke share access (requires auth + ownership)
export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await revokeShare(userId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking share:", error);
    const message = error instanceof Error ? error.message : "Failed to revoke share";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
