import { storeSecretsForUser } from "@/lib/secrets";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const SecretsBodySchema = z.object({
  openaiApiKey: z.string().min(1).optional(),
  elevenlabsApiKey: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = SecretsBodySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { openaiApiKey, elevenlabsApiKey } = parseResult.data;

  // Require at least one key to be provided
  if (!openaiApiKey && !elevenlabsApiKey) {
    return NextResponse.json(
      { error: "At least one API key must be provided" },
      { status: 400 }
    );
  }

  try {
    await storeSecretsForUser(session.user.id, {
      openaiApiKey,
      elevenlabsApiKey,
    });
  } catch (storeError) {
    console.error("Failed to store secrets", storeError);
    return NextResponse.json(
      { error: "Unable to store secrets" },
      { status: 500 }
    );
  }

  // Return masked status only - never return the actual keys
  return NextResponse.json({
    ok: true,
    savedOpenAI: !!openaiApiKey,
    savedElevenLabs: !!elevenlabsApiKey,
  });
}
