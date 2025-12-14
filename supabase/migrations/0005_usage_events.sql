-- Create usage_events table for tracking API usage
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  chat_id uuid null references public.chats(id) on delete set null,
  track_id uuid null references public.tracks(id) on delete set null,
  action_type text not null check (action_type in ('refine', 'generate', 'regenerate')),
  action_group_id uuid null, -- correlate refine + generate sequences
  provider text not null check (provider in ('openai', 'elevenlabs')),
  model text not null,
  input_tokens int null,
  output_tokens int null,
  total_tokens int null,
  duration_ms int null,
  error jsonb null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.usage_events enable row level security;

-- RLS policies: users can only view their own usage events
create policy "Users can view their usage events" on public.usage_events
  for select using (auth.uid() = user_id);

-- Server-side insert only (no user insert policy needed - service role will insert)
-- This ensures usage events are created only by trusted server code

-- Create index for efficient queries by user and date
create index if not exists usage_events_user_id_created_at_idx 
  on public.usage_events(user_id, created_at desc);

-- Create index for action_group_id lookups
create index if not exists usage_events_action_group_id_idx 
  on public.usage_events(action_group_id) 
  where action_group_id is not null;
