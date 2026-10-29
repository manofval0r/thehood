<!-- BEGIN:nextjs-agent-rules -->

## COMMIT POLICY (user directive — from 29 Oct 2026)

From now on: **any new change, commit it immediately**. Do not wait for authorization, do not batch multiple changes into a single commit, do not delay until a feature wave finishes. Each edit gets its own commit. This applies to docs, code, config, migrations — everything. The agent must not forget this; this note exists so the policy is preserved in docs.

- Spell: **Cybersecurity** (not Cyber-Security, not Cyber Security with a hyphen, not any em-dash variation).
- Touch targets: **44px minimum**.
- Desktop breakpoints verified: **1280 / 1440**.
- Mobile targets verified: **390 / 320** (CSS pixels, portrait, Chrome, light and dark).
- Light/dark schemes: verified on both before any claim of done.

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
