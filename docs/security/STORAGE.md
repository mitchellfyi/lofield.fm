# Storage Policies

**Purpose**: File upload and access controls for Supabase Storage  
**Audience**: Developers  
**Last updated**: 2025-12-15

## Overview

Lofield Studio stores generated audio files in Supabase Storage. The `tracks` bucket is **private** with RLS-style policies that enforce user isolation.

## Storage Architecture

### Bucket Structure

```
tracks (bucket)
  └── {user_id}/
      ├── {track_id_1}.mp3
      ├── {track_id_2}.mp3
      └── ...
```

**Path format**: `tracks/{user_id}/{track_id}.mp3`

### Bucket Configuration

- **Name**: `tracks`
- **Public**: `false` (private bucket)
- **File size limit**: None (respects Supabase project limits)
- **Allowed MIME types**: Any (primarily `audio/mpeg`, `audio/mp3`)

## Storage Policies

Storage policies work similarly to RLS but control file access instead of row access.

### Policy Definitions

Defined in `/supabase/migrations/0003_storage.sql`:

```sql
-- Allow users to upload to their own folder
create policy "Users can upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to read from their own folder
create policy "Users can read their own files"
  on storage.objects for select
  using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own files
create policy "Users can delete their own files"
  on storage.objects for delete
  using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Policy Logic

**Key function**: `storage.foldername(name)` splits the path and returns an array.

Example:
- Path: `tracks/a1b2c3/track-123.mp3`
- `storage.foldername(name)` returns `{a1b2c3}`
- `(storage.foldername(name))[1]` returns `a1b2c3`
- Policy checks: `a1b2c3 = auth.uid()::text`

## Uploading Files

### Server-Side Upload (Admin Client)

Use the admin client to bypass RLS during initial upload (preferred for server actions):

```typescript
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function uploadTrack(userId: string, trackId: string, audioBuffer: Buffer) {
  const filePath = `${userId}/${trackId}.mp3`;

  const { data, error } = await supabaseAdmin.storage
    .from('tracks')
    .upload(filePath, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    throw new Error(`Failed to upload track: ${error.message}`);
  }

  return data;
}
```

**Why admin client?**
- Server actions may not have access to user's auth token
- Admin client ensures upload succeeds regardless of policy timing

### Client-Side Upload (User Client)

If uploading from the browser (future feature):

```typescript
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export async function uploadTrackFromBrowser(file: File, userId: string, trackId: string) {
  const supabase = createBrowserSupabaseClient();
  const filePath = `${userId}/${trackId}.mp3`;

  const { data, error } = await supabase.storage
    .from('tracks')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Failed to upload: ${error.message}`);
  }

  return data;
}
```

**Note**: User must be authenticated and the path must match their `user_id`.

## Accessing Files

### Signed URLs (Recommended)

Generate time-limited signed URLs for playback:

```typescript
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export async function getTrackUrl(userId: string, trackId: string) {
  const supabase = createBrowserSupabaseClient();
  const filePath = `${userId}/${trackId}.mp3`;

  const { data, error } = await supabase.storage
    .from('tracks')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
```

**Signed URL benefits**:
- Works with private buckets
- Expires automatically (security)
- Doesn't require ongoing authentication

### Public URLs (Not Used)

We **do not** use public URLs because:
- Bucket is private
- Users shouldn't be able to guess others' file paths
- Signed URLs provide better control

## Deleting Files

### Server-Side Deletion

```typescript
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function deleteTrack(userId: string, trackId: string) {
  const filePath = `${userId}/${trackId}.mp3`;

  const { error } = await supabaseAdmin.storage
    .from('tracks')
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete track: ${error.message}`);
  }
}
```

### Client-Side Deletion

```typescript
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export async function deleteTrackFromBrowser(userId: string, trackId: string) {
  const supabase = createBrowserSupabaseClient();
  const filePath = `${userId}/${trackId}.mp3`;

  const { error } = await supabase.storage
    .from('tracks')
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete: ${error.message}`);
  }
}
```

**Note**: User must own the file (path starts with their `user_id`).

## Common Issues

### Upload Fails with 403

**Cause**: Path doesn't match user's `user_id`.

**Fix**:
```typescript
// WRONG
const filePath = `someone-else/${trackId}.mp3`;

// RIGHT
const filePath = `${session.user.id}/${trackId}.mp3`;
```

### Signed URL Returns 404

**Possible causes**:
1. File doesn't exist
2. Path is incorrect
3. User doesn't own the file

**Debug steps**:
1. Verify file exists in Supabase Dashboard → Storage → tracks
2. Check path format: `{user_id}/{track_id}.mp3`
3. Ensure user is authenticated

### Can't Access File from Browser

**Cause**: Bucket is private; direct URLs don't work.

**Fix**: Use signed URLs (see "Accessing Files" above).

## Security Best Practices

### ✅ Do

- **Use path prefix `{user_id}/`** to enforce user isolation
- **Generate signed URLs** for file access
- **Set reasonable expiry** on signed URLs (1-24 hours)
- **Verify ownership** before generating signed URLs

### ⚠️ Caution

- **File size limits**: Supabase has project-level limits; monitor usage
- **Naming collisions**: Use unique IDs (UUIDs) for file names

### 🚫 Never

- **Make bucket public** (breaks user isolation)
- **Use predictable file names** (e.g., `track-1.mp3`, `track-2.mp3`)
- **Share signed URLs publicly** (they're time-limited but still sensitive)

## Cleanup Considerations

### Orphaned Files

If a track record is deleted but the file remains:
- Files accumulate in storage
- Storage costs increase

**Future enhancement**: Add cleanup job to delete orphaned files.

### User Deletion

If a user deletes their account:
- Delete all files in `{user_id}/` folder
- Delete all database records (cascaded via foreign keys)

**Not yet implemented**: Account deletion flow.

## Related Documentation

- [Back to Index](../INDEX.md)
- [Row Level Security (RLS)](./RLS.md)
- [Secrets Management](./SECRETS.md)
- [Supabase Setup](../setup/SUPABASE.md)
