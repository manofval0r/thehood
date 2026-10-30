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

## Decisions (resolved 30 Oct 2026)

All four blocking questions are answered below from code evidence, not from
taste. Each one names the file that settles it.

### 1. Scope: the board is a view of the existing bulletin, never a replacement for it

`BulletinBoard3D` is imported in exactly one place, `app/bulletin/page.tsx`.
The landing page imports the 2D `BulletinBoard` instead. So the board is
already scoped to `/bulletin`, and the landing stays as it is.

The finding that changes the build: **`/bulletin` currently loses every
operation the landing board has.** The 3D board receives `feed` and renders
notes. It has no verification gate, no RSVP, no meeting-link reveal, no
WhatsApp share, no Outlook health line, no archive link, no refresh, no lead
lane and no priority channel. Those all live in `components/BulletinBoard.tsx`.
`/bulletin` is the page a student opens when something is wrong, and it is the
one page that showed the least truth.

So the board becomes a **view mode inside `BulletinBoard.tsx`**, which already
owns filter state, the verified flag, refresh, health and the archive toggle.
The board is fed the `visible` items that component already computed. Nothing
is reimplemented and nothing is lost. `fullPage` keeps meaning "show every
item rather than the first eight".

### 2. Mobile: the canvas is not mounted at all below `md`

three.js, drei and framer-motion are a heavy bundle, and `PRODUCT.md` holds
the page to 390x844 and 320x568. The current build mounts the `Canvas` at every
width and then covers it with a `md:hidden` 2D overlay, so a phone downloads
and renders a WebGL scene nobody can see. The `useState` on line 157 that was
meant to detect a small window is also wrong: a `useState` initializer cannot
register a listener, and the cleanup it returns is discarded.

The canvas is therefore gated on all three of: width at or above `md`, WebGL
available, and no `prefers-reduced-motion`. It is loaded with
`next/dynamic({ ssr: false })` from inside the client component, which is the
only place Next 16 allows that flag, so three.js is fetched when the reader
asks for the board view and never on first paint. Phones get a 2D board in the
site's own flat language.

### 3. Filters: use the canonical vocabulary, and delete the drifting copy

`lib/bulletin-ui.ts` already defines `BulletinFilter` as
`all | today | classes | deadlines | events | notices`, with
`filterBulletinItems` as the single implementation. The 3D board re-derived
all of it inline and got three things wrong:

- **"today" used `toISOString().slice(0, 10)`, which is the UTC day.** The
  cohort runs on Africa/Lagos, and the canonical helper uses `lagosDay()`.
  A note can sit in the wrong day on both sides of midnight.
- **"classes" filtered on `kind === "class"` only, which drops cancellations.**
  A cancellation is emitted as `kind: "alert"` in `lib/bulletin-feed.ts`, so
  the one class note a student most needs to see was hidden behind the Classes
  filter. The canonical rule is `kind === "class" || kind === "alert"`.
- **It invented an "alerts" channel and had no "notices" channel**, so
  `notice` and `resource` items were unreachable.

The two "remove" ideas are hides, not channels, so they are checkboxes that
compose with the selected channel rather than more tabs. "Remove lectures"
hides `kind === "class"`; "remove in-person" keeps only items with no
`location`. `meetingUrl` stays redacted: it is deleted from `BulletinItem`
before the type is built, so the board cannot show it by accident.

### 4. Colours: the existing tone tokens, with a text label on every note

`globals.css` already carries five theme-aware category tones:
`--tone-academic`, `--tone-exams`, `--tone-holiday`, `--tone-statutory`,
`--tone-ceremony`. They are the site's one colour vocabulary for categories, so
the notes use them rather than a second rainbow:

| `kind` | Token | Register |
| --- | --- | --- |
| `class` | `--tone-academic` | the teaching day |
| `deadline` | `--tone-exams` | assessments |
| `event` | `--tone-ceremony` | department events |
| `notice` | `--tone-statutory` | official notices |
| `resource` | `--tone-holiday` | reference material |
| `alert` or `urgent` | alert red | with an explicit "Urgent" label |

Colour is never the only signal, so every note also carries its kind as text,
which is the same rule the calendar follows.

### On the cork itself

`ROADMAP.md` section 1 rejects warm cream and terracotta as a default, and a
literal cork board is that palette. So the board keeps the cork board's
*reading* and loses its *material*: notes stay pinned pieces of paper with a
small deterministic tilt and a pixel pin, but the ground is the site's own
surface and border, and the notes sit in the canonical order the feed already
sorted them into. Random placement was thrown away twice over: it destroyed
the pinned, urgent, live, chronological order that `sortBulletinItems`
exists to produce, and `Math.random()` in render means the same feed can land
in different places on a re-render.

Motion is a hover lift only. The old board turned every note continuously,
which is a battery cost, a reduced-motion violation, and movement that carries
no information on an operational page.

## Status

Decisions resolved above. Implementation follows this document.
