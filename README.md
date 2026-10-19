# Cybersecurity 300L — Course Resource Hub

Course resources for **NUTM Cybersecurity 300 Level, First Semester 2026/2027**.

Students can browse the ten registered courses, search across both courses and
individual files, preview PDFs in a dialog, and batch-download selections as a
single ZIP. The weekly timetable and the course registration list are also
printable and downloadable.

Built with **Next.js (App Router) + Tailwind v4** in `website/`, deployed on
**Vercel**.

![The hooded figure at a laptop](website/public/wallpaper-1920x1080.png)

## Layout

```
.
├── courses/                 # your original source folders
├── docs/                    # source timetable + registration PDFs
└── website/                 # the Next.js app — point Vercel here
    ├── src/
    │   ├── app/             # routes
    │   ├── components/      # UI
    │   ├── hooks/           # useCountdown
    │   └── lib/             # resources, calendar, schedule, ics
    ├── tools/               # generators (see Artwork)
    └── public/
        ├── courses/         # served file copies — this is what users download
        ├── docs/            # served timetable + registration PDFs
        ├── wallpapers/      # generated, see Artwork
        └── favicon.png      # generated, see Artwork
```

`website/public/` is what the site serves. The repo-root `courses/` and `docs/`
are your originals — copy new files into `website/public/` to publish them.

## Run locally

```bash
cd website
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the build
```

## Pages

| Route | What it does |
|---|---|
| `/` | All ten courses, live countdown to the next class, search across courses **and files** |
| `/courses/<slug>` | Course detail, resource type filters, PDF preview dialog, batch download |
| `/timetable` | Weekly timetable, today marked, running class marked, printable. Grid or Perspective view |
| `/registration` | The registration list, printable |
| `/timeline` | Academic calendar with a draggable session rail, category filters, `.ics` download |
| `/resources` | Papers, lecture channels, practice platforms and tools |
| `/contact` | Who teaches each course, when and where, and how to reach them |
| `/calendar.ics` | The whole session as an importable calendar file |
| `/sitemap.xml`, `/robots.txt` | Generated from `src/app/` |

## Adding a resource

There is no admin interface yet, so resources are added in the manifest.

1. Put the file in `website/public/courses/<Course Folder>/`.
2. Add one entry to `website/src/lib/resources.ts` under that course's
   `resources` array:

```ts
{
  id: "csc309-lecture-1",
  title: "Lecture 1 – Intro to AI",
  type: "pptx",          // "pdf" | "pptx" | "xlsx" | "doc" | "other"
  url: "/courses/Artificial Intelligence/Lecture 1 – Intro to AI.pptx",
},
```

3. Commit and push. Vercel redeploys.

`resources.ts` is the single source of truth the site reads. A future admin CMS
would write to the same data rather than replace the shape of it.

### A course that meets twice

Give the course an `extraSessions` entry. Do not add it on the timetable page:

```ts
extraSessions: [{ day: "Monday", time: "10:00am - 12:00pm", venue: "PG 2" }],
```

The timetable used to carry its own copy of every slot, which meant a session
could exist in one place and not the other. CYB 303 meets on Wednesday, and
adding Monday 10:00am only to the timetable would have left the countdown, the
navbar clock and the venue counts all believing that class does not happen.
Everything now derives from the manifest: `SCHEDULE` in `src/lib/schedule.ts`
emits both the primary slot and any extras, and the timetable, the countdowns
and the "how many sessions in this room" figures all read it.

## The timetable, two ways

**Grid** is a real table, because a week of teaching is a lookup and a lookup
wants aligned columns. It is the default and it is what prints.

**Perspective** reuses the academic calendar's depth language on a different
axis. There, `--d` is distance from whatever the rail is pointing at, and
opacity and scale fall off with it. On the timetable `--d` is hours from the
nearest session in the week, so the class that is running or next holds full
strength and the rest recede behind it.

Two details that are load-bearing:

- **The code column is sized, not wrapped.** A status chip appears and
  disappears with the day, and a column that reflows when it does is a grid
  whose rows shift under the reader mid-schedule.
- **The depth rows use `.settle-move`, not `.settle`.** A filled animation on
  `opacity` pins it at its final keyframe forever, outranking every later
  declaration, so a card using `.settle` could never be faded by the depth rule
  no matter what that rule said. `.settle-move` is the same entrance without
  the fade.

The choice is remembered in `localStorage` and restored after mount, never
read during render, or every reader who picked a view would see a flash of the
other one.

## Deploy to Vercel

1. Push this repository.
2. **New Project → import the repo → Root Directory = `website`**. Framework
   preset is auto-detected.
3. Set `NEXT_PUBLIC_SITE_URL` to the deployed origin, so the sitemap and the
   `robots.txt` do not advertise the placeholder domain.
4. Deploy. Every push to `main` redeploys.

## Design

Dark is the brand and the default. Light mode re-points the tokens rather than
overriding utilities one at a time, so a new component is theme-correct for
free by using the tokens and nothing else.

- **Ground** `#000000`, **surface** `#0a0a0a`, **accent** `#22c55e`
- **Type** Geist Sans throughout
- The accent becomes `#15803d` in light mode. `#22c55e` is legible on black
  and fails contrast on white, so one accent cannot serve both grounds. The
  five category tones are darkened for the same reason.
- **Cards** carry a cursor-tracked 3D tilt and spotlight wherever they appear:
  the course grid, resource cards, the contact directory, the registration
  summary tiles and the study resources page. The registration and timetable
  tables stay flat on purpose; a data grid that leans is a grid you cannot
  scan. Two structural rules are easy to break: the tilt element must be the
  direct child of the perspective wrapper, and it must not set `overflow`,
  because any overflow makes the browser flatten `transform-style` and collapse
  the depth.
- **Entrance animations use `translate` and `scale`, never `transform`.** A
  filled animation on `transform` outranks later declarations in the cascade
  and would pin the card flat forever.
- The theme is applied by an inline script in `<head>`, before first paint, so
  a light-mode reader never sees a flash of dark.
- The light/dark switch floats below the header rather than sitting inside it.
  The navbar was already carrying six things, and a fixed control outside the
  bar cannot change the bar's geometry as the page scrolls.

## Contacting the reps

`website/src/lib/contact.ts` holds the only thing the manifest cannot know:
the email addresses. It ships with both fields empty, and the site behaves
correctly while they are:

- `/contact` lists every course with its lecturer, day, time and venue, read
  from the same manifest as the timetable, and says plainly that no address is
  published yet.
- Courses whose lecturer is not assigned show "Lecturer to be announced"
  rather than the raw `Pending` in the data.
- No mail link renders until an address exists.

To switch it on, set `REPS_EMAIL` to a shared inbox, and/or add per-rep
addresses to `REP_EMAILS` keyed by course code. Nothing else changes.

## Artwork

The hooded figure is defined as geometry, not drawn by hand. Shapes live in
`website/tools/pixelart-gen.js`; the grid inside `src/components/PixelArt.tsx`
is generated from them, so the two cannot drift.

```bash
cd website
node tools/pixelart-gen.js --write   # regenerate the grid in PixelArt.tsx
node tools/gen-wallpapers.js         # render wallpaper PNGs
node tools/gen-icons.js              # render favicon + apple-touch-icon
node tools/check-calendar.js         # assert the calendar parses and sorts correctly
```

`check-calendar.js` exists because a date range crossing a year boundary once
parsed to the wrong year and silently sorted to the wrong part of the session.
Nothing threw and the row count stayed correct; it was only visible by reading
the rendered order.

## The countdown

A split-flap clock, in the navbar and on the homepage.

One flap per digit, which is the only way the effect reads correctly. Measured
on the loaded font, a Geist digit is `0.663em` wide by `0.73em` tall — wider
than it is tall, so two digits side by side are about 1.83× the height of one.
Any card wide enough for both is far wider than tall, the digits end up small
in the middle of it, and the fold line crosses empty space. The first version
did exactly that and read as two numbers flipping up and down.

Giving each digit its own flap makes the flap nearly square, which lets the
digit fill it. Geometry, all derived from those metrics:

```
flap-h        the card height
line-height   = flap-h            centres the digit in the card
font-size     = flap-h * 1.18     cap height of flap-h * 0.86
flap-w        = flap-h * 0.92     the 0.91 digit aspect plus side bearing
```

The bottom half is the same glyph shifted up by half its height, which is what
shows the lower half of the character. The two turning halves are offset by
half a duration so they move in sequence, and both darken as they turn, which
is most of what makes the rotation read as a rotation.

The days group is omitted below 24 hours. A leading `00` reads as a real
quantity and makes an afternoon feel like a deadline.

## Data sources

- `src/lib/resources.ts` — courses, their weekly sessions and their files. The
  manifest.
- `src/lib/calendar.ts` — the academic calendar, parsed from the Registrar's
  published Unified Academic Calendar. `tools/check-calendar.js` validates it.
- `src/lib/schedule.ts` — the teaching timetable, derived from the same course
  records, and used by the countdowns and by the timetable page.

## Study resources marks

The marks on `/resources` are drawn per kind rather than fetched from each
site's favicon. Twenty-odd favicon requests would tell every one of those sites
who was reading, and would break the page for anyone offline or behind a
captive portal. Drawing them also says more: not "this is arXiv" but "this is
where you read papers", which is the distinction the reader is actually making
while scanning.

## Not implemented

Deliberately left out, and why:

- **Recurring weekly lectures in the `.ics`.** Would require inventing term
  start and end dates. A subscription that ignores exam week and public
  holidays is worse than no subscription.
- **A news or RSS feed.** Depends on the network at build time and adds nothing
  a student needs to find a lecture note.
- **Admin CMS.** Needs an auth decision that has not been made.

Built by [Valor](https://davidowu.tech).
