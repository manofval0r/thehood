# Cyber-Security 300L — Course Resource Hub

A resource management site for **NUTM Cyber-Security 300 Level, First Semester 2026/2027**.
Students can browse the 10 registered courses, filter resources by type, preview PDFs in a dialog, and batch-download selections as a single ZIP.

Built with **Next.js (App Router, React 19) + Tailwind v4** in `website/`, deployed on **Vercel**. Black ground, green accent, white ink.

## Project layout

```
cyber CMS/
├── courses/                     # (source folders where you keep resource files)
├── docs/                        # (source timetable + registration PDFs)
└── website/                     # ← the Next.js app (point Vercel here)
    ├── src/
    │   ├── app/                 # routes: /, /courses/[slug], /timetable, /registration
    │   ├── components/          # Nav, SearchBar, ResourceCard, ResourceModal, BatchDownload…
    │   └── lib/resources.ts     # ← THE MANIFEST — this is where resources are listed
    └── public/
        ├── courses/             # ← served file copies (this is what users download)
        └── docs/                # ← served timetable + registration PDFs
```

**Served files** live in `website/public/courses/<Course Folder>/` and `website/public/docs/`. The repo-root `courses/` and `docs/` are your original source folders — mirror/sync new files into `website/public/` (or keep them there directly once it's your workflow).

## Run locally

```bash
cd website
npm install
npm run dev        # → http://localhost:3000
npm run build      # production build
```

## Adding a resource (the "CMS" for now)

1. Put the file in `website/public/courses/<Course Folder>/`.
2. Add one entry to `website/src/lib/resources.ts` under the right course's `resources` array:

```ts
{
  id: "csc309-lecture-1",
  title: "Lecture 1 — Intro to AI",
  type: "pptx",          // "pdf" | "pptx" | "xlsx" | "doc" | "other"
  url: "/courses/Artificial Intelligence/Lecture 1 – Intro to AI.pptx",
},
```

3. Commit and push — Vercel redeploys automatically.

`resources.ts` is the single source of truth the site reads. The future admin CMS will edit this same data instead of the file being hand-edited.

## Deploy to Vercel

1. Push this repo to your existing GitHub repo (or push `website/` contents into it).
2. In Vercel: **New Project → import your repo → Root Directory = `website`**.
   (Next.js is auto-detected.) Framework preset: Next.js. No env vars needed.
3. Deploy. Live on push.

## Pages

- `/` — all 10 courses, search (course code, lecturer, keywords) → jumps to the course
- `/courses/<slug>` — course detail + resources with type filters, **PDF preview in dialog**, **per-course batch download**
- `/timetable` — full weekly timetable (also downloadable as PDF)
- `/registration` — the 10-course registration list (23 units, also downloadable as PDF)
- `/timeline` — **academic calendar timeline** with current date marker, exam countdown, and session progress bar

## Design (black · green · white)

- **Palette:** black ground (#000), near-black surface (#0a0a0a), green accent (#22c55e), white ink (#fff). No gradients, no shadows at rest.
- **Type:** one family (Geist Sans), two sizes: large headlines, small data.
- **No icon-topped feature cards, no rows of identical cards.**
- **No glass, no gradients, no thin rules.** Space, scale, and full content drive the design.
- **Headlines:** two lines or fewer at every width.

## Design system & roadmap

- **Core design:** follows design-taste-frontend house rules (no ornaments, no icons-topped cards, no monospace, no thin rules).
- **Color roles:** one ground, one ink, one accent (green #22c55e). Sections change color fields but maintain consistent spacing.
- **Motion:** only purposeful animation — entrance for section parts, feedback on controls, hero picture movement. No empty fades.

## High-priority roadmap (P0–P1)

| Priority | Feature | Notes |
|---|---|---|
| **P0** | Course list, course detail, search, resources tab, PDF preview, batch download | ✅ Already built and tested |
| **P1 — highest priority** | **Academic calendar timeline** with current date marker and exam countdown | High-fidelity CSS-only design (no image_url), vertical line with color-coded dots, current date pulsing green indicator |
| P2 | Real-world cybersecurity news via open RSS feeds | Cards with category tags (Threat, Policy, Tooling, Breach) |
| P3 | Certification deals, competitions, and role pathways | Static curated cards with downloadable resources |
| P4 | Prospective cyber roles (forensic, SOC, pentester, cloud) | Sections with tool lists and links |
| P4 | Events feed (hackathons, conferences) | Parse open feeds or manual entries |
| P6 | Admin CMS upload interface | Future phase — replace manifest with API |

## The pixel art (favicon + README embed)

- **Source:** 34×20 pixel grid (see `website/src/lib/resources.ts` for the `typeIcon` mapping)
- **Subject:** hooded figure sitting at a laptop, green eyes, black silhouette
- **Files:** `favicon-48.png`, `favicon-32.png`, `icon-144.png`, `icon-192.png` in `website/public/`
- **Embed in README:** base64 data URI (48×48 PNG) — see `README.md` for the full string

## Timeline feature highlights

- **Current date marker:** pulsating green dot on the vertical timeline
- **Days until exams:** large countdown number
- **Session progress:** progress bar showing % of semester completed
- **Category coding:** green for academic, amber for exams, grey for holidays, blue for statutory meetings
- **Mobile responsive:** timeline adapts to mobile view with stacked sections

## README pixel art embed (favicon & hero)

The README contains a base64-encoded PNG of the pixel art (32×32 and 48×48 variants). The embed appears in the introduction section and the favicon is served via `public/favicon.png`.

## How to add resources (today's CMS)

1. Place file in `website/public/courses/<Course Folder>/`
2. Add manifest entry to `website/src/lib/resources.ts`
3. Commit and push — Vercel deploys automatically

## Roadmap

- **P0** (now): Course pages, search, resources, batch download, PDF viewer
- **P1** (next): Academic calendar timeline with timeline design and countdown
- **P2**: News feed (RSS parsing), certification/competition cards
- **P5**: Admin CMS for resource uploads
- **Future**: Calendar integration with Google Calendar, wallpaper export, mobile app

## How to add the timeline (P1)

1. Add `website/src/lib/calendar.ts` (done)
2. Create `/app/timeline/page.tsx` (done)
3. Add to Nav and Footer links
4. Update `/` homepage to link to `/timeline`
5. Run `npm run dev` and verify `/timeline` shows the vertical timeline with current date marker

## Pixel art note

- The pixel art (hooded figure on laptop) is available as `favicon-48.png` and `icon-144.png`.
- The base64 embed for the README is in `website/README.md` — look for the "pixel art" section.
- The art is rendered via SVG → PNG (via resvg) in `pixelart/gen.js` — it's a static asset, not a live component.

## Running the dev server

```bash
cd "C:\CD STF\School Stuff\cyber CMS\website"
npm run dev
```

The server is running at `http://localhost:3000` — check the homepage, course pages, and the new `/timeline` page.