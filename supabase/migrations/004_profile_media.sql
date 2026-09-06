insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-media', 'profile-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public profile media" on storage.objects;
create policy "public profile media" on storage.objects for select using (bucket_id = 'profile-media');

drop policy if exists "users upload profile media" on storage.objects;
create policy "users upload profile media" on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text and coalesce(metadata->>'mimetype', '') like 'image/%');

drop policy if exists "users delete profile media" on storage.objects;
create policy "users delete profile media" on storage.objects for delete to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from storage.objects where bucket_id in ('midi-files', 'profile-media') and name like auth.uid()::text || '/%';
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;