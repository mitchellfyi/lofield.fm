-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgsodium";
create extension if not exists "vault";

-- Profile for each authenticated user
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  artist_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Secrets are stored via Vault (ids only) but optionally cached for local dev
create table if not exists public.user_secrets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  openai_secret_id uuid,
  elevenlabs_secret_id uuid,
  openai_api_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  openai_model text,
  eleven_music_defaults jsonb,
  prompt_defaults jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.chats (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references public.chats(id) on delete cascade,
  role text not null,
  content text not null,
  draft_spec jsonb,
  created_at timestamptz default now()
);

create table if not exists public.tracks (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references public.chats(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  description text,
  final_prompt text,
  metadata jsonb,
  length_ms integer,
  instrumental boolean,
  status text default 'draft',
  error jsonb,
  storage_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Storage bucket for generated tracks
insert into storage.buckets (id, name, public)
values ('tracks', 'tracks', false)
on conflict (id) do nothing;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_secrets enable row level security;
alter table public.user_settings enable row level security;
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.tracks enable row level security;

-- Profiles policies
create policy "Users can view their profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can create their profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update their profile" on public.profiles
  for update using (auth.uid() = id);

-- Secrets policies (ids only visible to owner)
create policy "Users can view their secrets" on public.user_secrets
  for select using (auth.uid() = user_id);
create policy "Users manage their secrets" on public.user_secrets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Settings policies
create policy "Users can view their settings" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "Users manage their settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Chats policies
create policy "Users can view their chats" on public.chats
  for select using (auth.uid() = user_id);
create policy "Users manage their chats" on public.chats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Messages policies (match chat ownership)
create policy "Users can view their chat messages" on public.chat_messages
  for select using (
    auth.uid() = (
      select user_id from public.chats where chats.id = chat_id
    )
  );
create policy "Users can insert their chat messages" on public.chat_messages
  for insert with check (
    auth.uid() = (
      select user_id from public.chats where chats.id = chat_id
    )
  );

-- Tracks policies (match chat ownership)
create policy "Users can view their tracks" on public.tracks
  for select using (auth.uid() = user_id);
create policy "Users manage their tracks" on public.tracks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage policies (bucket: tracks)
create policy "Users can upload their own tracks" on storage.objects
  for insert with check (
    bucket_id = 'tracks' and split_part(name, '/', 1)::uuid = auth.uid()
  );
create policy "Users can access their own tracks" on storage.objects
  for select using (
    bucket_id = 'tracks' and split_part(name, '/', 1)::uuid = auth.uid()
  );
create policy "Users can delete their own tracks" on storage.objects
  for delete using (
    bucket_id = 'tracks' and split_part(name, '/', 1)::uuid = auth.uid()
  );

-- Vault helpers
create or replace function public.create_secret(secret_value text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select vault.create_secret(secret_value);
$$;

create or replace function public.decrypt_secret(secret_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select vault.decrypt_secret(secret_id);
$$;
