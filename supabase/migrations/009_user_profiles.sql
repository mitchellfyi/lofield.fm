-- Add username and bio columns to profiles table for public profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username varchar(30) UNIQUE,
  ADD COLUMN IF NOT EXISTS bio text;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx
  ON public.profiles(username)
  WHERE username IS NOT NULL;

-- Add policy for public profile viewing (anyone can see profiles with username)
CREATE POLICY "Anyone can view public profiles"
  ON public.profiles FOR SELECT
  USING (username IS NOT NULL);

-- Reserved usernames that cannot be used
-- This is enforced at the application level, but documented here
-- admin, api, app, auth, explore, settings, studio, user, users, help, support, about, contact

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_profile_updated') THEN
    CREATE TRIGGER on_profile_updated
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
  END IF;
END $$;
