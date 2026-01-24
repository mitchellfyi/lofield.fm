-- Create recordings table for storing recorded performance automation
create table public.recordings (
  id uuid default gen_random_uuid() primary key,
  track_id uuid references public.tracks on delete cascade not null,
  name varchar(255),
  duration_ms integer not null,
  events jsonb not null default '[]',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.recordings enable row level security;

-- Recordings policies: users can CRUD recordings for tracks in their own projects
create policy "Users can view recordings for own tracks"
  on public.recordings for select
  using (
    exists (
      select 1 from public.tracks
      join public.projects on projects.id = tracks.project_id
      where tracks.id = recordings.track_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert recordings for own tracks"
  on public.recordings for insert
  with check (
    exists (
      select 1 from public.tracks
      join public.projects on projects.id = tracks.project_id
      where tracks.id = recordings.track_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update recordings for own tracks"
  on public.recordings for update
  using (
    exists (
      select 1 from public.tracks
      join public.projects on projects.id = tracks.project_id
      where tracks.id = recordings.track_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete recordings for own tracks"
  on public.recordings for delete
  using (
    exists (
      select 1 from public.tracks
      join public.projects on projects.id = tracks.project_id
      where tracks.id = recordings.track_id
      and projects.user_id = auth.uid()
    )
  );

-- Create index for faster lookups by track
create index recordings_track_id_idx on public.recordings(track_id);

-- Create updated_at trigger
create trigger on_recording_updated
  before update on public.recordings
  for each row execute procedure public.handle_updated_at();
