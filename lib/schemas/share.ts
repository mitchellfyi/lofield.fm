/**
 * Zod schemas for share-related API validation
 */

import { z } from "zod";

// Privacy level enum
export const privacyLevelSchema = z.enum(["private", "unlisted", "public"]);

// Share token validation (12-char alphanumeric)
export const shareTokenSchema = z
  .string()
  .length(12, "Share token must be 12 characters")
  .regex(/^[A-Za-z0-9]+$/, "Share token must be alphanumeric");

// Update share settings (privacy only)
export const updateShareSchema = z.object({
  privacy: privacyLevelSchema,
});

// Type exports
export type PrivacyLevelInput = z.infer<typeof privacyLevelSchema>;
export type UpdateShareInput = z.infer<typeof updateShareSchema>;
