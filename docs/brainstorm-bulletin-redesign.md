# Brainstorm / Clarify — Bulletin Redesign + Micro-interactions

Triggered by user directive (commit-every-change policy applies).

## Questions before implementation (must clarify)

### Bulletin board (three.js sticky-note cork board)
1. Scope: replace `BulletinBoard.tsx` and `/bulletin/page.tsx` only, or landing `BulletinBoard` too?
2. Physics: sticky notes pinned to cork with spring rotation/drag? Or static pinned with hover lift?
3. Mobile (390/320): keep three.js board on mobile, or graceful 2D fallback? Performance budget applies.
4. Note colors/pins: online courses (AI, digital sovereignty, digital forensics) get specific pin colors? Alerts vs events vs lectures — distinct sticky colors?
5. Filters exact mapping: "remove lectures" = hide lecture-type notes from board; "remove in-person" = hide notes with `venue` set; "today" = filter `date === today`; "alerts" = `priority = alert`? Confirm against `BulletinFeed` types.
6. Sticky note content: same `BulletinItemRow` fields (title, time, venue, meetingUrl redacted)? Any handwritten-style font (e.g., `font-family: 'Permanent Marker'`)?

### Micro-interactions audit
1. Navbar (`Nav.tsx`): dropdown group hover/focus open with spring? ArrowDown focus state animation? Mobile sheet entrance slide + ease?
2. Bulletin notes: hover lift + shadow spring; click expand note detail (scale-in); drag-to-reposition? Filter toggle: button press scale + active state glow?
3. Existing animations: `FlipClock`, theme slider, notification bell — audit against `micro-interactions` checklist (duration 100-400ms, compositor-only, reduced-motion respected)?
4. Responsive: desktop 1280/1440 full animation; mobile 390/320 minimal (100-200ms), no hover effects, tap feedback with `-webkit-tap-highlight-color`.

### Design references
- Image: cork bulletin board, colorful push pins, sticky notes, rainbow decorations, photos pinned.
- Spelling: **Cybersecurity**; no em-dashes; 44px touch targets; light/dark schemes verified.

## Decisions needed from user before build
- Confirm board scope (full page vs component only).
- Confirm mobile three.js strategy (keep vs fallback).
- Confirm filter definitions mapped to `BulletinFeed` fields.
- Confirm pin/note color coding for online vs in-person vs alert.

No implementation started — clarification required per `brainstorming` rules.
