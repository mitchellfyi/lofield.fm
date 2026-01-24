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

// Type exports for use in API routes
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;
export type CreateRevisionInput = z.infer<typeof createRevisionSchema>;
