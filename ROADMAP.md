# Design System & Roadmap — Cybersecurity 300L

Status: P0 and P1 complete. Artifacts: `website/src/app/globals.css` (tokens +
primitives), `website/src/components/Wordmark.tsx` (identity),
`website/src/components/PixelArt.tsx` (the mark), `website/src/lib/calendar.ts`
(session truth).

## 1. Art direction

The subject is a Nigerian university's cybersecurity department, 300 level,
first semester. The visual world is **the terminal at 2am**: black ground, one
green signal colour, monospace for anything that is an identifier, and pixel art
as the mark. Nothing decorative that isn't also informative.

Rejected defaults, deliberately:
- Warm cream + terracotta (the house "AI" palette) — not used.
- A card grid as the primary layout — courses are a reference, not a pitch.
- Index numbering (`01 / 02`) — position already encodes order.
- Eyebrow labels above every heading — the heading says it.

## 2. Tokens

| Role | Value | Use |
| --- | --- | --- |
| Ground | `#000000` | page |
| Surface | `#0a0a0a` | cards, nav, footer |
| Surface hover | `#141414` | hover only |
| Surface raised | `#1a1a1a` | selected, sticky header |
| Border | `#1f1f1f` | hairlines (structure, not decoration) |
| Ink | `#ffffff` | headings, body |
| Muted ink | `#9a9a9a` / `#6b6b6b` | secondary, tertiary |
| Accent | `#22c55e` | actions, course codes, active state |
| Accent ink | `#04140a` | text on accent |

Category tones exist because the calendar has five real categories:

| Category | Token | Hex |
| --- | --- | --- |
| Academic | `--tone-academic` | `#22c55e` |
| Exams & Results | `--tone-exams` | `#f59e0b` |
| Holidays & Breaks | `--tone-holiday` | `#64748b` |
| Statutory Meetings | `--tone-statutory` | `#60a5fa` |
| Ceremonies | `--tone-ceremony` | `#c084fc` |

Type: Geist Sans only, four steps — `clamp(2.5rem,7vw,4.5rem)` display,
`1.5rem` section, `1rem` body, `0.75rem` label. Negative tracking on display
(`-0.03em`), wide tracking on labels (`0.12em`). Tabular numerals
(`.tnum`) everywhere a column aligns.

## 3. Motion primitives (globals.css)

| Class | What it does | Why |
| --- | --- | --- |
| `.card-lift` | `translateY(-4px)` + shadow bloom on hover | Apple card hover; gated behind `@media (hover:hover) and (pointer:fine)` so touch doesn't get sticky hover |
| `.pressable` | `scale(0.98)` on `:active` | feedback on pointer-down, not release |
| `.row-hover` | 2px slide + tone step | list rows read as selectable, not as buttons |
| `.rise` | 14px rise + fade, staggered 40–90ms | section entrances; transform+opacity only |
| `.pulse-ring` | expanding green ring | the "today" marker on the calendar |
| `.fill-x` | scaleX progress fill | session-progress bar |

Easing is custom, not the CSS defaults: `--ease-out: cubic-bezier(0.23,1,0.32,1)`.
Durations: 130ms press, 200ms base, 320ms entrances. All under 300ms for UI.

Reduced motion: travel is removed, opacity feedback is kept, `.rise` renders
visible immediately. Nothing is hidden if scripts fail.

## 4. Components

- **`Wordmark`** — shield glyph + "Cybersecurity 300L" + "NUTM · APAPA". Used in
  nav and footer so identity is never re-drawn.
- **`PixelArt`** — inline SVG, 58×42 grid, 1034 rects. Crisp at any size, no
  raster decode, no CLS. Uses `shape-rendering="crispEdges"`.
  Palette is tuned for a pure-black ground (greys sit at `#8a8a8a`→`#3d3d3d`),
  otherwise the silhouette vanishes into the background.
- **`ui/table`** — `TableFrame`, `DataTable`, `Thead` (sticky, blurred edge), `Th`,
  `Tr`, `Td`, `DayGroup`. Real tables get real table treatment.
- **`ResourceModal`** — self-hosted pdf.js worker at `/pdf.worker.min.mjs`.

## 5. PDF viewer — the bug and the fix

**Symptom:** `Setting up fake worker failed: Failed to fetch dynamically
imported module: http://unpkg.com/pdfjs-dist@6.3.289/legacy/build/pdf.worker.min.js`

**Cause:** two faults stacked.
1. `pdfjs-dist` v6 ships an **ESM** worker (`pdf.worker.min.mjs`); the v4 `.js`
   path does not exist, so the CDN returned 404.
2. The URL was hardcoded to `http://` (mixed content) and depended on a third
   party at runtime.

**Fix:** copy `node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs` into
`public/` and set `GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"`.
Same-origin, version-locked to the installed package, works offline and on
Vercel.

Also in this pass: page navigation (arrows + buttons), responsive width,
focus management, scroll lock, Esc to close, and a non-PDF state that says what
to do instead of showing a broken frame.

## 6. Tables

Both tables were rebuilt. Before: border-riddled `<table>`, unit total as a
stray paragraph, no grouping. After:

- **Timetable** — grouped by day with a `DayGroup` header row carrying a count;
  course codes are live links to their resource pages; tabular numerals on
  time/units; venue and lecturer columns; a totals row inside the table.
- **Registration** — three summary tiles (core units / service units / total)
  above the table; programme split visibly; a files column that shows a muted 0 when
  a lecturer hasn't uploaded; totals row.

## 7. Priorities

| Priority | Feature | State |
| --- | --- | --- |
| P0 | Courses, search, resources, batch ZIP, PDF preview | Done |
| P1 | **Academic calendar timeline** | Done — countdown strip, session progress rail with a today marker, month rail, category colour spine, per-event status (Done / Today / In Nd) |
| P2 | Cybersecurity news via open RSS | **Done** — `/news` parses eight feeds server-side with `fast-xml-parser`, caches hourly via `cacheLife`, never breaks on a dead feed, no third-party requests from the reader |
| P3 | Certification deals, competitions, role pathways | **Done** — `/careers` carries eight roles, fifteen certifications with indicative cost bands and how to pay less, and twelve practice platforms. Four new pixel motifs |
| P4 | Prospective-role resources | **Done** — `/careers/<role>` names the courses on this programme that feed each role and links to each one, with the route in, the certifications that count and where to practise |
| P5 | Events feed | **Done** — `/events` carries a live CTFtime competition list fetched server-side and cached hourly, the department's own calendar, and the events that happen every year |
| P6 | Admin CMS upload | **Done** — `/admin` uploads a file to a course without a rebuild. The file goes to Supabase Storage, the index to the `files` table, and the index is tagged so the course page, the search and the counts pick it up. `/api/files` is the endpoint the manifest used to be |
| P7 | **Attendance** | **Done** — `/admin` behind one shared staff code. One box per class per student; the fill is the record (null is unmarked, 0 is absent, 0.5 is partial, excused is a third state). Supabase `thehood-cms`, RLS on with no policies, service role server-only. See section 9 |

## 8. Rules held throughout

- No gradients, no glows, no glass. Shadows only on things that float — the
  sticky header, a raised card, the focused row on the calendar — never on
  something sitting still on the page.
- Surfaces separate by tone step, never by a decorative rule.
- Headlines two lines or fewer at every width.
- No monospace except identifiers and course codes — that is code-like data.
- One typeface.
- Every interactive element has a visible `:focus-visible` ring.
- Icons carry meaning or are omitted; never decorative filler.

## 9. Attendance (built)

**The idea, as given:** in the admin CMS, staff fill a box per class. What a
student missed is inferred from which boxes are filled and which are not, and
the student can then see their own attendance without asking anyone.

**Why a box is the right primitive.** The fill *is* the record: there is no
separate attendance row to keep in sync. An unfilled box is also visibly empty
rather than absent, which is the difference between "missed" and "nobody has
entered anything yet". That distinction has to survive into the data, or the
student-facing view will accuse people of missing classes that were never
marked.

### What it became

The staff area lives at `/admin`, behind one shared code. The attendance grid
is at `/admin/attendance`: rows are students, columns are the classes in a
week, and each cell is one box.

- **The box is drawn in pixels, like everything else here.** No icons. An
  unmarked box is an empty outline. An absent one carries a bright cross. A
  partial mark fills the box to the level that was marked. An excuse is a flat
  bar. The distinction between "nobody has marked this" and "this person was
  not there" is visible before a word is read.
- **The grid is flat.** It is a table, and tables on this site stay flat.
- **Standing** is the percentage of the classes that were actually marked. A
  session nobody marked is not in the denominator, because an unfinished week
  must not become a bad mark for a student.

### The questions, answered

1. **Identity.** One code per person, no accounts. The sign-in is a name and
   a code, the code is kept only as a scrypt hash and shown once, and a mark
   records the name of whoever made it. A shared code could not say who did
   what, and could not be taken back from one person without taking it back
   from all of them. The students themselves are identified by matric number
   only.
2. **Who marks.** The department, each member with a code of their own. Every
   write is recorded as `marked_by` and logged.
3. **Granularity.** One box per weekly meeting, which is what attendance
   thresholds are counted against. A course that meets twice has two columns a
   week, because the count of boxes has to match the count of classes.
4. **Visibility.** Admin-only for now. The student-facing view is not built,
   because it needs the real roster first and the roster is the privacy
   decision that has not been made yet.
5. **Correction.** Every change is written to `attendance_log` with what it
   replaced, in the same transaction as the change itself. A silently edited
   attendance record is worse than a wrong one.

### Where the data lives

Supabase project `thehood-cms`, three tables: `roster`, `attendance` and
`attendance_log`. Row level security is on with no policies and the tables
are revoked from `anon` and `authenticated`, so the only way in is the site's
own server code using the service role. The service role key never reaches
the client bundle, and the build was checked for that.

**The roster is in the database, not in the repository.** This site is public
and a student list committed to git is a student list published. The roster is
entered by staff behind the code and read by the server only.

### Rules it obeys

- Attendance is personal data. It goes behind auth, never on a public page, and
  never into the client bundle.
- "Missed" is a loaded word for something a student did not choose. The copy
  says "not recorded" and "absent" and lets the number carry the weight.
- The threshold a university counts against (commonly 70 or 75 percent) belongs
  in the copy, so a student can see where they stand without asking.
