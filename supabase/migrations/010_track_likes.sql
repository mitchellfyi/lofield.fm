-- Create track_likes table for user favorites
CREATE TABLE IF NOT EXISTS public.track_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  track_id uuid REFERENCES public.tracks ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, track_id)
);

-- Enable Row Level Security
ALTER TABLE public.track_likes ENABLE ROW LEVEL SECURITY;

-- Users can view their own likes
CREATE POLICY "Users can view own likes"
  ON public.track_likes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own likes
CREATE POLICY "Users can insert own likes"
  ON public.track_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes"
  ON public.track_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS track_likes_user_id_idx ON public.track_likes(user_id);
CREATE INDEX IF NOT EXISTS track_likes_track_id_idx ON public.track_likes(track_id);
CREATE INDEX IF NOT EXISTS track_likes_created_at_idx ON public.track_likes(created_at DESC);

-- Add like_count column to tracks table for quick access (denormalized for performance)
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0;

-- Create index for like_count ordering
CREATE INDEX IF NOT EXISTS tracks_like_count_idx
  ON public.tracks(like_count DESC)
  WHERE privacy = 'public';

-- Function to update like_count on tracks table
CREATE OR REPLACE FUNCTION public.update_track_like_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tracks SET like_count = like_count + 1 WHERE id = NEW.track_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tracks SET like_count = like_count - 1 WHERE id = OLD.track_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update like_count
DROP TRIGGER IF EXISTS on_track_like_changed ON public.track_likes;
CREATE TRIGGER on_track_like_changed
  AFTER INSERT OR DELETE ON public.track_likes
  FOR EACH ROW EXECUTE PROCEDURE public.update_track_like_count();
