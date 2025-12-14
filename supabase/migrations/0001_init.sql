-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgsodium";
create extension if not exists "vault";

-- Profile for each authenticated user
create table if not exists public.profiles (
  id uuid primary key,
  artist_name text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Secrets are stored via Vault (ids only)
create table if not exists public.user_secrets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  openai_secret_id uuid null,
  elevenlabs_secret_id uuid null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  openai_model text default 'gpt-4.1-mini',
  eleven_music_defaults jsonb default '{}'::jsonb,
  prompt_defaults jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  draft_spec jsonb null,
  created_at timestamptz default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  final_prompt text not null,
  metadata jsonb not null default '{}'::jsonb,
  length_ms int not null,
  instrumental boolean not null default true,
  status text not null check (status in ('draft', 'generating', 'ready', 'failed')),
  error jsonb null,
  storage_path text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create updated_at triggers for all tables with updated_at column
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger user_secrets_updated_at
  before update on public.user_secrets
  for each row execute function public.update_updated_at_column();

create trigger user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.update_updated_at_column();

create trigger chats_updated_at
  before update on public.chats
  for each row execute function public.update_updated_at_column();

create trigger tracks_updated_at
  before update on public.tracks
  for each row execute function public.update_updated_at_column();

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
