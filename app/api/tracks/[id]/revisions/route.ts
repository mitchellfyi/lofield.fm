import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRevisions, createRevision } from "@/lib/tracks";
import { z } from "zod";

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

const createRevisionBodySchema = z.object({
  code: z.string(),
  message: z.string().max(500, "Message must be 500 characters or less").nullable().optional(),
});

// GET: List all revisions for a track
export async function GET(_req: Request, context: RouteContext) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const revisions = await getRevisions(userId, id);

    return NextResponse.json({ revisions });
  } catch (error) {
    console.error("Error fetching revisions:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch revisions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Create a new revision for a track
export async function POST(req: Request, context: RouteContext) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const result = createRevisionBodySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const revision = await createRevision(userId, id, result.data.code, result.data.message);

    return NextResponse.json({ revision }, { status: 201 });
  } catch (error) {
    console.error("Error creating revision:", error);
    const message = error instanceof Error ? error.message : "Failed to create revision";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
