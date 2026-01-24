-- Create projects table for organizing user's tracks
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name varchar(255) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tracks table for storing individual tracks within projects
create table public.tracks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  name varchar(255) not null,
  current_code text not null default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create revisions table for version history
create table public.revisions (
  id uuid default gen_random_uuid() primary key,
  track_id uuid references public.tracks on delete cascade not null,
  code text not null,
  message varchar(500),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security on all tables
alter table public.projects enable row level security;
alter table public.tracks enable row level security;
alter table public.revisions enable row level security;

-- Projects policies: users can CRUD their own projects
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Tracks policies: users can CRUD tracks in their own projects
create policy "Users can view tracks in own projects"
  on public.tracks for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = tracks.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert tracks in own projects"
  on public.tracks for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = tracks.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update tracks in own projects"
  on public.tracks for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = tracks.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete tracks in own projects"
  on public.tracks for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = tracks.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Revisions policies: users can CRUD revisions for tracks in their own projects
create policy "Users can view revisions for own tracks"
  on public.revisions for select
  using (
    exists (
      select 1 from public.tracks
      join public.projects on projects.id = tracks.project_id
      where tracks.id = revisions.track_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert revisions for own tracks"
  on public.revisions for insert
  with check (
    exists (
      select 1 from public.tracks
      join public.projects on projects.id = tracks.project_id
      where tracks.id = revisions.track_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete revisions for own tracks"
  on public.revisions for delete
  using (
    exists (
      select 1 from public.tracks
      join public.projects on projects.id = tracks.project_id
      where tracks.id = revisions.track_id
      and projects.user_id = auth.uid()
    )
  );

-- Create indexes for faster lookups
create index projects_user_id_idx on public.projects(user_id);
create index tracks_project_id_idx on public.tracks(project_id);
create index revisions_track_id_idx on public.revisions(track_id);

-- Create updated_at triggers for projects and tracks
create trigger on_project_updated
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

create trigger on_track_updated
  before update on public.tracks
  for each row execute procedure public.handle_updated_at();
