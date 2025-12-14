import { storeSecretsForUser } from "@/lib/secrets";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const openaiApiKey = body.openaiApiKey as string | undefined;
  const elevenlabsApiKey = body.elevenlabsApiKey as string | undefined;

  try {
    await storeSecretsForUser(session.user.id, { openaiApiKey, elevenlabsApiKey });
  } catch (storeError) {
    console.error("Failed to store secrets", storeError);
    return NextResponse.json({ error: "Unable to store secrets" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
