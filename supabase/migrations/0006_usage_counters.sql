-- Create usage_counters table for rate limiting
create table if not exists public.usage_counters (
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  refine_count int not null default 0,
  generate_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, date)
);

-- Enable RLS
alter table public.usage_counters enable row level security;

-- RLS policies: users can only view their own usage counters
create policy "Users can view their usage counters" on public.usage_counters
  for select using (auth.uid() = user_id);

-- Server-side insert/update only (no user insert/update policy needed - service role will manage)
-- This ensures usage counters are created only by trusted server code

-- Create index for efficient queries by user and date
create index if not exists usage_counters_user_id_date_idx 
  on public.usage_counters(user_id, date desc);

-- Trigger to update updated_at timestamp
create trigger usage_counters_updated_at
  before update on public.usage_counters
  for each row execute function public.update_updated_at_column();
