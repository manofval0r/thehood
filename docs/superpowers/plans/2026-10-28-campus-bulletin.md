# Campus Bulletin, Landing, and Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Courses page the cohort's operational home with a live bulletin, verified meeting links, managed Outlook sync, audited super-admin overrides, RSVP, and compact grouped navigation.

**Architecture:** A server-only bulletin data layer normalizes staff posts, Outlook events, academic-calendar rows, class occurrences, and overrides into one client-safe feed. Stateless signed student sessions protect meeting-link and RSVP routes. A dedicated admin workspace owns drafts, publication, Outlook health, and source-versus-override conflicts; the existing scheduler consumes effective class occurrences so cancelled/rescheduled classes cannot emit stale reminders.

**Tech Stack:** Next.js 16 App Router with Cache Components, React 19, TypeScript, Supabase PostgREST/Storage, Microsoft Graph Calendar API, Web Push, Tailwind CSS 4, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-28-campus-bulletin-design.md`

## Global Constraints

- Preserve search, Drive, course cards, folder upload/tree, Resources behavior, student attendance table, and existing notifications.
- Outlook has one super-admin-managed connection; active overrides win for one occurrence only.
- Matric plus registered surname creates a signed, device-bound cohort-verification cookie; meeting URLs never appear in public payloads.
- Ordinary staff draft; super admins publish, archive, pin, connect Outlook, override, restore, and view RSVP names.
- No reader-side third-party request occurs before an explicit external navigation.
- Phone targets are 390x844 and 320x568 in dark/light; desktop targets are 1280x900 and 1440x900.
- Primary and icon-only actions are at least 44x44 on phones; phone form text is at least 16px.
- Reader copy uses “Cybersecurity”, full course names where needed, and no em dashes.
- Keep the existing black/white/green pixel-art identity and restrained depth.

## Review Focus

- A guessed matric/surname must not reveal whether either field exists; five failures in fifteen minutes must throttle the source address.
- Public bulletin JSON and HTML must never include meeting URLs; only a verified meeting endpoint returns one.
- A cancellation/reschedule must suppress original reminder keys and be idempotent when the five-minute scheduler runs twice.
- A stale override form must fail instead of overwriting a newer Outlook sync or admin decision.
- Outlook failure or missing credentials must preserve the last sync and render a labeled stale/degraded state instead of breaking the public page.

---

### Task 1: Test Harness and Bulletin Domain

**Files:**
- Modify: `website/package.json`
- Modify: `website/package-lock.json`
- Create: `website/vitest.config.ts`
- Create: `website/src/lib/bulletin-types.ts`
- Create: `website/src/lib/bulletin-domain.ts`
- Test: `website/src/lib/bulletin-domain.test.ts`
- Create: `website/supabase/migrations/20261028000000_campus_bulletin.sql`

**Interfaces:**
- Produces: `BulletinItem`, `BulletinSource`, `ClassOccurrenceOverride`, `OutlookEvent`, `effectiveOccurrence()`, `sortBulletinItems()`, `isBulletinActive()`, `rsvpCounts()`.

- [ ] Write failing tests for override precedence, cancellation, reschedule, active/archive boundaries, ordering, RSVP aggregation, and malformed timestamps.
- [ ] Run `npm test -- src/lib/bulletin-domain.test.ts` and confirm failures are missing exports/behavior.
- [ ] Implement the client-safe domain types and pure functions.
- [ ] Add the locked RLS tables: `bulletin_items`, `bulletin_rsvps`, `class_occurrence_overrides`, `calendar_connections`, and `outlook_events`, with indexes and uniqueness constraints.
- [ ] Run the focused tests and `npx tsc --noEmit`.
- [ ] Commit domain, tests, harness, and migration.

### Task 2: Lightweight Student Verification

**Files:**
- Create: `website/src/lib/student-session.ts`
- Create: `website/src/lib/student-verification.ts`
- Create: `website/src/lib/student-verification.test.ts`
- Create: `website/src/app/api/student/session/route.ts`
- Create: `website/src/app/api/student/verify/route.ts`

**Interfaces:**
- Produces: `currentStudent(): Promise<VerifiedStudent | null>`, `verifyRosterIdentity(matric, surname)`, signed cookie start/end functions, and GET/POST/DELETE session routes.

- [ ] Write failing tests for normalization, surname matching, generic rejection, expiry, signature tampering, and throttle boundaries.
- [ ] Verify tests fail for missing behavior.
- [ ] Implement roster lookup, HMAC cookie session, constant-time signature check, and IP throttle without exposing roster existence.
- [ ] Add session API routes with narrow return payloads.
- [ ] Run focused tests, typecheck, and build.
- [ ] Commit student verification.

### Task 3: Bulletin Store, Aggregation, and Public APIs

**Files:**
- Create: `website/src/lib/bulletin.ts`
- Create: `website/src/lib/bulletin-feed.ts`
- Create: `website/src/lib/bulletin-feed.test.ts`
- Create: `website/src/app/api/bulletin/route.ts`
- Create: `website/src/app/api/bulletin/[id]/meeting/route.ts`
- Create: `website/src/app/api/bulletin/[id]/rsvp/route.ts`

**Interfaces:**
- Consumes: Task 1 domain; Task 2 `currentStudent()`.
- Produces: `getBulletinFeed({ archive, student })`, public item DTOs with `hasMeeting` but no URL, verified meeting response, and RSVP upsert/count endpoints.

- [ ] Write failing tests proving source aggregation, override precedence, public URL redaction, personal assessment inclusion, canonical anchors, and RSVP privacy.
- [ ] Verify expected failures.
- [ ] Implement server store queries and feed aggregation from published staff items, synced Outlook rows, effective class occurrences, academic calendar, and verified-student assessments.
- [ ] Implement uncached request-time routes; return graceful empty/degraded results when new tables are not migrated.
- [ ] Run focused tests, typecheck, and build.
- [ ] Commit bulletin data and APIs.

### Task 4: Managed Outlook Connection and Sync

**Files:**
- Create: `website/src/lib/outlook-calendar.ts`
- Create: `website/src/lib/outlook-calendar.test.ts`
- Modify: `website/src/app/api/calendar/outlook/authorize/route.ts`
- Modify: `website/src/app/api/calendar/outlook/callback/route.ts`
- Modify: `website/src/app/api/calendar/sync/route.ts`

**Interfaces:**
- Produces: encrypted token storage, signed OAuth state, `syncManagedOutlook()`, course inference, Graph event normalization, and connection health.

- [ ] Write failing tests for course-code inference, Teams/Zoom URL extraction, cancelled-event normalization, token encryption round-trip/tamper failure, and OAuth state expiry.
- [ ] Verify tests fail correctly.
- [ ] Implement super-admin-only authorize/callback, encrypted tokens, refresh flow, bounded `calendarView` sync, dedupe/upsert, and health reporting.
- [ ] Make manual sync accept either a super-admin session or the existing scheduler secret.
- [ ] Run focused tests, typecheck, and build.
- [ ] Commit managed Outlook sync.

### Task 5: Staff Bulletin, Publication, and Overrides

**Files:**
- Create: `website/src/app/admin/bulletin/page.tsx`
- Create: `website/src/app/admin/bulletin/actions.ts`
- Create: `website/src/components/BulletinManager.tsx`
- Create: `website/src/components/OverrideConflictDialog.tsx`
- Modify: `website/src/components/Nav.tsx`
- Modify: `website/src/lib/staff.ts` only if a narrow audit helper is needed.

**Interfaces:**
- Consumes: bulletin store and Outlook connection.
- Produces: draft create/update, super publish/archive/pin, custom event, override/restore, RSVP roster, delivery results, and audit records.

- [ ] Write failing tests for draft versus publish authorization, typed cancellation confirmation, required reason, stale `updated_at`, and one-occurrence scope.
- [ ] Verify failures.
- [ ] Implement server actions that authenticate every mutation and re-read authoritative rows rather than trusting client payloads.
- [ ] Build the staff workspace and side-by-side conflict dialog showing source, proposal, reminder effects, reason, scope, and expiry.
- [ ] Add Bulletin to every active staff member's grouped navigation.
- [ ] Run focused tests, typecheck, and build.
- [ ] Commit admin bulletin workflow.

### Task 6: Effective Class Reminders and Corrective Alerts

**Files:**
- Modify: `website/src/lib/push.ts`
- Modify: `website/src/app/api/push/schedule/route.ts`
- Create: `website/src/lib/class-reminders.test.ts`

**Interfaces:**
- Consumes: `effectiveOccurrence()` and stored overrides.
- Produces: cancellation suppression, rescheduled timing, corrective announcements, Outlook refresh in scheduler, and idempotent keys based on effective occurrence.

- [ ] Write failing tests showing cancelled classes emit no start/break/end reminders, rescheduled classes use new times/venue, restore re-enables source behavior, and duplicate scheduler runs do not resend.
- [ ] Verify failures.
- [ ] Apply overrides once per scheduler window before emitting class reminders.
- [ ] Sync managed Outlook before reminders; record a health failure without failing the rest of the scheduler.
- [ ] Send and log the immediate corrective alert in the override action.
- [ ] Run focused tests, typecheck, and build.
- [ ] Commit reminder correctness.

### Task 7: Landing Page and Live Campus Command Board

**Files:**
- Modify: `website/src/app/page.tsx`
- Create: `website/src/components/BulletinBoard.tsx`
- Create: `website/src/components/StudentVerifyDialog.tsx`
- Create: `website/src/components/BulletinItemRow.tsx`
- Create: `website/src/app/bulletin/page.tsx`
- Modify: `website/src/app/globals.css` for board-specific tokens/animations only.

**Interfaces:**
- Consumes: initial public feed and public APIs.
- Produces: compact utility header, unchanged course grid, command board, filters, Join/Verify, RSVP, WhatsApp sharing, and archive page.

- [ ] Write browser-oriented component tests or route smoke assertions for URL redaction, verification dialog, RSVP controls, filter state, and external share URL construction.
- [ ] Verify failures.
- [ ] Replace the hero/stats/snapshot/closing filler with the compact utility header, search, Timetable, Drive, and immediate course grid.
- [ ] Build one integrated command-board frame after the cards with live/next lane, pinned-alert lane, chronological feed, source/urgency labels, archive link, and honest degraded/empty states.
- [ ] Add student verification dialog and verified Join/RSVP interactions.
- [ ] Add reduced-motion-safe status transitions and no reader-side embedded third-party content.
- [ ] Run tests, typecheck, and build.
- [ ] Commit public landing and bulletin.

### Task 8: Grouped Navbar

**Files:**
- Create: `website/src/lib/navigation.ts`
- Create: `website/src/lib/navigation.test.ts`
- Rewrite: `website/src/components/Nav.tsx`

**Interfaces:**
- Produces: three public groups and staff navigation, parent active-state logic, hover/focus/click/touch behavior, and grouped mobile sheet.

- [ ] Write failing tests for route-to-parent matching and group membership.
- [ ] Verify failures.
- [ ] Implement Courses, Study, and Campus groups with overview links, hover/focus opening, click pinning, arrow navigation, Escape/outside close, active non-color cue, and grouped mobile sections.
- [ ] Preserve bell, staff sign-out, focus trap, theme slider, next-class preview, and 44px phone controls.
- [ ] Run tests, typecheck, and build.
- [ ] Commit grouped navigation.

### Task 9: Database, Visual Review, and Release Verification

**Files:**
- Modify: `website/MOBILE_EXPERIENCE_PLAN.md` only if evidence needs a durable appendix.
- Create/modify: `DESIGN.md` and `.impeccable/design.json` only after finish review if the final extension establishes durable new system rules.

**Interfaces:**
- Verifies all prior tasks as a release.

- [ ] Inspect the linked Supabase schema, repair CLI authorization if credentials are available, and apply pending migrations locally first, then remotely; otherwise document the exact blocker without pretending persistence is live.
- [ ] Seed temporary bulletin/event/RSVP/override fixtures locally or in the linked project, verify flows, and remove every fixture.
- [ ] Run the complete unit suite, `npx tsc --noEmit`, focused ESLint, and `npm run build`.
- [ ] Run the app and inspect desktop 1440/1280 plus mobile 390/320 in dark/light in one browser pass; capture `.impeccable/review/desktop.png` and `mobile.png`.
- [ ] Test navbar pointer/keyboard/touch, verification, meeting-link redaction/reveal, RSVP, WhatsApp share, draft/publish, conflict diff, cancellation suppression, archive, and Outlook degraded/configured states.
- [ ] Run the Impeccable detector once over changed UI targets and fix mechanical findings in one batch.
- [ ] Perform one final browser confirmation pass, Lighthouse accessibility/SEO/best-practices audit, and production smoke after deployment.
- [ ] Commit evidence/documentation, push `main`, wait for Ready deployment, and verify the production alias.
