-- Migration: Add done flag to course_assignments.
--
-- An assignment can be marked done once it has been submitted. Done
-- assignments stop generating reminder pushes.

alter table public.course_assignments add column if not exists done boolean not null default false;

create index if not exists course_assignments_done_idx on public.course_assignments(done);

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_assignments' and policyname = 'Staff can mark assignments done') then
    create policy "Staff can mark assignments done" on public.course_assignments for update using (true);
  end if;
end $$;
