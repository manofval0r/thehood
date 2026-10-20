-- Roles, permissions, and the review queue.
--
-- There are two kinds of staff. A super admin can approve people, take
-- access away, and read the audit log. An admin does the day-to-day work
-- and can add people, but the people they add wait for a super admin before
-- they can sign in at all.
--
-- The code for a newly approved person is not stored in the clear and never
-- was. It is encrypted with a key derived from ADMIN_SECRET and shown to the
-- person who added them for two days, after which it is gone for good and has
-- to be reissued. A code that sits in a database forever is a code that
-- leaks forever.

alter table public.staff add column if not exists role text not null default 'admin';
alter table public.staff add column if not exists status text not null default 'active';
alter table public.staff add column if not exists permissions text[] not null default '{}';
alter table public.staff add column if not exists added_by text;
alter table public.staff add column if not exists added_by_name text;
alter table public.staff add column if not exists code_cipher text;
alter table public.staff add column if not exists code_visible_until timestamptz;
alter table public.staff add column if not exists reviewed_by text;
alter table public.staff add column if not exists reviewed_at timestamptz;
alter table public.staff add column if not exists revoked_at timestamptz;
alter table public.staff add column if not exists revoked_reason text;

-- The old boolean is now the status. It is kept in step by a trigger rather
-- than by two places in the application remembering to set it.
create or replace function public.staff_sync_active() returns trigger
language plpgsql as $$
begin
  new.active := (new.status = 'active');
  return new;
end;
$$;

create trigger staff_sync_active
  before insert or update of status on public.staff
  for each row execute function public.staff_sync_active();

-- The one account that already existed becomes the first super admin.
update public.staff
   set role = 'super',
       status = 'active',
       permissions = array['attendance', 'files', 'roster', 'staff']
 where role is null or role = 'admin';

alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff add constraint staff_role_check
  check (role in ('super', 'admin'));

alter table public.staff drop constraint if exists staff_status_check;
alter table public.staff add constraint staff_status_check
  check (status in ('pending', 'active', 'revoked', 'rejected'));

-- The audit log.
--
-- Every change to a person, who did it and who it was done to. The
-- attendance record says a mark was changed; this says who changed it and
-- what they changed it from.
create table if not exists public.staff_audit (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id text,
  actor_name text not null,
  action text not null,
  target_id text,
  target_name text,
  detail text
);

create index if not exists staff_audit_at_idx on public.staff_audit (at desc);

comment on table public.staff_audit is
  'Who changed whose access, and when.';

alter table public.staff_audit enable row level security;
revoke all on table public.staff_audit from public, anon, authenticated;

-- The roster is the cohort, not a course's private list, so the same
-- students turn up on more than one course. The key has to allow that:
-- a matric number identifies a person, and a person takes several courses.
alter table public.roster drop constraint if exists roster_pkey;
alter table public.roster add constraint roster_pkey primary key (course, matric);

create index if not exists roster_matric_idx on public.roster (matric);
