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
| `/courses/<slug>` | The course, its workspace of files and folders, and its videos |
| `/view/<id>` | The viewer: a deck, a document, a table, a message, all read in the browser |
| `/timetable` | Weekly timetable, today marked, running class marked, printable. Grid or Perspective view |
| `/registration` | The registration list, printable |
| `/timeline` | Academic calendar with a draggable session rail, category filters, `.ics` download |
| `/resources` | Papers, lecture channels, practice platforms and tools |
| `/careers` | The eight jobs this programme feeds, the certifications that count, where to practise, and the week's security news |
| `/careers/<role>` | One job in depth, and the courses here that feed it |
| `/events` | The competitions you can enter from here, the department's calendar, and the events that happen every year |
| `/admin` | The staff area, behind one code per person. The roll, the attendance, the files, the videos, the staff |
| `/admin/attendance` | The marking grid, the register as a spreadsheet, the classes that are still blank |
| `/admin/files` | The file manager: folders, drag and drop, rename, move, remove, upload |
| `/admin/videos` | The videos of a course, with their titles and a line about each |
| `/admin/roll` | Who is on each course |
| `/contact` | Who teaches each course, when and where, and how to reach them |
| `/calendar.ics` | The whole session as an importable calendar file |
| `/sitemap.xml`, `/robots.txt` | Generated from `src/app/` |

## Adding a resource

**Files can be added from the staff area now.** A member of staff with the
files permission drags them onto `/admin/files` and they are on the course
page within a request or two, with no commit and no redeploy.

The repository route is still there, and it is still the right one for a
file that belongs to the course itself rather than to a week of it:

1. Put the file in `website/public/courses/<Course Folder>/`.
2. Run `node tools/scan-archive.js`, which walks that folder and writes
   what is in it to `src/lib/archive.ts`. The scan is the truth about what
   exists: the manifest lists the files it knows about, and the scan finds
   the ones it does not.
3. To give a file a title of its own, add one entry to
   `website/src/lib/resources.ts` under that course's `resources` array:

```ts
{
  id: "csc309-lecture-1",
  title: "Lecture 1 - Intro to AI",
  type: "pptx",          // "pdf" | "pptx" | "xlsx" | "doc" | "other"
  url: "/courses/Artificial Intelligence/Lecture 1 - Intro to AI.pptx",
},
```

4. Commit and push. Vercel redeploys.

The scan is written at build time rather than read at request time because
the serverless function does not have the public folder on its disk. The
folder is served by the CDN.

`resources.ts` is the source of truth for the titles. A future admin CMS
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

## Mobile

Two things measured on a real 375px viewport that are worth keeping:

**The navbar has no hamburger.** The links and the countdown are inline, in one
horizontally scrolling rail, at every width. A phone that hides five links and
a live countdown behind a tap is a phone you have to operate before it can
navigate.

The countdown is pinned outside that rail so it can never be scrolled off: it
is the reason a student checks the bar, and "scroll to find out when your class
is" is a bad trade for "it is always there". On scroll the wordmark collapses
and the links slide into the space it frees.

The arithmetic behind that, at 375px with 307px of usable bar:

```
wordmark lockup   170px   with the countdown that is 298 of 307,
countdown         128px   which left a one-pixel gap for five links
NUTM mark alone    30px   leaves 141px of rail at the top, 171px scrolled
```

So below `sm` the wordmark shows only the NUTM mark and the words return at
640px. That is the same text that collapses on scroll, just starting earlier,
because a phone has no room for it at any point. The hook is
`data-wordmark-text`, because the Wordmark's own root element is a span and a
bare `[&_span]` selector hides the whole thing including the mark.

The navbar flip clock is `clamp(1.15rem, 2.9vw, 1.7rem)`. At a fixed 1.7rem the
six flaps alone were 150px, most of a phone's width.

**Wide tables scroll, and say so.** `TableFrame` tracks its own overflow and
puts a fade on whichever edge has more content past it, plus a line of
instruction while that is true. `overflow-x-auto` alone is invisible: a table
wider than the screen looks exactly like a table that has been cut off. The
registration list also lost its serial-number column, which cost 3.5rem on a
phone, and the code column took that width instead so no course code wraps.

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

## Breaks

A three hour lecture is not three hours of teaching. It is an hour of
teaching, a break, an hour of teaching, a break, and the last hour. The break
falls at the end of each period, and the last period has none in it, so a
three hour lecture with a ten minute break has two breaks and still ends when
it was scheduled to end.

- **The length is a decision, not a constant.** Most lectures take ten
  minutes, some take five, and some take none at all, so it is set per
  session on `/admin/schedule` and held in `session_breaks`, keyed by the
  course, the day and the minute the session starts. A course that meets
  twice a week has two rows.
- **The arithmetic is in one file** (`src/lib/breaks.ts`), and it is pure, so
  the countdown in the bar and the timetable cannot disagree about where a
  break falls. `tools/check-breaks.js` checks the cases that matter.
- **The timetable draws the breaks as their own rows**, under the lecture
  they belong to, so a student reading the week can see where the hour
  turns over.
- **The countdown knows about them.** While a lecture is running the clock
  counts down to the break rather than to the end of the lecture, and inside
  a break it counts down to the class resuming.
- **The period is the lecture's own.** A lecture that starts at ten past
  nine breaks at ten to ten, not at ten.

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

- **The light and dark switch is in the bar**, next to the bell. It used to
  float below the header, and it looked good there, but a floating control is
  on top of something, and the pages put links in their top right corners. A
  reader reaching for a download button was reaching for the switch. At a
  narrow width it was covering the rightmost sixty pixels of the content,
  which is a fifth of a phone. The bar is the only place a control can be
  that is never in the way.
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
node tools/pixel-motifs.js           # regenerate the resource motifs
node tools/gen-wallpapers.js         # render the hood wallpapers
node tools/gen-timetable-wallpapers.js  # render the timetable wallpapers
node tools/gen-icons.js              # render the favicon set
node tools/check-icons.js           # assert every declared icon exists and matches
node tools/check-calendar.js         # assert the calendar parses and sorts correctly
node tools/preview-motifs.js         # print the motifs as terminal ASCII
node tools/preview-png.js public/favicon-32.png   # print any PNG as ASCII
```

## Icons

The hood, cropped to the head and shoulders and lifted so it reads on both
light and dark surfaces. `tools/gen-icons.js` writes the whole set from the
grid in `PixelArt.tsx`:

```
favicon.ico      16/32/48, as PNG frames
favicon-16..512  the modern set the browser picks from
favicon.png      64, for anything that hardcodes the path
apple-touch-icon 180
site.webmanifest
```

Two things that were wrong and are now guarded:

- The layout declared `sizes="48x48"` for a **64x64** file. Nothing threw and
  the page rendered fine; only reading the two numbers against each other showed
  it. `tools/check-icons.js` now parses the layout's link tags and compares
  every `sizes` against the file's real IHDR dimensions. It immediately caught
  the manifest pointing at a `favicon-512.png` that had never been generated.
- There was **no `/favicon.ico` at all**. A browser told nothing probes that
  path, so it was a 404 in the tab strip rather than the artwork.

The small sizes need a smaller crop, not a smaller scale. Pixel art cannot be
scaled fractionally, and the hood is 34 rows tall, so on a 16px tile the integer
scale lands on 1 and a 30x34 crop does not fit. It was drawing the top-left
corner of the artwork. Sizes 16, 32 and 48 now crop tighter onto the dome of
the hood, which is the part that still reads at 16 pixels.

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

## News

The security news lives on `/careers`, at the bottom of the page. A job
title is an abstraction, and the week's breaches and advisories are what
the work behind it actually looks like. The details of how the feed is
read, because it is easy to get each part wrong and each part has a
consequence:

- **Fetched server-side, never from the browser.** The reader's browser talks to
  this site once and to no feed. There are no third-party images, so a feed
  that wants to be read by tracking pixels gets nothing. That is the same
  privacy rule as the study-resource motifs (which replaced drawn icons partly
  because they were making external requests).
- **Hourly revalidation.** The whole route is cached with `cacheLife("hours")`
  (1h stale, 1d expire). `src/lib/news.ts` parses both RSS and Atom with
  `fast-xml-parser` and normalises them to one `NewsItem` shape.
- **A dead feed never breaks the page.** Every feed is fetched with a 12s
  timeout through `Promise.allSettled`; nothing throws. If a single blog is
  down the page just shows the rest, and if every feed is down it renders an
  honest empty state rather than an error.
- **Dedup by normalised title.** Feeds echo each other, so the same breach
  would otherwise appear five times. A title is a duplicate if it shares its
  first forty letters with one already kept.
- **`Date.now()` cannot run during prerender.** Cache Components refuses
  unstable values, and `Date.now()` is the textbook one. The grouping and the
  "2h ago" stamps therefore live in a client component (`NewsStream.tsx`) that
  computes them only after mount, so the labels are also accurate while the
  reader is actually looking.
- **The sources manifest (`src/lib/news-sources.ts`) is a claim about the
  network.** Every URL was checked by `tools/probe-feeds.js` before being
  trusted. Delete a feed (don't merely let it break silently) and re-run that
  probe first.

Run `node tools/probe-feeds.js` to re-check every candidate feed against the
live network before editing `news-sources.ts`.

## Careers

`/careers` answers the three questions a student at this level actually asks,
in this order: what job can I get, what paper proves I can do it, and where do
I practise. `/careers/<role>` opens one job and names the courses on this
programme that feed it, because the job title and the course code look like
unrelated things until somebody points at both.

The content is a manifest (`src/lib/career.ts`), not a database. It is eight
roles, fifteen certifications and twelve practice platforms, cross-referenced
to each other. `tools/check-career.js` asserts that every reference resolves,
so a typo in a course slug cannot quietly render one card fewer than it
should. Run it alongside the other checks.

**On the costs.** Certification prices are indicative bands rather than
quotes, and the page says so where they appear. Vendors move prices, academic
pricing differs by country, and a specific number written here would be wrong
by next term. What is specific is the advice about how to pay less, which
barely changes: academic pricing, and buying the training and the exam
together rather than the exam alone.

## Events

`/events` carries three different kinds of thing, which is why they are in
three sections rather than one list:

- **Competitions**, from the [CTFtime API](https://ctftime.org/api/),
  fetched on the server and cached for an hour. The reader's browser never
  talks to CTFtime, so a feed that wants to know where you were learns
  nothing. Their API asks that it be used for data analysis rather than for
  copying their site; this is a short list, each entry links back to the
  event, and the page says where the data came from.
- **The department's own calendar**, which was already in the manifest.
- **The events that happen every year**, which no feed reports because they
  are not announcements, they are the shape of the year.

## Course files

Staff add a file to a course from `/admin`. It appears on the course page, in
the search and in the counts, without the site being rebuilt.

### Two kinds of file, one index

| | Where the file lives | Who can remove it |
|---|---|---|
| Archive | In the repository, under `public/courses`, served by the site's own CDN | Nobody, from the staff area |
| Upload | In Supabase Storage | Staff, from the staff area |

**The archive stays in the repository on purpose.** The site's CDN does not
charge for the traffic, and a class of a hundred students downloading their
course material every week is exactly the traffic that a metered storage
bucket charges for. The staff area says so on the file itself: an archive
file is marked "in the repository" and has no Remove button, because taking
it out of the index would leave the file sitting in the public folder with
nothing pointing at it.

### The index

`files` table: course, title, type, url, size, folder, and which of the two
kinds it is. It is read through `/api/files`, which is the endpoint the
manifest used to be, and the search uses it so a file staff uploaded is
findable by name.

The index is cached and tagged. An upload calls `updateTag("files")`, so the
course page, the search and the counts all pick the change up on the next
request rather than waiting for the cache to age out.

**The archive is merged in outside the cache.** The archive is part of the
code rather than part of the database, and a cached copy of it would go on
serving the list the site had when it was last built. The index is cached
on its own; the merge is not.

**The manifest still carries the original file list**, for two reasons. It is
the fallback when the database cannot be reached, because a course page that
shows nothing because a table was not populated is a worse failure than a
duplicated row. And it decides the title and the id of the files it knows
about, where the scan decides only that they exist.

The upload itself is capped at 25 MB. The file is stored first and indexed
second, so a course page never points at a file that is not there: the other
order would leave an index row pointing at a file that was never stored.

### Folders

A course's material is a tree, and the site shows it as one. A file's
folder is a column on the index. **Moving a file is one column**: the file
does not move on disk and the object does not move in the bucket, so a move
is instant, it costs nothing, and the folder a student sees is the folder
the index says.

A file with nothing in the index takes the folder its address implies,
which is how the files in the repository keep the folders they already have
on disk. `course_folders` holds the folders that exist on their own, so
that "Assessment 1" can be made before anything is put in it.

### The viewer

`/view/<id>` reads a file in the browser rather than sending the reader
somewhere else to open it.

- **A deck is drawn.** A `.pptx` is a zip of XML, and `pptx-preview` unzips
  it and lays each slide out as HTML. It is not a perfect reproduction of
  PowerPoint, and it does not need to be, because a student with no
  PowerPoint can see what the lecturer put on the screen.
- **A table is a table.** The parser does quoted fields, doubled quotes and
  line breaks inside a quoted field, because splitting on commas gets all
  three wrong.
- **A message is a message.** The `.eml` reader unfolds the headers, decodes
  the MIME encoded words, finds the text part of a multipart body and undoes
  the transfer encoding.
- **JSON is a tree.** What a key holds is easier to read as a tree than as
  a wall of braces, and the raw text is one click away.

The files are public course resources. A reader who can download one can
read one, so the browser asks for it where it lives rather than the site
fetching it and passing it along.

### Videos

A lecture recording, or a recording of somebody else's lecture that is worth
a student's afternoon, is indexed with the course. The staff area is
`/admin/videos`.

**The picture is kept on this site.** The server fetches it from YouTube
once and the reader gets it from this site's own address, because a page
that asks somebody else's server for an image tells that server who was
reading. The video itself is YouTube's and is only loaded when somebody
presses play, from the embed that does not set tracking cookies until
then.

## Attendance

`/admin` is the staff area. It is behind one shared code, it is excluded from
the sitemap and from `robots.txt`, and it has no link in the site navigation.
The footer carries a quiet link to it, because staff need to be able to find
it and students have no business in it.

### The box

The idea was that staff fill a box per class and the fill is the record. That
is what it does, and the box is drawn in pixels like the rest of the site:

| State | What it looks like | What it means |
|---|---|---|
| Not recorded | An empty outline | Nobody has marked this box |
| Present | The box, filled | On class for the whole session |
| Half | The box, filled halfway | On class for part of it |
| Absent | A bright cross through the box | Not on class |
| Excused | A flat bar across the box | Illness or death, not counted against them |

The distinction between an empty box and a cross is the whole point of the
feature. An empty box has not been marked yet and does not count against
anyone. A cross is a verdict, and it is drawn so it can never be mistaken for
the empty box beside it.

### The data

**The roll is the cohort.** The seventeen students are in the database, on
every course in the programme, because the core courses are taken by every
student and the shared ones are taken by them too. `tools/seed-roster.js` puts
them there and clears anything that was there before.

The roster lives in the database rather than in the repository. This site is
public, and a student list committed to git is a student list published.

The rest of the attendance data:

Three tables in Supabase project `thehood-cms`:

- `roster` — matric number, name, course.
- `attendance` — one row per course, session date and student. `fill` is a
  level from 0 to 1 and is **nullable**: null means unmarked, which is not the
  same as 0. `excused` is a third state, not a flavour of absent.
- `attendance_log` — every change, with what it replaced.

A mark and its log entry are written by one database function, so a change
cannot be saved without its history.

**Row level security is on, with no policies, and the tables are revoked from
`anon` and `authenticated`.** The site reads them with the service role,
server-side only. The build was checked to confirm the service key and the
staff code appear in no client chunk.

**The roster is in the database, not in the repository.** The site is public,
and a student list committed to git is a student list published. Staff paste
the roll in on the staff page, as one `matric, name` per line.

### Standing

The percentage is over the sessions that were actually marked. A session
nobody has got to is not in the denominator, so an unfinished week never
becomes a bad mark for a student. Excused sessions are not in the denominator
either.

### Using it

The staff area is at **`/admin`**. There is no link to it in the navigation,
because the navigation is for students; there is a quiet one in the footer.

**When a member of staff signs in, the bar changes.** The student links are
replaced by the staff ones, the page you are on is marked in the same way a
student's page is, and a **Sign out** button appears. The staff links are
whatever that person is allowed to do, so somebody who may only mark
attendance sees only "Attendance".

The area is five pages rather than one long one:

| Page | What it is for | Needs |
|---|---|---|
| `/admin` | Who can get in, the review queue, the audit log | Add staff members |
| `/admin/attendance` | The marking grid, the register, the blank classes | Mark attendance |
| `/admin/files` | The file manager: folders, drag and drop, rename, move, remove | Upload and remove course files |
| `/admin/videos` | The videos of a course, and a line about each | Upload and remove course files |
| `/admin/roll` | Who is on each course | Keep the student roll |

The file manager is a file manager rather than a form: a folder tree, a
list of what is in the folder you are in, and a file dragged onto the
folder it belongs in. The drag is built on pointer events rather than the
browser's own dragging, because the browser's dragging does not work on a
touch screen, and a touch drag has to be a held drag or every attempt to
scroll the list would pick a file up instead. Every gesture also has a
button, because a drag is never the only way to do something.

On the attendance page there are two things a lecturer wants beyond the grid:
a **spreadsheet of the register** (every student, every class, every mark) and
a list of the **classes that are still blank**. A class counts as marked as
soon as one mark is in it, because a lecturer who marked twenty of thirty
people has marked the class.

1. **Get your code.** The first one is made from the command line:
   ```bash
   cd website
   node tools/add-staff.js "Your Name" [your@email]
   ```
   It prints a code like `FNTQH-GUXFB-W33QW-6WUUA`. **Write it down there and
   then.** It is shown once and cannot be read back.

   The first account made this way is a super admin. After that, anybody with
   the **Add staff members** permission can add colleagues from the staff
   page, and a super admin approves them.

2. **Open `/admin` and sign in** with your name and that code.

3. **To upload a course file:** `/admin/files`, pick the course, choose the
   file, give it a name if you want one other than the file name, and press
   **Add the file**. It appears on the course page, in the search and in the
   counts within a request or two. Twenty-five megabytes is the limit.

4. **To remove a file:** the **Remove** button next to it. Only files you
   uploaded can be removed; the ones in the repository are marked "in the
   repository" and have no button, because deleting one from the index would
   leave the file sitting in the public folder with nothing pointing at it.

5. **To rename one:** the **Rename** button, which turns the name into a
   field. Only the title changes. The name of the file itself does not,
   because changing it would break the link.

6. **To mark attendance:** `/admin/attendance`, choose the course, pick the
   week, and click a box. A panel opens with the five states: present, half,
   absent, excused, not recorded. Every change is written down with your name
   on it, and the last day's changes are listed underneath the grid.

7. **To add a colleague:** "Who can get in" on `/admin`. They wait for a
   super admin to approve them, and then their code appears for you to copy
   and pass on, for two days.

8. **To sign out:** the **Sign out** button in the bar. Your session lasts
   twelve hours.

### Who can get in

There are two kinds of staff, and the difference between them is who can do
what to whom.

**A super admin** (there are two or three) approves people, takes access
away, changes what somebody is allowed to do, and reads the audit log. They
also have every permission themselves, whatever their list says.

**An admin** does the day-to-day work: marks attendance, uploads files,
keeps the roll. They can also add people, but the people they add go into a
review queue and wait for a super admin before they can sign in at all.

Every person has a code **of their own**. The sign-in is a name and a code,
not one shared secret for the department, because:

- A shared code cannot say who did what. `marked_by` used to be the word
  "staff" on every row, which means an attendance record that cannot be
  argued with. It now carries the name of the person who marked it, and the
  correction history carries it too.
- A shared code cannot be taken back from one person without taking it back
  from all of them. Per-person codes can be locked out individually, and
  individual permissions can be taken away without taking the account.

### Adding somebody

1. An admin adds a name, an email, and what they should be allowed to do.
2. The person is **pending**. They cannot sign in, because they have no code
   yet, and the sign-in says so rather than saying the code is wrong.
3. A super admin sees them in the queue and approves them.
4. A code is made. **The person who added them can read it for two days**,
   and a super admin can too. It is shown with a Copy button, because a code
   that is read off a screen and typed into a message is a code that gets
   typed wrong.
5. After two days the code is **destroyed**, not merely hidden. There is
   nothing left to decrypt. If it needs passing on again, a new one is
   issued and the old one stops working.

The code is never stored in the clear. What is kept for signing in is a
scrypt hash and the salt it was made with; what is kept for the two-day
window is an encrypted copy, encrypted with a key derived from
`ADMIN_SECRET`. Rotating that secret makes every issued code unreadable,
which is the same as saying those codes no longer exist.

`tools/add-staff.js "Name" [email]` makes a super admin from the command
line. After that, anybody with the **Add staff members** permission can add
colleagues from the staff page.

`ADMIN_SECRET` is **not** a way in. It signs the session cookie and encrypts
the issued codes, and nothing else, so rotating it ends every session at
once without changing anybody's code. It is the key to the door, not a key to
the building.

### Permissions

| Permission | What it allows |
|---|---|
| **Mark attendance** | Fill the boxes on the attendance grid |
| **Upload and remove course files** | Add and remove the files on a course page |
| **Keep the student roll** | Add and remove students from the roll |
| **Add staff members** | Add people, who then wait for a super admin to approve them |

A super admin has all four. An admin has whichever they were given, and a
super admin can change that at any time, one permission at a time or all of
them at once by taking the account away.

The permissions are enforced **in the Server Actions**, not only in the
interface. An action is reachable by a direct POST, so hiding a section is a
convenience and not a protection.

### The audit log

Every change to anybody's access is written down: who added them, who
approved them, whose permissions were changed, who was locked out and by
whom, with the time. A super admin reads it on the staff page.

### What else protects it

- The code is compared with a constant-time check, so a wrong guess cannot be
  narrowed down by timing the response.
- Five wrong guesses from one address locks that address out for fifteen
  minutes. The counters live in the instance's memory, so on a serverless
  deployment the lockout is per instance rather than global.
- The session cookie is httpOnly, signed, and expires after twelve hours. The
  person in it is checked against the staff list on every request, so
  removing someone ends their access straight away rather than whenever
  their cookie happens to expire.
- Every Server Action re-checks the session itself, because an action is
  reachable by a direct POST and a check in the interface is not a
  protection.
- The area is excluded from the sitemap and from `robots.txt`, carries
  `noindex`, and has no link in the site navigation.

### Configuration

Three environment variables, on the deployment and in `.env.local` locally:

| Variable | What it is |
|---|---|
| `SUPABASE_URL` | The project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | The service role key. Server-side only, never exposed |
| `ADMIN_SECRET` | Signs the session cookie. Not a way in, and not anybody's code |

Five wrong guesses from one address locks that address out for fifteen
minutes. The lockout counters live in the instance's memory, so on a
serverless deployment they are per instance rather than global, which is
weaker than a shared store and worth knowing about.

### Where it is not yet

- **The student view.** A student cannot see their own attendance yet. It
  needs the real roster first, and the roster is the privacy decision that has
  not been made yet: matric lookup, a name plus a matric, or a per-student
  secret all expose different things.
- **The admin CMS (P6).** The staff area covers attendance only. Uploading
  files still means editing `resources.ts`.

## Notifications

The bell in the bar. It says how much is unread, and it opens a panel with
what is unread, what is coming, and the settings for what to be told about.

### The idea underneath it

Most of what a notification system would deliver has **already happened, in a
table the site already keeps**. A new file is a row in `files` with a
timestamp on it. A mark that changed is a row in `attendance_log`. The
timetable is a constant. So the system is not a queue and a delivery
pipeline. It is a question asked of the data the site already holds: *what has
changed since this person last looked*.

`GET /api/updates?since=<timestamp>` is that question. The reader's cursor
lives in their own browser, so there is no read-receipt table and no row to
mark as seen.

The push is the only part with machinery in it, and it is deliberately small.

### What can be told about

| | Kind | What it is |
|---|---|---|
| A | New course material | A deck or a handout was posted for a course |
| E, F | Your classes | Five minutes before a class, and when it ends |
| B, C, D | Your attendance | Attendance recorded, a mark corrected, the standing |
| I | The academic calendar | Exams, registration, matriculation |
| J to Q | Staff and the site | Approvals, unmarked classes, uploads, a broken feed |

Each kind is turned on and off separately, and there are quiet hours in the
reader's own clock. The server checks the quiet hours as well, so a push that
should not have arrived does not.

### Two halves

**In the tab.** The class reminders are timed in the browser, because the
class times are known in advance and need no server to say so. A tab that is
open will remind you five minutes before, and when the class ends. This half
works on any plan, with no push service involved.

**Out of the tab.** Web push, for the cases where the reader is elsewhere.
This needs a service worker, a VAPID key pair and a subscription. The payload
is encrypted end to end, so the push service sees an opaque blob it cannot
read, and it never sees the reader's address.

**A subscription is a device, not a person.** The students have no accounts,
so the row says nothing about who is holding it. The preferences are per
device for the same reason, and the device id is a random string in the
reader's own storage.

### What triggers what

Only the class reminders need a clock. Everything else is event-driven: a
file was uploaded, so the upload action says so. There is nothing scheduled
about a file, and nothing to keep running.

The scheduler is `GET /api/push/schedule`, guarded by a shared secret. It is
called every five minutes by Supabase's own cron, which calls it over the
network with `pg_net`, because Vercel's cron runs once a day on the free
plan and that is no use for "starts in five minutes". `vercel.json` has the
same schedule for a paid plan, and the two do not conflict.

If neither cron is working, the class reminders still arrive for anybody who
has the site open, because the browser times them itself.

### Configuration

| Variable | What it is |
|---|---|
| `VAPID_PUBLIC_KEY` | Goes to the browser |
| `VAPID_PRIVATE_KEY` | Never leaves the server |
| `VAPID_SUBJECT` | A contact address for the push service |
| `PUSH_SCHEDULE_SECRET` | The secret the scheduler calls with. Different from `ADMIN_SECRET` |

To make a new key pair:

```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

Rotating the pair invalidates every subscription, so every device has to turn
notifications on again.

### The site is now installable

There is a service worker, so the site can be added to a home screen and
opens without a network. `public/offline.html` is what it shows when there
is no signal.

**The payload of a partly prerendered page is never served from the cache.**
Next sends it as an ordinary fetch, so a cache-first worker hands back the
page as it was when it was last visited. On a course page that means a file
that has been added and a video that has been put up are both missing, and
the page says they are not there. The people who hit it hardest are the
people who installed the site, which is to say the people who use it most.
The cache is still a fallback for when there is no signal.

## Data sources

- `src/lib/resources.ts` — courses, their weekly sessions and their files. The
  manifest.
- `src/lib/calendar.ts` — the academic calendar, parsed from the Registrar's
  published Unified Academic Calendar. `tools/check-calendar.js` validates it.
- `src/lib/schedule.ts` — the teaching timetable, derived from the same course
  records, and used by the countdowns and by the timetable page.
- `src/lib/attendance-db.ts` — the attendance store, read and written with the
  Supabase service role over PostgREST. The schema lives in
  `supabase/migrations/` and is applied with `supabase db push`.
- `src/lib/files.ts` — the file index and the upload path, the same way.
  `tools/migrate-files.js` indexes the archive files.
- `src/lib/permissions.ts` — what a member of staff may do. It has no secrets
  and no database in it, so the browser can read it too.
- `src/lib/staff.ts` — the staff list, the codes, and the audit log.
  `tools/seed-roster.js` puts the cohort on the roll.

## Study resources marks

The marks on `/resources` are pixel motifs drawn per kind, not fetched favicons
and not stroked line icons.

Favicons would mean twenty-odd third-party requests on one page load, which
tells every one of those sites who is reading and breaks the page for anyone
offline or behind a captive portal. Stroked icons were tried first and failed
for a different reason: a 1.7px line at card size reads as a smudge, and
twenty-two of them look identical. A pixel motif has a silhouette, which is
what makes a page scannable.

`tools/pixel-motifs.js` describes each motif as geometry and rasterises it into
`src/components/PixelMotif.tsx`, so the grid cannot drift from the shapes that
produced it. `tools/preview-motifs.js` prints each one as terminal ASCII, which
is how you check a silhouette without opening a browser:

```
node tools/preview-motifs.js
```

## Wallpapers

The "Add as wallpaper" control downloads **the timetable**, not the artwork.
What a student pins to a laptop for a whole semester is the thing they will
look at every day, which is when and where they are meant to be.

`tools/gen-timetable-wallpapers.js` renders it: a weekly board with day rows, an
hour axis, and each session positioned by time, drawn with a 5x7 pixel font so
the course codes are actually readable. Today is marked, and the class that is
running is picked out. The schedule is read out of the manifest source, so the
wallpaper cannot show a week the site does not believe in.

```
node tools/gen-timetable-wallpapers.js
```

## Not implemented

Deliberately left out, and why:

- **Recurring weekly lectures in the `.ics`.** Would require inventing term
  start and end dates. A subscription that ignores exam week and public
  holidays is worse than no subscription.
- **Admin CMS.** Needs an auth decision that has not been made.
- **Attendance.** Blocked on the same auth decision as the CMS, since a student
  has to be identifiable before anything can be recorded against them. The shape
  and the open questions are written up in `ROADMAP.md` §9 so the idea survives
  without needing this file to describe it twice.

Built by [Valor](https://davidowu.tech).
