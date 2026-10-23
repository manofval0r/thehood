# MEMORY

## This machine (Windows, PowerShell)

- **No `bash`.** The `motion-designer` skill's `scripts/doctor.sh`, `install.sh` and
  `new_film.sh` cannot run. Replicate `new_film.sh` by hand: create
  `<film>/{src,audio,out,dist}`, copy `templates/shared/*` then
  `templates/<kind>/*` into `<film>/src/`, and write `out/` + `audio/source/` into
  `<film>/.gitignore`. Everything else in the skill (`beats.py`, `music_edit.py`,
  `assets.py`, `build_single.py`, `render.mjs`, `check.mjs`) runs fine.
- **`scripts/sheet.py` is broken on Windows** — it globs with forward slashes and
  then splits each path on `"/t"`, which throws on the backslash paths Windows
  produces. Workaround lives in `docs/launch-film/tools/sheet.mjs` +
  `tools/sheet.py` (Windows-safe tiler, same output).
- Python 3.11/3.12, Node 24, ffmpeg 9, Chrome, uv, Pillow are all installed.
- Set `$env:PYTHONIOENCODING="utf-8"` before running the skill's Python scripts —
  their `print()` calls use `→` and `–`, which crash on the default cp1252 console.

## motion-designer gotchas worth remembering

- **`cameraAt()` in `templates/*/device.js` keys `d` as the duration of the move
  *into* that key, and that move *starts* at the key's own `t`.** So a key's `t` is
  when the camera leaves the previous framing, not when it arrives. If you want a
  framing to land on a beat, write your own arrival-keyed camera instead
  (`docs/launch-film/src/scenes.js` has one, `cam()`).
- **`rise()` only translates; it does not hide.** An element that should be absent
  before its entrance needs its own `show()` gate, or it sits in its final place
  from the moment its container appears. Same for `rise()` on an element centred
  with `translateX(-50%)` — `rise()` overwrites the transform and loses the centring.
- **A layer that holds a scrolled page must clip itself** (`overflow:hidden`), or
  the page spills past the layer's box and shows over the page replacing it.
- **`collect(stage)` must run again** if you write `data-k` elements after it
  (e.g. building a list in JS) or `$["key"]` is `undefined` at apply time.
- **A `K.beat` that is referenced but never defined makes `prog()` return NaN**,
  and an invalid `translateY(NaNpx)` is rejected by the browser, so the element
  silently keeps its previous transform — a non-determinism that no check catches
  but the order-independence probe does. Grep for every `K.*` used against the
  ones defined.
- **The split-flap clock reads HH:MM:SS, so the digit places are not decimal
  powers of the remaining seconds** — each field counts inside its own cycle
  (minutes inside the hour), or the middle digits come out wrong.
- `check.mjs` has a `--no-loop` flag if a film legitimately cannot loop.

## This project — Cybersecurity 300L course resource hub

- The site's live address is **`https://www.thehood-psi.vercel.app/`**. The
  `thehood.vercel.app` default in `website/src/app/sitemap.ts` is the older
  fallback — use the `www.thehood-psi` one in anything public.
- The app's Geist font (Latin, variable 100–900) is in the build cache at
  `website/.next/static/media/7178b3e590c64307-s.21jp631_3pja2.woff2` — usable as
  a local font without a network fetch.
- `website/src/lib/resources.ts` holds 10 courses / 23 units / 15 files;
  `website/src/lib/schedule.ts` derives 11 weekly sessions. The site's real
  counts, if a mockup needs them.
- Features that exist now, in case a mockup or a film needs them: a per-course
  workspace with folders (`lib/file-tree.ts`), an in-browser viewer for every
  file kind (`app/view/[id]`, `components/viewers/*`), recorded lectures per
  course (`lib/videos.ts`, `VideoLibrary.tsx`), a notification bell with web push
  and quiet hours, a `/events` page (CTF + department events) and a `/careers`
  page, and a staff area with a file manager, a video manager, a roll and a
  review queue. The student-facing nav is Courses, Timetable, Calendar,
  Registration, Resources, Careers, Events.
- A launch film for the site lives in `docs/launch-film/` (source, brief, README
  with the beat map, and the rendered mp4s under `out/`, which is gitignored).
