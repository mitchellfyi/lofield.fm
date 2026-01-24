import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRevision } from "@/lib/tracks";

export const runtime = "nodejs";

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

interface RouteContext {
  params: Promise<{ id: string; revisionId: string }>;
}

// GET: Get a single revision by ID
export async function GET(_req: Request, context: RouteContext) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, revisionId } = await context.params;
    const revision = await getRevision(userId, id, revisionId);

    if (!revision) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 });
    }

    return NextResponse.json({ revision });
  } catch (error) {
    console.error("Error fetching revision:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch revision";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
