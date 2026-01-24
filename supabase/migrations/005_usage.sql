-- Create user_usage table for tracking per-user token and request usage
create table public.user_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  tokens_used bigint default 0 not null,
  requests_count bigint default 0 not null,
  period_start timestamp with time zone default date_trunc('day', timezone('utc'::text, now())) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_quotas table for per-user limits
create table public.user_quotas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  daily_token_limit bigint default 100000 not null,
  requests_per_minute integer default 20 not null,
  tier varchar(50) default 'free' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create abuse_flags table for tracking violations
create table public.abuse_flags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  violation_type varchar(100) not null,
  count integer default 1 not null,
  last_flagged_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, violation_type)
);

-- Create request_log table for sliding window rate limiting
create table public.request_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security on all tables
alter table public.user_usage enable row level security;
alter table public.user_quotas enable row level security;
alter table public.abuse_flags enable row level security;
alter table public.request_log enable row level security;

-- Policies for user_usage: users can view their own usage
create policy "Users can view own usage"
  on public.user_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.user_usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on public.user_usage for update
  using (auth.uid() = user_id);

-- Policies for user_quotas: users can view their own quotas
create policy "Users can view own quotas"
  on public.user_quotas for select
  using (auth.uid() = user_id);

-- Policies for abuse_flags: users can view their own flags
create policy "Users can view own abuse flags"
  on public.abuse_flags for select
  using (auth.uid() = user_id);

-- Policies for request_log: users can only insert their own logs
create policy "Users can insert own request logs"
  on public.request_log for insert
  with check (auth.uid() = user_id);

create policy "Users can view own request logs"
  on public.request_log for select
  using (auth.uid() = user_id);

create policy "Users can delete own request logs"
  on public.request_log for delete
  using (auth.uid() = user_id);

-- Triggers for updated_at
create trigger on_user_usage_updated
  before update on public.user_usage
  for each row execute procedure public.handle_updated_at();

create trigger on_user_quotas_updated
  before update on public.user_quotas
  for each row execute procedure public.handle_updated_at();

create trigger on_abuse_flags_updated
  before update on public.abuse_flags
  for each row execute procedure public.handle_updated_at();

-- Indexes for faster queries
create index user_usage_user_id_idx on public.user_usage(user_id);
create index user_quotas_user_id_idx on public.user_quotas(user_id);
create index abuse_flags_user_id_idx on public.abuse_flags(user_id);
create index request_log_user_id_idx on public.request_log(user_id);
create index request_log_user_id_created_at_idx on public.request_log(user_id, created_at);

-- Function to clean up old request logs (older than 1 hour)
create or replace function public.cleanup_old_request_logs()
returns void as $$
begin
  delete from public.request_log
  where created_at < timezone('utc'::text, now()) - interval '1 hour';
end;
$$ language plpgsql security definer;
