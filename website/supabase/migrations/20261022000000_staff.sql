-- Staff.
--
-- One row per person who is allowed into the staff area, with their own
-- code. The shared code that came before could not say who did what, and
-- could not be taken back from one person without taking it from all of
-- them.
--
-- The code is never stored. What is stored is a scrypt hash and the salt it
-- was made with, so reading the table does not hand over the ability to log
-- in. The code is shown once, when it is made, and not again.

create table if not exists public.staff (
  id text primary key,
  -- The name the person signs in with. Not unique: two people can share a
  -- name, and the code is what identifies which of them it is.
  name text not null,
  email text,
  -- scrypt, as "salt:hash" in hex.
  secret_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create index if not exists staff_name_idx on public.staff (lower(name));

comment on table public.staff is
  'People allowed into the staff area. Each has their own code; only its scrypt hash is stored.';

alter table public.staff enable row level security;

revoke all on table public.staff from public, anon, authenticated;
