-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
create table if not exists public.votes (
  id bigint generated always as identity primary key,
  slot text not null check (slot ~ '^\d{4}-\d{2}-\d{2}_\d{2}:\d{2}$'),
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);

-- One vote per name per time slot (case-insensitive).
create unique index if not exists votes_slot_name_key on public.votes (slot, lower(name));
create index if not exists votes_slot_idx on public.votes (slot);

-- Only the site's server (service role key) reads and writes; no public access.
alter table public.votes enable row level security;
