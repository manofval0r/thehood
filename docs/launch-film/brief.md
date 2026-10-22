# Cybersecurity 300L: EVERY NOTE, ONE PLACE

A film for **Cybersecurity 300L — Course Resource Hub** (NUTM Apapa). The site's own
words: *"Every lecture note, lab and handout."* It shows the real site in a browser
window on a laptop, doing the three things the site exists to do — show a student
what their week looks like, find a file by typing part of its name, **and open that
file in the site without downloading anything** — and then show them when their
class is. Everything is built in code from the app's own tokens and components. No
templates, no stock motion graphics, no invented features.

**Type:** product film (`templates/desktop`). **Format:** landscape 1920 × 1080, 60 fps,
52 beats, 32.85 s. **Style:** Brand-native — the stage is the app's own black, its
green, its Geist. **Live at:** `https://thehood-psi.vercel.app/`

---

## Inputs

What the film uses, all from the working tree:

- **Type and colour** — the app's tokens in `website/src/app/globals.css`: black
  ground `#000000`, surface `#0a0a0a`, ink `#ffffff`, accent `#22c55e`, muted
  `#9a9a9a`, border `#1f1f1f`. The canvas for the film is the app's black, not a
  restyle of it.
- **Font** — Geist, variable 100–900, taken from the build cache at
  `website/.next/static/media/7178b3e590c64307-s.21jp631_3pja2.woff2` and packed
  into `src/assets.js`. No CDN at render time.
- **The mark** — `NutmMark` from `website/src/components/Wordmark.tsx`, redrawn as
  inline SVG at the film's size: extruded shield, green keyhole.
- **The bell** — the pixel bell from `NotificationBell.tsx`, redrawn rect for rect.
- **The interface** — rebuilt from `Nav.tsx`, `SearchBar.tsx`, `CourseCard.tsx`,
  `NextClassCountdown.tsx`, `FlipClock.tsx`, `TimetableBoard.tsx`,
  `app/view/[id]/page.tsx` and `resources.ts`, at the app's own point sizes.
- **Real data** — the ten courses, 23 units and 15 files exactly as
  `src/lib/resources.ts` holds them, and the eleven weekly sessions as
  `src/lib/schedule.ts` derives them. Course codes, lecturers, venues, sessions
  and file names are the app's real ones.
- **Artwork** — the app's own pixel hero and its own desktop wallpaper, from
  `website/public/`.
- **Music** — `audio/audioknap-the-hip-hop-618430.mp3`, the user's own track.

What was **not** used, and why: the app has no student accounts and no public
admin, so the film shows none of that. The course page's recorded lectures and its
per-course workspace are real features, but their contents come from the live
store, so the film does not invent a video library or a file tree it cannot show
honestly. The film shows the file library instead, because that is the part of the
site that is real and fixed: the files, and the viewer that opens them.

---

## Direction

The feel is the app's: black, one green, type doing the work. Nothing on the stage
that the app would not have on screen. The camera never leaves the laptop once the
window has opened, and the app is always inside it — traffic lights in frame, the
nav bar and its live split-flap clock readable in every wide shot.

**The relay object** is a single course card — *CYB 305 · Digital Forensics and
Investigation Methods*, the course the film is about. It opens the film alone on
black, expands into the browser window, and the window closes back into that same
card at the end. The green keyhole on the mark is the accent that ties the two
ends together, and the first frame and the last frame are the same frame, so the
film loops.

**The signature move** is the split-flap card, the app's most recognisable shape.
Its fold is the film's transition: the card is what the window grows out of, and
what it collapses back into. No crossfades, no blur-ins, no glow reveals — every
change is a shape from the app moving to where the app puts it.

**Pointer.** Present only for the four clicks it explains: into the search field,
onto the file, onto *Timetable*, onto *Perspective*. It arrives early, clicks on
the beat, and goes away while the file is open, the way a mouse does when somebody
is reading.

**Sound.** The track alone; the hip-hop is dense enough that a sound on every
action would fight it. The film is cut to its own grid: 95.000 BPM, 13 bars, the
breakdown at the head opening the film, the drop at bar 25 carrying the file
opening, and the groove closing it.

---

## Structure

| Beat | Time | What happens |
|---|---|---|
| B1 | 0.00 s | The CYB 305 course card alone on black. The keyhole in the NUTM mark is green. |
| B2 | 0.63 s | The card's flap folds open and the browser window grows out of it. |
| B3 | 1.26 s | The page assembles — the wordmark, seven links, the notification bell, the split-flap clock starts ticking. |
| B4 | 1.89 s | The hero rises: the department line, the headline, the copy, the pixel art. |
| B5 | 2.53 s | The stats roll: 10 courses, 23 units, 15 files uploaded, 5 courses with files. |
| B6 | 3.16 s | The page scrolls to the session snapshot; the split-flap clock ticks. |
| B7 | 3.79 s | The next-class card rises. |
| B8 | 4.42 s | The page scrolls back; the camera settles on the search field. |
| B9 | 5.05 s | The pointer glides to the field. |
| B10 | 5.68 s | Click. The field lifts and takes the accent ring. |
| B11–B14 | 6.32–8.21 s | Types `forensic`, two characters a beat. |
| B15 | 8.84 s | The results panel opens out of the field; the *Courses* row rises. |
| B16 | 9.47 s | The *Files* group rises: seven rows, staggered. |
| B17 | 10.11 s | The cursor lands on **Week 1 - Computer Forensics Fundamentals**. |
| B18 | 10.74 s | The camera pushes into the file list. |
| B19 | 11.37 s | The pointer settles on the file. |
| B20 | 12.00 s | Click. The route change starts. |
| **B21** | **12.63 s** | **The drop.** The file opens in the site: the back link, the title, the PDF chip, the Download button, and the page in the reader. |
| B22 | 14.53 s | The camera pushes into the page; the reader draws it and the pager settles. |
| B24 | 15.79 s | The pointer travels up to the nav. |
| B25 | 16.42 s | Click *Timetable*. The nav's pill slides across; the timetable pushes up. |
| B26 | 17.05 s | The timetable arrives. |
| B27 | 17.68 s | Click *Perspective*. The list re-sorts by distance from now, and CYB 305 — the class running right now — comes forward, lit and ringed. |
| B28–B29 | 18.32–20.84 s | Hold on the running class; the camera eases in, then pulls back to the whole window. |
| B30 | 21.47 s | The desktop appears; the laptop's bezel, notch and deck grow around it. |
| B31 | 22.11 s | The window shrinks back into the CYB 305 course card. |
| B32 | 22.74 s | The card settles; the keyhole pulses. |
| B33 | 24.00 s | The NUTM mark and the wordmark rise. |
| B34 | 24.63 s | The line: **Every lecture note, lab and handout.** |
| B35 | 25.26 s | The accent word types in, letter by letter: *handout.* |
| B36 | 25.89 s | The facts stagger in: 10 courses · 23 units · 15 files uploaded · 5 courses with files. |
| B37 | 26.53 s | The call to action springs in: **Open the course hub**. |
| B38 | 27.16 s | The URL rises under it: `thehood-psi.vercel.app`. |
| B39 | 27.79 s | The arrow slides; the end card holds. |
| B40–B52 | 28.42–32.85 s | The type sinks, the world leaves, and the card flies home — the last frame is the first frame. |

**Holds** are whole beats, so every action stays on the grid:
`[[22, 2], [29, 3], [33, 1], [40, 7]]`. None of them sit before beat 21, which is
what puts the drop on the track's own drop bar.

---

## Build

- **Format** — `film({ W: 1920, H: 1080, FPS: 60, BPM: 95.00009, BEATS: 52 })`,
  1971 frames, 32.85 s. `B(n)` is the n-th story beat at `0.631578 s`.
- **Deterministic** — every frame is a pure function of `t`. No CSS transitions or
  animations, no timers, no `Math.random`, no `Date`, no state carried between
  frames. The split-flap clock, the caret, the camera drift and the mark's pulse
  are all functions of `t`; the drift uses `loop()`, so it completes whole cycles
  over the film and the last frame equals the first.
- **The device is always there** — the app lives in the window at `WIN`, inside the
  1512 × 982 display, inside the laptop. Close-ups crop but never go full-bleed;
  the traffic lights and the nav bar stay in frame for every shot that matters.
- **Legibility** — desktop zoom only, 1.0 to 1.5. The nav shot is 1.5 so a 13.5 pt
  tab label lands at 20 px; the file list is 1.48 so a 14 pt row lands at 21 px;
  the reader is 1.18. Nothing inside the app is enlarged to cheat.
- **What lands on the beat** — the click, each pair of typed characters, the
  results panel opening, the route change, the file opening, the nav pill's slide,
  the perspective switch, and the end card's type. Every result holds before the
  next action.
- **Render** — 60 fps, supersampled at 2× and downscaled with lanczos, H.264 high
  profile, CRF 15, the cut audio muxed at 256 kb/s. Inspect a contact sheet every
  0.5 s, every transition at 0.05 s, and every text screen at full size.

---

## Open

- **Music licence.** `audioknap-the-hip-hop-618430.mp3` is the user's own track and
  is assumed cleared for this film. The filename suggests an Audiomack/Audioknap
  source; **confirm the licence before the film is posted anywhere public.**
- **Marks.** The NUTM shield is the department's own mark and is used as the app
  uses it.
- **Claims.** Nothing is claimed about uploads, storage or security beyond what the
  code does. `pages/home.tsx` states admin upload is still being built; the film
  does not imply otherwise. The file the film opens is a real file of a real
  course; the size shown against it is illustrative.
