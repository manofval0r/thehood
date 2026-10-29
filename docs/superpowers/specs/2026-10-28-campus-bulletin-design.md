# Campus Bulletin and Navigation Design

## Intent

Turn the Courses landing page into the cohort's operational home. Students should stop hunting through Outlook details or WhatsApp for an online-class link. The page should answer what is happening, what changed, where to go, and what needs attention while keeping course search, the shared Drive link, the timetable, and all course cards immediately useful.

## Goals

- Replace the promotional hero with a compact utility header.
- Keep search, Google Drive, and a prominent Timetable action above the course grid.
- Place a high-fidelity live campus command board immediately after course cards.
- Synchronize shared Outlook events through one managed super-admin connection.
- Let super admins override one class occurrence with an explicit Outlook-versus-proposed diff.
- Suppress stale class reminders and send corrective notifications after cancellation or rescheduling.
- Support staff drafts, super-admin publishing, custom events, RSVP, archive history, and WhatsApp sharing.
- Replace the flat desktop navbar with three accessible dropdown groups.

## Non-goals

- Replacing Outlook, WhatsApp, or the university calendar.
- Building high-assurance student identity or a full student account system.
- Exposing private Outlook data beyond the cohort events needed by the bulletin.
- Allowing ordinary admins to publish class overrides.
- Rebuilding course cards, Resources, attendance, or the file tree.

## Identity and Access

Students verify once per device with matric number and registered surname. The server checks the roster, rate-limits failed attempts, and sets a signed HTTP-only cookie containing only matric number and expiry. Meeting URLs are never present in public bulletin payloads. A verified request retrieves a join URL or writes one RSVP. Public readers see summaries and RSVP counts; authorized staff see response names.

This is deliberately described as cohort verification, not authentication. It blocks casual public disclosure and duplicate anonymous RSVP without claiming that a predictable matric number is a secret.

## Data Sources and Authority

1. An active super-admin override is authoritative for its occurrence.
2. Managed Outlook events are authoritative when no override exists.
3. The published weekly timetable supplies scheduled classes Outlook does not contain.
4. Staff bulletin items, academic-calendar events, assessments, and selected resource updates join the feed with clearly labeled sources.

Every effective item carries source, status, timing, course, urgency, visibility, publication state, and expiry. Expired items are excluded from the active board but retained for archive and audit.

## Outlook Connection

- Only a super admin can begin or replace the managed connection.
- OAuth uses a signed state value, callback session re-check, `Calendars.Read offline_access`, and encrypted tokens stored in a locked table.
- Sync reads Microsoft Graph `calendarView` for a bounded window, stores only subject, preview, times, location, join URL, web URL, cancellation state, modification time, and inferred course.
- Manual sync is available in admin. The existing scheduler also refreshes before processing reminders.
- Missing credentials or an expired connection degrades to timetable and staff content with a visible admin health state; public pages do not fail.

## Super-admin Override Flow

The admin selects an upcoming occurrence, then chooses cancel, reschedule, replace link, change venue, add note, or restore source. The confirmation dialog shows:

- Outlook/source values on the left.
- Proposed effective values on the right.
- A field-by-field change indicator.
- Which original reminders will be suppressed and which corrective/new reminders will be sent.
- Reason, author, scope (“this occurrence only”), and automatic expiry.
- Typed `CANCEL` confirmation for cancellation.

Publishing writes the override, creates or updates its bulletin item, writes an audit record, suppresses original reminder keys, and sends the corrective alert immediately. Restore removes effective precedence but retains history.

## Bulletin Content Model

Kinds: class, alert, notice, event, deadline, resource.

Statuses: draft, published, cancelled, archived.

The active board order is:

1. Live or imminent online class with verified Join action.
2. Pinned urgent cancellation/change.
3. Today's remaining items.
4. Upcoming deadlines and events.
5. Recent resource updates.

Custom event fields include title, description, start/end, course or cohort audience, venue, optional external link, RSVP enabled, urgency, pin state, publication/expiry, and notification behavior.

## Landing Composition

### Compact utility header

- Small department/session line.
- `Courses` heading and one short factual line.
- Search occupies the main width.
- Timetable is the obvious adjacent action; Drive is a secondary action with its existing folder motif.
- No pixel-art hero, marketing claim, statistics row, large session snapshot, empty-course warning, or duplicate closing CTA.

### Course grid

The existing grid and course cards remain first-class and directly follow the utility header.

### Live campus command board

The board is a single integrated operational surface rather than a pile of generic cards. It uses crisp rails, status channels, timestamped rows, green live signals, amber changes, red cancellation language, pixel details, and purposeful state transitions.

- Header: `LIVE CAMPUS BOARD`, sync health, last updated, active/archive switch.
- Lead lane: live/next class with time, course, source, location, and Join/Verify action.
- Alert lane: pinned cancellation or admin notice.
- Feed lane: filterable chronological rows for classes, deadlines, events, notices, and resources.
- Event rows expose RSVP counts and the verified student's response controls.
- Every item exposes a WhatsApp share action using its canonical anchor.
- Empty state says what source was checked and when, not merely “Nothing here.”

## Navbar Information Architecture

Desktop top level:

- **Courses** → All courses, Timetable, Assessments, Registration.
- **Study** → Tools, Resources.
- **Campus** → Bulletin, Calendar, Events, Careers, Contact.

Each label links to its overview/default route. Hover and keyboard focus open its dropdown; click pins/toggles it; Escape and outside click close it. Arrow keys move within the menu. The active child gives the parent a non-color active cue. Touch uses the grouped mobile sheet with the same labels and order.

## Admin Information Architecture

`/admin/bulletin` is available to all active staff. Ordinary admins can create and edit drafts and see their draft status. Super admins additionally see:

- Publish/archive/pin controls.
- Outlook connection and sync health.
- Upcoming source occurrences.
- Override/restore controls.
- RSVP counts and verified student names.
- Delivery counts and audit history.

## Failure and Edge States

- Outlook unavailable: retain last successful sync, label it stale, and continue using timetable/admin items.
- No meeting URL: show `Link not posted yet`, never a disabled fake Join button.
- Verification failure: generic error, rate limit, no roster existence leak.
- Duplicate RSVP: upsert the existing response.
- Event cancellation after RSVP: retain responses in history and label the event cancelled.
- Conflicting simultaneous override: last write requires the current `updated_at`; stale submissions receive a refresh message.
- Scheduler rerun: all corrective and class notifications remain idempotent.

## Verification Matrix

- Public: landing and full bulletin at 390x844, 320x568, 1280x900, and 1440x900, dark and light.
- Navbar: hover, click, keyboard focus, arrows, Escape, outside click, touch sheet, active cues.
- Verification: correct, wrong, malformed, rate-limited, expired cookie, and meeting-link disclosure.
- RSVP: going/unsure/not-going, upsert, public counts, staff identities.
- Overrides: cancel, reschedule, link/venue change, stale write, restore, notification suppression and corrective delivery.
- Outlook: configured, missing credentials, expired refresh token, failed Graph response, dedupe, cancellation, and stale sync.

## Direction Contract

**THESIS:** The Courses page is a live cohort control surface, not a marketing landing page. It refuses the oversized hero and generic dashboard-card stack.

**OWN-WORLD:** Extend the existing black, white, green, crisp-border, pixel-detail system. The bulletin uses one continuous command-board frame with ruled lanes, strong type hierarchy, restrained depth, explicit source labels, and state colors that never replace words.

**STORY:** A student searches or opens a course, then reaches the board and immediately understands the next class, any authoritative change, the join action, and what follows. Staff see the same public truth and manage its sources in a dedicated operational workspace.

**FIRST VIEWPORT:** A compact Courses header occupies no more than the top utility band: department/session, factual heading, search, Timetable, and Drive. Course cards begin immediately. On a common laptop the first course row is visible without scrolling through promotional material.

**FORM:** Code-led extension of the incumbent Operate surface. Signature interaction: the bulletin's effective state visibly resolves Outlook source data and super-admin override data into one authoritative row, while the admin conflict dialog shows that resolution before it happens.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Implementation Calls Delegated to the Builder

- Use matric plus registered surname, not matric alone, for lightweight verification.
- Keep sessions stateless and signed with `ADMIN_SECRET` under a separate cookie namespace.
- Use server-rendered initial board data with client enhancement for filters, verification, RSVP, and live time.
- Use existing push infrastructure and `staff_audit` rather than adding a second delivery/audit system.
- Keep external meeting and WhatsApp navigation user-initiated.
