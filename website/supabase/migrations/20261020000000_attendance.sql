-- Attendance, P7.
--
-- The fill IS the record: there is no separate attendance row to keep in sync
-- with the boxes. An unfilled box is not an absent student, it is a box that
-- nobody has entered anything into yet, and that difference has to survive
-- into the data or the student-facing view will accuse people of missing
-- classes that were never marked. So `fill` is nullable, and NULL is not 0.

create table if not exists public.attendance (
  course       text        not null,
  session_date date        not null,
  matric       text        not null,
  -- How much of the session someone was on class, from 0 to 1.
  -- NULL means nobody has marked this box yet.
  fill         numeric(3,2) check (fill is null or (fill >= 0 and fill <= 1)),
  -- Excused is a third state, not a flavour of absent. Illness and death are
  -- counted at a university and must not read the same as not turning up.
  excused      boolean     not null default false,
  marked_by    text,
  marked_at    timestamptz not null default now(),
  primary key (course, session_date, matric),
  -- Excused and a fill level are mutually exclusive states.
  constraint attendance_excused_exclusive
    check (not (excused and fill is not null))
);

comment on column public.attendance.fill is
  'Presence level 0..1. NULL is unmarked, which is not the same as 0 (absent).';
comment on table public.attendance is
  'One row per course, session date and student. The box fill is the record.';

-- The roster.
--
-- Names live here rather than in the repository. The site is public, and a
-- student list committed to git is a student list published. The roster is
-- entered by staff behind the admin secret and is only ever read server-side.
create table if not exists public.roster (
  matric   text primary key,
  name     text        not null,
  course   text        not null,
  added_at timestamptz not null default now()
);

create index if not exists roster_course_idx on public.roster (course);

-- Correction history.
--
-- A silently edited attendance record is worse than a wrong one, so every
-- change is written down with what it replaced and when it happened.
create table if not exists public.attendance_log (
  id           bigint generated always as identity primary key,
  course       text        not null,
  session_date date        not null,
  matric       text        not null,
  old_fill     numeric(3,2),
  old_excused  boolean,
  new_fill     numeric(3,2),
  new_excused  boolean,
  changed_at   timestamptz not null default now(),
  changed_by   text
);

create index if not exists attendance_log_course_date_idx
  on public.attendance_log (course, session_date);

-- Row level security on all three tables.
--
-- The application reaches the database with the service role, which bypasses
-- RLS. Every other role is locked out, so there is no path to the data except
-- through this site's own server code, and the attendance never reaches the
-- client bundle.
alter table public.attendance     enable row level security;
alter table public.roster         enable row level security;
alter table public.attendance_log enable row level security;

revoke all on table public.attendance     from public, anon, authenticated;
revoke all on table public.roster         from public, anon, authenticated;
revoke all on table public.attendance_log from public, anon, authenticated;
