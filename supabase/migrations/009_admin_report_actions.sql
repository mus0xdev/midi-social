create or replace function public.admin_delete_midi(target_midi_id uuid) returns void
language plpgsql security definer set search_path = public, storage as $$
declare
  target_path text;
begin
  if not public.is_admin_user() then raise exception 'Admin access required'; end if;
  select storage_path into target_path from public.midi_files where id = target_midi_id;
  if target_path is null then raise exception 'MIDI not found'; end if;
  delete from storage.objects where bucket_id = 'midi-files' and name = target_path;
  delete from public.midi_files where id = target_midi_id;
end;
$$;
revoke all on function public.admin_delete_midi(uuid) from public;
grant execute on function public.admin_delete_midi(uuid) to authenticated;