/**
 * Service layer for projects, tracks, revisions, and recordings
 * Handles all database operations for track management
 */

import { createServiceClient } from "@/lib/supabase/service";
import type { Project, Track, Revision, ProjectWithTrackCount } from "@/lib/types/tracks";
import type { Recording, RecordingEvent } from "@/lib/types/recording";

// ============================================================================
// Project Operations
// ============================================================================

export async function getProjects(userId: string): Promise<ProjectWithTrackCount[]> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      tracks:tracks(count)
    `
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  // Transform the response to include track_count
  type ProjectWithTracks = Project & { tracks?: { count: number }[] };
  return ((data as ProjectWithTracks[]) || []).map((project) => ({
    ...project,
    track_count: project.tracks?.[0]?.count ?? 0,
    tracks: undefined, // Remove the tracks array from response
  })) as ProjectWithTrackCount[];
}

export async function getProject(userId: string, projectId: string): Promise<Project | null> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to fetch project: ${error.message}`);
  }

  return data;
}

export async function createProject(userId: string, name: string): Promise<Project> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return data;
}

export async function updateProject(
  userId: string,
  projectId: string,
  name: string
): Promise<Project> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("projects")
    .update({ name })
    .eq("id", projectId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  return data;
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

// ============================================================================
// Track Operations
// ============================================================================

export async function getTracks(userId: string, projectId: string): Promise<Track[]> {
  const supabase = await createServiceClient();

  // First verify project ownership
  const project = await getProject(userId, projectId);
  if (!project) {
    throw new Error("Project not found or access denied");
  }

  const { data, error } = await supabase
    .from("tracks")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch tracks: ${error.message}`);
  }

  return data || [];
}

export async function getTrack(userId: string, trackId: string): Promise<Track | null> {
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
    throw new Error(`Failed to fetch track: ${error.message}`);
  }

  // Verify ownership
  if (data.project?.user_id !== userId) {
    return null;
  }

  // Remove project from response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { project: _project, ...track } = data;
  return track as Track;
}

export async function createTrack(
  userId: string,
  projectId: string,
  name: string,
  currentCode: string = ""
): Promise<Track> {
  const supabase = await createServiceClient();

  // Verify project ownership
  const project = await getProject(userId, projectId);
  if (!project) {
    throw new Error("Project not found or access denied");
  }

  const { data, error } = await supabase
    .from("tracks")
    .insert({
      project_id: projectId,
      name,
      current_code: currentCode,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create track: ${error.message}`);
  }

  return data;
}

export async function updateTrack(
  userId: string,
  trackId: string,
  updates: { name?: string; current_code?: string }
): Promise<Track> {
  const supabase = await createServiceClient();

  // Verify track ownership
  const existingTrack = await getTrack(userId, trackId);
  if (!existingTrack) {
    throw new Error("Track not found or access denied");
  }

  const { data, error } = await supabase
    .from("tracks")
    .update(updates)
    .eq("id", trackId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update track: ${error.message}`);
  }

  return data;
}

export async function deleteTrack(userId: string, trackId: string): Promise<void> {
  const supabase = await createServiceClient();

  // Verify track ownership
  const existingTrack = await getTrack(userId, trackId);
  if (!existingTrack) {
    throw new Error("Track not found or access denied");
  }

  const { error } = await supabase.from("tracks").delete().eq("id", trackId);

  if (error) {
    throw new Error(`Failed to delete track: ${error.message}`);
  }
}

// ============================================================================
// Revision Operations
// ============================================================================

export async function getRevisions(userId: string, trackId: string): Promise<Revision[]> {
  const supabase = await createServiceClient();

  // Verify track ownership
  const track = await getTrack(userId, trackId);
  if (!track) {
    throw new Error("Track not found or access denied");
  }

  const { data, error } = await supabase
    .from("revisions")
    .select("*")
    .eq("track_id", trackId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch revisions: ${error.message}`);
  }

  return data || [];
}

export async function createRevision(
  userId: string,
  trackId: string,
  code: string,
  message?: string | null
): Promise<Revision> {
  const supabase = await createServiceClient();

  // Verify track ownership
  const track = await getTrack(userId, trackId);
  if (!track) {
    throw new Error("Track not found or access denied");
  }

  const { data, error } = await supabase
    .from("revisions")
    .insert({
      track_id: trackId,
      code,
      message: message ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create revision: ${error.message}`);
  }

  // Prune old revisions to keep only the last 50
  await pruneRevisions(trackId, 50);

  return data;
}

export async function getRevision(
  userId: string,
  trackId: string,
  revisionId: string
): Promise<Revision | null> {
  const supabase = await createServiceClient();

  // Verify track ownership
  const track = await getTrack(userId, trackId);
  if (!track) {
    throw new Error("Track not found or access denied");
  }

  const { data, error } = await supabase
    .from("revisions")
    .select("*")
    .eq("id", revisionId)
    .eq("track_id", trackId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch revision: ${error.message}`);
  }

  return data;
}

/**
 * Prune old revisions for a track, keeping only the most recent N revisions.
 * This is called automatically after creating a new revision.
 */
export async function pruneRevisions(trackId: string, keepCount: number = 50): Promise<number> {
  const supabase = await createServiceClient();

  // Get all revisions for this track, ordered by created_at
  const { data: revisions, error: fetchError } = await supabase
    .from("revisions")
    .select("id, created_at")
    .eq("track_id", trackId)
    .order("created_at", { ascending: false });

  if (fetchError) {
    throw new Error(`Failed to fetch revisions for pruning: ${fetchError.message}`);
  }

  // If we have more than keepCount revisions, delete the old ones
  if (revisions && revisions.length > keepCount) {
    const revisionsToDelete = (revisions as { id: string; created_at: string }[])
      .slice(keepCount)
      .map((r) => r.id);

    const { error: deleteError } = await supabase
      .from("revisions")
      .delete()
      .in("id", revisionsToDelete);

    if (deleteError) {
      throw new Error(`Failed to prune revisions: ${deleteError.message}`);
    }

    return revisionsToDelete.length;
  }

  return 0;
}

// ============================================================================
// Recording Operations
// ============================================================================

export async function getRecordings(userId: string, trackId: string): Promise<Recording[]> {
  const supabase = await createServiceClient();

  // Verify track ownership
  const track = await getTrack(userId, trackId);
  if (!track) {
    throw new Error("Track not found or access denied");
  }

  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .eq("track_id", trackId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch recordings: ${error.message}`);
  }

  return data || [];
}

export async function getRecording(
  userId: string,
  trackId: string,
  recordingId: string
): Promise<Recording | null> {
  const supabase = await createServiceClient();

  // Verify track ownership
  const track = await getTrack(userId, trackId);
  if (!track) {
    throw new Error("Track not found or access denied");
  }

  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .eq("id", recordingId)
    .eq("track_id", trackId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch recording: ${error.message}`);
  }

  return data;
}

export async function createRecording(
  userId: string,
  trackId: string,
  durationMs: number,
  events: RecordingEvent[],
  name?: string
): Promise<Recording> {
  const supabase = await createServiceClient();

  // Verify track ownership
  const track = await getTrack(userId, trackId);
  if (!track) {
    throw new Error("Track not found or access denied");
  }

  const { data, error } = await supabase
    .from("recordings")
    .insert({
      track_id: trackId,
      name: name ?? null,
      duration_ms: durationMs,
      events: events,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create recording: ${error.message}`);
  }

  return data;
}

export async function updateRecording(
  userId: string,
  trackId: string,
  recordingId: string,
  updates: { name?: string; events?: RecordingEvent[] }
): Promise<Recording> {
  const supabase = await createServiceClient();

  // Verify recording ownership
  const existingRecording = await getRecording(userId, trackId, recordingId);
  if (!existingRecording) {
    throw new Error("Recording not found or access denied");
  }

  const { data, error } = await supabase
    .from("recordings")
    .update(updates)
    .eq("id", recordingId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update recording: ${error.message}`);
  }

  return data;
}

export async function deleteRecording(
  userId: string,
  trackId: string,
  recordingId: string
): Promise<void> {
  const supabase = await createServiceClient();

  // Verify recording ownership
  const existingRecording = await getRecording(userId, trackId, recordingId);
  if (!existingRecording) {
    throw new Error("Recording not found or access denied");
  }

  const { error } = await supabase.from("recordings").delete().eq("id", recordingId);

  if (error) {
    throw new Error(`Failed to delete recording: ${error.message}`);
  }
}
