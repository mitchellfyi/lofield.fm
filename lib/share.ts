/**
 * Service layer for sharing functionality
 * Handles share token generation, privacy updates, and public track access
 */

import { createServiceClient } from "@/lib/supabase/service";
import { generateShareToken, buildShareUrl } from "@/lib/share/token";
import type { PrivacyLevel, PublicTrackData, SharedTrack } from "@/lib/types/share";

// Type for the track query result with nested project
interface TrackWithProject {
  id: string;
  name: string;
  current_code: string;
  created_at: string;
  privacy: string;
  project: { user_id: string } | null;
}

// ============================================================================
// Public Access (No Auth Required)
// ============================================================================

/**
 * Get a publicly shared track by its share token
 * Returns null if token is invalid or track is private
 */
export async function getSharedTrack(token: string): Promise<PublicTrackData | null> {
  const supabase = await createServiceClient();

  // First get the track with its project's user_id
  const { data: trackData, error: trackError } = await supabase
    .from("tracks")
    .select(
      `
      id,
      name,
      current_code,
      created_at,
      privacy,
      project:projects!inner(user_id)
    `
    )
    .eq("share_token", token)
    .in("privacy", ["public", "unlisted"])
    .single();

  if (trackError) {
    if (trackError.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Failed to fetch shared track:", trackError.message);
    return null;
  }

  if (!trackData) {
    return null;
  }

  // Get the author's display name from profiles
  let authorName: string | null = null;
  const track = trackData as TrackWithProject;
  if (track.project?.user_id) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", track.project.user_id)
      .single();

    authorName = profileData?.display_name ?? null;
  }

  return {
    id: trackData.id,
    name: trackData.name,
    current_code: trackData.current_code,
    created_at: trackData.created_at,
    privacy: trackData.privacy as PrivacyLevel,
    author_name: authorName,
  };
}

// ============================================================================
// Authenticated Operations
// ============================================================================

/**
 * Get a track's share info (for owner only)
 */
export async function getTrackShareInfo(
  userId: string,
  trackId: string
): Promise<SharedTrack | null> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("tracks")
    .select(
      `
      *,
      project:projects!inner(user_id)
    `
    )
    .eq("id", trackId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch track share info: ${error.message}`);
  }

  // Verify ownership
  if (data.project?.user_id !== userId) {
    return null;
  }

  // Remove project from response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { project: _project, ...track } = data;
  return track as SharedTrack;
}

/**
 * Generate or regenerate a share token for a track
 * If track already has a token, it will be replaced
 */
export async function generateShare(
  userId: string,
  trackId: string,
  privacy: PrivacyLevel = "unlisted"
): Promise<{ shareUrl: string; shareToken: string; privacy: PrivacyLevel }> {
  const supabase = await createServiceClient();

  // Verify ownership
  const track = await getTrackShareInfo(userId, trackId);
  if (!track) {
    throw new Error("Track not found or access denied");
  }

  // Generate new token
  const shareToken = generateShareToken();

  const { error } = await supabase
    .from("tracks")
    .update({
      share_token: shareToken,
      privacy,
      shared_at: new Date().toISOString(),
    })
    .eq("id", trackId);

  if (error) {
    throw new Error(`Failed to generate share link: ${error.message}`);
  }

  const shareUrl = buildShareUrl(shareToken);

  return { shareUrl, shareToken, privacy };
}

/**
 * Update the privacy setting for a track
 * If changing to private, the share token is preserved but ineffective
 */
export async function updateSharePrivacy(
  userId: string,
  trackId: string,
  privacy: PrivacyLevel
): Promise<{ privacy: PrivacyLevel }> {
  const supabase = await createServiceClient();

  // Verify ownership
  const track = await getTrackShareInfo(userId, trackId);
  if (!track) {
    throw new Error("Track not found or access denied");
  }

  const { error } = await supabase.from("tracks").update({ privacy }).eq("id", trackId);

  if (error) {
    throw new Error(`Failed to update share privacy: ${error.message}`);
  }

  return { privacy };
}

/**
 * Revoke sharing for a track
 * Sets privacy to private and clears the share token
 */
export async function revokeShare(userId: string, trackId: string): Promise<void> {
  const supabase = await createServiceClient();

  // Verify ownership
  const track = await getTrackShareInfo(userId, trackId);
  if (!track) {
    throw new Error("Track not found or access denied");
  }

  const { error } = await supabase
    .from("tracks")
    .update({
      share_token: null,
      privacy: "private",
      shared_at: null,
    })
    .eq("id", trackId);

  if (error) {
    throw new Error(`Failed to revoke share: ${error.message}`);
  }
}
