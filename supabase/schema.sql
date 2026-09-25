-- Jersey21 "Share Your 21 Story" wall
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query)
-- for a fresh project. Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  sport text check (sport is null or char_length(sport) <= 40),
  story text not null check (char_length(story) between 1 and 2000),
  submitted_at timestamptz not null default now(),
  approved boolean not null default false
);

-- Row Level Security: the public (anon) API key can only do exactly
-- what these policies allow -- nothing more. Think of this like a
-- database role that's only ever granted INSERT and a restricted SELECT.
alter table public.stories enable row level security;

drop policy if exists "Anyone can submit a story" on public.stories;
create policy "Anyone can submit a story"
  on public.stories
  for insert
  to anon
  with check (approved = false);

drop policy if exists "Anyone can read approved stories" on public.stories;
create policy "Anyone can read approved stories"
  on public.stories
  for select
  to anon
  using (approved = true);

-- No update/delete policy is created for "anon" at all, so the public
-- API key can never edit or remove a row -- only insert new ones and
-- read the approved ones. Moderation happens in the Supabase Table
-- Editor (Brian logs in, flips "approved" to true on stories to publish).

create index if not exists stories_approved_submitted_idx
  on public.stories (approved, submitted_at desc);
