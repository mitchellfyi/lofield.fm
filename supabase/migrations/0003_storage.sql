-- Create private bucket for tracks
insert into storage.buckets (id, name, public)
values ('tracks', 'tracks', false)
on conflict (id) do nothing;

-- Storage policies for tracks bucket
-- Object key format: tracks/{user_id}/{chat_id}/{track_id}.mp3
-- Note: The bucket name is part of the path, so we check from the first segment

-- Allow read only if object name starts with tracks/{auth.uid()}/
create policy "Users can read their own tracks" on storage.objects
  for select using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow insert only if object name starts with tracks/{auth.uid()}/
create policy "Users can upload their own tracks" on storage.objects
  for insert with check (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow update only if object name starts with tracks/{auth.uid()}/
create policy "Users can update their own tracks" on storage.objects
  for update using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow delete only if object name starts with tracks/{auth.uid()}/
create policy "Users can delete their own tracks" on storage.objects
  for delete using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
