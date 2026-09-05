create table if not exists public.profile_follows (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  follower_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, follower_id),
  check (profile_id <> follower_id)
);

create index if not exists profile_follows_profile_id_idx on public.profile_follows(profile_id, created_at desc);
create index if not exists profile_follows_created_at_idx on public.profile_follows(created_at desc);

alter table public.profile_follows enable row level security;

drop policy if exists "follows are public" on public.profile_follows;
create policy "follows are public" on public.profile_follows for select using (true);

drop policy if exists "users follow profiles" on public.profile_follows;
create policy "users follow profiles" on public.profile_follows for insert to authenticated with check (auth.uid() = follower_id);

drop policy if exists "users unfollow profiles" on public.profile_follows;
create policy "users unfollow profiles" on public.profile_follows for delete to authenticated using (auth.uid() = follower_id);