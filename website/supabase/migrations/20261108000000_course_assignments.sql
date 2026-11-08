-- Migration: Create course assignments tables for the open assignment system.
--
-- Run this against the Supabase database (via the SQL editor or psql).
--
-- Three tables:
--
--   course_assignments       One row per assignment attached to a course.
--   course_assignment_resources  YouTube links or uploads attached to an assignment.
--   course_assignment_reminders  Notification reminder schedule per assignment.

create table if not exists public.course_assignments (
  id uuid primary key default gen_random_uuid(),
  course_code text not null,
  course_title text not null,
  title text not null,
  type text not null check (type in ('group', 'individual')),
  due_at timestamptz not null,
  submit_method text not null check (submit_method in ('email', 'presentation', 'inperson', 'other')),
  submit_detail text not null default '',
  notes text not null default '',
  event_title text not null default '',
  event_at timestamptz,
  notification_frequency text not null default 'once' check (notification_frequency in ('once', 'biweekly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists course_assignments_course_code_idx on public.course_assignments(course_code);
create index if not exists course_assignments_due_at_idx on public.course_assignments(due_at);

create table if not exists public.course_assignment_resources (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.course_assignments(id) on delete cascade,
  type text not null check (type in ('youtube', 'upload')),
  url text not null,
  title text not null default ''
);

create index if not exists course_assignment_resources_assignment_id_idx
  on public.course_assignment_resources(assignment_id);

create table if not exists public.course_assignment_reminders (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.course_assignments(id) on delete cascade,
  offset_hours int not null,
  sent boolean not null default false,
  sent_at timestamptz
);

create index if not exists course_assignment_reminders_assignment_id_idx
  on public.course_assignment_reminders(assignment_id);

alter table public.course_assignments enable row level security;
alter table public.course_assignment_resources enable row level security;
alter table public.course_assignment_reminders enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_assignments' and policyname = 'Anyone can read assignments') then
    create policy "Anyone can read assignments" on public.course_assignments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_assignments' and policyname = 'Staff can insert assignments') then
    create policy "Staff can insert assignments" on public.course_assignments for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_assignments' and policyname = 'Staff can update assignments') then
    create policy "Staff can update assignments" on public.course_assignments for update using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_assignments' and policyname = 'Staff can delete assignments') then
    create policy "Staff can delete assignments" on public.course_assignments for delete using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_assignment_resources' and policyname = 'Anyone can read assignment resources') then
    create policy "Anyone can read assignment resources" on public.course_assignment_resources for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_assignment_resources' and policyname = 'Staff can insert assignment resources') then
    create policy "Staff can insert assignment resources" on public.course_assignment_resources for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_assignment_resources' and policyname = 'Staff can delete assignment resources') then
    create policy "Staff can delete assignment resources" on public.course_assignment_resources for delete using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_assignment_reminders' and policyname = 'Anyone can read assignment reminders') then
    create policy "Anyone can read assignment reminders" on public.course_assignment_reminders for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_assignment_reminders' and policyname = 'Staff can insert assignment reminders') then
    create policy "Staff can insert assignment reminders" on public.course_assignment_reminders for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_assignment_reminders' and policyname = 'Staff can update assignment reminders') then
    create policy "Staff can update assignment reminders" on public.course_assignment_reminders for update using (true);
  end if;
end $$;
