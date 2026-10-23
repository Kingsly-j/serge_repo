-- Run this migration in the Supabase SQL Editor for the configured project.
-- Public reads let the site display uploaded photos; inserts let the public-key
-- client upload files. Filenames are UUID-prefixed by the application.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Public can read Anthony home photos'
  ) then
    execute 'create policy "Public can read Anthony home photos" on storage.objects for select to anon, authenticated using (bucket_id = ''photos'')';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Public can upload Anthony home photos'
  ) then
    execute 'create policy "Public can upload Anthony home photos" on storage.objects for insert to anon, authenticated with check (bucket_id = ''photos'')';
  end if;
end $$;
