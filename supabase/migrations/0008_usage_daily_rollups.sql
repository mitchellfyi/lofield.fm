-- Create usage_daily_rollups table for fast usage charts
-- This table stores pre-aggregated daily usage metrics from providers
create table if not exists public.usage_daily_rollups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  provider text not null check (provider in ('openai', 'elevenlabs')),
  metric jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, date, provider)
);

-- Enable RLS
alter table public.usage_daily_rollups enable row level security;

-- RLS policies: users can only view their own rollups
create policy "Users can view their daily rollups" on public.usage_daily_rollups
  for select using (auth.uid() = user_id);

-- No insert/update policy: only service role can manage rollups
-- This ensures rollups are created only by trusted server code

-- Create indexes for efficient queries
create index if not exists usage_daily_rollups_user_id_date_idx 
  on public.usage_daily_rollups(user_id, date desc);

create index if not exists usage_daily_rollups_user_id_provider_date_idx
  on public.usage_daily_rollups(user_id, provider, date desc);

-- Trigger to update updated_at timestamp
create trigger usage_daily_rollups_updated_at
  before update on public.usage_daily_rollups
  for each row execute function public.update_updated_at_column();
