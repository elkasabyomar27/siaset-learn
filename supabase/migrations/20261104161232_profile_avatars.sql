-- Account avatar files only. Learning tables and evidence writes remain unchanged.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', false, 262144, array['image/webp']);

create policy "profile_avatar_owner_read" on storage.objects
for select to authenticated
using (bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false');

create policy "profile_avatar_owner_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.webp$'
  and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false');

create policy "profile_avatar_owner_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false');
