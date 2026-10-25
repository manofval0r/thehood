# Research Report: Multiple Countdown Reminders for Tests, Exams, and Assignments

**Research Query:** How best to add a feature like multiple countdowns that reminds people of tests, exams, and assignments.

**Status:** Research summary only — no implementation performed.

---

## Executive Summary

Add a student-facing "Assessments" section that lets students track multiple upcoming tests, exams, and assignments with live countdowns and configurable reminders. The cleanest path for this codebase (Next.js 16 + Supabase + existing notification bell/panel) is:

1. **Supabase table** for assessment deadlines (server source of truth, not localStorage)
2. **Live client countdowns** rendered in React, computed from `deadline - now()` on a single shared tick loop
3. **Scheduled reminders** via Supabase Edge Functions + Cron (or Inngest durable functions) — works even when the browser tab is closed
4. **Browser notifications** (Notification API / Notification Triggers API) for in-tab reminders
5. **Urgency color coding** and progress bars matching the existing pixel-art aesthetic

No new third-party services are required beyond Supabase, which is already configured.

---

## Research Query

> "can you add a feature like multiple countdowns that reminds people of tests, exams, and assignments"

**Breadth:** 6 parallel search angles  
**Depth:** 2 recursive rounds  
**Result:** No implementation; summary only.

---

## Findings Grouped by Theme

### 1. Data Model & Storage

**Key learnings:**
- Deadlines should be stored server-side (Supabase `timestamptz`), not in `localStorage`, so a student sees consistent times across phone and laptop (CalcPool, Mendix Forum).
- One row per assessment: course, title, type (exam/test/assignment), due date/time, owner (student).
- Per-student reminder preferences: which intervals fire (e.g. 1 week, 1 day, 1 hour) and which channel (browser, email, both).
- Perusall sends staggered reminders: 3 days, 2 days, and 1 day before an assignment deadline. Exam Countdown's free tier offers 1 day before; premium offers 1 week / 2 weeks / 1 month / 3 months / 6 months / 1 year.

**Directions:**
- Should reminders be opt-in per assessment or global defaults?
- Should there be a "start date" so progress bars show % elapsed?

### 2. Live Countdown Rendering (Client-Side)

**Key learnings:**
- Compute `remaining = due_at - now()` on every tick; never accumulate delta, which causes drift (CommandLinux, Countdown Timer GitHub).
- Use a **single shared tick loop** (`requestAnimationFrame` when visible, longer interval when hidden) for all timers on the page — not one interval per timer (Countdown Timer GitHub, siimplelab/minimal-timer).
- Recompute immediately when the tab regains focus so the display snaps to the correct value (browsers throttle background tabs to ~1/minute in Chrome).
- Mobile-first: digits must not overflow containers on 320–390px phones; keep compact ("3d 14h" not "3 days 14 hours 22 minutes") (Rija.io).
- Show urgency levels: green (≥7 days), amber (1–7 days), red (<24h) (CalcPool).
- Show a progress bar = % of total time elapsed between start and deadline (CalcPool).
- Dynamic page title showing remaining time is a nice-to-have (Countdown Timer GitHub).

**Directions:**
- Should completed/overdue assessments auto-archive or stay visible until manually dismissed?
- Should the countdown be a card, a pill in the nav, or both?

### 3. Reminder Delivery (Two Layers)

**In-tab (client-side):**
- **Notification API**: `Notification.requestPermission()` then `new Notification()` for simple in-tab alerts (Countdown Timer GitHub, Smart-Alarm-App).
- **Notification Triggers API** (Chrome): Schedule native notifications in the service worker with a `timestamp` — works without the page open and without VAPID keys (Chrome for Developers). Best for calendar-style reminders.

**Server-side (tab/browser closed):**
- **Supabase Cron + Edge Function**: A cron job runs hourly/daily, queries reminders due in the upcoming window, sends push (via `web-push` with VAPID keys stored as Supabase secrets) or email, marks `sent = true` (Supabase Push Notifications docs).
- **Inngest**: Durable scheduled functions with `ts` field or `step.sleepUntil()`; auto-retries, up to 1 year delay, works across providers (Inngest Docs).
- **Expo Notifications** (if mobile app later): schedule one-off or repeating notifications, fetch push tokens for FCM/APNS (expo-notifications README).

**Directions:**
- Use Supabase Cron (already in stack) vs. add Inngest as a new dependency?
- Which channels at launch: browser push only, or email too?

### 4. UI/UX Design Patterns

**Key learnings:**
- Tie the timer to a genuine, real deadline — fake urgency backfires (Rija.io).
- Pair urgency with clarity: "when" + "what" + "why" in one glance (Rija.io).
- Placement matters: site-wide standing reminder vs. page-specific timer (WiserNotify).
- Staggered cadence works best: 1 month out (start revising), 1 week out (last push), 1 day out (check time/room) (Exam Countdown app).
- Color-code exams/tests and allow icons (Exam Countdown Lite, 400 icons).
- Calendar view: see the whole semester on a month grid, color-coded, every exam a tap away (Exam Countdown App Store).
- Recurring timers for repeating exams/assignments (Countdown Timer GitHub).
- Pause/resume controls are a nice-to-have but add complexity (Countdown Timer GitHub).

**Directions:**
- Should assessments be groupable by course or shown as one flat list?
- Should there be a calendar view in addition to the list view?

### 5. Performance & Browser Constraints

**Key learnings:**
- Chrome clamps background-tab timers to roughly once per minute after a few minutes hidden; mobile Safari similar (CodeFronts).
- Use `performance.now()` for high-precision timing and correct drift on return to foreground (siimplelab/minimal-timer).
- PWA/offline support is optional but useful for students on spotty campus Wi-Fi (siimplelab).
- Web Workers can run the timer off the main thread for 60Hz refresh without jank (siimplelab).

**Directions:**
- Is off-main-thread timing worth the complexity for a student deadline app?
- Should the app be installable as a PWA?

### 6. Integration with the Existing Site

**Key learnings (site-specific):**
- The site already uses **Supabase** (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`) — no new infra needed.
- **Next.js 16** with Cache Components and Partial Prefetching is already in production.
- Existing **NotificationBell** component is 44px, focus-trapped, theme-aware — reuse for in-app reminder indicators.
- Existing **ThemeProvider** handles dark/light mode — countdown cards must use CSS variables, not hardcoded colors.
- Existing **FlipClock** / CountdownPill is the next-class dock — the assessments countdown is a separate surface; don't conflate them.
- Mobile audit already validates 390x844 and 320x568 at dark/light with 44px touch targets — new feature must pass the same matrix.
- Production is deployed on Vercel at `nutmcybersecurity.vercel.app`.

**Directions:**
- Add `/assessments` route (student-facing, read-only for visitors, full CRUD for signed-in students).
- Add an "Assessments" link to the mobile More/Menu sheet.

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Client (Next.js 16, React)                                 │
│  • Single shared tick loop recomputes all countdowns        │
│  • Urgency colors + progress bars per card                  │
│  • Notification API for in-tab alerts                       │
│  • Notification Triggers API (Chrome) for scheduled alerts  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (already configured)                              │
│  • assessments table (due_at timestamptz, RLS)              │
│  • assessment_reminders table (offset_hours, channel, sent) │
│  • Cron job (hourly/daily) → Edge Function                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Delivery                                                   │
│  • Browser push (web-push + VAPID) when tab closed          │
│  • Email (optional, via existing mail provider)             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases (Suggested)

| Phase | Work | Verification |
|-------|------|--------------|
| 1 | Supabase `assessments` table + RLS policies; server route to list/create assessments | Build passes; RLS blocks cross-user access |
| 2 | Client countdown component (single shared tick, urgency colors, progress bar) | Renders correct time at 320/390/1280, dark+light |
| 3 | Assessment cards list page (`/assessments`) with add/edit/delete | 44px touch targets, no overflow, keyboard navigable |
| 4 | In-tab browser notifications (Notification API) | Permission granted → notification fires at offset |
| 5 | Server-scheduled reminders (Supabase Cron + Edge Function or Inngest) | Test reminder fires at 24h/1h before a test deadline |
| 6 | Mobile menu integration (link to Assessments in the More/Menu sheet) | Consistent with existing nav patterns |

---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Browser throttles background timers (~1/min) | Compute `remaining = due_at - now()` on every tick; recompute immediately on tab focus |
| Timezone confusion | Store `due_at` as `timestamptz` (UTC); display in user's local timezone via `Intl.DateTimeFormat` |
| Notification permission denied | Fall back gracefully to in-app alert badge; don't block countdown on permission |
| Duplicate reminders | Mark `sent = true` server-side after delivery; idempotency keys if using Inngest |
| Mobile overflow | Keep countdown compact ("3d 14h"); test at 320px width per existing audit matrix |
| Pixel-art style drift | Use existing CSS variables, not hardcoded colors |

---

## Related Considerations (Out of Scope for This Feature)

- **PDF/PPTX download for file attachments:** The site already serves file resources. Adding format conversion (PDF/PPTX generation) would require a library like `pdfkit`/`jspdf` (PDF) or `pptxgenjs` (PPTX) server-side, or a client-side print-to-PDF approach. This is orthogonal to the countdown feature.
- **YouTube-to-Markdown:** No mature open-source solution was found for fully automated YouTube video → markdown transcription that works reliably without API keys. Options like `youtube-transcript-api` (unofficial, fragile) or Whisper-based transcription (heavy, requires model download) exist but are production-risky. Recommend skipping this unless a stable API (YouTube Data API captions, or a paid transcription service) is acceptable.

---

## Sources

- CalcPool Deadline Countdown Timer — https://calcpool.com/tools/deadline-countdown-timer
- Mendix Forum: Exam countdown timer best practice — https://community.mendix.com/link/spaces/app-development/questions/145252
- WiserNotify: 20 Countdown Timer Examples — https://wisernotify.com/blog/countdown-timer-examples
- Exam Countdown Lite (Google Play) — https://play.google.com/store/apps/details?id=uk.co.beyondlearning.examcountdown
- Exam Countdown (App Store) — https://apps.apple.com/us/app/exam-countdown-school-uni/id873279955
- Chrono Countdown (App Store) — https://apps.apple.com/us/app/chrono-countdown-event-clock/id6743369111
- Exam Countdown — Alerts and reminders — https://examcountdown.app/help/alerts-and-reminders/
- Exam Countdown — Chrome Web Store — https://chromewebstore.google.com/detail/exam-countdown/mhjcpnnmmalddidegkfcempomlpkkdan
- Kotola Exam Countdown — https://kotola1.github.io/examflow
- GitHub: ChitranshSingh/Countdown-Timer — https://github.com/ChitranshSingh/Countdown-Timer
- GitHub: siimplelab/minimal-timer — https://github.com/siimplelab/minimal-timer
- GitHub: ayoub-ouazene/Smart-Alarm-App — https://github.com/ayoub-ouazene/Smart-Alarm-App
- GitHub: Sarvesh246/calendar (Datebook) — https://github.com/Sarvesh246/calendar
- CommandLinux: How Browser Countdowns Track a Deadline — https://commandlinux.com/updates/how-browser-countdowns-track-a-deadline
- CodeFronts: 22 CSS Countdown Timers — https://codefronts.com/snippets/css-countdown-timers/
- Rija.io: Countdown Timer Best Practices — https://rija.io/blog/countdown-timer-best-practices.php
- GoodUI: Pattern #42 Countdown Timer — https://goodui.org/patterns/42
- Stack Overflow: Multiple countdown timers on one page — https://stackoverflow.com/questions/22796620/multiple-countdown-timers-on-one-page
- Chrome for Developers: Notification Triggers API — https://developer.chrome.com/docs/web-platform/notification-triggers
- Inngest Docs: Cron Jobs, Schedules & Delayed Functions — https://www.inngest.com/docs/durable-execution/guides-and-advanced/events-and-triggers/schedules-and-delayed-starts
- Inngest Docs: Scheduling a one-off function — https://www.inngest.com/docs/examples/scheduling-one-off-function
- Inngest Docs: Running code at specific times — https://www.inngest.com/docs/patterns/schedule/running-at-specific-times
- Inngest Blog: Run Next.js functions in the background — https://www.inngest.com/blog/run-nextjs-functions-in-the-background
- Supabase Docs: Sending Push Notifications — https://supabase.com/docs/guides/functions/examples/push-notifications
- Supabase Docs: Realtime — https://supabase.com/docs/guides/realtime
- Supabase Docs: Using Realtime with Next.js — https://supabase.com/docs/guides/realtime/realtime-with-nextjs
- MakerKit: Building a Real-time Notification System with Supabase and Next.js — https://makerkit.dev/blog/tutorials/real-time-notifications-supabase-nextjs
- Expo Notifications README — https://github.com/expo/expo/blob/main/packages/expo-notifications/README.md
- CountTogether Push Notifications — https://counttogether.app/en/features/push-notifications
- Pushwoosh: Push notifications with a countdown timer — https://help.pushwoosh.com/hc/en-us/articles/29388648093853-How-do-I-create-push-notifications-with-a-countdown-timer-for-time-based-offers
- Perusall: Assignment reminders — https://support.perusall.com/hc/en-us/articles/360048648074-Does-Perusall-remind-students-when-their-assignments-are-due
- Moodle: Assignment notice to students about due dates — https://moodle.org/mod/forum/discuss.php?d=152421
- Cengage WebAssign: Set Up Email Reminders — https://help.cengage.com/webassign/student_guide/webassign/t_s_assignments_email_notifications.htm
- Adalo: Scheduled Notifications — https://help.adalo.com/actions/notifications/scheduled-notifications
- By The Way Labs: Countdown Timer — https://bythewaylabs.zendesk.com/hc/en-us/articles/53706461980691-Countdown-Timer
- Deadline Funnel: Website Countdown Timer — https://www.deadlinefunnel.com/features/website-countdown-timer
- Coderstool: Countdown Deadline Timer — https://www.coderstool.com/count-down-timer
- GitHub: Ayokanmi-Adejola/Launch-Countdown-Timer — https://github.com/Ayokanmi-Adejola/Launch-Countdown-Timer
- Daily UI #014 Countdown Timer (Figma) — https://www.figma.com/community/file/1475149586242980144/daily-ui-014-countdown-timer
- GitHub: takayingofa44/Countdown-Timer — https://github.com/takayingofa44/Countdown-Timer
- DEV Community: Countdown Timer — https://dev.to/farouk_/countdown-timer-5aid
- Huawei: reminderAgent API — https://developer.huawei.com/consumer/en/doc/harmonyos-references/js-apis-reminderagent
- EveryToolkit: Reminder Scheduler — https://www.everytoolkit.com/ru/reminder-scheduler
- Reminders App (Chrome Web Store) — https://chromewebstore.google.com/detail/reminders-app/ndicejkjfmjbpnddjeledfaeamekhodc

---

**End of report.** This is a research summary only. No code was written or modified.