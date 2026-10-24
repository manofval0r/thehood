# Mobile Experience Plan: Cybersecurity 300L

**Status:** Draft for approval. This commit adds this document only; no mobile UI code is changed.
**Audit date:** 24 October 2026.
**Targets:** 390 x 844 and 320 x 568 CSS pixels, portrait, Chrome, dark scheme, production data, read-only.
**Production baseline:** https://nutmcybersecurity.vercel.app, deployment `dpl_5AcznJRDssgp2aD8ovkzxieWNeBa` from `894f93c`, Ready and aliased.

## 1. Summary

The admin work and the folder upload and folder tree are already live. This plan does not reimplement them. It treats the folder workflow as a first-class surface and a regression contract, then proposes a route-by-route mobile pass at 390px and 320px.

The audit covers 56 route states, each loaded at both widths: 44 public states and 12 staff states, for 112 page loads. Every public and admin route is in the matrix in Appendix A.

The shared shell causes most of the serious problems:

- The public navigation rail is clipped at both widths. At 390px, Registration, Resources, Careers and Events are cut off. At 320px, Calendar is cut off as well. The rail scrolls, but there is no visible overflow control or edge fade.
- The admin navigation rail is clipped at both widths. At 390px, Announce and Settings are cut off on the dashboard, and Roll, Staff, Announce and Settings are cut off onAttendance and Resources. At 320px, Resources joins that list. The notification badge also overflows its 32px bell.
- The home page is 351px wide at a 320px viewport. The navigation wrapper is the main offender. Careers is 325px and Events is 327px at 320px; the same wrapper is the common source, with a small residual overflow to confirm after the navigation fix.
- The fixed next-class dock covers the "All courses" link on all 10 course pages and the course code link on all 15 viewer pages. It also covers the Download button on `csc309-foundations-of-ai` at 390px.
- The fixed theme switch covers primary actions: the timetable's "Import .ics file" at 320px, the viewer Download on `csc312-ds` at 390px, the admin dashboard input at 320px, the announcement input and "Different room" control, and the Resources course picker at 320px. It also covers secondary card links on careers, events and the not-found page.

The plan is phased. Phase 1 fixes the shared shell, Phase 2 the public pages, Phase 3 the admin pages and the folder surface, and Phase 4 verifies the whole matrix. No broad mobile redesign starts before approval. The student attendance view remains tabled.

## 2. Current state and constraints

| Area | State |
|---|---|
| Production | `https://nutmcybersecurity.vercel.app` serves deployment `dpl_5AcznJRDssgp2aD8ovkzxieWNeBa` from commit `894f93c`, Ready and aliased. |
| Folder upload and tree | Shipped in `894f93c`. Both New folder and Upload folder are live. Nested folder paths, folder moves, rename, delete guard and the tree were tested and cleaned up. |
| Resources page | Files and videos are one page with one full-name course picker. The Files and Videos tabs are present. |
| Audit | Complete for 56 route states at 390x844 and 320x568. Read-only; no data changed. |
| Mobile code | None. This plan is a documentation-only change. |
| Student attendance view | Tabled. It is not part of this plan. |
| Broad redesign | Waiting for explicit approval of this plan. |

The following constraints apply to every phase:

- Keep the folder upload and folder tree first-class and visible. Do not hide the tree in a settings panel, a modal or a secondary menu. Both New folder and Upload folder stay visible.
- Use only the site's own assets. No third-party reader-side requests, fonts, icons or embeds.
- Keep the pixel-art style.
- Write "Cybersecurity", never the hyphenated form.
- Use full course names. Do not replace them with course codes alone.
- No em-dashes.
- Keep the student attendance view tabled.
- Commit each feature or change before starting the next. Group at reviewable boundaries; do not split one fix into artificial commits.
- No broad mobile redesign before explicit approval.

## 3. Method and evidence

- 56 route states: 44 public and 12 staff. Each was loaded at 390x844 and 320x568, for 112 page loads.
- Chrome, headless, dark colour scheme, service workers blocked, production data, read-only. The staff pages used the staff account. The code is not recorded in this document.
- For each state the audit measured:
  - document `scrollWidth` against the viewport, with the elements that overflow;
  - header controls whose labels are clipped by a scrolling parent;
  - controls under the fixed next-class dock;
  - interactive elements under the fixed theme switch;
  - table widths and whether the parent scrolls;
  - interactive elements smaller than 44px in either dimension;
  - input and select font sizes below 16px;
  - the notification panel bounds and close target;
  - the Resources folder tree open and closed, plus its tabs.
- The raw output is in the local temp folder used for the audit (`mobile-audit/audit-table.md`, `audit-findings.md` and `audit.json`). It is not committed. Appendix A is the durable matrix.
- The doubled text seen in some screenshots is a capture artifact, not a site bug. The DOM check found one visible copy, one main element and no text shadow.
- The folder flow test was separate from the audit. It created a disposable folder, verified nested uploads and cleanup, and left no test data.
- The audit used the dark scheme. Light theme, keyboard and touch verification belong to Phase 4.
- The build checks at `894f93c` passed: `npx tsc --noEmit`, focused ESLint and `npm run build`. The existing `listPending` warning is pre-existing and unrelated.

## 4. Route coverage

The route states are grouped below. Appendix A records the 390px and 320px result for every state.

| Group | States | Notes |
|---|---:|---|
| Public static | 11 | Includes the visitor sign-in state of `/admin`. |
| Public role pages | 8 | One per career role. |
| Public course pages | 10 | One per course. |
| Public viewer pages | 15 | One per file in the viewer. |
| Staff pages | 12 | Includes redirects and the `?tab=videos` state. |
| Total | 56 | 112 page loads at two widths. |

The two `/admin` states are separate: the public state is the visitor sign-in screen, and the staff state is the signed-in dashboard.

### 4.1 Public static routes

| Route | What it is |
|---|---|
| `/` | Home |
| `/timetable` | Timetable |
| `/timeline` | Timeline |
| `/registration` | Registration |
| `/resources` | Study resources |
| `/careers` | Careers index |
| `/events` | Events |
| `/contact` | Contact |
| `/offline` | Offline fallback |
| `/this-page-does-not-exist` | Not found |
| `/admin` | Staff sign-in as a visitor |

### 4.2 Public role pages

| Route | Full role title |
|---|---|
| `/careers/soc-analyst` | SOC Analyst |
| `/careers/penetration-tester` | Penetration Tester |
| `/careers/dfir-analyst` | Forensics and Incident Response Analyst |
| `/careers/security-engineer` | Security Engineer |
| `/careers/appsec-engineer` | Application Security Engineer |
| `/careers/cloud-security-engineer` | Cloud Security Engineer |
| `/careers/grc-analyst` | Governance, Risk and Compliance Analyst |
| `/careers/threat-intel-analyst` | Threat Intelligence Analyst |

### 4.3 Public course pages

| Route | Code | Full course title |
|---|---|---|
| `/courses/gst-312` | GST 312 | Peace and Conflict Resolution |
| `/courses/nut-man-315` | NUT-MAN 315 | Marketing Management |
| `/courses/nut-csc-301` | NUT-CSC 301 | Digital Sovereignty: Governance, Technology and Implementation |
| `/courses/csc-309` | CSC 309 | Artificial Intelligence |
| `/courses/nut-csc-312` | NUT-CSC 312 | Data Structures |
| `/courses/cyb-301` | CYB 301 | Cryptography Techniques, Algorithms and Applications |
| `/courses/cyb-303` | CYB 303 | Cybersecurity Risks Analysis, Challenges and Mitigation |
| `/courses/cyb-305` | CYB 305 | Digital Forensics and Investigation Methods |
| `/courses/nut-csc-310` | NUT-CSC 310 | Distributed System Security |
| `/courses/nut-cyb-312` | NUT-CYB 312 | Secure Coding |

### 4.4 Public viewer pages

| Route | File title |
|---|---|
| `/view/gst312-session-1` | Session 1 - Peace and Conflict Resolution |
| `/view/nutman315-intro` | Introduction to Marketing Management |
| `/view/nutman315-group-assignment` | Group Assignment - Marketing Management |
| `/view/nutman315-proctor` | Marketing Information Systems (Proctor, 1991) |
| `/view/csc309-course-outline` | CSC 309 Course Outline |
| `/view/csc309-foundations-of-ai` | Foundations of AI |
| `/view/csc312-ds` | CSC301 Data Structures |
| `/view/csc312-week1` | Week 1 - Data Management Foundations |
| `/view/cyb305-course-overview` | CYB 305 Course Overview |
| `/view/cyb305-week1-fundamentals` | Week 1 - Computer Forensics Fundamentals |
| `/view/cyb305-readme` | Lab Evidence Manual - README_FIRST |
| `/view/cyb305-preliminary` | Preliminary Report (DRAFT) |
| `/view/cyb305-sha256` | SHA256 Source Manifest |
| `/view/cyb305-student-template` | Student Report Template |
| `/view/cyb305-inference-config` | Inference Provider Config (JSON) |

### 4.5 Staff pages

| Route | State |
|---|---|
| `/admin` | Staff dashboard after sign-in |
| `/admin/attendance` | Attendance |
| `/admin/announce` | Announcements |
| `/admin/resources` | Resources, Files tab |
| `/admin/resources?tab=videos` | Resources, Videos tab requested |
| `/admin/schedule` | Redirects to `/admin/settings/breaks` |
| `/admin/notifications` | Redirects to `/admin/settings/notifications` |
| `/admin/settings` | Redirects to `/admin/settings/notifications` |
| `/admin/settings/notifications` | Notification settings |
| `/admin/settings/breaks` | Session breaks |
| `/admin/files` | Redirects to `/admin/resources` |
| `/admin/videos` | Redirects to `/admin/resources` |

## 5. Folder upload and folder tree baseline

The folder feature is already shipped. It is not a future item in this plan, and it is not downplayed. It is a working, first-class part of Resources and a regression contract for every mobile change.

### 5.1 What is live now

- **New folder** creates a folder under the selected course.
- **Upload folder** opens the device's directory picker. It preserves the selected root folder and every nested subfolder. A file chosen as `Week 1/Slides/Intro.pdf` is stored under the current course's resource path as `Week 1/Slides/Intro.pdf`, not flattened. The selected root is preserved, and every deeper folder is accounted for recursively.
- Folder rows are created before the uploads. The uploads are quiet, and one summary notification is sent at the end.
- If two files in the same folder share a base name, the upload retries with the full filename instead of dropping one.
- The folder tree is visible through the **Folder tree** control. It shows the nested structure, highlights the active folder, has an up-one-folder control, inline rename, collision checks and a delete guard.
- Desktop uses drag handles. Touch uses a move select, which is the accessible equivalent on a phone.
- Moving a folder rewrites the path prefixes for its contents. Files stay reachable and no orphaned rows are left behind.
- The course picker is shared by Files and Videos and shows the full course name and code.

### 5.2 Path contract

For course `NUT-CSC 312 Data Structures`, selecting a folder named `Week 1` that contains `Slides/Intro.pdf` and `Notes.md` produces:

- `Week 1/Slides/Intro.pdf`
- `Week 1/Notes.md`

The course's resource path is the root. The selected folder's name is the first segment. Every nested folder below it is preserved. The tree shows `Week 1 > Slides > Intro.pdf`. The same contract applies to deep nesting, to rename and to moves within the course.

### 5.3 Audit result

- `/admin/resources` at 390px: document `scrollWidth` 390, no horizontal overflow.
- `/admin/resources` at 320px: document `scrollWidth` 320, no horizontal overflow.
- Folder tree open at 390px: `scrollWidth` 390, no horizontal overflow.
- Folder tree open at 320px: `scrollWidth` 320, no horizontal overflow.
- Both widths show `New folder`, `Upload folder` and `Folder tree` in the visible button list, next to the existing `Sign out` and the `Session 1 - Peace and Conflict Resolution` download.
- The tree opens and its toggle works at both widths. The Files and Videos tabs are present.
- The tree is not the source of the overflow. The remaining mobile work on this surface is polish:
  - At 320px, the theme switch covers the course picker when the tree is closed.
  - The course picker is 250x37 at 320px, uses a 12.5px font and truncates the full name.
  - The tree's actions are among the 35 targets under 44px.
  - The `Choose a folder to upload` label is clipped at 320px when the tree is open.

### 5.4 Regression checklist

Run this before and after the Resources mobile work. The functional items must pass before and after. The 44px, full-name and theme-switch items are the target state for the mobile acceptance. Use a local instance with a disposable test course and folder, and clean up all test data. Do not create test data in production.

- [ ] Both New folder and Upload folder are visible, at least 44px high, and not hidden behind a menu or the theme switch at 390px and 320px.
- [ ] Upload a folder with at least three nested levels. Every file path starts with the selected course's resource path and preserves the selected root and every nested folder.
- [ ] The folder rows exist before the uploads finish, and the tree shows the nested structure.
- [ ] Upload into an existing folder and into a new folder. No files are flattened into the course root.
- [ ] Two files with the same base name in one folder both survive. The duplicate retry uses the full filename.
- [ ] One summary notification is sent for a folder upload, not one per file.
- [ ] Rename a folder that contains files. Paths and file links stay correct, and the tree updates.
- [ ] Move a folder with nested content to another folder in the same course. Path prefixes rewrite, files stay reachable, and no orphaned rows remain.
- [ ] Moving a folder into its own descendant is blocked.
- [ ] Deleting a non-empty folder shows the guard. Deleting after confirmation removes the intended folder and leaves no orphaned files.
- [ ] The up-one-folder control works, and the active folder highlight follows the selection.
- [ ] Desktop drag works. The touch move select works at 390px and 320px. Keyboard focus is visible.
- [ ] The tree is open and closed with no document horizontal overflow at 390px and 320px.
- [ ] The course picker shows the full course name and code at 320px and is not covered by the theme switch.
- [ ] No test data remains.

### 5.5 Optional touch drag

The current touch move select is accessible and works. A long-press drag, or an explicit Move mode with a destination sheet, would make the tree feel closer to moving apps between file manager folders. That is an enhancement, not a fix, and it is not implemented by this plan. It can be approved as a separate phase after the core mobile pass, with its own commit. The existing select stays either way.

## 6. Findings

The priority is about user impact, not visual noise. A P1 means a primary navigation or action is not usable, or the page itself does not fit the viewport. A P2 means a clear mobile usability problem with a workaround. A P3 means cleanup, consistency or a small isolated bug.

| Priority | Finding | Affected route states | Phase |
|---|---|---|---|
| P1 | Public navigation labels are clipped at both widths, and the navigation wrapper causes document overflow at 320px. | All public states | 1 and 2 |
| P1 | Admin navigation labels are clipped at both widths. | All staff states | 1 |
| P1 | The home page is 31px wider than a 320px viewport. Careers is 5px wider and Events is 7px wider. | Home, Careers, Events | 1 and 2 |
| P1 | The fixed next-class dock covers the top breadcrumb on every course and viewer page. | 10 course states and 15 viewer states | 1 |
| P1 | The fixed theme switch covers primary actions on public and admin pages. | Timetable, `csc312-ds`, admin dashboard, announce, resources and the legacy resources redirects | 1 |
| P2 | Tables require horizontal scrolling without a visible affordance. | Timetable, Registration, admin Attendance, `cyb305-sha256` | 2 and 3 |
| P2 | Many controls are under 44px. | Most states | 1, 2 and 3 |
| P2 | Inputs and selects use fonts under 16px. | Home, viewer, admin sign-in and forms | 1 and 3 |
| P2 | The notification bell and panel close are 32x32, and the unread badge overflows the bell. | All states with the header | 1 |
| P2 | The theme switch covers secondary card links. | Careers, Events, not-found, career role cards, inference config | 1 |
| P2 | The Resources course picker is 37px high, uses 12.5px text, truncates the full name and is covered by the theme switch at 320px. | Admin Resources and its redirects | 3 |
| P2 | Long role and course headings wrap without truncation. | Role pages and course pages | 2 |
| P3 | `?tab=videos` and `/admin/videos` select the Files tab. | Admin Resources, Files and Videos | 3 |
| P3 | Settings uses a link nav without `role=tab`. This is correct for two pages, but the links need mobile target sizes. | Settings pages | 3 and 4 |
| P3 | Scroll containers and menus need visible affordances and complete ARIA and keyboard behaviour. | Navigation, tables, menus, panel | 1, 2 and 3 |

### P1.1 Public navigation is clipped at both widths

The public navigation is a horizontal rail. The audit measured 286px visible of 575px of content at 390px, and 216px visible of 575px at 320px. The rail does scroll, but the scrollbar is hidden on phones and there is no edge fade or overflow control.

Clipped labels:

- At 390px: Registration, Resources, Careers, Events.
- At 320px: Calendar, Registration, Resources, Careers, Events.

The active link and the rail's scroll position change the exact clipped set per route. The matrix in Appendix A records it for every state. The labels are technically reachable by swiping the rail, but at rest they look cut off. Most readers will not discover that the navigation continues.

The home page makes this worse. At 320px its document `scrollWidth` is 351px. The audit names the navigation wrapper `div.relative.mx-auto` at right 622px, the Events link at right 622px and the Careers link at right 555px. The wrapper extends beyond the viewport instead of being contained by the rail.

This conflicts with the deliberate design intent in `Nav.tsx`: the site avoids a hamburger because the links are the most used thing in the bar. The plan should preserve that. The recommended pattern is a visible primary row plus a clearly labelled overflow control and edge fades, so the top destinations stay visible and the rest are one tap away. A full hamburger that hides every link is the least preferred option.

Acceptance:

- Every public destination is reachable in at most two taps.
- No primary navigation label is cut off at rest without a visible affordance.
- The navigation does not cause document horizontal overflow at 390px or 320px.
- The top-level links have at least a 44px touch height.
- Keyboard focus and `aria-current` are preserved.

### P1.2 Admin navigation is clipped at both widths

The staff rail is narrower than the public rail. The audit measured 211px visible of 454px of content at 390px, and 141px visible of 454px at 320px.

Clipped labels:

- At 390px: Announce and Settings on `/admin`; Roll, Staff, Announce and Settings on `/admin/attendance` and `/admin/resources`.
- At 320px: Resources, Roll, Staff, Announce and Settings on Attendance and Resources.

The audit also lists the bell's accessible label, `Notifications, 15 unread`, among the clipped controls. That is not a navigation label. The unread badge extends beyond the 32px bell button. It is covered separately in P2.4.

The admin rail has six destinations: Attendance, Resources, Roll, Announce, Settings and Staff. A labelled Menu control with a sheet is a better fit than an invisible horizontal scroll because the admin pages are task-oriented and the destinations are more important than the rail's visual continuity. The public and admin patterns can share the overflow control, or admin can use a Menu control on its own.

Acceptance:

- Every admin destination is reachable at 390px and 320px.
- No admin navigation label is cut off at rest without a visible affordance.
- The bell and Sign out remain visible and reachable.
- The top-level controls have at least a 44px touch height.
- The active destination has a non-colour cue.

### P1.3 The home, Careers and Events pages are wider than 320px

The home page is 351px wide at a 320px viewport. The shared navigation wrapper is the main offender. Careers is 325px and Events is 327px. The audit's overflow element list for those two routes points at the same navigation wrapper, though the wrapper's right edge is 318px on Careers and 263px on Events, so a small page-specific residual may remain after the navigation fix.

The fix is not `overflow-x: hidden` on the body. That hides content and focus rings. The navigation must contain its own wide row, and the page content must be measured again after the fix. The home should be 320px or less. Careers and Events should be re-audited; if the remaining 5px or 7px is a card, badge or date element, fix that element directly.

Acceptance:

- The document `scrollWidth` is less than or equal to the viewport width for every public route at both widths.
- No content or focus indicator is clipped to achieve it.
- The three routes are re-measured after the navigation change, not assumed fixed.

### P1.4 The next-class dock covers course and viewer breadcrumbs

The next-class dock is fixed below the navigation on phones. It is useful and should stay. The problem is that the page content starts underneath it.

- On all 10 course pages, the `All courses` link is at y=112, height 20. The dock covers it at both widths.
- On all 15 viewer pages, the course code link is at y=96, height 20. The dock covers it at both widths.
- On `csc309-foundations-of-ai` at 390px, the Download button is also under the dock at y=96, height 36.

That is 25 of the 56 route states, so this is a shared shell fix, not 25 page fixes. The dock is rendered by `CountdownPill.tsx` as a fixed element with `sm:hidden`; the page has no matching spacer in the flow.

The fix is a phone-only spacer whose height matches the dock plus its offset, rendered only when the dock is present. The dock stays fixed. When there is no next class, no spacer is rendered and no blank gap appears. The viewer header should place the Download below the dock, not beside the course code.

Acceptance:

- No interactive element sits under the dock on any course or viewer page at 390px or 320px.
- `All courses` and the course code are reachable at both widths.
- The Download is a 44px target and is not under the dock.
- The dock remains fixed and visible.
- No blank gap appears when there is no next class.
- Desktop is unchanged.

### P1.5 The theme switch covers primary actions

The theme switch floats at the bottom right on phones and is always live on a coarse pointer. The audit found it covering primary actions:

- `/timetable` at 320px: `Import .ics file`, 64x13 at 187,539.
- `/view/csc312-ds` at 390px: `Download`, 89x32 at 268,771.
- `/admin` staff dashboard at 320px: an input, 280x40 at 20,512.
- `/admin/announce` at 390px: an input, 350x38 at 20,790. At 320px: `Different room`, 110x33 at 146,504.
- `/admin/resources`, `/admin/resources?tab=videos`, `/admin/files` and `/admin/videos` at 320px: the course picker, 250x37 at 35,493.

It also covers secondary card links:

- Careers index at 390px: the Penetration Tester card, 350x135 at 20,714.
- Events at 390px: the 27 OCT TUE Sudocrypt card, 350x342 at 20,670.
- Not found at 390px and 320px: the Academic calendar card and the All courses card.
- Every career role page at 390px: a related course card.
- `cyb305-inference-config` at both widths: code tokens.

The theme switch is 66x36. The current comment in `ThemePill.tsx` says the page's bottom padding keeps it clear of content, but these actions are not at the bottom of the page; they happen to be under the fixed corner at the initial viewport. A fixed overlay will always cover something while scrolling.

The recommended fix is to move the theme switch into the mobile header or the mobile menu, so it is one tap away and no longer floats over the page. A 44px icon beside the bell is acceptable if the header has room. The alternative is to keep it floating but auto-hide it while scrolling down, show it on scroll up, and reserve a bottom safe area. That still covers content at rest and is less reliable. A bottom control bar is a larger change and is not recommended.

Acceptance:

- No primary action is under the theme control on first paint at 390px or 320px.
- The theme control is reachable on every route.
- The theme persists, switches without a flash and is tested in both themes.
- The control is at least 44px in its touch area.
- The pixel-art style is unchanged.

### P2.1 Tables scroll horizontally without a visible affordance

The document itself fits on these routes, but the table lives in a horizontal scroller with no visible hint that more columns exist.

| Route | Table width | Parent |
|---|---:|---|
| `/timetable` | 920px | horizontal scroll at 390px and 320px |
| `/registration` | 666px | horizontal scroll at 390px and 320px |
| `/admin/attendance` | 348px at 390px, 334px at 320px | horizontal scroll, slight overflow at 320px |
| `/view/cyb305-sha256` | 1391px | horizontal scroll at 390px and 320px |

The timetable is the worst case at nearly three times the 320px viewport. It already has a `Perspective` tab beside the `Grid` tab. The Perspective view should be tested at both widths; if it is already a readable card layout, making it the default on phones is a low-risk improvement, while keeping the Grid tab available. If it is not, use a day-card layout or a sticky first column with a visible scroll shadow.

The registration table should use the same approved pattern. The admin attendance table is only slightly wider than 320px; it can fit the column or use a small scroll container with an affordance. The SHA256 viewer table is inherently tabular source data; a visible horizontal scroll with a sticky header is acceptable, as long as the document does not overflow and the data is not reflowed in a way that changes its meaning.

Acceptance:

- The document `scrollWidth` is less than or equal to the viewport.
- Any internal table scroll has a visible affordance, is keyboard reachable and preserves all columns.
- The table data is not hidden or truncated.
- The timetable's Perspective view is tested before it is chosen as a default.

### P2.2 Many controls are under 44px

The raw count includes inline text links, code tokens and other small text. It is not a target of zero. It is a useful baseline for the controls that matter.

| Route | 390px | 320px |
|---|---:|---:|
| `/` | 25 | 25 |
| `/timetable` | 46 | 46 |
| `/careers` | 51 | 51 |
| `/events` | 34 | 34 |
| `/contact` | 38 | 38 |
| `/admin` staff | 51 | 51 |
| `/admin/attendance` | 55 | 52 |
| `/admin/resources` | 35 | 35 |
| `/admin/schedule` | 80 | 80 |
| `/admin/notifications` | 45 | 45 |
| `/admin/settings` | 45 | 45 |

Key targets:

- The notification bell and panel close: 32x32.
- The theme switch: 66x36.
- `Import .ics file`: 64x13.
- The viewer Download: 89x32.
- The Resources course picker: 250x37 at 320px.
- Admin inputs and selects: 37px to 40px high.
- The folder tree toggle, folder rows and file action icons.
- The settings section links: about 32px high.
- The nav links: 32px high.

The rule for this plan is: every primary action and every icon-only control has at least a 44x44 touch area. Inline text links may be smaller if they are readable, but a critical action cannot exist only as a small icon. Table row actions and folder actions get 44px targets through padding or row height, not by growing every glyph.

Acceptance:

- No primary action or icon-only control is under 44x44.
- The nav, menu, bell, panel close, theme control, folder controls and table actions are at least 44px.
- Inline text remains readable.
- The pixel-art proportions are preserved; hit areas grow, not every visual element.

### P2.3 Inputs and selects use fonts under 16px

| Route | Control | 390px | 320px |
|---|---|---|---|
| `/` | Search | 15px, 356x56 | 15px, 286x56 |
| `/view/csc312-ds` | Viewer search | 12.5px, 48x29 | 12.5px, 48x29 |
| `/admin` visitor | Name, code | 14px, 350x40 | 14px, 280x40 |
| `/admin` staff | Email, permissions | 14px, 350x40; 12.5px, 14x14 | 14px, 280x40; 12.5px, 14x14 |
| `/admin/announce` | Course, title, href, body, when | 13px, 13px, 12.5px, 13px, 13px | same fonts, 280px wide except `when` at 210px |
| `/admin/resources` | Course select | 12.5px, 320x37 | 12.5px, 250x37 |

iOS Safari zooms the page when an input under 16px receives focus. That shifts the layout and can hide the field the reader is editing. Even on Android, 16px is the accessible baseline.

The fix is a mobile form baseline: inputs, selects and textareas use at least 16px at the phone breakpoint, with a minimum 44px height. The permissions checkboxes can stay visually small, but their labels become the 44px target. The course select uses 16px and the full course name. The viewer search is 16px with a 44px hit area.

Acceptance:

- No input, select or textarea is under 16px at 390px or 320px.
- Form controls are at least 44px high.
- Checkbox labels are at least 44px high.
- The iOS zoom is not triggered.
- The larger text does not clip labels or values.

### P2.4 The notification bell and panel controls are small

| Viewport | Panel | Scroll | Close |
|---|---|---|---|
| 390px | 358x278 | 276/276 | 32x32 |
| 320px | 288x480 | 478/478 | 32x32 |

The panel fits and does not need internal scrolling with the current content. The bell is 32x32, and its unread badge extends beyond the button, which is why the audit reports `Notifications, 15 unread` among the clipped controls. The close button is also 32x32.

The fix is a 44px bell, a 44px close and a badge that stays inside the button's box or uses a safe inset. The panel keeps its current content, adds a maximum height with scrolling if the list grows, traps focus, closes on Escape and returns focus to the bell. The panel is the only public overlay besides the navigation menu, so its keyboard behaviour should match the menu.

Acceptance:

- The bell and close are at least 44x44.
- The badge does not overflow the bell.
- The panel fits at 390px and 320px.
- Focus is trapped while open, Escape closes it and focus returns to the bell.
- The panel scrolls if its content exceeds the viewport.

### P2.5 The theme switch covers secondary card links

At 390px the theme switch covers the Penetration Tester card on Careers, the Sudocrypt event card on Events, and a related course card on every career role page. At 390px and 320px it covers the Academic calendar card or the All courses card on the not found page. At both widths it covers code tokens on `cyb305-inference-config`.

These are secondary links, not primary actions, so this is P2. The fix is the same as P1.5: move the theme control out of the floating bottom-right position on phones, or reserve enough space that it never covers a card. Moving the control fixes all of these cases at once and is the recommendation.

Acceptance:

- No card link is under the theme control at first paint.
- The not found page's recovery links are clear at both widths.
- The career role cards and event cards are fully tappable.

### P2.6 The Resources folder surface needs mobile polish, not a rebuild

The functional folder workflow passes. The tree opens and closes without document overflow at 390px and 320px. New folder, Upload folder and Folder tree are visible at both widths. The remaining issues are:

- At 320px, the theme switch covers the course picker when the tree is closed.
- The course picker is 250x37, uses a 12.5px font and truncates the course name to `Peace and Conflict Resolution (GST 3...`.
- The tree actions and the file actions contribute to the 35 targets under 44px.
- The `Choose a folder to upload` label is clipped at 320px when the tree is open.

The mobile work should keep the tree prominent and keep both upload paths visible. The top action row can wrap to two rows at 320px: New folder and Upload folder on one line, Folder tree full width on the next. The tree toggle should not be hidden inside a menu. The course picker should be 44px high, use 16px text and show the full course name and code, wrapping to two lines if needed. The tree rows and action icons get 44px targets. The `Choose a folder to upload` label should be a normal full-width button, not a clipped native file input.

This is a P2 because the feature works and the document does not overflow. It becomes a P1 if a mobile change hides the tree or one of the two upload paths. Do not let that happen.

Acceptance:

- The tree is visible and openable at 390px and 320px without a menu.
- New folder and Upload folder are both visible at 390px and 320px.
- The course picker is 44px high, uses 16px text and shows the full course name and code.
- The theme switch does not cover the picker.
- The tree actions and file actions are at least 44px.
- The tree open and closed have no document horizontal overflow.
- The folder regression checklist in section 5.4 passes.
- The folder storage paths and move, rename and delete behaviour are unchanged.

### P2.7 Admin forms, attendance and settings

- The admin dashboard input is 280x40 at 320px and sits under the theme switch. The permissions checkboxes are 14x14.
- The announcement form uses 13px and 12.5px fields. `Different room` is 110x33 at 320px and sits under the theme switch.
- The attendance table is 348px at 390px and 334px at 320px. It is only slightly wider than the 320px viewport, but the parent scrolls without an affordance.
- The settings section links are about 32px high. The notification settings and session breaks pages have many small controls.

The fix is the mobile form baseline from P2.3, plus a 44px target for the permission labels and the announcement controls. The attendance table should fit the column or use a visible horizontal scroll. The settings pages keep their link navigation, which is correct for two separate pages, but the links get a 44px height and a non-colour active cue.

The student attendance view remains tabled. Only the staff attendance page's existing table and controls are in scope.

Acceptance:

- Admin inputs, selects and textareas are at least 16px and 44px high.
- Permission labels are at least 44px high.
- `Different room` and the course picker are 44px and are not under the theme switch.
- The attendance table fits or scrolls visibly.
- The settings links are 44px and keep `aria-current`.
- No student attendance view is added.

### P2.8 Long headings wrap without truncation

At 320px, several role titles wrap to three or four lines: `dfir-analyst` and `grc-analyst` are 144px high, and `appsec-engineer` and `threat-intel-analyst` are 108px. Course titles reach 95px to 127px on some pages. The headings start below the navigation or the dock, and the audit found no document overflow from them.

This is not a truncation problem. The plan keeps the full role and course names, as required. The mobile pass should check line height and spacing after the navigation and dock changes, and should not introduce a clamp or an ellipsis. The heading should remain readable at 320px.

Acceptance:

- Full role and course names remain visible.
- No line clamp, ellipsis or code-only replacement is introduced.
- The heading does not collide with the dock, navigation or first card.
- The line length and leading are readable at 320px.

### P3.1 The Videos tab is not selected from the URL

At 390px and 320px, `/admin/resources?tab=videos` shows `Files 1* | Videos 0`. `/admin/videos` redirects to `/admin/resources` and also shows the Files tab. The same happens on `/admin/files`.

The cause is in `ResourceManager.tsx`: the tab state is initialised to `"files"` and never reads the URL. `/admin/videos` redirects to `/admin/resources` without a tab. The tab markup itself has `role=tablist`, `role=tab`, `aria-selected` and `aria-controls`, so the accessibility structure is mostly there. The panel has an `id` but the tabs do not have matching `id` values for `aria-labelledby`.

The fix is small and isolated:

- Read the `tab` query in the server page or with `useSearchParams`, and initialise the tab from it.
- Update the URL when the tab changes, with `router.replace(..., { scroll: false })`.
- Redirect `/admin/videos` to `/admin/resources?tab=videos`; `/admin/files` can go to `/admin/resources?tab=files` or the plain Resources URL.
- Preserve the selected course when the tab changes.
- Add `id` values to the tabs and `aria-labelledby` to the tabpanel.

This should be its own commit. It is unrelated to the broad mobile redesign and can be fixed first if approved.

Acceptance:

- `/admin/resources?tab=videos` selects Videos at 390px and 320px.
- `/admin/videos` lands on Resources with Videos selected.
- `/admin/files` lands on Resources with Files selected, or the plain Resources URL.
- Reload and browser back and forward preserve the selected tab.
- The selected course is preserved across tab changes.
- The tab list and panel are keyboard operable and correctly labelled.

### P3.2 Settings links and redirects

`SettingsTabs.tsx` uses a `<nav aria-label="Settings">` with links and `aria-current`, not ARIA tabs. That is correct for two separate pages: Notifications and Session breaks. The audit's ARIA tab detector did not find `role=tab` there, and it should not. Do not convert the links to tabs unless the content becomes in-page panels.

The redirects are intentional. The full map is in Appendix B. `/admin/settings` sends the audited super admin to Notifications; a non-super admin should land on Session breaks. That conditional path needs a separate check with a non-super account.

The settings links need a 44px height on mobile. The active state should have a non-colour cue, such as a thicker underline or weight change, in addition to the accent colour.

Acceptance:

- The settings links remain links with `aria-current`.
- The links are at least 44px high.
- The active state is clear without colour alone.
- `/admin/settings` sends a super admin to Notifications and a non-super admin to Session breaks.
- The redirects in Appendix B work at both widths.

### P3.3 Scroll affordances, ARIA and keyboard behaviour

The navigation rail and the table scrollers use horizontal overflow. The rail's scrollbar is hidden on phones. The plan adds:

- Edge fades or a visible overflow control on the navigation rail.
- A visible scroll shadow and a keyboard-focusable wrapper on table scrollers, with an `aria-label` that says the table scrolls horizontally.
- `aria-expanded` and `aria-controls` on the menu and notification panel controls.
- A focus trap in the menu and panel, Escape to close, and focus returned to the trigger.
- A non-colour active state for navigation and settings.
- Reduced-motion handling for the menu and panel.

Acceptance:

- Keyboard users can reach and scroll every horizontal container.
- The menu and panel open and close with the keyboard.
- The active destination is clear without colour.
- Reduced motion is respected.
- Screen readers announce the menu, panel and table scroller correctly.

### Checked and not a bug

- The doubled text in some screenshots is a capture artifact. The DOM check found one visible copy, one main element and no text shadow.
- Settings uses links, not ARIA tabs. That is correct for two pages.
- The navigation rail scrolling horizontally is intentional. The missing affordance is the bug, not the scrolling itself.
- The theme switch existing on phones is intentional. The overlap is the bug.
- `/admin` showing the sign-in screen to a visitor is intentional. The signed-in dashboard is a separate state.
- The admin schedule and notifications redirects are intentional. The Videos tab destination is the only redirect bug.
- `Notifications, 15 unread` in the clipped list is the bell's accessible label. The badge overflow is covered in P2.4, not with the navigation labels.
- Long role and course headings wrapping is not truncation. The full names stay.
- The raw small-target counts include inline text links and code tokens. The 44px rule applies to primary and icon-only controls, not every inline word.
- The audit used the dark scheme only. The light scheme and keyboard behaviour are Phase 4 checks.

## 7. Phased plan

### Phase 0: Audit and plan

This commit. Documentation only. The route matrix, findings and decisions are recorded. No UI code changes. The plan is committed on its own and pushed for review.

Commit message: `docs: add mobile experience audit and phased plan`.

### Phase 1: Shared mobile shell

This phase fixes the problems that appear on most routes. It goes first because it changes the measurements for everything else.

Scope:

- `website/src/components/Nav.tsx`
- `website/src/components/CountdownPill.tsx`
- `website/src/components/ThemePill.tsx`
- `website/src/components/NotificationBell.tsx` and the panel component it opens
- `website/src/app/globals.css`
- The shared layout that renders the navigation, dock and theme control

Work:

1. Implement the approved public navigation pattern from D1. Keep the most-used links visible, add a labelled overflow control and edge fades, contain the wide row, and make every top-level link at least 44px high. Preserve `aria-current` and keyboard behaviour. Remove the document overflow at 320px.
2. Implement the approved admin navigation pattern from D2. Use a labelled Menu or the shared overflow control, with every admin destination reachable. Keep the bell and Sign out visible.
3. Add the phone-only dock spacer from D4. Reserve the dock's measured height only when the dock is present. Keep the dock fixed. Test with and without a next class.
4. Move the theme control out of the floating bottom-right position on phones, or implement the approved alternative from D3. Keep the theme switch reachable on every route and preserve the no-flash theme script.
5. Enlarge the bell and panel close to 44px, keep the badge inside the bell, and add the panel's focus, Escape and maximum-height behaviour.
6. Add the global safe-area and scroll-padding rules so content does not sit under the navigation, dock or menu.

Acceptance:

- Public and admin navigation labels are not clipped without an affordance.
- Every destination is reachable in at most two taps.
- The home page is at most 320px wide at a 320px viewport.
- No course or viewer breadcrumb is under the dock.
- No primary action is under the theme control.
- The bell and close are at least 44px.
- The menu and panel are keyboard operable.
- Desktop is unchanged.

Suggested commits, each independently testable:

- `fix: make public and admin navigation reachable on phones`
- `fix: reserve space for the next-class dock`
- `fix: stop the theme switch covering mobile actions`
- `fix: enlarge the notification bell and panel controls`

Do not split one navigation fix across several commits. The four boundaries above are separate behaviours and can be reviewed and reverted separately.

### Phase 2: Public pages

Phase 2 fixes the public content after the shell is stable. It covers all 44 public states at both widths.

Scope:

- Home, Careers, Events, Contact and the not found page
- Timetable and Registration
- The 15 viewer pages
- The shared cards and the viewer header

Work:

1. Re-measure Home, Careers and Events at 320px. The navigation fix should remove the shared overflow. Fix any remaining 5px or 7px at the specific element, without clipping content.
2. Test the timetable's `Perspective` view at 390px and 320px. If it is a readable card layout, make it the default on phones and keep the Grid tab. Otherwise use a day-card layout or a sticky first column with a visible scroll affordance. Make `Import .ics file` 44px and keep it out from under the theme control.
3. Apply the approved table pattern to Registration. Make every column reachable and the table readable at 320px.
4. Fix the viewer header: the course code is below the dock, the Download is at least 44px and not under the dock or theme control, the viewer search is 16px with a 44px hit area, and the SHA256 table has a visible scroll affordance.
5. Check the career cards, event cards and not found recovery links. They should be fully tappable and not under the theme control.
6. Re-check the long role and course headings after the shell changes. Keep the full names.

Acceptance:

- All 44 public states have `scrollWidth` less than or equal to the viewport at 390px and 320px.
- The timetable and registration tables are readable and complete.
- The viewer Download and course code are reachable at both widths.
- The SHA256 table scrolls visibly and preserves its data.
- No primary or card link is under the theme control.
- The full role and course names are visible.

Suggested commits, grouped by behaviour:

- `fix: contain the public page width at 320px`
- `fix: make the timetable and registration tables readable on phones`
- `fix: give viewer pages a clear mobile action row`
- `fix: make the public cards and not found page fit the phone`

The home, Careers and Events fix may be one commit if the navigation change covers it. Do not create a separate commit for each page when the change is the same shared rule.

### Phase 3: Admin pages and the folder surface

Phase 3 covers the 12 staff states and the folder surface. The folder workflow is already shipped; this phase changes only its mobile layout and targets.

Scope:

- `website/src/components/ResourceManager.tsx`
- `website/src/components/FileManager.tsx`
- `website/src/components/CoursePicker.tsx`
- `website/src/components/VideoManager.tsx`
- `website/src/components/SettingsTabs.tsx`
- The admin dashboard, attendance and announce pages
- The admin settings pages
- `website/src/app/globals.css`

Work:

1. If the admin navigation was not finished in Phase 1, finish it here. Every admin destination is reachable and the bell and Sign out stay visible.
2. Keep the Resources tree first-class. Both New folder and Upload folder stay visible at 320px, the tree toggle is a full-width 44px control, and the top action row wraps instead of hiding a control.
3. Make the course picker 44px high, 16px text and full-name at 320px. Keep it out from under the theme control. Preserve the selected course across tabs.
4. Make the tree rows, folder actions and file actions at least 44px. Keep the tree open and closed free of document overflow at both widths. Make `Choose a folder to upload` a full-width button.
5. Apply the 16px and 44px form baseline to the dashboard, announcement form, attendance controls and settings forms. Make the permission labels 44px.
6. Make the attendance table fit or scroll visibly. Do not add a student attendance view.
7. Keep the settings link navigation. Make the links 44px and the active state clear without colour.
8. Fix the Videos tab as its own commit: initial tab from the URL, URL update on tab change, `/admin/videos` to `?tab=videos`, and the tab and panel labels.

Acceptance:

- All 12 staff states pass at 390px and 320px.
- The folder regression checklist passes.
- The tree is visible and openable without a menu.
- New folder and Upload folder are both visible.
- The course picker shows the full name at 16px and is not under the theme control.
- Every admin input is at least 16px and 44px high.
- The Videos tab is selected from the URL.
- The settings links remain links.
- No student attendance view is added.

Suggested commits:

- `fix: make the admin shell usable on phones` (only if not in Phase 1)
- `fix: keep the folder tree and upload controls first-class at 320px`
- `fix: make admin forms and tables usable on phones`
- `fix: select the Videos tab from the URL`
- `fix: make the settings links usable on phones` (only if the settings work is separate)

The Videos tab fix is isolated. If approved, it can be done first, before Phase 1, as a small bug fix. The folder mobile polish must not change the storage paths, the move and rename rules or the delete guard.

### Phase 4: Verification

Run the whole matrix again after each phase and once at the end.

- 56 route states at 390x844 and 320x568, 112 loads.
- Dark and light schemes.
- Keyboard and touch.
- The public navigation, admin navigation, menu, panel and table scrollers.
- The full folder regression checklist, with cleanup.
- `npx tsc --noEmit`, focused ESLint and `npm run build`.
- No third-party reader-side requests.
- No em-dashes, "Cybersecurity" spelling, full course names, pixel-art style, student attendance view tabled.
- Desktop at 1280px and 1440px, to confirm the mobile controls did not change the desktop layout.
- Production deployment verification after the final UI commit.

Record the after results in this plan or in a follow-up document if the matrix changes enough to need its own file. The after matrix is the evidence for the definition of done.

### Commit boundaries

The plan is one docs commit. Each phase is split at behaviour boundaries that can be reviewed and reverted independently. The user's rule applies: commit each change before starting the next, and do not force artificial commits. The suggested boundaries are:

- Docs plan.
- Public and admin navigation.
- Dock spacer.
- Theme control.
- Bell and panel.
- Public page width and tables.
- Viewer action row.
- Folder surface.
- Admin forms and tables.
- Settings links, only if separate.
- Videos tab, isolated.

Every UI commit runs the focused checks and the affected route sweep before the next change. The full 112-load sweep runs at the end of each phase. No commit bundles the Videos tab with a redesign, and no commit hides the folder tree to make the layout fit.

## 8. Open decisions

The plan is ready to execute, but these choices change the shape of the work. The recommendation is first in each row. If you approve the plan and say "use the recommendations", the plan proceeds with those options.

| ID | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | Public navigation pattern | A: Keep the primary links visible and add a labelled More control with edge fades. B: Wrap the links onto a second row. C: Bottom tab bar. D: Full hamburger. | A. It preserves the current no-hamburger intent, keeps the top links visible and adds only one tap for the overflow links. |
| D2 | Admin navigation pattern | A: A labelled Menu control with a sheet. B: Two-row wrap. C: Bottom tab bar. | A. Six task destinations are easier to scan in a sheet, and the bell and Sign out stay visible. |
| D3 | Theme control | A: Move it into the mobile header or menu. B: Keep it floating, auto-hide on scroll down, show on scroll up. C: A bottom control bar. | A. It removes the fixed corner obstruction instead of trying to reserve space under it. |
| D4 | Next-class dock | A: Reserve its height in the flow with a phone-only spacer. B: Make it collapsible or dismissible. C: Show it only on Home and Timetable. | A. The dock is useful and should stay visible; the page should start below it. |
| D5 | Tables | A: Day cards for Timetable and Registration, visible horizontal scroll for admin Attendance and the SHA256 viewer. B: All tables scroll horizontally with sticky first columns. C: All tables become cards. | A. It uses the right presentation for each content type. Test the existing Perspective view before building a new timetable card layout. |
| D6 | Folder touch movement | A: Keep the current touch move select and add long-press drag later as a separate enhancement. B: Add an explicit Move mode now. C: Add full drag now. | A. The current select is accessible and works; the drag enhancement can be approved on its own after the core mobile pass. |
| D7 | Videos tab | A: Fix it first as a separate small commit. B: Bundle it with the Resources phase. C: Leave it. | A. It is isolated, small and independent of the redesign. |
| D8 | Phase order | A: Phase 1, then Phase 2, then Phase 3. B: Phase 1, then the Phase 3 folder surface, then the rest of Phase 2 and Phase 3. C: Public pages first, then the shell. | A. The shell changes every measurement. If the folder page is the priority, B is a reasonable variation after Phase 1. |

## 9. Acceptance criteria

The mobile pass is done when all of the following are true at 390x844 and 320x568.

- [ ] All 56 route states are loaded, 112 page loads total.
- [ ] Every route has document `scrollWidth` less than or equal to the viewport. Internal table scrollers are allowed and have a visible, keyboard-reachable affordance.
- [ ] The public navigation has no label cut off at rest without an affordance, and every destination is reachable in at most two taps.
- [ ] The admin navigation has every destination reachable, with the bell and Sign out visible.
- [ ] The next-class dock does not cover the `All courses` link, the course code, the Download or any other control.
- [ ] The theme control does not cover a primary action or a card link at first paint.
- [ ] Primary actions and icon-only controls are at least 44x44.
- [ ] Inputs, selects and textareas are at least 16px and 44px high.
- [ ] The notification bell and close are at least 44x44, and the panel fits.
- [ ] The timetable, registration, attendance and SHA256 tables are readable, complete and scroll or wrap visibly.
- [ ] The folder tree is visible and openable at both widths, both New folder and Upload folder are visible, and the full folder regression checklist passes with cleanup.
- [ ] The Resources course picker is 44px, 16px and full-name at 320px.
- [ ] `/admin/resources?tab=videos` selects Videos, and `/admin/videos` lands on Videos.
- [ ] The settings pages keep their link navigation, with 44px links and a non-colour active state.
- [ ] The redirects in Appendix B work at both widths.
- [ ] No third-party reader-side requests or assets are added.
- [ ] "Cybersecurity" spelling is correct, full course names are used, no em-dashes are introduced, and the pixel-art style is unchanged.
- [ ] The student attendance view remains tabled.
- [ ] Desktop at 1280px and 1440px is unchanged except for the intended mobile-only controls.
- [ ] `npx tsc --noEmit`, focused ESLint and `npm run build` pass.
- [ ] The production deployment is verified after the final UI commit.

## 10. Risks and mitigations

- **Navigation changes regress desktop.** Use a phone breakpoint and keep the desktop rail unchanged. Test 1280px and 1440px with the rail's active pill and keyboard focus.
- **The theme switch flashes or disappears.** Keep the existing inline theme script and `ThemeProvider`. The new control must toggle the same state. Test both themes and a hard reload.
- **The dock spacer leaves a gap when there is no next class.** Render the spacer only when the dock is present. Test Home, Offline, Not found, the viewer pages and an admin page with no next class.
- **A folder change breaks the path contract.** Run the full folder regression on a disposable local course and folder. Do not change the storage primitives casually. Clean up all test data.
- **The Videos tab fix changes the initial state.** Test direct load, reload, back and forward, tab clicks and course changes. Keep the selected course stable.
- **A table card layout hides columns.** Preserve all data and provide a table or scroll alternative. Do not drop columns to make the card fit.
- **Growing every target damages the pixel-art rhythm.** Grow hit areas and row heights, not every glyph. Keep the visual proportions.
- **The 320px overflow is hidden instead of fixed.** Do not add `overflow-x: hidden` to the body or main. Find the element and contain it.
- **A mobile change hides the folder tree.** The tree is a hard requirement. Any proposal that moves it into a menu, a modal or a settings panel is rejected.
- **Test data reaches production.** Use a local instance with a disposable course and folder. The production audit stays read-only.

## 11. Approval checklist

- [ ] I approve the 56-state route coverage and the P1, P2 and P3 priorities.
- [ ] D1: public navigation pattern.
- [ ] D2: admin navigation pattern.
- [ ] D3: theme control.
- [ ] D4: next-class dock.
- [ ] D5: tables.
- [ ] D6: folder touch movement.
- [ ] D7: Videos tab.
- [ ] D8: phase order.
- [ ] The student attendance view stays tabled.
- [ ] The folder tree and both upload paths stay first-class.

If the answers are "use the recommendations", the plan starts with D7 as a small isolated fix if approved, then Phase 1. No Phase 1 to Phase 4 code is part of this document or this commit.

## Appendix A: Full route audit matrix

This is the durable 390px and 320px result for every route state. The raw audit output is in the local `mobile-audit` temp folder and is not committed.

Legend:

- `sw`: document `scrollWidth`; `(+n)` is the overflow against the viewport.
- `clip`: labels or controls whose box is clipped by a scrolling parent. The parent's visible and content widths are shown where useful.
- `dock`: a control under the fixed next-class dock.
- `pill`: an interactive element under the fixed theme switch, with its box.
- `table`: table width and the parent's overflow behaviour.
- `small`: count of interactive elements under 44px in either dimension. This includes inline text links and code tokens.
- `h1`: heading top and height. A large height means the heading wrapped, not that it was truncated.
- `->`: redirect target.
- `Notifications, 15 unread` in a clipped list is the bell's accessible label, not a navigation label. The badge overflow is covered in P2.4.
- Long text in the `pill` cells is truncated at 40 characters by the audit. The full labels are in the site's own course and event data.

### A.1 Public states

| Route | 390px | 320px |
|---|---|---|
| `/` | sw 390; clip Registration/Resources/Careers/Events; small 25; h1 y194 h121 | sw 351 (+31); clip Calendar/Registration/Resources/Careers/Events; small 25; h1 y194 h121 |
| `/timetable` | sw 390; clip Registration/Resources/Careers/Events; table 920/auto; small 46; h1 y120 h76 | sw 320; clip Calendar/Registration/Resources/Careers/Events; pill Import .ics file; table 920/auto; small 46; h1 y120 h76 |
| `/timeline` | sw 390; clip Registration/Resources/Careers/Events; small 33; h1 y172 h38 | sw 320; clip Calendar/Registration/Resources/Careers/Events; small 33; h1 y172 h76 |
| `/registration` | sw 390; clip Resources/Careers/Events; table 666/auto; small 35; h1 y120 h38 | sw 320; clip Resources/Careers/Events; table 666/auto; small 35; h1 y120 h76 |
| `/resources` | sw 390; clip Careers/Events; small 28; h1 y120 h37 | sw 320; clip Careers/Events; small 29; h1 y120 h37 |
| `/careers` | sw 390; clip Events; pill Penetration Tester Paid to break int; small 51; h1 y149 h72 | sw 325 (+5); clip Events; small 51; h1 y149 h72 |
| `/events` | sw 390; pill 27 OCT TUE Sudocrypt v16.0 exunclan ; small 34; h1 y149 h36 | sw 327 (+7); small 34; h1 y149 h36 |
| `/contact` | sw 390; clip Registration/Resources/Careers/Events; small 38; h1 y149 h36 | sw 320; clip Calendar/Registration/Resources/Careers/Events; small 38; h1 y149 h36 |
| `/offline` | sw 390; clip Registration/Resources/Careers/Events; small 24; h1 y173 h36 | sw 320; clip Calendar/Registration/Resources/Careers/Events; small 24; h1 y173 h36 |
| `/this-page-does-not-exist` | sw 390; clip Registration/Resources/Careers/Events; pill Academic calendar The 2026/2027 sess; small 23; h1 y196 h65 | sw 320; clip Calendar/Registration/Resources/Careers/Events; pill All courses Every registered course ; small 23; h1 y196 h65 |
| `/careers/soc-analyst` | sw 390; clip Events; pill NUT-CSC 301 Digital Sovereignty: Gov; small 31; h1 y186 h36 | sw 320; clip Events; small 31; h1 y186 h36 |
| `/careers/penetration-tester` | sw 390; clip Events; pill CYB 303 Cybersecurity Risks Analysis; small 31; h1 y186 h36 | sw 320; clip Events; small 31; h1 y186 h72 |
| `/careers/dfir-analyst` | sw 390; clip Events; pill CYB 303 Cybersecurity Risks Analysis; small 31; h1 y186 h108 | sw 320; clip Events; small 31; h1 y186 h144 |
| `/careers/security-engineer` | sw 390; clip Events; pill CYB 303 Cybersecurity Risks Analysis; small 31; h1 y186 h36 | sw 320; clip Events; small 31; h1 y186 h72 |
| `/careers/appsec-engineer` | sw 390; clip Events; pill NUT-CSC 312 Data Structures Jeremiah; small 31; h1 y186 h72 | sw 320; clip Events; small 31; h1 y186 h108 |
| `/careers/cloud-security-engineer` | sw 390; clip Events; pill CYB 301 Cryptography Techniques, Alg; small 31; h1 y186 h72 | sw 320; clip Events; small 31; h1 y186 h72 |
| `/careers/grc-analyst` | sw 390; clip Events; pill NUT-CSC 301 Digital Sovereignty: Gov; small 31; h1 y186 h108 | sw 320; clip Events; small 31; h1 y186 h144 |
| `/careers/threat-intel-analyst` | sw 390; clip Events; pill CYB 303 Cybersecurity Risks Analysis; small 31; h1 y186 h72 | sw 320; clip Events; small 31; h1 y186 h108 |
| `/courses/gst-312` | sw 390; clip Registration/Resources/Careers/Events; dock All courses; small 29; h1 y211 h64 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock All courses; small 29; h1 y211 h64 |
| `/courses/nut-man-315` | sw 390; clip Registration/Resources/Careers/Events; dock All courses; small 38; h1 y211 h32 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock All courses; small 38; h1 y211 h64 |
| `/courses/nut-csc-301` | sw 390; clip Registration/Resources/Careers/Events; dock All courses; small 26; h1 y211 h95 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock All courses; small 26; h1 y211 h127 |
| `/courses/csc-309` | sw 390; clip Registration/Resources/Careers/Events; dock All courses; small 32; h1 y211 h32 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock All courses; small 32; h1 y211 h64 |
| `/courses/nut-csc-312` | sw 390; clip Registration/Resources/Careers/Events; dock All courses; small 32; h1 y211 h32 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock All courses; small 32; h1 y211 h32 |
| `/courses/cyb-301` | sw 390; clip Registration/Resources/Careers/Events; dock All courses; small 26; h1 y211 h95 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock All courses; small 26; h1 y211 h127 |
| `/courses/cyb-303` | sw 390; clip Registration/Resources/Careers/Events; dock All courses; small 26; h1 y211 h95 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock All courses; small 26; h1 y211 h127 |
| `/courses/cyb-305` | sw 390; clip Registration/Resources/Careers/Events; dock All courses; small 32; h1 y211 h64 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock All courses; small 32; h1 y211 h95 |
| `/courses/nut-csc-310` | sw 390; clip Registration/Resources/Careers/Events; dock All courses; small 26; h1 y211 h64 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock All courses; small 26; h1 y211 h64 |
| `/courses/nut-cyb-312` | sw 390; clip Registration/Resources/Careers/Events; dock All courses; small 26; h1 y211 h32 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock All courses; small 26; h1 y211 h32 |
| `/view/gst312-session-1` | sw 390; dock GST 312; small 18; h1 y128 h55 | sw 320; dock GST 312; small 18; h1 y128 h55 |
| `/view/nutman315-intro` | sw 390; dock NUT-MAN 315; small 18; h1 y128 h55 | sw 320; dock NUT-MAN 315; small 18; h1 y128 h55 |
| `/view/nutman315-group-assignment` | sw 390; clip Registration/Resources/Careers/Events; dock NUT-MAN 315; small 25; h1 y128 h55 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock NUT-MAN 315; small 25; h1 y128 h55 |
| `/view/nutman315-proctor` | sw 390; clip Registration/Resources/Careers/Events; dock NUT-MAN 315; small 27; h1 y128 h55 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock NUT-MAN 315; small 25; h1 y128 h55 |
| `/view/csc309-course-outline` | sw 390; clip Registration/Resources/Careers/Events; dock CSC 309; small 25; h1 y128 h28 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock CSC 309; small 25; h1 y128 h28 |
| `/view/csc309-foundations-of-ai` | sw 390; clip Registration/Resources/Careers/Events; dock CSC 309/Download; small 25; h1 y128 h28 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock CSC 309; small 25; h1 y128 h28 |
| `/view/csc312-ds` | sw 390; clip Registration/Resources/Careers/Events; dock NUT-CSC 312; pill Download; small 30; h1 y128 h28 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock NUT-CSC 312; small 30; h1 y128 h28 |
| `/view/csc312-week1` | sw 390; dock NUT-CSC 312; small 18; h1 y128 h55 | sw 320; dock NUT-CSC 312; small 18; h1 y128 h55 |
| `/view/cyb305-course-overview` | sw 390; clip Registration/Resources/Careers/Events; dock CYB 305; small 27; h1 y128 h28 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock CYB 305; small 25; h1 y128 h28 |
| `/view/cyb305-week1-fundamentals` | sw 390; clip Registration/Resources/Careers/Events; dock CYB 305; small 25; h1 y128 h55 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock CYB 305; small 27; h1 y128 h55 |
| `/view/cyb305-readme` | sw 390; clip Registration/Resources/Careers/Events; dock CYB 305; small 27; h1 y128 h55 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock CYB 305; small 27; h1 y128 h55 |
| `/view/cyb305-preliminary` | sw 390; clip Registration/Resources/Careers/Events; dock CYB 305; small 27; h1 y128 h28 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock CYB 305; small 27; h1 y128 h28 |
| `/view/cyb305-sha256` | sw 390; clip Registration/Resources/Careers/Events; dock CYB 305; table 1391/auto; small 25; h1 y128 h28 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock CYB 305; table 1391/auto; small 25; h1 y128 h28 |
| `/view/cyb305-student-template` | sw 390; clip Registration/Resources/Careers/Events; dock CYB 305; small 27; h1 y128 h28 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock CYB 305; small 27; h1 y128 h28 |
| `/view/cyb305-inference-config` | sw 390; clip Registration/Resources/Careers/Events; dock CYB 305; pill 0: {8}/1: {10}/2: {10}; small 89; h1 y128 h28 | sw 320; clip Calendar/Registration/Resources/Careers/Events; dock CYB 305; pill model: {3}; small 89; h1 y128 h55 |
| `/admin` (visitor) | sw 390; clip Registration/Resources/Careers/Events; small 26; h1 y149 h36 | sw 320; clip Calendar/Registration/Resources/Careers/Events; small 26; h1 y149 h36 |

### A.2 Staff states

| Route | 390px | 320px |
|---|---|---|
| `/admin` (staff) | sw 390; clip Announce/Settings; small 51; h1 y149 h36 | sw 320; clip Announce/Settings; pill input; small 51; h1 y149 h36 |
| `/admin/attendance` | sw 390; clip Roll/Staff/Announce/Settings/Notifications, 15 unread; table 348/auto; small 55; h1 y149 h36 | sw 320; clip Resources/Roll/Staff/Announce/Settings/Notifications, 15 unread; table 334/auto; small 52; h1 y149 h36 |
| `/admin/announce` | sw 390; clip Settings/Notifications, 15 unread; pill input; small 36; h1 y149 h36 | sw 320; clip Settings/Notifications, 15 unread; pill Different room; small 36; h1 y149 h36 |
| `/admin/resources` | sw 390; clip Roll/Staff/Announce/Settings/Notifications, 15 unread; small 35; h1 y149 h36 | sw 320; clip Roll/Staff/Announce/Settings/Notifications, 15 unread; pill Peace and Conflict Resolution (GST 3; small 35; h1 y149 h36 |
| `/admin/resources?tab=videos` | sw 390; clip Roll/Staff/Announce/Settings/Notifications, 15 unread; small 35; h1 y149 h36 | sw 320; clip Roll/Staff/Announce/Settings/Notifications, 15 unread; pill Peace and Conflict Resolution (GST 3; small 35; h1 y149 h36 |
| `/admin/schedule` | sw 390; clip Notifications, 15 unread; small 80; h1 y149 h36; -> /admin/settings/breaks | sw 320; small 80; h1 y149 h36; -> /admin/settings/breaks |
| `/admin/notifications` | sw 390; clip Notifications, 15 unread; small 45; h1 y149 h36; -> /admin/settings/notifications | sw 320; small 45; h1 y149 h36; -> /admin/settings/notifications |
| `/admin/settings` | sw 390; small 45; h1 y149 h36; -> /admin/settings/notifications | sw 320; small 45; h1 y149 h36; -> /admin/settings/notifications |
| `/admin/settings/notifications` | sw 390; small 45; h1 y149 h36 | sw 320; clip Notifications, 15 unread; small 45; h1 y149 h36 |
| `/admin/settings/breaks` | sw 390; clip Notifications, 15 unread; small 80; h1 y149 h36 | sw 320; small 80; h1 y149 h36 |
| `/admin/files` | sw 390; clip Roll/Staff/Announce/Settings; small 35; h1 y149 h36; -> /admin/resources | sw 320; clip Roll/Staff/Announce/Settings; pill Peace and Conflict Resolution (GST 3; small 35; h1 y149 h36; -> /admin/resources |
| `/admin/videos` | sw 390; clip Roll/Staff/Announce/Settings; small 35; h1 y149 h36; -> /admin/resources | sw 320; clip Roll/Staff/Announce/Settings/Notifications, 15 unread; pill Peace and Conflict Resolution (GST 3; small 35; h1 y149 h36; -> /admin/resources |

The staff `/admin` row is the signed-in dashboard. The public `/admin` row above is the visitor sign-in. The Resources, `?tab=videos`, Files and Videos rows all show the Files tab at both widths; that is the P3.1 bug. The redirect destinations are in Appendix B.

## Appendix B: Redirect map

| Source | Destination | Expected state | Audit result |
|---|---|---|---|
| `/admin/settings` | `/admin/settings/notifications` | Notifications for a super admin; Session breaks for other staff | Correct for the audited super admin. Verify the non-super destination in Phase 4. |
| `/admin/schedule` | `/admin/settings/breaks` | Session breaks | Correct |
| `/admin/notifications` | `/admin/settings/notifications` | Notification settings | Correct |
| `/admin/files` | `/admin/resources` | Files tab | Correct destination; the tab is implicit |
| `/admin/videos` | `/admin/resources` | Videos tab | Bug: lands on Files. Should go to `/admin/resources?tab=videos`. |
| `/admin/resources?tab=videos` | Same route | Videos tab | Bug: the query is ignored and Files is selected. Fix in P3.1. |

The redirects are intentional. The only redirect bug is the lost Videos tab. The old `/admin/schedule` and `/admin/notifications` pages are now sections under Settings, and the audit treats their redirects as route states.

## Appendix C: Evidence and production baseline

- Production: `https://nutmcybersecurity.vercel.app`.
- Deployment: `dpl_5AcznJRDssgp2aD8ovkzxieWNeBa` from commit `894f93c`, Ready and aliased.
- Vercel project: `nutmcybersecurity`, root directory `website`, team `geek-guys-projects`.
- Audit: 56 route states, 44 public and 12 staff, at 390x844 and 320x568, 112 page loads.
- Browser: Chrome, headless. Dark scheme. Service workers blocked. Production data. Read-only.
- Staff pages used the staff account. The code is not recorded in this document.
- Raw audit files: `mobile-audit/audit-table.md`, `mobile-audit/audit-findings.md`, `mobile-audit/audit.json` and `mobile-audit/audit-progress.log` under the local temp folder `C:/Users/HomePC/AppData/Local/Temp/opencode/`. They are not committed. Appendix A is the durable matrix.
- The folder flow test was separate from the audit. It verified nested uploads, duplicate names, the summary notification, move, rename, the delete guard and cleanup. It left no test data.
- The doubled text in some screenshots is a capture artifact. The DOM check found one visible copy, one main element and no text shadow.
- The build checks at `894f93c` passed: `npx tsc --noEmit`, focused ESLint and `npm run build`. The existing `listPending` warning is pre-existing and unrelated.
- This plan is documentation only. It does not change the production UI. The production site remains the verified folder deployment above until an approved UI phase is merged.

The after-audit uses the same 56-route matrix, adds the light theme and keyboard checks, and records the folder regression. The plan is complete when the acceptance criteria in section 9 are met and the user approves the phase results.
