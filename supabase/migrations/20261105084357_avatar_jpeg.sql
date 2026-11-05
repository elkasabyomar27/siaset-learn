-- Safari cannot encode WebP from a canvas, so browsers there prepare avatars as JPEG instead.
-- Allow JPEG (.jpg) alongside WebP (.webp); size limit and owner-only rules are unchanged.
update storage.buckets set allowed_mime_types = array['image/webp','image/jpeg'] where id = 'profile-avatars';

drop policy "profile_avatar_owner_insert" on storage.objects;
create policy "profile_avatar_owner_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(webp|jpg)$'
  and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false');
