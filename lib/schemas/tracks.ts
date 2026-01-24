/**
 * Zod schemas for validating project and track API requests
 */

import { z } from "zod";

// Project schemas
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(255, "Project name must be 255 characters or less"),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(255, "Project name must be 255 characters or less")
    .optional(),
});

// Track schemas
export const createTrackSchema = z.object({
  project_id: z.string().uuid("Invalid project ID"),
  name: z
    .string()
    .min(1, "Track name is required")
    .max(255, "Track name must be 255 characters or less"),
  current_code: z.string().default(""),
});

export const updateTrackSchema = z.object({
  name: z
    .string()
    .min(1, "Track name is required")
    .max(255, "Track name must be 255 characters or less")
    .optional(),
  current_code: z.string().optional(),
});

// Revision schemas
export const createRevisionSchema = z.object({
  track_id: z.string().uuid("Invalid track ID"),
  code: z.string(),
  message: z.string().max(500, "Message must be 500 characters or less").nullable().optional(),
});

// Recording event schema
const recordingEventSchema = z.object({
  id: z.string(),
  timestamp_ms: z.number().min(0),
  type: z.enum(["tweak", "layer_mute", "layer_volume", "layer_solo"]),
  param: z.enum(["bpm", "swing", "filter", "reverb", "delay"]).optional(),
  layerId: z.string().optional(),
  oldValue: z.union([z.number(), z.boolean()]),
  newValue: z.union([z.number(), z.boolean()]),
});

// Recording schemas
export const createRecordingSchema = z.object({
  track_id: z.string().uuid("Invalid track ID"),
  name: z.string().max(255, "Name must be 255 characters or less").optional(),
  duration_ms: z.number().min(0, "Duration must be positive"),
  events: z.array(recordingEventSchema),
});

export const updateRecordingSchema = z.object({
  name: z.string().max(255, "Name must be 255 characters or less").optional(),
  events: z.array(recordingEventSchema).optional(),
});

// Type exports for use in API routes
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;
export type CreateRevisionInput = z.infer<typeof createRevisionSchema>;
export type CreateRecordingInput = z.infer<typeof createRecordingSchema>;
export type UpdateRecordingInput = z.infer<typeof updateRecordingSchema>;
