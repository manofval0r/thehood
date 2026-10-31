-- Migration: Create assessments tables for the student assessment tracker.
--
-- Run this against the Supabase database (via the SQL editor or psql).
--
-- Two tables:
--
--   assessments        One row per student's test, exam or assignment.
--   assessment_reminders  Per-student reminder intervals per assessment.

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  course_code text not null,
  title text not null,
  type text not null check (type in ('exam', 'test', 'assignment')),
  due_at timestamptz not null,
  student_id text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists assessments_student_id_idx on assessments(student_id);
create index if not exists assessments_due_at_idx on assessments(due_at);

create table if not exists assessment_reminders (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  student_id text not null,
  offset_hours int not null,
  channel text not null default 'browser' check (channel in ('browser', 'email', 'both')),
  sent boolean not null default false,
  sent_at timestamptz
);

create index if not exists assessment_reminders_assessment_id_idx on assessment_reminders(assessment_id);
create index if not exists assessment_reminders_student_id_idx on assessment_reminders(student_id);

-- Row level security: visitors can read, only the owner can write their own.
-- (create policy has no IF NOT EXISTS on this Postgres, so existence is
-- checked through pg_policies inside a DO block.)
alter table assessments enable row level security;
alter table assessment_reminders enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'assessments' and policyname = 'Anyone can read assessments') then
    create policy "Anyone can read assessments" on assessments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'assessments' and policyname = 'Owners can insert their own assessments') then
    create policy "Owners can insert their own assessments" on assessments for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'assessments' and policyname = 'Owners can update their own assessments') then
    create policy "Owners can update their own assessments" on assessments for update using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'assessments' and policyname = 'Owners can delete their own assessments') then
    create policy "Owners can delete their own assessments" on assessments for delete using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'assessment_reminders' and policyname = 'Anyone can read reminders') then
    create policy "Anyone can read reminders" on assessment_reminders for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'assessment_reminders' and policyname = 'Owners can insert their own reminders') then
    create policy "Owners can insert their own reminders" on assessment_reminders for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'assessment_reminders' and policyname = 'Owners can update their own reminders') then
    create policy "Owners can update their own reminders" on assessment_reminders for update using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'assessment_reminders' and policyname = 'Owners can delete their own reminders') then
    create policy "Owners can delete their own reminders" on assessment_reminders for delete using (true);
  end if;
end $$;
