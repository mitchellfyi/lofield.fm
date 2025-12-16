-- ============================================================
-- Spec 13A: Public Track Library
-- ============================================================
-- This migration adds visibility controls and public browsing
-- capabilities to the tracks table.
--
-- Changes:
-- 1. Add visibility enum column (public, unlisted, private)
-- 2. Add published_at timestamp
-- 3. Add artist_name snapshot from profiles
-- 4. Add search_tsv for full-text search (Spec 13B)
-- 5. Add metadata normalization columns (bpm, genre, moods)
-- 6. Add indexes for efficient querying
-- 7. Update RLS policies for public access
-- 8. Update Storage policies for public playback
-- ============================================================

-- Add new columns to tracks table
alter table public.tracks
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'unlisted', 'private')),
  add column if not exists published_at timestamptz null,
  add column if not exists artist_name text null,
  add column if not exists bpm int null,
  add column if not exists genre text null,
  add column if not exists mood_energy int null
    check (mood_energy is null or (mood_energy >= 0 and mood_energy <= 100)),
  add column if not exists mood_focus int null
    check (mood_focus is null or (mood_focus >= 0 and mood_focus <= 100)),
  add column if not exists mood_chill int null
    check (mood_chill is null or (mood_chill >= 0 and mood_chill <= 100));

-- Add full-text search column (generated)
-- Combines title, description, artist_name, and genre for search
alter table public.tracks
  add column if not exists search_tsv tsvector
    generated always as (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(artist_name, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(genre, '')), 'D')
    ) stored;

-- Create indexes for efficient querying
-- GIN index for full-text search
create index if not exists idx_tracks_search_tsv
  on public.tracks using gin(search_tsv);

-- Index for public library queries (visibility + published_at)
create index if not exists idx_tracks_visibility_published
  on public.tracks(visibility, published_at desc nulls last);

-- Index for artist browsing
create index if not exists idx_tracks_artist_name
  on public.tracks(artist_name);

-- Index for BPM range queries
create index if not exists idx_tracks_bpm
  on public.tracks(bpm);

-- Index for genre filtering
create index if not exists idx_tracks_genre
  on public.tracks(genre);

-- GIN index on metadata JSONB for flexible filtering
create index if not exists idx_tracks_metadata
  on public.tracks using gin(metadata jsonb_path_ops);

-- ============================================================
-- RLS Policy Updates for Tracks
-- ============================================================

-- Drop existing tracks policies
drop policy if exists "Users can view their tracks" on public.tracks;
drop policy if exists "Users can insert their tracks" on public.tracks;
drop policy if exists "Users can update their tracks" on public.tracks;
drop policy if exists "Users can delete their tracks" on public.tracks;

-- SELECT: Allow anyone (including anon) to read public/unlisted tracks
create policy "Anyone can view public and unlisted tracks" on public.tracks
  for select using (
    visibility in ('public', 'unlisted')
  );

-- SELECT: Allow owners to read all their tracks regardless of visibility
create policy "Users can view all their own tracks" on public.tracks
  for select using (
    auth.uid() = user_id
  );

-- INSERT: Only authed user can insert their own tracks
-- Default visibility='public' applies from column default
create policy "Users can insert their own tracks" on public.tracks
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chats
      where chats.id = tracks.chat_id
      and chats.user_id = auth.uid()
    )
  );

-- UPDATE: Only owner can update their tracks
-- Prevent changing user_id, chat_id, storage_path
create policy "Users can update their own tracks" on public.tracks
  for update using (
    auth.uid() = user_id
  )
  with check (
    auth.uid() = user_id
    and user_id = (select user_id from public.tracks where id = tracks.id)
    and chat_id = (select chat_id from public.tracks where id = tracks.id)
    and (storage_path = (select storage_path from public.tracks where id = tracks.id)
         or storage_path is null)
  );

-- DELETE: Only owner can delete their tracks
create policy "Users can delete their own tracks" on public.tracks
  for delete using (
    auth.uid() = user_id
    and exists (
      select 1 from public.chats
      where chats.id = tracks.chat_id
      and chats.user_id = auth.uid()
    )
  );

-- ============================================================
-- Storage Policy Updates
-- ============================================================

-- Drop existing storage policies for tracks bucket
drop policy if exists "Users can read their own tracks" on storage.objects;
drop policy if exists "Users can upload their own tracks" on storage.objects;
drop policy if exists "Users can update their own tracks" on storage.objects;
drop policy if exists "Users can delete their own tracks" on storage.objects;

-- SELECT: Allow owner to read their own tracks
create policy "Users can read their own tracks" on storage.objects
  for select using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: Allow anyone (including anon) to read public/unlisted track files
create policy "Anyone can read public track files" on storage.objects
  for select using (
    bucket_id = 'tracks'
    and exists (
      select 1 from public.tracks
      where tracks.storage_path = storage.objects.name
      and tracks.visibility in ('public', 'unlisted')
    )
  );

-- INSERT: Allow authed users to upload their own tracks
create policy "Users can upload their own tracks" on storage.objects
  for insert with check (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Allow authed users to update their own tracks
create policy "Users can update their own tracks" on storage.objects
  for update using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Allow authed users to delete their own tracks
create policy "Users can delete their own tracks" on storage.objects
  for delete using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Migration Helpers
-- ============================================================

-- Set published_at for existing public tracks
update public.tracks
set published_at = created_at
where visibility = 'public'
  and published_at is null;

-- Backfill artist_name from profiles for existing tracks
update public.tracks t
set artist_name = p.artist_name
from public.profiles p
where t.user_id = p.id
  and t.artist_name is null
  and p.artist_name is not null;

-- Backfill metadata normalization columns from metadata JSONB
-- BPM
update public.tracks
set bpm = (metadata->>'bpm')::int
where metadata ? 'bpm'
  and bpm is null
  and (metadata->>'bpm') ~ '^\d+$';

-- Genre
update public.tracks
set genre = metadata->>'genre'
where metadata ? 'genre'
  and genre is null;

-- Mood energy
update public.tracks
set mood_energy = (metadata->'mood'->>'energy')::int
where metadata->'mood' ? 'energy'
  and mood_energy is null
  and (metadata->'mood'->>'energy') ~ '^\d+$';

-- Mood focus
update public.tracks
set mood_focus = (metadata->'mood'->>'focus')::int
where metadata->'mood' ? 'focus'
  and mood_focus is null
  and (metadata->'mood'->>'focus') ~ '^\d+$';

-- Mood chill
update public.tracks
set mood_chill = (metadata->'mood'->>'chill')::int
where metadata->'mood' ? 'chill'
  and mood_chill is null
  and (metadata->'mood'->>'chill') ~ '^\d+$';
