import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiKeyInfo, setApiKey, deleteApiKey } from "@/lib/api-keys";

export const runtime = "nodejs";

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// GET: Return API key status (has_key, masked_key)
export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const info = await getApiKeyInfo(userId);

    return NextResponse.json({
      hasKey: info.hasKey,
      maskedKey: info.maskedKey,
    });
  } catch (error) {
    console.error("Error getting API key info:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Save a new API key (after validation)
export async function POST(req: Request) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { key } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    // Basic format validation
    if (!key.startsWith("sk-")) {
      return NextResponse.json({ error: "Invalid API key format" }, { status: 400 });
    }

    await setApiKey(userId, key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving API key:", error);
    return NextResponse.json({ error: "Failed to save API key" }, { status: 500 });
  }
}

// DELETE: Remove user's API key
export async function DELETE() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteApiKey(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
  }
}
