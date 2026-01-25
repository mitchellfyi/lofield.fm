-- Add metadata columns to tracks table for public discovery
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS bpm integer,
  ADD COLUMN IF NOT EXISTS genre varchar(100),
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS plays integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false;

-- Index for public track queries (most common query pattern)
CREATE INDEX IF NOT EXISTS tracks_public_idx
  ON public.tracks(privacy, is_featured DESC, plays DESC, created_at DESC)
  WHERE privacy = 'public';

-- Index for genre filtering
CREATE INDEX IF NOT EXISTS tracks_genre_idx
  ON public.tracks(genre)
  WHERE genre IS NOT NULL AND privacy = 'public';

-- Index for BPM range queries
CREATE INDEX IF NOT EXISTS tracks_bpm_idx
  ON public.tracks(bpm)
  WHERE bpm IS NOT NULL AND privacy = 'public';

-- GIN indexes for tag array searches
CREATE INDEX IF NOT EXISTS tracks_tags_idx
  ON public.tracks USING gin(tags);

CREATE INDEX IF NOT EXISTS tracks_ai_tags_idx
  ON public.tracks USING gin(ai_tags);

-- Update existing RLS policy to allow public track viewing without share_token
-- Drop the old restrictive policy first
DROP POLICY IF EXISTS "Anyone can view public or unlisted tracks by token" ON public.tracks;

-- Create new policy that allows viewing all public tracks (no token required)
CREATE POLICY "Anyone can view public tracks"
  ON public.tracks FOR SELECT
  USING (
    privacy = 'public'
    OR (
      privacy = 'unlisted'
      AND share_token IS NOT NULL
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = tracks.project_id
        AND projects.user_id = auth.uid()
      )
    )
  );

-- Create system user and project for preset tracks (if not exists)
-- This runs as a DO block to handle the conditional logic
DO $$
DECLARE
  system_user_id uuid;
  system_project_id uuid;
BEGIN
  -- Check if system project exists
  SELECT id INTO system_project_id
  FROM public.projects
  WHERE name = 'LoField Presets'
  LIMIT 1;

  -- If no system project, we'll create tracks without a project
  -- The application will handle this via the API
  IF system_project_id IS NULL THEN
    RAISE NOTICE 'System project does not exist. Preset tracks will be seeded via API.';
  END IF;
END $$;
