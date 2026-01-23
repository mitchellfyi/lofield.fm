-- Create api_keys table for storing encrypted user API keys
create table public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  encrypted_key text not null,
  key_last_4 varchar(4) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.api_keys enable row level security;

-- Create policy for users to view their own API key metadata
create policy "Users can view own API key"
  on public.api_keys for select
  using (auth.uid() = user_id);

-- Create policy for users to insert their own API key
create policy "Users can insert own API key"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

-- Create policy for users to update their own API key
create policy "Users can update own API key"
  on public.api_keys for update
  using (auth.uid() = user_id);

-- Create policy for users to delete their own API key
create policy "Users can delete own API key"
  on public.api_keys for delete
  using (auth.uid() = user_id);

-- Create trigger to automatically update the updated_at timestamp
create trigger on_api_key_updated
  before update on public.api_keys
  for each row execute procedure public.handle_updated_at();

-- Add index for faster lookups by user_id (already has unique constraint, but explicit index for clarity)
create index api_keys_user_id_idx on public.api_keys(user_id);
