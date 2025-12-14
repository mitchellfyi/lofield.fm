-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.user_secrets enable row level security;
alter table public.user_settings enable row level security;
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.tracks enable row level security;

-- Profiles policies: user can select/update only where id = auth.uid()
create policy "Users can view their profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update their profile" on public.profiles
  for update using (auth.uid() = id);

-- User secrets policies: only where user_id = auth.uid()
create policy "Users can view their secrets" on public.user_secrets
  for select using (auth.uid() = user_id);
create policy "Users can insert their secrets" on public.user_secrets
  for insert with check (auth.uid() = user_id);
create policy "Users can update their secrets" on public.user_secrets
  for update using (auth.uid() = user_id);
create policy "Users can delete their secrets" on public.user_secrets
  for delete using (auth.uid() = user_id);

-- User settings policies: only where user_id = auth.uid()
create policy "Users can view their settings" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "Users can insert their settings" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "Users can update their settings" on public.user_settings
  for update using (auth.uid() = user_id);
create policy "Users can delete their settings" on public.user_settings
  for delete using (auth.uid() = user_id);

-- Chats policies: only where user_id = auth.uid()
create policy "Users can view their chats" on public.chats
  for select using (auth.uid() = user_id);
create policy "Users can insert their chats" on public.chats
  for insert with check (auth.uid() = user_id);
create policy "Users can update their chats" on public.chats
  for update using (auth.uid() = user_id);
create policy "Users can delete their chats" on public.chats
  for delete using (auth.uid() = user_id);

-- Chat messages policies: only through join to chats.user_id = auth.uid()
create policy "Users can view their chat messages" on public.chat_messages
  for select using (
    exists (
      select 1 from public.chats
      where chats.id = chat_messages.chat_id
      and chats.user_id = auth.uid()
    )
  );
create policy "Users can insert their chat messages" on public.chat_messages
  for insert with check (
    exists (
      select 1 from public.chats
      where chats.id = chat_messages.chat_id
      and chats.user_id = auth.uid()
    )
  );
create policy "Users can update their chat messages" on public.chat_messages
  for update using (
    exists (
      select 1 from public.chats
      where chats.id = chat_messages.chat_id
      and chats.user_id = auth.uid()
    )
  );
create policy "Users can delete their chat messages" on public.chat_messages
  for delete using (
    exists (
      select 1 from public.chats
      where chats.id = chat_messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

-- Tracks policies: only where user_id = auth.uid() and chat_id belongs to user
create policy "Users can view their tracks" on public.tracks
  for select using (
    auth.uid() = user_id
    and exists (
      select 1 from public.chats
      where chats.id = tracks.chat_id
      and chats.user_id = auth.uid()
    )
  );
create policy "Users can insert their tracks" on public.tracks
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chats
      where chats.id = tracks.chat_id
      and chats.user_id = auth.uid()
    )
  );
create policy "Users can update their tracks" on public.tracks
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.chats
      where chats.id = tracks.chat_id
      and chats.user_id = auth.uid()
    )
  );
create policy "Users can delete their tracks" on public.tracks
  for delete using (
    auth.uid() = user_id
    and exists (
      select 1 from public.chats
      where chats.id = tracks.chat_id
      and chats.user_id = auth.uid()
    )
  );
