-- Create privacy level enum type
create type public.privacy_level as enum ('private', 'unlisted', 'public');

-- Add sharing columns to tracks table
alter table public.tracks
  add column share_token varchar(12) unique,
  add column privacy public.privacy_level default 'private' not null,
  add column shared_at timestamp with time zone;

-- Create index for share_token lookups
create index tracks_share_token_idx on public.tracks(share_token) where share_token is not null;

-- Add RLS policy for public/unlisted track access (no auth required)
-- This allows anyone to view tracks that are public or unlisted
create policy "Anyone can view public or unlisted tracks by token"
  on public.tracks for select
  using (
    privacy in ('public', 'unlisted')
    and share_token is not null
  );
