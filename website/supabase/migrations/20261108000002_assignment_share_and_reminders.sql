-- Migration: Add more notification frequency options and shareable links to assignments.
--
-- Adds:
--   - notification_frequency: new options (daily, weekly, biweekly, monthly, custom)
--   - custom_reminder_hours: custom reminder interval in hours (when frequency is custom)
--   - share_token: unique token for public shareable link to an assignment

alter table public.course_assignments add column if not exists custom_reminder_hours int;
create index if not exists course_assignments_custom_reminder_hours_idx on public.course_assignments(custom_reminder_hours);

alter table public.course_assignments add column if not exists share_token text unique;
create index if not exists course_assignments_share_token_idx on public.course_assignments(share_token) where share_token is not null;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_assignments' and policyname = 'Anyone can read shared assignments') then
    create policy "Anyone can read shared assignments" on public.course_assignments
      for select using (share_token is not null);
  end if;
end $$;
