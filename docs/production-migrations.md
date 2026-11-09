# Production migration state

Recorded 2026-11-09, after the assignments + comments rollout. If you are
adding features that need new tables, apply the matching files from
`website/supabase/migrations/` to the production project (the one the site
reads, e.g. `ufxoqzabqdnrjwxvuaxs`) with `apply_migration` or the SQL editor.

Applied to production (all green, verified 2026-11-09):

- `course_assignments` — course_assignments, course_assignment_resources,
  course_assignment_reminders, RLS policies
- `assignment_done` — `done` column on course_assignments
- `assignment_share_and_reminders` — `custom_reminder_hours`, `share_token`
  (unique) for public share links; `notification_frequency` already covers
  once / daily / weekly / biweekly / monthly / custom
- `file_comments` — file_comments + file_comment_replies, RLS policies

Notes:

- The assignment subsystem uses the `assignment` notification kind for the
  reminder scheduler; `announceAssignments()` runs inside
  `/api/push/schedule`, which Vercel cron hits on its own schedule.
- Comments are readable by anyone, writable by signed-in staff and students;
  authors can edit/delete only their own (enforced in `/api/comments`).
- The `/assignments?share=<token>` flow is served client-side because the
  server-rendered searchParams boundary never resumed under cache components;
  see `AssignmentsClient.tsx`.
- `visitors do not need Supabase credentials; all access goes through
  server-side routes that use the service role key.
