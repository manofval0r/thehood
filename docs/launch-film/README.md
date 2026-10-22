# Cybersecurity 300L — launch film

A 33-second product film for **Cybersecurity 300L — Course Resource Hub** (NUTM
Apapa). The site's own words: *"Every lecture note, lab and handout."*

It shows the real site in a browser window on a laptop: the hero and its counts,
the split-flap countdown to the next class, the search finding a file, **that file
opening in the site's own reader**, and the timetable's perspective view with the
class running *right now* lifted out of the plane. Then the window collapses back
into the course card it opened on. The last frame equals the first, so it loops.

| | |
|---|---|
| Format | 1920 × 1080, 60 fps, H.264 + AAC |
| Length | 32.85 s (1971 frames) |
| Music | `audio/audioknap-the-hip-hop-618430.mp3`, bars 20–32, 95.000 BPM |
| Site | `https://thehood-psi.vercel.app/` |
| Type | Product film (`templates/desktop`) |
| Style | Brand-native — the stage is the app's own black, green and Geist |

---

## The beat map

The film runs on the track's own grid: **95.000 BPM**, a bar every 2.5263 s, and
52 beats in all. The cut is bars 20–32 of the source, and the track's drop bar
(25) lands on film beat 21 at 12.632 s — 38 % in, where the file opens.

`B(n)` is the n-th story beat. The full beat map is in `brief.md`; this is the
shape of it:

| Beat | Time | What happens |
|---|---|---|
| B1–B2 | 0.00–0.63 s | The CYB 305 course card alone on black; its flap folds open into the browser window. |
| B3–B5 | 1.26–2.53 s | The page assembles — wordmark, seven links, the notification bell, the ticking split-flap clock — then the hero and the counts. |
| B6–B7 | 3.16–3.79 s | The page scrolls to the session snapshot; the clock ticks; the next-class card rises. |
| B8–B10 | 4.42–5.68 s | Back to the hero; the pointer finds the search field and clicks it. |
| B11–B14 | 6.32–8.21 s | Types `forensic`, two characters a beat. |
| B15–B17 | 8.84–10.11 s | The results panel opens out of the field: one course, seven files. The cursor lands on **Week 1 - Computer Forensics Fundamentals**. |
| B18–B20 | 10.74–12.00 s | The camera pushes into the list; the pointer settles and clicks. |
| **B21** | **12.63 s** | **The drop.** The file opens in the site: the back link, the title, the PDF chip, the Download button, and the page in the reader. |
| B22–B25 | 14.53–16.42 s | The camera pushes into the page; the pointer goes to the nav and clicks *Timetable*. |
| B26–B27 | 17.05–17.68 s | The timetable arrives. Click *Perspective*: the list re-sorts by distance from now and CYB 305 — the class running right now — comes forward, ringed in green. |
| B28–B31 | 18.32–22.11 s | Hold on the running class; pull back to the whole window; the desktop and the laptop appear; the window collapses back into the course card. |
| B32–B39 | 22.74–27.79 s | The end card: the mark, the wordmark, the line, the accent word typed in, the counts, the call to action, the URL. |
| B40–B52 | 28.42–32.85 s | The type sinks, the world leaves, and the card flies home — the last frame is the first frame. |

**Holds** are whole beats, so every action stays on the grid:
`[[22, 2], [29, 3], [33, 1], [40, 7]]` — none of them sit before beat 21, which
is what puts the drop on the track's own drop bar.

---

## The style

Brand-native. The stage is the app's own palette, taken from
`website/src/app/globals.css` and not adjusted: black ground `#000000`, accent
`#22c55e`, ink `#ffffff`, muted `#9a9a9a`, surface `#0a0a0a`, border `#1f1f1f`.
Type is the app's own Geist, packed from the build cache at
`website/.next/static/media/7178b3e590c64307-s.21jp631_3pja2.woff2`.

**The relay object** is one course card — CYB 305, *Digital Forensics and
Investigation Methods*, the course the film is about. It opens the film alone on
black, expands into the browser window, and the window closes back into that same
card at the end. The first frame and the last frame are the same frame, so the
film loops.

**Every transition is the app's own motion.** The window grows out of the card.
The nav's pill slides from *Courses* to *Timetable*. Each route change is a push,
the old page up and the new one up from below. The results panel opens out of the
search field, the way a palette does. The perspective view re-sorts itself by
distance from now. The split-flap clock folds. Nothing cross-fades, and no shape
arrives from off-screen for its own sake.

**The pointer** appears only for the four clicks it explains, and goes away while
the file is open, the way a mouse does when somebody is reading.

---

## What is real

Everything on screen is the app's own interface, rebuilt at the app's own point
sizes from its own components, with its own data:

- `website/src/components/Nav.tsx` — the bar, the wordmark, the seven links, the pill, the notification bell, the countdown showing the course code
- `website/src/components/NotificationBell.tsx` — the pixel bell, redrawn rect for rect
- `website/src/components/SearchBar.tsx` — the field, the results panel, the groups
- `website/src/components/FlipClock.tsx` — the split-flap clock, one flap per digit
- `website/src/components/NextClassCountdown.tsx` — the next-class card
- `website/src/components/TimetableBoard.tsx` — the grid, the view slicer, the perspective list
- `website/src/app/view/[id]/page.tsx` — the viewer: the back link, the title, the kind chip, the Download button, the page and the pager
- `website/src/components/CourseCard.tsx` — the relay card
- `website/src/components/Wordmark.tsx` — the NUTM mark
- `website/src/lib/resources.ts` — the ten courses, 23 units, 15 files
- `website/src/lib/schedule.ts` — the eleven weekly sessions
- `website/public/` — the pixel hero and the desktop wallpaper

**The flow is true.** Searching `forensic` finds the course *Digital Forensics
and Investigation Methods* **and all seven of its files**, because
`SearchBar.tsx` scores a resource against its course's title as well as its own.
That is what happens on the real site, and the film shows the real ranking. The
file the film opens is one of them.

**Fictional** are only the things a recording cannot fix: which day is "today"
(Wednesday), which session is running (CYB 305, 12:30pm – 2:30pm), the
countdown's start value (04:12:36), and the byte size shown against the file. No
course, lecturer, venue, session, file name, course code, unit count or file
count is invented — all ten courses, all eleven sessions and all fifteen files are
the app's.

**Not claimed.** The film never suggests the site processes, secures or stores
anything. `pages/home.tsx` says admin upload is still being built; the film does
not imply otherwise. The course page's recorded lectures and its per-course
workspace are real features, but their contents come from the live store, so the
film does not invent a video library or a file tree it cannot show honestly.

---

## Preview

Open `src/index.html` in Chrome. The player under the frame has a scrub bar and
a play button; the film's music is `audio/edit.m4a`.

To render a single still:

```bash
node "<skill>/scripts/render.mjs" stills src/index.html out/stills 4.6,12.9,18.6 --scale 2
```

## Check

```bash
node "<skill>/scripts/check.mjs" src/index.html
```

Five checks, all passing:

```
PASS  no clock, timer, randomness or CSS animation in src/
PASS  every 0.05s from 0 to 32.83s without page errors
PASS  frames are the same whatever order they are sought in
PASS  the loop closes: 32.850s equals 0s
PASS  dist/cybersecurity-300l.html matches the sources pixel for pixel
```

## Render

```bash
node "<skill>/scripts/render.mjs" video src/index.html out/cybersecurity-300l.mp4 \
     --audio audio/edit.m4a --scale 2 --crf 15
```

Roughly 0.4–0.8 s a frame; about 13 minutes for the 1971 frames. The render is
supersampled at 2× and downscaled with lanczos, so type stays clean.

> **On Windows**, set `MOTION_DESIGNER_CDP_TIMEOUT=600` first. The default is 90 s
> for a single CDP call, and on a busy machine one frame can exceed it, which
> kills the render part-way through.

The muted loop and the poster come from the same source frames:

```bash
ffmpeg -i out/cybersecurity-300l.mp4 -an -c:v copy out/cybersecurity-300l-loop.mp4
node "<skill>/scripts/render.mjs" stills src/index.html out/poster 14.60 --scale 2
```

The poster is the frame at 14.60 s — the file open in the reader, with the
perspective timetable behind it.

## Rebuild

The film's source is five files in `src/`:

| File | What |
|---|---|
| `core.js` | the engine: `film()`, `B()`, easings, springs, `track()`, `prog()` |
| `device.js` | the desktop: the display, the menu bar, the dock, the window, the pointer |
| `scenes.js` | **this film's story** — the beat map, the app's interface, the camera |
| `film.css` | the app's tokens, and the split-flap card |
| `assets.js` | Geist, the pixel hero and the wallpaper, inlined as data URIs |

To change the film, edit `scenes.js`. The clock is the first line:

```js
film({ W: 1920, H: 1080, FPS: 60, BPM: 95.00009, BEATS: 52,
       holds: [[22, 2], [29, 3], [33, 1], [40, 7]] });
```

`BEATS` must equal the story's beats plus its holds, and the music must be cut
to exactly that many beats:

```bash
python3 "<skill>/scripts/beats.py" ../../audio/audioknap-the-hip-hop-618430.mp3 --json audio/grid.json
python3 "<skill>/scripts/music_edit.py" ../../audio/audioknap-the-hip-hop-618430.mp3 audio/grid.json \
        --from-bar 20 --bars 13 --fps 60 --out audio/edit
```

### Tools in this folder

The skill's own `sheet.py` splits paths on `"/t"` and cannot read the backslash
paths Windows produces, and its `render.mjs sheet` calls it. `tools/` holds
Windows-safe replacements, plus two that go further:

| Tool | What |
|---|---|
| `tools/sheet.mjs` | contact sheet: `node tools/sheet.mjs src/index.html out/qa/x.png 0 32.85 0.5` |
| `tools/sheet.py` | the tiler behind it (path-safe) |
| `tools/timeline.mjs` | prints every story beat's time and beat number: `node tools/timeline.mjs src/index.html` |
| `tools/ordertest.mjs` | reproduces the order-independence probe and writes the differing frames |
| `tools/imgdiff.py` | pixel diff of two PNGs, with the differing region: `python3 tools/imgdiff.py a.png b.png` |
| `tools/diffseek.mjs` | seeks to one time from two different histories and compares |

**Two things to know if you edit the film.** A layer that holds a scrolled page
must clip itself (`overflow:hidden`), or the page spills past the layer's box and
shows over the page that is replacing it. And the course card is drawn **once**,
on the stage: an earlier version drew it in the window as well, so the same card
was rasterised twice at slightly different sub-pixel positions — invisible to the
eye, but it made the same frame of `seek(t)` differ depending on what was
seeked to before it. `tools/ordertest.mjs` is how that was found.

## Single file

```bash
python3 "<skill>/scripts/build_single.py" src/index.html dist/cybersecurity-300l.html
node "<skill>/scripts/check.mjs" src/index.html --dist dist/cybersecurity-300l.html
```

One self-contained HTML file: the font, the images and the music inlined.

---

## Sources and rights

- **Music** — `audio/audioknap-the-hip-hop-618430.mp3`, supplied by the user, cut
  to bars 20–32 (48.07 s – 80.92 s) at 95.000 BPM. The filename suggests an
  Audiomack/Audioknap source. **Confirm the licence before posting this film
  anywhere public.**
- **Type** — Geist (SIL Open Font License), from the project's own build cache.
- **Artwork** — the NUTM mark, the pixel hero and the desktop wallpaper are the
  project's own, from `website/public/`.
- **Data** — the courses, sessions and files are the project's own, from
  `website/src/lib/resources.ts` and `website/src/lib/schedule.ts`.
- **Mark** — the NUTM shield is the department's own.
