---
version: 1
slug: "website-src-app-page-tsx"
primary_target: "website/src/app/page.tsx"
related_targets: ["website/src/components/Nav.tsx","website/src/app/admin/bulletin/page.tsx"]
---

# Courses Landing and Campus Bulletin

**Mode:** Operate

**Scope:** `website/src/app/page.tsx`, public navigation, the live bulletin components, student verification, and the super-admin bulletin workspace.

**Audience and job:** Cybersecurity 300L students need to find courses, today's class status, online meeting links, deadlines, and authoritative changes without asking WhatsApp. Staff draft operational information; super admins reconcile Outlook with the cohort's actual day.

**Constraints:** Preserve course search, Drive, course cards, folder/resource behavior, existing pixel identity, dark/light themes, no reader-side third-party requests, 320/390 phone support, and 1280/1440 desktop support. Meeting links require cohort verification.

## Direction contract

**THESIS:** The Courses page is a live cohort control surface, not a marketing landing page. It refuses the oversized hero and generic dashboard-card stack.

**OWN-WORLD:** Extend the existing black, white, green, crisp-border, pixel-detail system. The bulletin uses one continuous command-board frame with ruled lanes, strong hierarchy, restrained depth, explicit source labels, and labeled state colors.

**STORY:** Students search or open a course, then reach the board and immediately understand the next class, any authoritative change, the join action, and what follows. Staff manage the same truth through sources and audited overrides.

**FIRST VIEWPORT:** A compact Courses utility band contains department/session, factual heading, search, Timetable, and Drive. Course cards begin immediately and the first row remains visible on a common laptop.

**FORM:** Code-led extension of the incumbent Operate surface. Signature interaction: the public board resolves Outlook and overrides into one authoritative state while the admin conflict dialog previews that resolution side by side before publication. Seed key: incumbent-operate-extension.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
