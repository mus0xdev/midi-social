alter table public.profiles add column if not exists banner_url text;
alter table public.profiles add column if not exists website_url text;
alter table public.profiles add column if not exists github_url text;
alter table public.profiles add column if not exists youtube_url text;
alter table public.profiles add column if not exists theme text not null default 'forest';
alter table public.profiles add column if not exists account_status text not null default 'active';

alter table public.profiles drop constraint if exists profiles_theme_check;
alter table public.profiles add constraint profiles_theme_check check (theme in ('forest', 'midnight', 'sunset', 'mono'));
alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check check (account_status in ('active', 'suspended', 'banned'));

create or replace function public.protect_profile_security() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.id := old.id;
  new.is_admin := old.is_admin;
  if auth.uid() = old.id and not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    new.account_status := old.account_status;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_admin_fields on public.profiles;
drop trigger if exists protect_profile_security_fields on public.profiles;
create trigger protect_profile_security_fields before update on public.profiles for each row execute procedure public.protect_profile_security();

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from storage.objects where bucket_id = 'midi-files' and name like auth.uid()::text || '/%';
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and account_status = 'active');
$$;
revoke all on function public.is_active_user() from public;
grant execute on function public.is_active_user() to anon, authenticated;

drop policy if exists "admins moderate profiles" on public.profiles;
create policy "admins moderate profiles" on public.profiles for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Recreate write policies so suspended and banned users cannot create new activity.
drop policy if exists "users create reports" on public.reports;
create policy "users create reports" on public.reports for insert to authenticated with check (auth.uid() = reporter_id and public.is_active_user());
drop policy if exists "users upload midi" on public.midi_files;
create policy "users upload midi" on public.midi_files for insert to authenticated with check (auth.uid() = user_id and public.is_active_user());
drop policy if exists "users manage own likes" on public.likes;
create policy "users manage own likes" on public.likes for insert to authenticated with check (auth.uid() = user_id and public.is_active_user());
drop policy if exists "users create comments" on public.comments;
create policy "users create comments" on public.comments for insert to authenticated with check (auth.uid() = user_id and public.is_active_user());
drop policy if exists "users follow profiles" on public.profile_follows;
create policy "users follow profiles" on public.profile_follows for insert to authenticated with check (auth.uid() = follower_id and public.is_active_user());
