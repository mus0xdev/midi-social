create or replace function public.is_admin_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_admin = true);
$$;
revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to anon, authenticated;

drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (
  account_status = 'active' or auth.uid() = id or public.is_admin_user()
);