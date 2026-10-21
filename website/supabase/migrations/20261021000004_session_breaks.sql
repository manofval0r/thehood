-- The breaks inside a lecture.
--
-- A three hour lecture is not three hours of teaching. It is an hour of
-- teaching, a break, an hour of teaching, a break, and the last hour. The
-- breaks are at the end of each period and the class always ends when it
-- was scheduled to end, so the last period has no break in it.
--
-- The length of the break is a decision, not a constant. Most lectures take
-- ten minutes, some take five, and some take none at all, so the length is
-- held per session rather than being written into the timetable.
--
-- The key is the session: the course, the day it meets and the minute it
-- starts. A course that meets twice a week has two rows, one for each
-- meeting.

create table if not exists public.session_breaks (
  course text not null,
  -- 0 = Sunday, matching Date.getDay().
  day_index integer not null,
  -- Minutes from midnight, the start of the session.
  start_min integer not null,
  -- How long the break is. Zero means the lecture runs straight through.
  break_min integer not null default 10
    check (break_min >= 0 and break_min <= 30),
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (course, day_index, start_min)
);

comment on table public.session_breaks is
  'The length of the break in each lecture, in minutes. Zero means no break.';

-- Row level security, as everywhere else here.
alter table public.session_breaks enable row level security;

revoke all on public.session_breaks from public, anon, authenticated;
