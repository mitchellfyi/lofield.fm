-- Allow system tracks to have null user_id
-- This is needed for preset/demo tracks that don't belong to any user

-- First, drop the NOT NULL constraint on user_id for tracks
ALTER TABLE public.tracks
  ALTER COLUMN user_id DROP NOT NULL;

-- Add a constraint that requires user_id for non-system tracks
ALTER TABLE public.tracks
  ADD CONSTRAINT tracks_user_id_required_for_non_system
  CHECK (is_system = true OR user_id IS NOT NULL);

-- Update RLS policies to handle system tracks (no owner)
-- System tracks with is_system=true should be viewable by everyone

DROP POLICY IF EXISTS "Users can view their own tracks" ON public.tracks;

CREATE POLICY "Users can view their own tracks or system tracks"
  ON public.tracks FOR SELECT
  USING (
    -- System tracks are viewable by everyone
    is_system = true
    OR
    -- User's own tracks
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tracks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Function to create system tracks (used by seed script)
CREATE OR REPLACE FUNCTION create_system_track(
  p_name text,
  p_current_code text,
  p_bpm integer DEFAULT NULL,
  p_genre text DEFAULT NULL,
  p_tags text[] DEFAULT '{}'::text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_track_id uuid;
BEGIN
  INSERT INTO public.tracks (
    name,
    current_code,
    bpm,
    genre,
    tags,
    ai_tags,
    plays,
    privacy,
    is_system,
    is_featured,
    user_id,
    project_id
  ) VALUES (
    p_name,
    p_current_code,
    p_bpm,
    p_genre,
    p_tags,
    '{}',
    0,
    'public',
    true,
    true,
    NULL, -- No user for system tracks
    NULL  -- No project for system tracks
  )
  RETURNING id INTO new_track_id;

  RETURN new_track_id;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION create_system_track TO service_role;
