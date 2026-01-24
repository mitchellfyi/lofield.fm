/**
 * TypeScript types for sharing functionality
 */

import { Track } from "./tracks";

/** Privacy level for tracks - matches database enum */
export type PrivacyLevel = "private" | "unlisted" | "public";

/** Track with share fields included */
export interface SharedTrack extends Track {
  share_token: string | null;
  privacy: PrivacyLevel;
  shared_at: string | null;
}

/** Public track data returned from share API */
export interface PublicTrackData {
  id: string;
  name: string;
  current_code: string;
  created_at: string;
  author_name: string | null;
  privacy: PrivacyLevel;
}

/** Share info for UI state management */
export interface ShareInfo {
  shareUrl: string | null;
  privacy: PrivacyLevel;
  shareToken: string | null;
  sharedAt: string | null;
}

/** Response from share API endpoints */
export interface ShareResponse {
  success: boolean;
  shareUrl?: string;
  shareToken?: string;
  privacy?: PrivacyLevel;
  sharedAt?: string;
  error?: string;
}
