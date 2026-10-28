# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Cybersecurity 300 Level students using phones and laptops to find course material, class times, online-class links, deadlines, and campus updates.
- Ordinary staff who maintain attendance and course material and may draft bulletin notices.
- Super admins who approve staff, publish authoritative notices, connect the managed Outlook calendar, override individual class occurrences, and audit what changed.

## Product Purpose

The site is the cohort's dependable source of truth for courses and day-to-day academic operations. Success means a student can find the right course, current class status, online meeting link, timetable, deadline, or urgent change without asking the WhatsApp group or arriving late.

## Positioning

The product joins the published timetable, a managed university Outlook calendar, staff-authored notices, assessments, course resources, notifications, and a live bulletin into one cohort-specific operational view. Super-admin overrides are explicit, audited, and take precedence over conflicting calendar data.

## Operating Context

- The university creates shared Outlook calendar events that all students receive; online-class links are often present in event details but poorly discovered.
- Students currently ask for links in a WhatsApp group and depend on somebody reposting them.
- The cohort operates in Africa/Lagos time.
- Course material lives both on this site and in a shared Google Drive folder.
- The site is deployed on Vercel and stores operational data in Supabase.

## Capabilities and Constraints

- The Courses landing page keeps course search, the shared Drive link, a prominent timetable action, and all course cards; promotional hero copy and stale filler do not belong there.
- A live campus bulletin follows the course cards and surfaces current/next classes, verified meeting links, cancellations, reschedules, urgent notices, deadlines, academic-calendar events, staff-created events, and selected resource updates.
- One super-admin-managed Outlook connection synchronizes cohort events.
- A super-admin override wins over Outlook for one occurrence. Before applying it, the UI shows the Outlook values beside the proposed values, the notification consequences, expiry, reason, and a strong cancellation confirmation.
- Cancellation suppresses the original class reminders and sends an immediate corrective notification. Rescheduling suppresses the old reminders and schedules the effective occurrence.
- Ordinary admins may draft bulletin content; super admins publish, pin, archive, override Outlook, and inspect RSVP identities.
- Students use lightweight cohort verification before meeting links or RSVP actions are revealed. Verification uses matric number plus registered surname and binds a signed session to the device; it is cohort verification, not high-assurance identity proof.
- Event counts are public; individual RSVP names are visible only to authorized staff.
- Every bulletin item has a WhatsApp share action pointing back to the canonical site item.
- Expired items leave the active board automatically but remain in searchable history and the immutable audit trail.
- Desktop navigation uses three grouped menus: Courses, Study, and Campus. Menus open with hover or keyboard focus and remain usable by click/tap. Mobile uses grouped sections in the existing sheet.
- Primary actions and icon-only controls are at least 44x44 on phones. Form controls are at least 16px text and 44px high on phones.
- The site must work at 390x844 and 320x568 in dark and light themes, with no document horizontal overflow. Desktop at 1280 and 1440 must remain usable.
- Reader-facing pages make no third-party requests unless the reader explicitly follows an external link or joins a meeting.
- Keep files and videos on one Resources admin surface, preserve folder upload paths and the visible folder tree, and keep student attendance tabled.

## Brand Commitments

- Product name: Cybersecurity 300L, Nigerian University of Technology and Management.
- Preserve the existing black/white/green identity, pixel-art motifs, crisp borders, compact operational copy, dark and light themes, and restrained physical depth.
- Write “Cybersecurity” and avoid em dashes in reader-facing copy.
- Use full course names wherever a code alone would be ambiguous.

## Evidence on Hand

- Published course manifest and timetable in `website/src/lib/resources.ts` and `website/src/lib/schedule.ts`.
- Academic calendar in `website/src/lib/calendar.ts`.
- Current roster, staff, audit, attendance, files, videos, announcements, subscriptions, and notification preferences in Supabase.
- Existing Outlook OAuth scaffold under `website/src/app/api/calendar/outlook/`.
- Existing push delivery, scheduler, notification panel, class countdown, course search, Drive link, course cards, mobile menu, and audit trail.
- No approved photography, testimonials, usage metrics, or public performance claims; future work must not fabricate them.

## Product Principles

1. Put the operational truth where students already look, not behind institutional knowledge.
2. Make conflicts explicit: show source data, overrides, consequences, author, and history.
3. One action should resolve the student's immediate question: join, attend, read, respond, or verify.
4. Protect sensitive links without turning a quick class check into account-management work.
5. Preserve one source of truth across timetable, bulletin, reminders, and audit records.

## Accessibility & Inclusion

- Keyboard operation, visible focus, semantic dialogs and menus, reduced-motion support, and 44px phone targets are required.
- Information cannot rely on color alone; urgency and status always have text labels.
- Meeting-link verification and RSVP workflows must provide clear errors without exposing roster information.
