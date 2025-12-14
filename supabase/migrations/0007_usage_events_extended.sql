-- Extend usage_events table to match full Spec 8A requirements
-- This migration adds additional columns for comprehensive usage tracking

-- Add new attribution column
alter table public.usage_events add column if not exists chat_message_id uuid null references public.chat_messages(id) on delete set null;

-- Rename created_at to occurred_at for consistency with spec
alter table public.usage_events rename column created_at to occurred_at;

-- Add provider detail columns
alter table public.usage_events add column if not exists provider_operation text null;
alter table public.usage_events add column if not exists provider_request_id text null;

-- Relax action_type check constraint to allow more action types as per spec
alter table public.usage_events drop constraint if exists usage_events_action_type_check;
alter table public.usage_events add constraint usage_events_action_type_check 
  check (action_type in ('refine_prompt', 'generate_track', 'regenerate_track', 'fetch_eleven_subscription', 'fetch_eleven_usage', 'refine', 'generate', 'regenerate'));

-- Make action_group_id not null as per spec
update public.usage_events set action_group_id = gen_random_uuid() where action_group_id is null;
alter table public.usage_events alter column action_group_id set not null;

-- Relax model constraint (can be null for some operations like fetch_eleven_subscription)
alter table public.usage_events alter column model drop not null;

-- Add ElevenLabs-specific metrics
alter table public.usage_events add column if not exists credits_used numeric(12,3) null;
alter table public.usage_events add column if not exists credits_balance numeric(12,3) null;
alter table public.usage_events add column if not exists credits_limit numeric(12,3) null;
alter table public.usage_events add column if not exists audio_seconds numeric(12,3) null;
alter table public.usage_events add column if not exists audio_bytes bigint null;

-- Add cost tracking columns
alter table public.usage_events add column if not exists cost_usd numeric(12,6) null;
alter table public.usage_events add column if not exists cost_notes text null;

-- Add outcome columns
alter table public.usage_events add column if not exists status text not null default 'ok' check (status in ('ok', 'error'));
alter table public.usage_events add column if not exists http_status int null;
alter table public.usage_events add column if not exists error_code text null;
alter table public.usage_events add column if not exists error_message text null;

-- Rename duration_ms to latency_ms for consistency
alter table public.usage_events rename column duration_ms to latency_ms;

-- Rename error to raw for metadata storage
alter table public.usage_events rename column error to raw;

-- Drop old index
drop index if exists public.usage_events_user_id_created_at_idx;

-- Create new indexes as per spec
create index if not exists usage_events_user_id_occurred_at_idx 
  on public.usage_events(user_id, occurred_at desc);

create index if not exists usage_events_user_id_provider_occurred_at_idx 
  on public.usage_events(user_id, provider, occurred_at desc);

create index if not exists usage_events_user_id_chat_id_occurred_at_idx 
  on public.usage_events(user_id, chat_id, occurred_at desc)
  where chat_id is not null;

create index if not exists usage_events_user_id_track_id_occurred_at_idx 
  on public.usage_events(user_id, track_id, occurred_at desc)
  where track_id is not null;

create index if not exists usage_events_user_id_model_occurred_at_idx 
  on public.usage_events(user_id, model, occurred_at desc)
  where model is not null;

create index if not exists usage_events_user_id_action_group_id_idx 
  on public.usage_events(user_id, action_group_id);

-- Update existing action_group_id index
drop index if exists public.usage_events_action_group_id_idx;

-- Add insert policy for RLS (server-side inserts via service role)
create policy "Users can insert their usage events" on public.usage_events
  for insert with check (auth.uid() = user_id);
