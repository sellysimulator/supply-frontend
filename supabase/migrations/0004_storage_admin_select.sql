-- Only administrators can list the catalog images.
--
-- 0002_storage.sql let anyone select from storage.objects in this bucket,
-- which let any visitor list every file, including images uploaded for drafts
-- or no longer referenced. A public bucket does not need it: public object
-- URLs (/storage/v1/object/public/...) are served without consulting these
-- policies, so the site keeps rendering images for anonymous visitors.
--
-- Administrators still need a select policy: the Storage API reads the row
-- before it deletes or overwrites (upsert) an object, and those reads are
-- subject to row level security.
--
-- Run after 0002_storage.sql. Safe to run more than once. Re-running
-- 0002_storage.sql afterwards would restore the public policy, so run this
-- file again if you ever do.

drop policy if exists "Catalog images are publicly readable" on storage.objects;

drop policy if exists "Administrators read catalog images" on storage.objects;
create policy "Administrators read catalog images"
  on storage.objects for select to authenticated
  using (bucket_id = 'catalog-images' and (select public.is_admin()));
