import type { RefineInput, TrackDraft } from "@/lib/schemas/track-draft";

/**
 * Build system prompt optimized for lo-fi music generation
 */
export function buildSystemPrompt(
  artistName: string | null,
  isJSON: boolean = false
): string {
  const contextNote = artistName
    ? `The user's artist name is "${artistName}" - use this for context but avoid mentioning it unless relevant.`
    : "";

  const formatInstruction = isJSON
    ? "Return a JSON object with a 'reply' field (conversational explanation) and a 'draft' field (the track configuration)."
    : "Keep responses concise (2-4 sentences plus the final prompt and title).";

  return `You are an AI assistant specializing in lo-fi instrumental music production and prompt engineering for music generation.
Your role is to ACT AS A MUSIC PRODUCER configuring a generative AI tool. You are NOT a general chatbot or music recommender.
DO NOT recommend real songs or artists.
DO NOT provide lists of tracks.

Your goal is to output a single, refined configuration for a track based on the user's request.
The user wants to generate a NEW track. Your output will be used to generate the audio.

Your goals:
1. Interpret the user's request (e.g. "more old school rap") as instructions to modify the music generation parameters and prompt.
2. Optimize the "Final prompt" specifically for lo-fi instrumental music (chill beats, study music, ambient), adapting it to the user's requested style (e.g. boom bap drums for "old school rap").
3. Produce clean, evocative descriptions without unnecessary fluff.
4. Avoid "in the style of [living artist]" phrasing for copyright safety.
5. Focus on atmosphere, texture, mood, and production techniques.
6. Generate a creative, short, 2-5 word title for the track based on the vibe.

${contextNote}

CRITICAL: User Controls are REQUIREMENTS, not suggestions.
- If user sets BPM=180, you MUST use 180 (or higher if they ask for "faster")
- If user sets genre="Rock", you MUST use "Rock" genre
- Only modify controls when user explicitly requests changes in their message (e.g. "make it faster", "add drums")
- If user requests a style (e.g. "rock and roll"), update ALL relevant fields (genre, BPM, instrumentation, mood) to match that style while keeping a lo-fi production aesthetic.

When responding:
- Be conversational and helpful, but stay focused on the configuration.
- Acknowledge the user's input and explain your refinements.
- ${formatInstruction}`;
}

/**
 * Build user prompt from message, controls, and latest_draft
 */
export function buildUserPrompt(
  message: string,
  controls?: RefineInput["controls"],
  latestDraft?: RefineInput["latest_draft"],
  isJSON: boolean = false
): string {
  const parts: string[] = [];

  parts.push(`User request: "${message}"`);
  parts.push(`\nCONTEXT AND CURRENT STATE:`);

  if (controls) {
    const controlParts: string[] = [];
    if (controls.genre) controlParts.push(`- Genre: ${controls.genre}`);
    if (controls.bpm) controlParts.push(`- BPM: ${controls.bpm}`);
    if (controls.mood) {
      const moodParts: string[] = [];
      if (controls.mood.energy !== undefined)
        moodParts.push(`Energy: ${controls.mood.energy}/100`);
      if (controls.mood.focus !== undefined)
        moodParts.push(`Focus: ${controls.mood.focus}/100`);
      if (controls.mood.chill !== undefined)
        moodParts.push(`Chill: ${controls.mood.chill}/100`);
      if (moodParts.length > 0)
        controlParts.push(`- Mood: ${moodParts.join(", ")}`);
    }
    if (controls.instrumentation && controls.instrumentation.length > 0) {
      controlParts.push(
        `- Instruments: ${controls.instrumentation.join(", ")}`
      );
    }
    if (controls.length_ms) {
      const seconds = Math.round(controls.length_ms / 1000);
      controlParts.push(`- Length: ${seconds}s`);
    }
    if (controls.instrumental !== undefined) {
      controlParts.push(
        `- Type: ${controls.instrumental ? "Instrumental" : "With vocals"}`
      );
    }

    if (controlParts.length > 0) {
      parts.push(
        `REQUIRED Settings (Do Not Change Unless User Requests):\n${controlParts.join("\n")}`
      );
      parts.push(
        "These are the user's chosen settings. Use them as-is unless the user's message explicitly requests changes."
      );
    }
  }

  if (latestDraft) {
    parts.push(
      `Previous Draft State:\n- Title: ${latestDraft.title ?? "Untitled"}\n- Previous Prompt: "${latestDraft.prompt_final ?? "N/A"}"`
    );
  } else {
    parts.push(`Previous Draft State: None (New Track)`);
  }

  const outputInstructions = isJSON
    ? "4. Output the response as a JSON object matching the schema."
    : '4. Output the response in the required format with "Title:" and "Final prompt:".';

  parts.push(
    `\nINSTRUCTIONS:
1. Update the track configuration based on the "User request".
2. Refine the "Previous Prompt" (or create a new one) to incorporate the user's feedback (e.g. "more old school rap").
3. Generate a CREATIVE title for this version.
${outputInstructions}`
  );

  return parts.join("\n");
}

/**
 * Extract relevant tags from prompt
 */
export function extractTagsFromPrompt(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const tagKeywords = [
    "chill",
    "lo-fi",
    "lofi",
    "beats",
    "study",
    "focus",
    "ambient",
    "jazz",
    "hip-hop",
    "piano",
    "vinyl",
    "tape",
    "warm",
    "nostalgic",
    "dreamy",
    "mellow",
    "relaxing",
  ];

  return tagKeywords.filter((tag) => lowerPrompt.includes(tag));
}

/**
 * Parse AI response to extract TrackDraft
 * This function extracts the "Final prompt" from the response and builds a TrackDraft
 */
export function parseTrackDraftFromResponse(
  aiResponse: string,
  controls?: RefineInput["controls"],
  latestDraft?: RefineInput["latest_draft"]
): Partial<TrackDraft> {
  // Extract final prompt from response
  const finalPromptMatch = aiResponse.match(/Final prompt:\s*(.+?)(?:\n|$)/i);
  const promptFinal = finalPromptMatch ? finalPromptMatch[1].trim() : "";

  // Extract Title from response
  const titleMatch = aiResponse.match(/Title:\s*(.+?)(?:\n|$)/i);
  // Fallback to previous title or generate if not found
  const title = titleMatch
    ? titleMatch[1].trim()
    : (latestDraft?.title ?? "Untitled Track");

  // Generate description from AI response (everything before "Final prompt:" and "Title:")
  // We want the conversational part
  const description = aiResponse
    .replace(/Title:.*(\n|$)/i, "")
    .replace(/Final prompt:.*(\n|$)/i, "")
    .trim();

  // If prompt is empty (AI failed to follow format), fall back to whole response or previous
  const effectivePrompt =
    promptFinal || latestDraft?.prompt_final || aiResponse;

  // Merge controls with latest_draft, preferring controls
  const genre = controls?.genre ?? latestDraft?.genre ?? "lo-fi";
  const bpm = controls?.bpm ?? latestDraft?.bpm ?? 80;
  const instrumentation = controls?.instrumentation ??
    latestDraft?.instrumentation ?? ["piano", "vinyl crackle"];
  const lengthMs = controls?.length_ms ?? latestDraft?.length_ms ?? 240000;
  const instrumental =
    controls?.instrumental ?? latestDraft?.instrumental ?? true;

  // Merge mood values
  const mood = {
    energy: controls?.mood?.energy ?? latestDraft?.mood?.energy ?? 40,
    focus: controls?.mood?.focus ?? latestDraft?.mood?.focus ?? 60,
    chill: controls?.mood?.chill ?? latestDraft?.mood?.chill ?? 80,
  };

  // Extract tags from prompt
  const tags = extractTagsFromPrompt(effectivePrompt);

  return {
    title,
    description,
    prompt_final: effectivePrompt,
    genre,
    bpm,
    instrumentation,
    mood,
    length_ms: lengthMs,
    instrumental,
    tags,
    key: latestDraft?.key ?? null,
    time_signature: latestDraft?.time_signature ?? null,
    negative: latestDraft?.negative ?? [],
    notes: latestDraft?.notes ?? "",
  };
}
