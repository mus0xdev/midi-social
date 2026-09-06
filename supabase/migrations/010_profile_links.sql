-- Add a flexible links column to profiles.
-- Each entry: { "label": "string", "url": "string" }
-- Max 8 links enforced at application level.
alter table public.profiles
  add column if not exists links jsonb not null default '[]'::jsonb;
