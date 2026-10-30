# File Storage — Cybersecurity 300L

- Small PDFs (~0.19–0.20 MB, e.g. timetable / registration list): commit into repo (`docs/` + `website/public/docs/`) — GitHub handles fine, no storage limit at this size.
- Large uploads (~5.33 MB): use Supabase Storage (folder-upload mechanism at `website/src/lib/files.ts` / `website/src/app/admin/resources/`). Do NOT commit large binaries to repo.
- 404 fixes: rename files to kebab-case (no literal spaces) so `%20` URL-encoding mismatches disappear.
- 413 (Payload Too Large): server-side upload limit; use Supabase Storage endpoint, not direct server upload.
- Spell: Cybersecurity (not Cyber-Security, no em-dash). Touch targets 44px min. Desktop 1280/1440; mobile 390/320; light/dark verified.
