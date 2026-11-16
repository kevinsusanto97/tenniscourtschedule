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

-- The site uses the publishable key, so members (anon role) may read, add and remove votes.
-- There are no accounts: this matches the site, where anyone with the link can vote.
alter table public.votes enable row level security;
grant select, insert, delete on public.votes to anon;

drop policy if exists "Anyone can read votes" on public.votes;
create policy "Anyone can read votes" on public.votes for select to anon using (true);

drop policy if exists "Anyone can vote" on public.votes;
create policy "Anyone can vote" on public.votes for insert to anon with check (true);

drop policy if exists "Anyone can remove a vote" on public.votes;
create policy "Anyone can remove a vote" on public.votes for delete to anon using (true);
