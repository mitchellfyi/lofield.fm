/**
 * Zod schema for chat response structured output
 * Used with Vercel AI SDK's streamObject for validated responses
 */

import { z } from "zod";

/**
 * Schema for the AI chat response containing notes and Tone.js code
 *
 * - notes: Short bullet points describing what changed (max 3)
 * - code: Complete Tone.js code to play
 */
export const chatResponseSchema = z.object({
  notes: z
    .array(z.string())
    .max(3)
    .describe("1-3 short bullet points describing what changed or was created"),
  code: z.string().min(1).describe("Complete Tone.js code to execute"),
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;
