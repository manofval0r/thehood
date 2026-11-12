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

## Assignment creation — current and planned

**Now (2026-11):** creation is fully public. Anyone can set an assignment,
no sign-in, matching the old assessments page's openness. Abuse is handled
by moderation, not gates: every assignment carries an HMAC owner token
created at creation time from the assignment id and the server secret;
the browser stores it in localStorage and presents it on edits and
deletes, where the server recomputes and compares. Authors can edit and
delete only their own assignments; staff can always edit or delete. The
token is deterministic, not stored — no extra columns. The `/assignments`
list and card show management controls only to staff or to the browser
holding the matching token.

**Planned, not installed yet:** creation will require dropping a matric
number (with surname) before an assignment can be set — the same roster
verification used for comments. At the same time the site gains a
program switch between **Computer Science** and **Cybersecurity**; the
matric number and surname determine which program the student is signed
into, rather than every student landing in the Cybersecurity view. This
is not wired up today; the current open create flow stays until that
change is implemented.
