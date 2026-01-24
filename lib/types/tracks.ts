/**
 * TypeScript interfaces for Projects, Tracks, and Revisions
 * These map directly to the database schema in 003_tracks.sql
 */

export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Track {
  id: string;
  project_id: string;
  name: string;
  current_code: string;
  created_at: string;
  updated_at: string;
}

export interface Revision {
  id: string;
  track_id: string;
  code: string;
  message: string | null;
  created_at: string;
}

/** Project with nested track count for list views */
export interface ProjectWithTrackCount extends Project {
  track_count: number;
}

/** Track with nested project info for display */
export interface TrackWithProject extends Track {
  project: Project;
}
