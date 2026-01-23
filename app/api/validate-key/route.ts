import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ valid: false, error: "API key is required" }, { status: 400 });
    }

    // Basic format validation for OpenAI keys
    if (!key.startsWith("sk-")) {
      return NextResponse.json({ valid: false, error: "Invalid API key format. OpenAI keys start with 'sk-'" }, { status: 400 });
    }

    // Test the key by making a minimal API call
    const openai = createOpenAI({ apiKey: key });

    await generateText({
      model: openai("gpt-4o-mini"),
      prompt: "Say 'ok'",
      maxTokens: 1,
    });

    return NextResponse.json({ valid: true });
  } catch (error) {
    // Handle OpenAI API errors
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("401") || message.includes("Incorrect API key") || message.includes("invalid_api_key")) {
      return NextResponse.json({ valid: false, error: "Invalid API key" }, { status: 400 });
    }

    if (message.includes("429") || message.includes("rate limit")) {
      return NextResponse.json({ valid: false, error: "API key is rate limited. Please try again later." }, { status: 400 });
    }

    if (message.includes("insufficient_quota")) {
      return NextResponse.json({ valid: false, error: "API key has insufficient quota" }, { status: 400 });
    }

    // Log unexpected errors for debugging but don't expose details
    console.error("API key validation error:", message);
    return NextResponse.json({ valid: false, error: "Failed to validate API key. Please try again." }, { status: 500 });
  }
}
