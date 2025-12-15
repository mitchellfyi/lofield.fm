-- Create provider_pricing table for deterministic cost computation
create table if not exists public.provider_pricing (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('openai', 'elevenlabs')),
  model text not null,
  unit text not null,
  price_input_per_1k numeric(12,6) null,
  price_output_per_1k numeric(12,6) null,
  price_per_unit numeric(12,6) null,
  currency text not null default 'usd',
  effective_from date not null,
  effective_to date null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.provider_pricing enable row level security;

-- RLS policies: all authenticated users can view pricing data (read-only)
create policy "Users can view provider pricing" on public.provider_pricing
  for select using (auth.uid() is not null);

-- No insert/update/delete policies - pricing is managed by admins only via service role

-- Create index for efficient pricing lookups
create index if not exists provider_pricing_lookup_idx
  on public.provider_pricing(provider, model, effective_from desc);

-- Insert initial pricing data for OpenAI models (as of Dec 2024)
insert into public.provider_pricing (provider, model, unit, price_input_per_1k, price_output_per_1k, currency, effective_from) values
  ('openai', 'gpt-4o-mini', 'tokens', 0.000150, 0.000600, 'usd', '2024-07-18'),
  ('openai', 'gpt-4o', 'tokens', 0.002500, 0.010000, 'usd', '2024-05-13'),
  ('openai', 'gpt-4-turbo', 'tokens', 0.010000, 0.030000, 'usd', '2024-04-09'),
  ('openai', 'gpt-3.5-turbo', 'tokens', 0.000500, 0.001500, 'usd', '2023-11-06');

-- Note: ElevenLabs pricing is credit-based and varies by subscription tier
-- We'll track credits_used from API responses rather than computing from a price table
