-- Create usage_events table for tracking API usage
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  
  -- Attribution
  chat_id uuid null references public.chats(id) on delete set null,
  chat_message_id uuid null references public.chat_messages(id) on delete set null,
  track_id uuid null references public.tracks(id) on delete set null,
  action_group_id uuid not null,
  action_type text not null,
  
  -- Provider
  provider text not null check (provider in ('openai', 'elevenlabs')),
  provider_operation text not null,
  provider_request_id text null,
  model text null,
  
  -- OpenAI metrics
  input_tokens int null,
  output_tokens int null,
  total_tokens int null,
  
  -- ElevenLabs metrics
  credits_used numeric(12,3) null,
  credits_balance numeric(12,3) null,
  credits_limit numeric(12,3) null,
  audio_seconds numeric(12,3) null,
  audio_bytes bigint null,
  
  -- Cost
  cost_usd numeric(12,6) null,
  cost_notes text null,
  
  -- Outcome
  status text not null check (status in ('ok', 'error')),
  http_status int null,
  error_code text null,
  error_message text null,
  latency_ms int null,
  raw jsonb null,
  
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.usage_events enable row level security;

-- RLS policies: users can select/insert only their own usage events
create policy "Users can view their usage events" on public.usage_events
  for select using (auth.uid() = user_id);

-- Removed insert policy: only service role can insert into usage_events
-- Server-side insert will use service role which bypasses RLS
-- But RLS policies ensure client-side access is still protected

-- Create indexes for efficient queries
create index if not exists usage_events_user_id_occurred_at_idx 
  on public.usage_events(user_id, occurred_at desc);

create index if not exists usage_events_user_id_provider_occurred_at_idx
  on public.usage_events(user_id, provider, occurred_at desc);

create index if not exists usage_events_user_id_chat_id_occurred_at_idx
  on public.usage_events(user_id, chat_id, occurred_at desc);

create index if not exists usage_events_user_id_track_id_occurred_at_idx
  on public.usage_events(user_id, track_id, occurred_at desc);

create index if not exists usage_events_user_id_model_occurred_at_idx
  on public.usage_events(user_id, model, occurred_at desc);

create index if not exists usage_events_user_id_action_group_id_idx
  on public.usage_events(user_id, action_group_id);
