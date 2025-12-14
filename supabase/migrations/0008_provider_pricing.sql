-- Create provider_pricing table for deterministic cost calculation
-- Used to compute cost_usd without scraping vendor pages at runtime

create table if not exists public.provider_pricing (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('openai', 'elevenlabs')),
  model text not null,
  unit text not null check (unit in ('tokens', 'credits', 'seconds')),
  price_input_per_1k numeric(12,6) null, -- OpenAI input tokens per 1k
  price_output_per_1k numeric(12,6) null, -- OpenAI output tokens per 1k
  price_per_unit numeric(12,6) null, -- Fallback for ElevenLabs or simple pricing
  currency text not null default 'usd',
  effective_from date not null,
  effective_to date null,
  created_at timestamptz default now()
);

-- Create index for efficient pricing lookups by provider, model, and date
create index if not exists provider_pricing_lookup_idx 
  on public.provider_pricing(provider, model, effective_from, effective_to);

-- Enable RLS
alter table public.provider_pricing enable row level security;

-- RLS policies: all authenticated users can read pricing data
create policy "Authenticated users can view pricing" on public.provider_pricing
  for select using (auth.role() = 'authenticated');

-- Only service role can insert/update pricing (admin operation)
-- No user insert/update policies needed

-- Insert initial pricing data for OpenAI gpt-4o-mini (as of Dec 2024)
insert into public.provider_pricing (provider, model, unit, price_input_per_1k, price_output_per_1k, effective_from)
values 
  ('openai', 'gpt-4o-mini', 'tokens', 0.000150, 0.000600, '2024-07-18'),
  ('openai', 'gpt-4o-mini-2024-07-18', 'tokens', 0.000150, 0.000600, '2024-07-18');

-- Insert pricing data for gpt-4o (if needed)
insert into public.provider_pricing (provider, model, unit, price_input_per_1k, price_output_per_1k, effective_from)
values 
  ('openai', 'gpt-4o', 'tokens', 0.00250, 0.01000, '2024-08-06'),
  ('openai', 'gpt-4o-2024-08-06', 'tokens', 0.00250, 0.01000, '2024-08-06');

-- ElevenLabs pricing is credit-based and varies by plan
-- We'll record API calls but leave cost calculation for later implementation
-- when we have access to user's plan information
