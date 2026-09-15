-- Catalog images.
--
-- The bucket is public so the site renders without a session; writing is
-- restricted to administrators by the same is_admin() check the catalog uses,
-- which is why sign-in has to go through Supabase: these policies read the
-- caller's identity from the Supabase session.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-images',
  'catalog-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Catalog images are publicly readable" on storage.objects;
create policy "Catalog images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'catalog-images');

drop policy if exists "Administrators upload catalog images" on storage.objects;
create policy "Administrators upload catalog images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'catalog-images' and public.is_admin());

drop policy if exists "Administrators replace catalog images" on storage.objects;
create policy "Administrators replace catalog images"
  on storage.objects for update to authenticated
  using (bucket_id = 'catalog-images' and public.is_admin())
  with check (bucket_id = 'catalog-images' and public.is_admin());

drop policy if exists "Administrators delete catalog images" on storage.objects;
create policy "Administrators delete catalog images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'catalog-images' and public.is_admin());
