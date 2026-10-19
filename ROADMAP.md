# Design System & Roadmap — Cyber-Security 300L

Status: P0 and P1 complete. Artifacts: `website/src/app/globals.css` (tokens +
primitives), `website/src/components/Wordmark.tsx` (identity),
`website/src/components/PixelArt.tsx` (the mark), `website/src/lib/calendar.ts`
(session truth).

## 1. Art direction

The subject is a Nigerian university's cyber-security department, 300 level,
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

- **`Wordmark`** — shield glyph + "Cyber-Security 300L" + "NUTM · APAPA". Used in
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
  above the table; programme split visibly; a files column that shows a dash when
  a lecturer hasn't uploaded; totals row.

## 7. Priorities

| Priority | Feature | State |
| --- | --- | --- |
| P0 | Courses, search, resources, batch ZIP, PDF preview | Done |
| P1 | **Academic calendar timeline** | Done — countdown strip, session progress rail with a today marker, month rail, category colour spine, per-event status (Done / Today / In Nd) |
| P2 | Cyber-security news via open RSS | Next — parse server-side with `fast-xml-parser` (already installed), `revalidate` hourly, no API keys |
| P3 | Certification deals, competitions, role pathways | Next — curated static cards; CTFtime and cert-vendor feeds where licences allow |
| P4 | Prospective-role resources | Next — link each role to the courses that feed it |
| P5 | Events feed | Planned |
| P6 | Admin CMS upload | Planned — replaces `resources.ts` with a real endpoint |

## 8. Rules held throughout

- No gradients, no glows, no glass, no shadows on things at rest.
- Surfaces separate by tone step, never by a decorative rule.
- Headlines two lines or fewer at every width.
- No monospace except identifiers and course codes — that is code-like data.
- One typeface.
- Every interactive element has a visible `:focus-visible` ring.
- Icons carry meaning or are omitted; never decorative filler.