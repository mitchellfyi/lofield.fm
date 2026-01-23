-- Create profiles table linked to auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create policy for users to view their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Create policy for users to update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create policy for users to insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create a trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a trigger to automatically update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
