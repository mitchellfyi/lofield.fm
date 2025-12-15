import { z } from "zod";

/**
 * TrackDraft schema - validated server-side and stored as jsonb
 * This is the structured output from the refine endpoint
 */
export const TrackDraftSchema = z.object({
  // Required fields
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  prompt_final: z.string().min(1).max(2000), // Eleven-ready, single prompt
  genre: z.string().min(1).max(100),
  bpm: z.number().min(40).max(220),
  instrumentation: z
    .array(z.string())
    .default([])
    .describe("List of instruments"),
  mood: z.object({
    energy: z.number().min(0).max(100).describe("0-100 energy level"),
    focus: z.number().min(0).max(100).describe("0-100 focus level"),
    chill: z.number().min(0).max(100).describe("0-100 chill level"),
  }),
  length_ms: z
    .number()
    .min(3000)
    .max(300000)
    .describe("Length in milliseconds (3000-300000)"),
  instrumental: z.boolean().describe("Whether the track is instrumental"),
  tags: z.array(z.string()).default([]).describe("Relevant tags for the track"),

  // Optional fields
  key: z.string().nullable().optional(),
  time_signature: z.string().nullable().optional(),
  negative: z.array(z.string()).optional(), // what to avoid
  notes: z.string().optional(), // human readable summary
});

export type TrackDraft = z.infer<typeof TrackDraftSchema>;

/**
 * Input schema for the refine endpoint
 */
export const RefineInputSchema = z.object({
  message: z.string().min(1).max(2000), // user's free text message
  controls: z
    .object({
      genre: z.string().optional(),
      bpm: z.number().min(40).max(220).optional(),
      mood: z
        .object({
          energy: z.number().min(0).max(100).optional(),
          focus: z.number().min(0).max(100).optional(),
          chill: z.number().min(0).max(100).optional(),
        })
        .optional(),
      instrumentation: z.array(z.string()).optional(),
      length_ms: z.number().min(3000).max(300000).optional(), // ElevenLabs: 3s-5min
      instrumental: z.boolean().optional(),
    })
    .optional(),
  latest_draft: z
    .object({
      // Allow partial TrackDraft for context
      title: z.string().optional(),
      description: z.string().optional(),
      prompt_final: z.string().optional(),
      genre: z.string().optional(),
      bpm: z.number().optional(),
      instrumentation: z.array(z.string()).optional(),
      mood: z
        .object({
          energy: z.number().optional(),
          focus: z.number().optional(),
          chill: z.number().optional(),
        })
        .optional(),
      length_ms: z.number().optional(),
      instrumental: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      key: z.string().nullable().optional(),
      time_signature: z.string().nullable().optional(),
      negative: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export type RefineInput = z.infer<typeof RefineInputSchema>;
