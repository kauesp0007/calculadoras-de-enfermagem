-- Applied 2026-10-03. Service role is the sole delivery path for these originals.
-- Restrictive isolation is necessary because older permissive storage policies
-- allow anon/authenticated access to other buckets.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='storage'
    and tablename='objects' and policyname='assistential_pdfs_private_isolation') then
    create policy assistential_pdfs_private_isolation on storage.objects
      as restrictive for all to anon, authenticated
      using (bucket_id <> 'assistential-pdfs-private')
      with check (bucket_id <> 'assistential-pdfs-private');
  end if;
end $$;
