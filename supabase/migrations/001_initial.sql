create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 2 and 32),
  avatar_url text,
  bio text check (char_length(bio) <= 280),
  created_at timestamptz not null default now(),
  is_admin boolean not null default false
);
alter table public.profiles add column if not exists is_admin boolean not null default false;

create table if not exists public.midi_files (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120), description text check (char_length(description) <= 2000),
  filename text not null, storage_path text not null unique, tags text[] not null default '{}', tone text check (char_length(tone) <= 32), license text not null default 'CC BY 4.0',
  plays integer not null default 0 check (plays >= 0), downloads integer not null default 0 check (downloads >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.midi_files add column if not exists tone text check (char_length(tone) <= 32);
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(), midi_id uuid not null references public.midi_files(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), unique (midi_id, user_id)
);
create table if not exists public.profile_follows (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  follower_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(),
  unique (profile_id, follower_id), check (profile_id <> follower_id)
);
create index if not exists profile_follows_profile_id_idx on public.profile_follows(profile_id, created_at desc);
create index if not exists profile_follows_created_at_idx on public.profile_follows(created_at desc);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(), midi_id uuid not null references public.midi_files(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, content text not null check (char_length(content) between 1 and 1000), created_at timestamptz not null default now()
);
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id) on delete cascade,
  midi_id uuid references public.midi_files(id) on delete cascade, comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check (reason in ('copyright', 'inappropriate', 'spam', 'other')),
  details text check (char_length(details) <= 1000), description text check (char_length(description) <= 1000), status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(), check ((midi_id is not null)::integer + (comment_id is not null)::integer = 1),
  unique (reporter_id, midi_id), unique (reporter_id, comment_id)
);
alter table public.reports add column if not exists description text check (char_length(description) <= 1000);
alter table public.reports enable row level security;
create index if not exists reports_status_idx on public.reports(status, created_at desc);
create index if not exists reports_midi_id_idx on public.reports(midi_id);
create index if not exists reports_comment_id_idx on public.reports(comment_id);
drop policy if exists "users create reports" on public.reports;
create policy "users create reports" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
drop policy if exists "users view own reports" on public.reports;
create policy "users view own reports" on public.reports for select using (auth.uid() = reporter_id);
drop policy if exists "admins view reports" on public.reports;
create policy "admins view reports" on public.reports for select using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
drop policy if exists "admins update reports" on public.reports;
create policy "admins update reports" on public.reports for update using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)) with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
create index if not exists midi_files_created_at_idx on public.midi_files(created_at desc);
create index if not exists midi_files_user_id_idx on public.midi_files(user_id);
create index if not exists comments_midi_id_idx on public.comments(midi_id);

create or replace function public.protect_profile_admin() returns trigger language plpgsql security definer set search_path = public as $$
begin new.id := old.id; new.is_admin := old.is_admin; return new; end;
$$;
drop trigger if exists protect_profile_admin_fields on public.profiles;
create trigger protect_profile_admin_fields before update on public.profiles for each row execute procedure public.protect_profile_admin();

create or replace function public.protect_midi_counters() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.id := old.id; new.user_id := old.user_id; new.filename := old.filename; new.storage_path := old.storage_path;
  if current_setting('midi.counter_update', true) is distinct from 'on' then
    new.plays := old.plays; new.downloads := old.downloads;
  end if;
  new.created_at := old.created_at; new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists protect_midi_immutable_fields on public.midi_files;
create trigger protect_midi_immutable_fields before update on public.midi_files for each row execute procedure public.protect_midi_counters();

create or replace function public.increment_midi_plays(midi_id uuid) returns void language sql security definer set search_path = public as $$
  select set_config('midi.counter_update', 'on', true);
  update public.midi_files set plays = plays + 1 where id = midi_id;
$$;
create or replace function public.increment_midi_downloads(midi_id uuid) returns void language sql security definer set search_path = public as $$
  select set_config('midi.counter_update', 'on', true);
  update public.midi_files set downloads = downloads + 1 where id = midi_id;
$$;
revoke all on function public.increment_midi_plays(uuid) from public;
revoke all on function public.increment_midi_downloads(uuid) from public;
grant execute on function public.increment_midi_plays(uuid) to anon, authenticated;
grant execute on function public.increment_midi_downloads(uuid) to anon, authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, username) values (new.id, coalesce(nullif(new.raw_user_meta_data->>'username', ''), 'user_' || substr(new.id::text, 1, 8))); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security; alter table public.midi_files enable row level security; alter table public.likes enable row level security; alter table public.profile_follows enable row level security; alter table public.comments enable row level security;
drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (true);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "midi is public" on public.midi_files;
create policy "midi is public" on public.midi_files for select using (true);
drop policy if exists "users upload midi" on public.midi_files;
create policy "users upload midi" on public.midi_files for insert with check (auth.uid() = user_id);
drop policy if exists "users update own midi" on public.midi_files;
create policy "users update own midi" on public.midi_files for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users delete own midi" on public.midi_files;
create policy "users delete own midi" on public.midi_files for delete using (auth.uid() = user_id);
drop policy if exists "likes are public" on public.likes;
create policy "likes are public" on public.likes for select using (true);
drop policy if exists "users manage own likes" on public.likes;
create policy "users manage own likes" on public.likes for insert with check (auth.uid() = user_id);
drop policy if exists "users remove own likes" on public.likes;
create policy "users remove own likes" on public.likes for delete using (auth.uid() = user_id);
drop policy if exists "follows are public" on public.profile_follows;
create policy "follows are public" on public.profile_follows for select using (true);
drop policy if exists "users follow profiles" on public.profile_follows;
create policy "users follow profiles" on public.profile_follows for insert to authenticated with check (auth.uid() = follower_id);
drop policy if exists "users unfollow profiles" on public.profile_follows;
create policy "users unfollow profiles" on public.profile_follows for delete to authenticated using (auth.uid() = follower_id);
drop policy if exists "comments are public" on public.comments;
create policy "comments are public" on public.comments for select using (true);
drop policy if exists "users create comments" on public.comments;
create policy "users create comments" on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists "users delete own comments" on public.comments;
create policy "users delete own comments" on public.comments for delete using (auth.uid() = user_id);
drop policy if exists "admins delete comments" on public.comments;
create policy "admins delete comments" on public.comments for delete using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('midi-files', 'midi-files', true, 10485760, array['audio/midi', 'audio/x-midi', 'audio/mid', 'application/octet-stream']) on conflict (id) do nothing;
update storage.buckets set public = true, file_size_limit = 10485760, allowed_mime_types = array['audio/midi', 'audio/x-midi', 'audio/mid', 'application/octet-stream'] where id = 'midi-files';
drop policy if exists "public midi downloads" on storage.objects;
create policy "public midi downloads" on storage.objects for select using (bucket_id = 'midi-files' and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}[.](mid|midi)$');
drop policy if exists "authenticated midi uploads" on storage.objects;
create policy "authenticated midi uploads" on storage.objects for insert to authenticated with check (bucket_id = 'midi-files' and (storage.foldername(name))[1] = auth.uid()::text and name ~ ('^' || auth.uid()::text || '/[0-9a-fA-F-]{36}[.](mid|midi)$') and coalesce(metadata->>'mimetype', '') in ('audio/midi', 'audio/x-midi', 'audio/mid', 'application/octet-stream'));
drop policy if exists "users delete own midi objects" on storage.objects;
create policy "users delete own midi objects" on storage.objects for delete to authenticated using (bucket_id = 'midi-files' and (storage.foldername(name))[1] = auth.uid()::text);