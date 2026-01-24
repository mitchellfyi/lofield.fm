import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProject, updateProject, deleteProject } from "@/lib/tracks";
import { updateProjectSchema } from "@/lib/schemas/tracks";

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

// GET: Get a single project by ID
export async function GET(_req: Request, context: RouteContext) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const project = await getProject(userId, id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update a project
export async function PUT(req: Request, context: RouteContext) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    if (!result.data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const project = await updateProject(userId, id, result.data.name);

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error updating project:", error);
    const message = error instanceof Error ? error.message : "Failed to update project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Delete a project
export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await deleteProject(userId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    const message = error instanceof Error ? error.message : "Failed to delete project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
