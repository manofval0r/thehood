# Supabase MCP fix — required before DB-backed design work

State observed 30 Oct 2026 (after bulletin + nav redesign completed without DB work):
- Site `.env.local`: SUPABASE_URL=https://ufxoqzabqdnrjwxvuaxs.supabase.co (line 5); service role key present (line 6).
- `supabase` MCP server points at `destcakvqdzhkzemdugo` (wrong project).
- `supabase-koji` / `supabase-pharmatrace` are unrelated.
- Direct `https://ufxoqzabqdnrjwxvuaxs.supabase.co/rest/v1/` returns 401 (expected without anon/service key in request header — endpoint is alive).
- `supabase` server returns 0 resources; all queries time out (project mismatch).

Fix options (user to apply; agent has no access to MCP server definition file):
1. Edit the `supabase` MCP server config to change the configured project from `destcakvqdzhkzemdugo` to `ufxoqzabqdnrjwxvuaxs`, then verify `get_project_url` returns the site URL.
2. OR, add/update an environment variable / connection string in the MCP server pointing at the site URL + key.
3. Re-verify: once fixed, re-run `supabase` list projects / tables; confirm `bulletin` table queries work; then resume DB-backed design.

No DB-backed bulletin or admin design was implemented in this session; all new code (BulletinBoardView, BulletinScene, BulletinStickyGrid, BulletinPalette, BulletinBoard, nav mega) renders from server-side feeds / static data and is safe regardless of this blocker.
