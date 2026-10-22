/* ============================================================
   CYBERSECURITY 300L — a launch film for the course resource hub.

   Every screen is rebuilt from the app's own components and tokens:
   website/src/app/globals.css, Nav.tsx, SearchBar.tsx, CourseCard.tsx,
   NextClassCountdown.tsx, FlipClock.tsx, TimetableBoard.tsx, resources.ts.

   Every frame is a pure function of t. No timers, no randomness, no CSS
   animation, no state carried between frames.
   ============================================================ */

film({
  W: 1920,
  H: 1080,
  FPS: 60,
  BPM: 95.00009,
  BEATS: 52,
  /* [at, len] reserves len whole beats of pause before story beat `at`.
     None of them sit before beat 21, so the drop lands on music beat 21 —
     the track's own drop bar, at 12.632 s. The last one is the tail. */
  holds: [[22, 2], [29, 3], [33, 1], [40, 7]],
});

/* ============================================================
   THE APP'S DATA — website/src/lib/resources.ts, verbatim
   ============================================================ */

const COURSES = [
  { code: "GST 312", title: "Peace and Conflict Resolution", units: 2, lecturer: "Ikechukwu Alamezie", venue: "PG 2", files: 1 },
  { code: "NUT-MAN 315", title: "Marketing Management", units: 2, lecturer: "Dr Ebes", venue: "PG 2", files: 3 },
  { code: "NUT-CSC 301", title: "Digital Sovereignty: Governance, Technology and Implementation", units: 2, lecturer: "Prof Sinjay", venue: "PG 2", files: 0 },
  { code: "CSC 309", title: "Artificial Intelligence", units: 2, lecturer: "Charles Igah", venue: "Cybersecurity Lab", files: 2 },
  { code: "NUT-CSC 312", title: "Data Structures", units: 3, lecturer: "Jeremiah Ocheni", venue: "Software Lab", files: 2 },
  { code: "CYB 301", title: "Cryptography Techniques, Algorithms and Applications", units: 2, lecturer: "Dr Steve", venue: "Cybersecurity Lab", files: 0 },
  { code: "CYB 303", title: "Cybersecurity Risks Analysis, Challenges and Mitigation", units: 2, lecturer: "Dr Faki", venue: "Cybersecurity Lab", files: 0 },
  { code: "CYB 305", title: "Digital Forensics and Investigation Methods", units: 2, lecturer: "Dr Segun", venue: "Cybersecurity Lab", files: 7 },
  { code: "NUT-CSC 310", title: "Distributed System Security", units: 3, lecturer: "Pending", venue: "Cybersecurity Lab", files: 0 },
  { code: "NUT-CYB 312", title: "Secure Coding", units: 3, lecturer: "Dr Faki", venue: "Cybersecurity Lab", files: 0 },
];
const TOTAL_UNITS = COURSES.reduce((n, c) => n + c.units, 0);
const TOTAL_FILES = COURSES.reduce((n, c) => n + c.files, 0);
const WITH_FILES = COURSES.filter((c) => c.files > 0).length;

/* The seven files CYB 305 publishes. Searching "forensic" finds the course
   and, because a resource is scored against its course's title too, all
   seven of them. */
const CYB305_FILES = [
  { title: "CYB 305 Course Overview", type: "pdf" },
  { title: "Week 1 - Computer Forensics Fundamentals", type: "pdf" },
  { title: "Lab Evidence Manual - README_FIRST", type: "doc" },
  { title: "Preliminary Report (DRAFT)", type: "doc" },
  { title: "SHA256 Source Manifest", type: "doc" },
  { title: "Student Report Template", type: "doc" },
  { title: "Inference Provider Config (JSON)", type: "doc" },
];
/* The file the film opens, and the kind label the viewer puts on it. */
const OPENED_FILE = CYB305_FILES[1];
const OPENED_INDEX = 1;
/* The kind labels, from lib/file-kinds.ts. */
const KIND_LABEL = { pdf: "pdf", doc: "word", pptx: "slides", xlsx: "sheet", csv: "csv", json: "json", txt: "text" };

/* The weekly schedule, in the order schedule.ts sorts it: by day, then time. */
const SCHEDULE = [
  { d: "Monday", t: "10:00am - 12:00pm", code: "CYB 303", title: "Cybersecurity Risks Analysis, Challenges and Mitigation", u: 2, v: "PG 2", l: "Dr Faki", x: true },
  { d: "Monday", t: "1:00pm - 4:00pm", code: "NUT-CYB 312", title: "Secure Coding", u: 3, v: "Cybersecurity Lab", l: "Dr Faki" },
  { d: "Tuesday", t: "9:00am - 11:00am", code: "NUT-MAN 315", title: "Marketing Management", u: 2, v: "PG 2", l: "Dr Ebes" },
  { d: "Tuesday", t: "12:00pm - 2:00pm", code: "NUT-CSC 301", title: "Digital Sovereignty: Governance, Technology and Implementation", u: 2, v: "PG 2", l: "Prof Sinjay" },
  { d: "Tuesday", t: "3:00pm - 5:00pm", code: "GST 312", title: "Peace and Conflict Resolution", u: 2, v: "PG 2", l: "Ikechukwu Alamezie" },
  { d: "Wednesday", t: "9:00am - 12:00pm", code: "NUT-CSC 312", title: "Data Structures", u: 3, v: "Software Lab", l: "Jeremiah Ocheni" },
  { d: "Wednesday", t: "12:30pm - 2:30pm", code: "CYB 305", title: "Digital Forensics and Investigation Methods", u: 2, v: "Cybersecurity Lab", l: "Dr Segun" },
  { d: "Wednesday", t: "3:00pm - 5:00pm", code: "CYB 303", title: "Cybersecurity Risks Analysis, Challenges and Mitigation", u: 2, v: "Cybersecurity Lab", l: "Dr Faki" },
  { d: "Thursday", t: "9:00am - 12:00pm", code: "NUT-CSC 310", title: "Distributed System Security", u: 3, v: "Cybersecurity Lab", l: "Pending" },
  { d: "Thursday", t: "12:30pm - 2:30pm", code: "CYB 301", title: "Cryptography Techniques, Algorithms and Applications", u: 2, v: "Cybersecurity Lab", l: "Dr Steve" },
  { d: "Thursday", t: "3:00pm - 5:00pm", code: "CSC 309", title: "Artificial Intelligence", u: 2, v: "Cybersecurity Lab", l: "Charles Igah" },
];

/* The perspective view sorts by distance from the session running now. */
const RUNNING = 6; /* CYB 305, Wednesday 12:30pm - 2:30pm */
const PERSPECTIVE = SCHEDULE.map((s, i) => ({ s, d: Math.abs(i - RUNNING) }))
  .sort((a, b) => a.d - b.d || a.s.d.localeCompare(b.s.d));

/* The query the film types. */
const QUERY = "forensic";

/* ============================================================
   LAYOUT — window points, the app's own sizes
   ============================================================ */

const BAR = 50;            /* the browser bar's height */
const NAVH = 64;           /* the app's nav bar */
const APPH = WIN.h - BAR;  /* 770 — the app's viewport inside the window */
const PAD = 32;            /* the page container's px-8 */
const CONTENT = WIN.w - PAD * 2;

const NAV = { top: BAR, h: 48, x: PAD, w: CONTENT };
const TABS = ["Courses", "Timetable", "Calendar", "Registration", "Resources", "Careers", "Events"];
const TABS_X = [];
const TABS_W = [];

/* The home page, measured the way the app lays it out. */
const HERO = {
  deptY: BAR + NAVH + 80,
  headY: BAR + NAVH + 80 + 16 + 40,
  headSize: 96,
  headLead: 88.32,
  colL: PAD,
  colW: 617,
  artX: 730,
  artW: 420,
  artY: 487,
};
HERO.copyY = HERO.headY + 176.64 + 56;
HERO.fieldY = HERO.copyY + 88 + 36;
HERO.statsY = HERO.fieldY + 56 + 48;

/* The session snapshot, further down the same page. */
const SNAP = { y: 892, labelY: 956, clockY: 1000, cardY: 1174, endY: 1256, h: 400 };

/* The results panel that opens under the search field. */
const PANEL = { x: PAD, w: 617, y: 0, h: 0 };

/* The timetable page. */
const TT = {
  h1Y: 194,
  slicerY: 322,
  theadY: 372,
  rowH: 44,
  headRH: 42,
  thH: 40,
};

/* The end card, on the stage. */
const END = { markY: 64, wmY: 140, subY: 174, lineY: 222, factY: 334, ctaY: 380, urlY: 464 };

/* The relay: one course card, in from the start and back at the end. */
const RELAY = { card: { x: 790, y: 442, w: 340, h: 196, r: 12 } };
const CARD_WIN = { x: 430, y: 292, w: 340, h: 196, r: 12 };

/* ============================================================
   SMALL MARKS — the app's own icon set, redrawn
   ============================================================ */

const IC = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M20.2 20.2 16.7 16.7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1116 0z"/><circle cx="12" cy="10" r="2.6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  download: '<path d="M12 3v12M7.5 11 12 15.5 16.5 11M4 20h16"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  rows: '<rect x="3" y="5" width="18" height="4" rx="1.2"/><rect x="3" y="10" width="18" height="4" rx="1.2"/><rect x="3" y="15" width="18" height="4" rx="1.2"/>',
  doc: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/><path d="M8.5 13h7M8.5 17h4"/>',
  book: '<path d="M12 7.5v13M3.5 18.5a1 1 0 01-1-1V6a2 2 0 012-2h5a3 3 0 013 3v13a3 3 0 00-3-3h-5a2 2 0 00-2 1.5z"/>',
  up: '<path d="M7 17 17 7M9 7h8v8"/>',
  back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  chevL: '<path d="M15 18l-6-6 6-6"/>',
  chevR: '<path d="M9 6l6 6-6 6"/>',
};
const svg = (path, size, color, sw = 1.8) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none">${path}</svg>`;

/* The NUTM mark, from website/src/components/Wordmark.tsx. */
function nutmMark(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" style="display:block;flex:none">
    <defs>
      <linearGradient id="nutm-face" x1="4" y1="3" x2="27" y2="29">
        <stop offset="0%" stop-color="#8f8f8f"/><stop offset="42%" stop-color="#4d4d4d"/><stop offset="100%" stop-color="#232323"/>
      </linearGradient>
      <linearGradient id="nutm-side" x1="10" y1="10" x2="26" y2="30">
        <stop offset="0%" stop-color="#1c1c1c"/><stop offset="100%" stop-color="#050505"/>
      </linearGradient>
      <linearGradient id="nutm-edge" x1="5" y1="4" x2="14" y2="17">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g transform="translate(1.65 3)" fill="url(#nutm-side)"><path d="M16 2.4 L28.6 8.2 V17.6 C28.6 24.4 23.4 29.2 16 30.6 C8.6 29.2 3.4 24.4 3.4 17.6 V8.2 Z"/></g>
    <path d="M16 2.4 L28.6 8.2 V17.6 C28.6 24.4 23.4 29.2 16 30.6 C8.6 29.2 3.4 24.4 3.4 17.6 V8.2 Z" fill="url(#nutm-face)"/>
    <path d="M16 2.4 L28.6 8.2 V17.6 C28.6 24.4 23.4 29.2 16 30.6 C8.6 29.2 3.4 24.4 3.4 17.6 V8.2 Z" stroke="url(#nutm-edge)" stroke-width="1.6"/>
    <path d="M16 11.1 a4.35 4.35 0 1 0 0.01 0 Z M13.9 15.2 h4.2 l1.5 8.1 h-7.2 Z" fill="#04140a" fill-opacity="0.92"/>
    <path d="M16 12.6 a2.85 2.85 0 1 1 -0.01 0 Z" fill="#22c55e"/>
    <path d="M15.1 16.2 h1.9 l1.15 6.2 h-4.2 Z" fill="#22c55e"/>
  </svg>`;
}

/* The bell, drawn in pixels, the way NotificationBell.tsx draws it. */
const BELL = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="display:block">
  <rect x="6" y="1" width="4" height="2"/><rect x="4" y="3" width="8" height="2"/>
  <rect x="3" y="5" width="10" height="2"/><rect x="2" y="7" width="12" height="2"/>
  <rect x="3" y="9" width="10" height="2"/><rect x="5" y="11" width="6" height="2"/>
  <rect x="7" y="13" width="2" height="2"/>
</svg>`;
/* The course card — CourseCard.tsx. It opens and closes the film. */
function cardMarkup() {
  return `
    <div class="abs" style="left:0;top:0;width:340px;height:196px;border-radius:12px;border:1px solid #1f1f1f;background:#0a0a0a;padding:20px;display:flex;flex-direction:column">
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <span class="chip" style="font-size:11px;padding:4px 8px">CYB 305</span>
        <span style="opacity:.5">${svg(IC.up, 16, "#6b6b6b")}</span>
      </div>
      <div class="t" style="font-size:15px;font-weight:600;line-height:1.35;color:#fff;margin-top:16px">Digital Forensics and Investigation Methods</div>
      <div class="t" style="font-size:13px;color:#9a9a9a;margin-top:8px">Dr Segun</div>
      <div class="row" style="margin-top:auto;padding-top:16px;border-top:1px solid #1f1f1f;justify-content:space-between;font-size:12px;color:#9a9a9a">
        <span class="t tnum">2 units</span><span class="t tnum" style="color:#fff;font-weight:500">5 files</span>
      </div>
    </div>`;
}

/* ============================================================
   THE SPLIT-FLAP CLOCK — FlipClock.tsx, one flap per digit
   ============================================================ */

const FLIP_TOP = 0.3;
const FLIP_BOT = 0.3;

/* Remaining seconds on the countdown, as a function of t. */
const CLOCK_START = 4 * 3600 + 12 * 60 + 36; /* 04:12:36 */
const remaining = (t) => Math.max(0, CLOCK_START - t);

/* The clock reads HH:MM:SS, so the digits are not decimal places of a
   countdown — the minutes tens digit is the tens digit of the minutes,
   which counts inside its own hour, not inside the whole countdown. */
const FIELDS = [
  { unit: 3600, cycle: 86400 },
  { unit: 60, cycle: 3600 },
  { unit: 1, cycle: 60 },
];

/* The digit of a field, and how long ago it last changed. */
function fieldDigit(rem, field, tens) {
  const period = field.unit * (tens ? 10 : 1);
  const value = (r) => Math.floor((r % field.cycle) / field.unit);
  const v = value(rem);
  const oldV = value(rem + period);
  return {
    value: tens ? Math.floor(v / 10) % 10 : v % 10,
    age: Math.ceil(rem / period) * period - rem,
    old: tens ? Math.floor(oldV / 10) % 10 : oldV % 10,
  };
}

function flap(rem, field, tens, h) {
  const d = fieldDigit(rem, field, tens);
  let leaves = "";
  if (d.age < FLIP_TOP) {
    const p = d.age / FLIP_TOP;
    leaves = `<div class="flip-leaf"><div class="leaf-top" style="transform:rotateX(${(-90 * p).toFixed(2)}deg);filter:brightness(${(1 - 0.45 * p).toFixed(3)})"><div class="flip-glyph">${d.old}</div></div></div>`;
  } else if (d.age < FLIP_TOP + FLIP_BOT) {
    const p = (d.age - FLIP_TOP) / FLIP_BOT;
    leaves = `<div class="flip-leaf"><div class="leaf-bottom" style="transform:rotateX(${(90 - 90 * p).toFixed(2)}deg);filter:brightness(${(0.55 + 0.45 * p).toFixed(3)})"><div class="flip-glyph flip-glyph-low">${d.value}</div></div></div>`;
  }
  return `<div class="flip" style="--flap-h:${h}px;--flap-w:${(h * 0.92).toFixed(2)}px">
    <div class="flip-half flip-top"><div class="flip-glyph">${d.value}</div></div>
    <div class="flip-half flip-bottom"><div class="flip-glyph flip-glyph-low">${d.value}</div></div>
    ${leaves}
  </div>`;
}

function clockHtml(rem, h) {
  return `<div class="row" style="gap:6px;align-items:flex-start">
    ${FIELDS.map((f, i) => `
      <div class="row" style="gap:6px">${flap(rem, f, true, h)}${flap(rem, f, false, h)}</div>
      ${i < 2 ? `<div class="flip-colon" style="font-size:${(h * 0.42).toFixed(1)}px">:</div>` : ""}
    `).join("")}
  </div>`;
}

/* ============================================================
   TIMELINE
   ============================================================ */

const K = {};
const POINTER = [];

function timeline() {
  Object.assign(K, {
    card: B(1), open: B(2), nav: B(3), head: B(4), stats: B(5),
    snap: B(6), nextcard: B(7), back: B(8), point: B(9), click: B(10),
    type: B(11), panel: B(15), files: B(16), sel: B(17), push: B(18), open2: B(19),
    route: B(20),
    drop: B(21), read: B(22), navmove: B(24), navclick: B(25),
    time: B(26), persp: B(27),
    pull: B(29), desk: B(30), lap: B(31), card2: B(32),
    mark: B(33), line: B(34), accent: B(35), facts: B(36),
    cta: B(37), url: B(38), final: B(39),
  });
  /* The end card sinks, then the world goes and the card flies home. */
  K.sink = K.final + 0.9;
  K.fly = K.final + 1.25;

  POINTER.splice(0, POINTER.length,
    { t: 0, x: WIN.x + 500, y: WIN.y + 300 },
    { t: K.point, x: WIN.x + HERO.colL + 90, y: WIN.y + HERO.fieldY + 28, d: 0.7 },
    { t: K.push, x: WIN.x + 200, y: WIN.y + 439, d: 0.8 },
    { t: K.navmove, x: WIN.x + TABS_X[1] + TABS_W[1] / 2, y: WIN.y + NAV.top + 24, d: 0.4 },
    { t: K.persp - 0.35, x: WIN.x + 150, y: WIN.y + TT.slicerY + 16, d: 0.7 });
}

/* ============================================================
   BUILD
   ============================================================ */

function build(stage) {
  /* The tab geometry is needed by the pointer, so it comes first.
     px-3, not px-3.5: with seven links the half-pixel on each side is
     thirty pixels across the row, which is the difference between the
     last link fitting beside the countdown and being clipped by it. */
  for (const t of TABS) TABS_W.push(measure(t, 13.5, 500) + 24);
  const tabsTotal = TABS_W.reduce((a, b) => a + b, 0);
  let tx = 0;
  for (let i = 0; i < TABS.length; i++) { TABS_X.push(tx); tx += TABS_W[i]; }

  timeline();

  /* --- the nav ---
     The bar is the nav's own floating pill. Everything inside it is placed
     relative to the bar, not to the window. */
  const tabHtml = TABS.map((t, i) =>
    `<div class="abs" data-k="tab${i}" style="left:${TABS_X[i] - PAD}px;top:8px;width:${TABS_W[i]}px;height:32px;display:flex;align-items:center;justify-content:center;font-size:13.5px;font-weight:500;color:${i === 0 ? "#fff" : "#9a9a9a"}">${t}</div>`
  ).join("");

  const nav = `
    <div class="abs" data-k="navBar" style="left:${NAV.x}px;top:${NAV.top}px;width:${NAV.w}px;height:${NAV.h}px;border-radius:24px">
      <div class="abs" data-k="mark1" style="left:16px;top:9px">${nutmMark(30)}</div>
      <div class="abs" style="left:56px;top:10px;display:flex;flex-direction:column;align-items:flex-start;line-height:1">
        <div class="t" style="font-size:15px;font-weight:700;letter-spacing:-.01em;color:#fff">Cybersecurity 300L</div>
        <div class="t" style="font-size:10px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:#9a9a9a;margin-top:4px">NUTM Apapa</div>
      </div>
      <div class="abs navPill" data-k="navPill" style="left:${TABS_X[0] - PAD}px;top:8px;height:32px;width:${TABS_W[0]}px"></div>
      ${tabHtml}
      <div class="abs" data-k="navBell" style="right:8px;top:6px;width:32px;height:32px;border-radius:50%;border:1px solid #1f1f1f;background:#0a0a0a;display:flex;align-items:center;justify-content:center;color:#9a9a9a">${BELL}</div>
      <div class="abs" data-k="navClock" style="right:8px;top:6px;height:36px;padding:4px 12px 4px 10px;border:1px solid #1f1f1f;border-radius:999px;background:#0a0a0a;display:flex;align-items:center;gap:8px">
        <i class="dot" style="width:6px;height:6px;background:#6b6b6b"></i><span data-k="navClockInner" style="display:block"></span>
        <span class="t" data-k="navCode" style="font-family:Geist,monospace;font-size:11px;line-height:1;color:#fff">CYB 305</span>
      </div>
    </div>`;

  /* --- the home page --- */
  const stat = (v, l, accent) =>
    `<div><div class="t tnum" style="font-size:30px;font-weight:700;line-height:1;color:${accent ? "#22c55e" : "#fff"}">${v}</div>
     <div class="t" style="font-size:12px;color:#9a9a9a;margin-top:6px">${l}</div></div>`;

  const hero = `
    <div class="abs" data-k="dept" style="left:${PAD}px;top:${HERO.deptY}px;display:flex;align-items:center;gap:12px">
      <i style="width:32px;height:1px;background:rgba(34,197,94,.6)"></i>
      <span class="t" style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#22c55e">Department of Cybersecurity</span>
      <span class="t" style="font-size:11px;color:#9a9a9a;margin-left:4px">First semester 2026/2027</span>
    </div>
    <div class="abs" data-k="head1" style="left:${PAD}px;top:${HERO.headY}px;font-size:${HERO.headSize}px;font-weight:700;line-height:${HERO.headLead}px;letter-spacing:-.045em;color:#fff">Every lecture note,</div>
    <div class="abs" data-k="head2" style="left:${PAD}px;top:${HERO.headY + HERO.headLead}px;font-size:${HERO.headSize}px;font-weight:700;line-height:${HERO.headLead}px;letter-spacing:-.045em;color:#fff">lab and handout.</div>

    <div class="abs" data-k="copy" style="left:${PAD}px;top:${HERO.copyY}px;font-size:18px;line-height:29.25px;color:#9a9a9a">
      <div>All ten courses in the Cybersecurity 300 Level programme,</div>
      <div>alongside the week-by-week calendar for 2026/2027. Open a</div>
      <div>file straight from search, or take a whole course as a zip.</div>
    </div>

    <div class="abs" data-k="field" style="left:${PAD}px;top:${HERO.fieldY}px;width:${HERO.colW}px;height:56px;border-radius:12px;border:1px solid #1f1f1f;background:#0a0a0a;display:flex;align-items:center">
      <span data-k="fieldIcon" style="position:absolute;left:16px;top:19px">${svg(IC.search, 18, "#9a9a9a")}</span>
      <span data-k="fieldText" class="t" style="position:absolute;left:48px;top:18px;font-size:15px;color:#9a9a9a">Search courses, lecturers, or a file name</span>
      <span data-k="fieldCaret" style="position:absolute;left:48px;top:15px;width:2px;height:26px;background:#22c55e;display:none"></span>
      <span data-k="fieldSlash" style="position:absolute;right:12px;top:18px;font-size:11px;color:#6b6b6b;border:1px solid #1f1f1f;border-radius:4px;padding:1px 5px;background:#141414">/</span>
    </div>

    <div class="abs" data-k="stats" style="left:${PAD}px;top:${HERO.statsY}px;width:${HERO.colW}px;padding-top:32px;border-top:1px solid #1f1f1f;display:flex;align-items:flex-start;gap:48px">
      ${stat(COURSES.length, "Courses")}${stat(TOTAL_UNITS, "Units")}${stat(TOTAL_FILES, "Files uploaded", true)}${stat(WITH_FILES, "Courses with files")}
    </div>

    <img data-k="heroArt" src="${ASSETS.img.hero}" style="position:absolute;left:${HERO.artX}px;top:${HERO.artY}px;width:${HERO.artW}px;height:304px;object-fit:contain;image-rendering:pixelated"/>

    <div class="abs" data-k="snapSec" style="left:${PAD}px;top:${SNAP.y}px;width:${CONTENT}px;height:${SNAP.h}px;border-radius:8px;border:1px solid #1f1f1f;background:#0a0a0a">
      <div class="abs" data-k="snapLabel" style="left:0;right:0;top:${SNAP.labelY - SNAP.y}px;display:flex;align-items:center;justify-content:center;gap:10px">
        <i class="dot" style="width:6px;height:6px;background:#6b6b6b"></i>
        <span class="t" style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#22c55e">Next class</span>
      </div>
      <div class="abs" data-k="snapClock" style="left:0;right:0;top:${SNAP.clockY - SNAP.y}px;display:flex;justify-content:center"></div>
      <div class="abs" data-k="snapUntil" style="left:0;right:0;top:${SNAP.cardY - SNAP.y - 40}px;text-align:center;font-size:13px;color:#9a9a9a">until it starts</div>
      <div class="abs" data-k="snapCard" style="left:50%;top:${SNAP.cardY - SNAP.y}px;transform:translateX(-50%);width:576px;height:70px;border-radius:12px;border:1px solid #1f1f1f;background:#0a0a0a;display:flex;align-items:center;padding:0 20px;gap:16px">
        <i class="abs" style="left:0;top:0;bottom:0;width:2px;background:#22c55e"></i>
        <div style="flex:1;min-width:0">
          <div class="t" style="font-size:16px;font-weight:600;letter-spacing:-.01em;color:#fff">Digital Forensics and Investigation Methods</div>
          <div class="row" style="gap:10px;margin-top:8px;font-size:12.5px;color:#9a9a9a">
            <span class="chip" style="font-size:11px;padding:2px 6px">CYB 305</span>
            <span class="row" style="gap:5px">${svg(IC.calendar, 12, "#9a9a9a")}Wednesday</span>
            <span class="row" style="gap:5px">${svg(IC.pin, 12, "#9a9a9a")}Cybersecurity Lab</span>
          </div>
        </div>
        <span style="opacity:.55">${svg(IC.arrow, 17, "#fff")}</span>
      </div>
      <div class="abs" data-k="snapFoot" style="left:0;right:0;top:${SNAP.endY - SNAP.y}px;text-align:center;font-size:12px;color:#6b6b6b"></div>
    </div>`;

  /* --- the results panel --- */
  const fileRow = (file, i) => `
    <div class="abs" data-k="file${i}" style="left:6px;top:${i * 62}px;width:${PANEL.w - 12}px;height:62px;border-radius:6px;display:flex;align-items:center;gap:12px;padding:0 10px">
      <span data-k="fileIcon${i}" style="opacity:.75">${svg(file.type === "pdf" ? IC.doc : IC.doc, 15, "#9a9a9a")}</span>
      <span style="flex:1;min-width:0">
        <span class="t" style="display:block;font-size:14px;font-weight:500;color:#fff">${file.title}</span>
        <span class="t" style="display:block;font-size:12px;color:#9a9a9a;margin-top:3px">CYB 305 · Digital Forensics and Investigation Methods</span>
      </span>
      <span class="t" style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9a9a9a;background:#141414;border-radius:4px;padding:2px 6px">${file.type}</span>
    </div>`;

  const panel = `
    <div class="abs panel" data-k="panel" style="left:${PANEL.x}px;top:${PANEL.y}px;width:${PANEL.w}px;height:${PANEL.h}px">
      <div class="abs" data-k="panelScroll" style="left:0;top:0;width:${PANEL.w}px;height:${PANEL.h - 30}px;overflow:hidden">
        <div class="groupHead" data-k="groupCourses" style="position:absolute;left:16px;top:8px">Courses</div>
        <div class="abs" data-k="courseHit" style="left:6px;top:25px;width:${PANEL.w - 12}px;height:62px;border-radius:6px;display:flex;align-items:center;gap:12px;padding:0 10px">
          <span style="opacity:.75">${svg(IC.book, 15, "#9a9a9a")}</span>
          <span style="flex:1;min-width:0">
            <span class="t" style="display:block;font-size:14px;font-weight:500;color:#fff">Digital Forensics and Investigation Methods</span>
            <span class="t" style="display:block;font-size:12px;color:#9a9a9a;margin-top:3px">Dr Segun · Cybersecurity Lab</span>
          </span>
          <span class="t" style="font-family:Geist,monospace;font-size:11px;font-weight:700;color:#22c55e">CYB 305</span>
        </div>
        <div class="groupHead" data-k="groupFiles" style="position:absolute;left:16px;top:99px">Files</div>
        <div data-k="fileList" style="position:absolute;left:0;top:116px;width:${PANEL.w}px">${CYB305_FILES.map((f, i) => fileRow(f, i)).join("")}</div>
      </div>
      <div class="abs" data-k="panelFoot" style="left:0;bottom:0;width:${PANEL.w}px;height:30px;border-top:1px solid #1f1f1f;display:flex;align-items:center;gap:16px;padding:0 12px;font-size:11px;color:#9a9a9a">
        <span class="row" style="gap:6px"><b style="font-weight:400;border:1px solid #1f1f1f;border-radius:4px;padding:0 4px;background:#0a0a0a">↑</b><b style="font-weight:400;border:1px solid #1f1f1f;border-radius:4px;padding:0 4px;background:#0a0a0a">↓</b>navigate</span>
        <span class="row" style="gap:5px">${svg(IC.arrow, 11, "#9a9a9a")}open</span>
        <span class="row" style="gap:6px"><b style="font-weight:400;border:1px solid #1f1f1f;border-radius:4px;padding:0 4px;background:#0a0a0a">esc</b>close</span>
      </div>
    </div>`;

  /* --- the timetable page --- */
  const dayHead = (d, y, today) => `
    <div class="abs" style="left:${PAD}px;top:${y}px;width:${CONTENT}px;height:${TT.headRH}px;display:flex;align-items:center;gap:12px;border-top:1px solid #2e2e2e">
      <span class="t" style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fff">${d}</span>
      ${today ? `<span class="t" style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#04140a;background:#22c55e;border-radius:999px;padding:4px 10px">Today</span>` : ""}
    </div>`;

  const trow = (s, y) => `
    <div class="abs" style="left:${PAD}px;top:${y}px;width:${CONTENT}px;height:${TT.rowH}px;border-top:1px solid #1f1f1f;display:flex;align-items:center;font-size:13px;color:#9a9a9a">
      <span class="t tnum" style="width:136px;padding-right:16px;font-weight:500;color:#fff">${s.t}</span>
      <span class="row" style="width:192px;gap:8px">
        <span class="t" style="font-family:Geist,monospace;font-size:12px;font-weight:700;color:#22c55e">${s.code}</span>
        ${s.x ? `<span class="t" style="font-family:Geist,monospace;font-size:9.5px;font-weight:700;letter-spacing:.06em;color:#6b6b6b;background:#141414;border-radius:4px;padding:1px 4px">+1</span>` : ""}
      </span>
      <span class="t" style="width:424px;padding-right:16px;font-weight:500;color:#fff">${s.title}</span>
      <span class="t tnum" style="width:80px;text-align:right;padding-right:16px;font-weight:600;color:#fff">${s.u}</span>
      <span class="t" style="width:152px;padding-left:16px;white-space:nowrap">${s.v}</span>
      <span class="t" style="width:152px;padding-left:16px;white-space:nowrap">${s.l}</span>
    </div>`;

  const prow = (item, i) => `
    <div class="abs" data-k="prow${i}" style="left:${PAD}px;top:${i * 58}px;width:${CONTENT}px;height:54px;border-radius:8px;display:flex;align-items:center;font-size:13px;color:#9a9a9a;padding:0 16px;gap:16px">
      <span class="t tnum" style="width:132px;font-weight:500;color:#fff">${item.s.t}</span>
      <span class="t" style="width:150px;font-family:Geist,monospace;font-size:12px;font-weight:700;color:#22c55e">${item.s.code}</span>
      <span class="t" style="flex:1;font-weight:500;color:#fff;white-space:nowrap;overflow:hidden">${item.s.title}</span>
      <span class="t" style="width:150px;white-space:nowrap">${item.s.v}</span>
      <span data-k="prowNow${i}" style="display:none;width:62px;height:20px;border-radius:999px;background:#22c55e;color:#04140a;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;align-items:center;justify-content:center">Now</span>
    </div>`;

  let ty = TT.theadY + TT.thH;
  const gridRows = [];
  let lastDay = null;
  for (const s of SCHEDULE) {
    if (s.d !== lastDay) {
      gridRows.push(dayHead(s.d, ty, s.d === "Wednesday"));
      ty += TT.headRH;
      lastDay = s.d;
    }
    gridRows.push(trow(s, ty));
    ty += TT.rowH;
  }

  const timeHtml = `
    <div class="abs" data-k="ttHead" style="left:${PAD}px;top:${TT.h1Y}px;width:760px">
      <div class="t" data-k="ttTitle" style="font-size:48px;font-weight:700;line-height:1.05;letter-spacing:-.02em;color:#fff">First Semester Timetable</div>
      <div data-k="ttSub" style="font-size:18px;line-height:1.55;color:#9a9a9a;margin-top:16px;width:576px">2026/2027 session. Every course code links to its resources page.</div>
    </div>
    <div class="abs" data-k="ttBtns" style="right:${PAD}px;top:${TT.h1Y}px;display:flex;flex-direction:column;gap:10px;align-items:flex-start">
      <span class="row" style="gap:8px;background:#22c55e;color:#04140a;border-radius:6px;padding:10px 16px;font-size:14px;font-weight:500">${svg(IC.download, 15, "#04140a")}Download PDF</span>
      <span class="row" style="gap:8px;border:1px solid #1f1f1f;border-radius:6px;padding:10px 16px;font-size:14px;color:#9a9a9a">${svg(IC.rows, 15, "#9a9a9a")}Print</span>
    </div>
    <div class="abs" data-k="slicer" style="left:${PAD}px;top:${TT.slicerY}px;height:34px">
      <div class="abs" style="left:0;top:0;height:34px;padding:3px;border-radius:9px;background:#0a0a0a;border:1px solid #1f1f1f;display:flex">
        <div data-k="slicerThumb" style="position:absolute;left:3px;top:3px;width:78px;height:26px;border-radius:7px;background:#141414;box-shadow:inset 0 0 0 1px #2e2e2e"></div>
        <div data-k="slicerGrid" style="position:absolute;left:3px;top:3px;width:78px;height:26px;display:flex;align-items:center;gap:6px;padding:0 10px;color:#9a9a9a;font-size:12.5px">${svg(IC.grid, 13, "#9a9a9a")}Grid</div>
        <div data-k="slicerPer" style="position:absolute;left:85px;top:3px;width:120px;height:26px;display:flex;align-items:center;gap:6px;padding:0 10px;color:#9a9a9a;font-size:12.5px">${svg(IC.rows, 13, "#9a9a9a")}Perspective</div>
      </div>
    </div>
    <div class="abs" data-k="ttGrid" style="left:${PAD}px;top:${TT.theadY}px;width:${CONTENT}px">
      <div class="abs" style="left:0;top:0;width:${CONTENT}px;height:${TT.thH}px;display:flex;align-items:center;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6b6b6b">
        <span style="width:136px">Time</span><span style="width:192px">Code</span><span style="width:424px">Course</span>
        <span style="width:80px;text-align:right;padding-right:16px">Units</span><span style="width:152px;padding-left:16px">Venue</span><span style="width:152px;padding-left:16px">Lecturer</span>
      </div>
      ${gridRows.join("")}
    </div>
    <div class="abs" data-k="ttTotal" style="left:${PAD}px;top:${ty}px;width:${CONTENT}px;height:46px;border-top:1px solid #2e2e2e;background:#1a1a1a;display:flex;align-items:center;font-size:12px;color:#9a9a9a;padding:0 16px">
      <span class="t" style="width:712px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:#fff">Total registered</span>
      <span class="t tnum" style="width:80px;text-align:right;font-weight:700;color:#fff">23</span>
      <span class="t" style="flex:1">units across 10 courses</span>
    </div>
    <div class="abs" data-k="ttPersp" style="left:${PAD}px;top:${TT.theadY}px;width:${CONTENT}px;height:${PERSPECTIVE.length * 58}px;visibility:hidden">
      ${PERSPECTIVE.map((it, i) => prow(it, i)).join("")}
    </div>`;

  /* --- the file viewer, from app/view/[id]/page.tsx --- */
  const pdfLines = [420, 560, 610, 520, 600, 380, 590, 430, 610, 340];
  const pdfPage = `
    <div class="abs" data-k="pdfPage" style="left:248px;top:24px;width:680px;height:880px;background:#fff;border:1px solid #1f1f1f;box-shadow:0 18px 40px -18px rgba(0,0,0,.95);padding:56px 64px">
      <div style="width:330px;height:20px;background:#1f1f1f"></div>
      <div style="width:190px;height:12px;background:#9a9a9a;margin-top:16px"></div>
      ${pdfLines.map((w, i) => `<div style="width:${w}px;height:8px;background:#c9c9c9;margin-top:${i === 0 ? 34 : 14}px"></div>`).join("")}
    </div>`;

  const reader = `
    <div class="abs" style="left:24px;top:${BAR + 40}px;width:1152px;height:${WIN.h - BAR - 40}px">
      <div class="abs" data-k="rdBack" style="left:0;top:0;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:500;color:#9a9a9a">
        ${svg(IC.back, 14, "#9a9a9a")}CYB 305
      </div>
      <div class="abs" data-k="rdTitle" style="left:0;top:22px;font-size:28px;font-weight:700;letter-spacing:-.015em;color:#fff">${OPENED_FILE.title}</div>
      <div class="abs" data-k="rdKind" style="left:0;top:62px;display:flex;align-items:center;gap:8px">
        <span class="chip" style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:2px 6px">${KIND_LABEL[OPENED_FILE.type]}</span>
        <span class="t tnum" style="font-size:11.5px;color:#6b6b6b">1.2 MB</span>
      </div>
      <div class="abs" data-k="rdDownload" style="right:0;top:0;height:36px;padding:0 16px;border-radius:6px;background:#22c55e;color:#04140a;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500">${svg(IC.download, 15, "#04140a")}Download</div>
      <div class="abs" data-k="rdPanel" style="left:0;top:110px;width:1152px;height:${WIN.h - BAR - 150}px;border-radius:8px;border:1px solid #1f1f1f;background:#0a0a0a;overflow:hidden">
        ${pdfPage}
        <div class="abs" data-k="rdPager" style="left:0;bottom:0;width:1152px;height:40px;border-top:1px solid #1f1f1f;display:flex;align-items:center;justify-content:center;gap:4px;background:#0a0a0a">
          <span class="abs" style="width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#2e2e2e">${svg(IC.chevL, 17, "#2e2e2e")}</span>
          <span class="t tnum" style="min-width:72px;text-align:center;font-size:12.5px;color:#9a9a9a">Page 1 of 12</span>
          <span class="abs" style="width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9a9a9a">${svg(IC.chevR, 17, "#9a9a9a")}</span>
        </div>
      </div>
    </div>`;

  const app = `
    ${browserBar("thehood-psi.vercel.app", { tabs: ["Cybersecurity 300L"] })}
    <div class="abs" data-k="appClip" style="left:0;top:${BAR}px;width:${WIN.w}px;height:${APPH}px;overflow:hidden;background:#000">
      <div class="abs" data-k="homeLayer" style="left:0;top:0;width:${WIN.w}px;height:${APPH}px;overflow:hidden">
        <div class="abs" data-k="homeScroll" style="left:0;top:0;width:${WIN.w}px">${hero}${panel}</div>
      </div>
      <div class="abs" data-k="readLayer" style="left:0;top:0;width:${WIN.w}px;height:${APPH}px;overflow:hidden">${reader}</div>
      <div class="abs" data-k="timeLayer" style="left:0;top:0;width:${WIN.w}px;height:${APPH}px;overflow:hidden">
        <div class="abs" data-k="timeScroll" style="left:0;top:0;width:${WIN.w}px">${timeHtml}</div>
      </div>
    </div>
    ${nav}`;

  /* --- the end card --- */
  const end = `
    <div class="abs" data-k="endCard" style="left:0;top:0;width:${FILM.W}px;height:${FILM.H}px">
      <div class="abs" data-k="endMark" style="left:${FILM.W / 2 - 26}px;top:${END.markY}px">${nutmMark(52)}</div>
      <div class="abs" data-k="endWm" style="left:${FILM.W / 2}px;top:${END.wmY}px;transform:translateX(-50%);font-size:26px;font-weight:700;letter-spacing:-.02em;color:#fff">Cybersecurity 300L</div>
      <div class="abs" data-k="endSub" style="left:${FILM.W / 2}px;top:${END.subY}px;transform:translateX(-50%);font-size:12px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:#9a9a9a">NUTM Apapa</div>
      <div class="abs" data-k="endLine" style="left:${FILM.W / 2}px;top:${END.lineY}px;transform:translateX(-50%);font-size:72px;font-weight:700;letter-spacing:-.035em;line-height:1.15;color:#fff;white-space:nowrap">
        Every lecture note, lab and <span data-k="endAccent" style="color:#22c55e">handout.</span>
      </div>
      <div class="abs" data-k="endFacts" style="left:${FILM.W / 2}px;top:${END.factY}px;transform:translateX(-50%);display:flex;gap:44px;font-size:17px;color:#9a9a9a">
        <span class="row" style="gap:8px"><b style="color:#fff;font-weight:600">${COURSES.length}</b>courses</span>
        <span class="row" style="gap:8px"><b style="color:#fff;font-weight:600">${TOTAL_UNITS}</b>units</span>
        <span class="row" style="gap:8px"><b style="color:#22c55e;font-weight:600">${TOTAL_FILES}</b>files uploaded</span>
        <span class="row" style="gap:8px"><b style="color:#fff;font-weight:600">${WITH_FILES}</b>courses with files</span>
      </div>
      <div class="abs" data-k="endCta" style="left:${FILM.W / 2}px;top:${END.ctaY}px;transform:translateX(-50%);height:60px;padding:0 30px;border-radius:999px;background:#22c55e;color:#04140a;display:flex;align-items:center;gap:12px;font-size:18px;font-weight:600;white-space:nowrap">Open the course hub<span data-k="endArrow" style="display:block">${svg(IC.arrow, 19, "#04140a")}</span></div>
      <div class="abs" data-k="endUrl" style="left:${FILM.W / 2}px;top:${END.urlY}px;transform:translateX(-50%);font-family:Geist,monospace;font-size:16px;color:#6b6b6b">thehood-psi.vercel.app</div>
    </div>`;

  stage.innerHTML = `
    <div class="full" style="background:var(--bg)"></div>
    <div class="abs" data-k="worldWrap" style="left:0;top:0;width:${FILM.W}px;height:${FILM.H}px">
      ${desktopMarkup(app, { name: "Cybersecurity 300L", menu: ["File", "Edit", "View", "History", "Bookmarks"], icon: nutmMark(18), dock: 5, clock: "Wed 12:48" })}
    </div>
    <div class="abs" data-k="cardStage" style="left:0;top:0;width:${FILM.W}px;height:${FILM.H}px">${cardMarkup()}</div>
    ${end}`;

  collect(stage);

  /* The nav's own geometry. The bell sits beside the countdown, and the
     links are centred in the gap between the wordmark and the bell, which
     is what the app does — centred in the gap, not on the whole bar, so a
     bar that grows cannot run the links into the clock. */
  $.navClockInner.innerHTML = clockHtml(remaining(0), 27.2);
  const pillW = $.navClock.offsetWidth;
  const bellRight = 8 + pillW + 6;
  $.navBell.style.right = bellRight + "px";
  const bellLeft = NAV.w - bellRight - 32;
  const gapL = 210;
  const tabX = Math.round(gapL + (bellLeft - gapL - tabsTotal) / 2);
  for (let i = 0; i < TABS.length; i++) {
    TABS_X[i] = tabX + TABS_W.slice(0, i).reduce((a, b) => a + b, 0);
    $["tab" + i].style.left = TABS_X[i] - PAD + "px";
    $["tab" + i].style.width = TABS_W[i] + "px";
  }
  $.navPill.style.left = TABS_X[0] - PAD + "px";
  $.navPill.style.width = TABS_W[0] + "px";

  /* The desktop is the site's own wallpaper, from website/public. */
  $.desk.style.background = `url(${ASSETS.img.wall}) center/cover no-repeat`;

  /* --- the results panel's geometry --- */
  PANEL.y = HERO.fieldY + 56 + 8;
  PANEL.h = 116 + CYB305_FILES.length * 62 + 6 + 30;
  $.panel.style.top = PANEL.y + "px";
  $.panel.style.height = PANEL.h + "px";
  $.panelScroll.style.height = (PANEL.h - 30) + "px";
  /* --- the end card's own geometry --- */
  $.endLine.style.width = (measure("Every lecture note, lab and handout.", 72, 700, "letter-spacing:-.035em") + 10) + "px";
  $.endCta.style.width = (measure("Open the course hub", 18, 600) + 102) + "px";

  /* --- the relay card, on the stage --- */
  const card = $.cardStage.firstElementChild;
  card.style.transformOrigin = "0 0";
  RELAY.card.x = Math.round((FILM.W - 340) / 2);
  RELAY.card.y = Math.round((FILM.H - 196) / 2);
}

/* ============================================================
   APPLY
   ============================================================ */

/* Where a window rect lands on the stage, for the camera v. */
function clipStage(v, r) {
  const a = toStage(v, WIN.x + r.x, WIN.y + r.y);
  return { x: a.x, y: a.y, w: r.w * v.z, h: r.h * v.z };
}

function apply(t) {
  const v = camera(t);
  PAGE_SCROLL = t < K.drop ? pageScroll(t) : 0;
  const worldOn = t >= K.open && t < K.fly + 1.4;
  show($.worldWrap, worldOn);

  if (worldOn) {
    const openP = prog(t, K.open, 0.75, E.smooth);
    const closeP = prog(t, K.card2, 0.7, E.inOut);
    const rect = t < K.card2 ? mixRect(CARD_WIN, FULL, openP) : mixRect(FULL, CARD_WIN, closeP);

    placeWorld(v, {
      rect,
      chrome: prog(t, K.open + 0.1, 0.35, E.out),
      desk: prog(t, K.desk, 0.9, E.smooth),
      hw: prog(t, K.lap, 0.6, E.out),
      lid: 1,
    });

    /* The world leaves by pushing down — the app's own page motion. */
    const out = prog(t, K.fly, 0.9, E.in);
    setT($.worldWrap, `translateY(${(out * 1400).toFixed(2)}px)`);

    applyApp(t, rect);
    /* The pointer shows only for the four clicks it explains. It goes
       away while the file is open, the way a mouse does when somebody
       is reading, and comes back when the nav is needed again. */
    placePointer(t, POINTER, [K.click, K.route, K.navclick, K.persp], -Infinity, Infinity);
    const vis = (t >= K.point - 0.15 && t < K.route + 0.12) || (t >= K.navclick - 0.2 && t < K.pull);
    $.pointer.style.opacity = vis ? "1" : "0";
  } else {
    setT($.worldWrap, "none");
  }

  applyRelay(t, v);
  applyEnd(t);
}

/* The course card: it is the window, and it comes home at the end. */
function applyRelay(t, v) {
  const stage = $.cardStage;
  const card = stage.firstElementChild;
  let on = true;
  let r;

  if (t < K.open) {
    r = RELAY.card;
  } else if (t < K.open + 0.22) {
    const p = prog(t, K.open, 0.75, E.smooth);
    r = clipStage(v, mixRect(CARD_WIN, FULL, p));
  } else if (t < K.card2) {
    on = false;
    r = RELAY.card;
  } else if (t < K.fly) {
    const p = prog(t, K.card2, 0.7, E.inOut);
    r = clipStage(v, mixRect(FULL, CARD_WIN, p));
  } else {
    const p = prog(t, K.fly, 0.9, E.smooth);
    r = mixRect(clipStage(v, CARD_WIN), RELAY.card, p);
  }

  show(stage, on);
  if (!on) return;
  const s = r.w / 340;
  card.style.left = "0px";
  card.style.top = "0px";
  setT(card, `translate(${r.x.toFixed(2)}px,${r.y.toFixed(2)}px) scale(${s.toFixed(5)})`);
}

/* The camera, keyed by ARRIVAL time. Each key's `d` is how long the move
   into it takes, so it starts at (t - d). The stock cameraAt reads `d` the
   other way round, which makes every move land a second late. */
function cam(t, keys) {
  let i = 0;
  while (i + 1 < keys.length && t >= keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1];
  if (!b) return view(a.cx, a.cy, a.z);
  const d = b.d ?? 0.9;
  const p = prog(t, Math.max(a.t, b.t - d), d, E.smooth);
  return view(lerp(a.cx, b.cx, p), lerp(a.cy, b.cy, p), lerp(a.z, b.z, p));
}

function camera(t) {
  const K2 = {
    nav: onWindow(600, 320, 1.12),
    head: onWindow(340, 330, 1.16),
    stats: onWindow(340, 640, 1.18),
    snap: onWindow(600, 250, 1.12),
    field: onWindow(340, 560, 1.2),
    close: onWindow(340, 560, 1.36),
    panel: onWindow(340, 500, 1.32),
    list: onWindow(340, 430, 1.48),
    reader: onWindow(600, 300, 1.05),
    pdf: onWindow(560, 430, 1.18),
    nav2: onWindow(600, 78, 1.5),
    table: onWindow(600, 300, 1.1),
    row: onWindow(600, 400, 1.4),
  };
  return cam(t, [
    { t: 0, ...onWindow(600, 390, 1.0) },
    { t: K.nav + 0.2, ...K2.nav, d: 0.9 },
    { t: K.head + 0.35, ...K2.head, d: 0.85 },
    { t: K.stats + 0.4, ...K2.stats, d: 0.8 },
    { t: K.snap + 0.9, ...K2.snap, d: 0.85 },
    { t: K.back + 0.8, ...K2.field, d: 0.85 },
    { t: K.point + 0.93, ...K2.close, d: 0.8 },
    { t: K.panel + 0.45, ...K2.panel, d: 0.9 },
    { t: K.sel + 0.95, ...K2.list, d: 0.9 },
    { t: K.open2 + 0.6, ...K2.reader, d: 0.9 },
    { t: K.read + 0.5, ...K2.pdf, d: 0.9 },
    { t: K.navclick + 0.2, ...K2.nav2, d: 0.9 },
    { t: K.time + 0.4, ...K2.table, d: 0.8 },
    { t: K.persp + 0.4, ...K2.row, d: 0.9 },
    { t: K.pull + 0.55, ...WHOLE_WINDOW, d: 0.95 },
    { t: K.desk + 0.7, ...WHOLE_SCREEN, d: 0.8 },
    { t: K.lap - 0.05, ...view(756, 0, 0.52), d: 0.9 },
  ]);
}

/* ============================================================
   THE APP
   ============================================================ */

function applyApp(t, rect) {
  applyNav(t);
  applyHome(t);
  applyField(t);
  applyPanel(t);
  applyReader(t);
  applyTimetable(t);
}

/* How far the page is scrolled. The nav floats on it, and the hero art
   scrolls under the bar. */
let PAGE_SCROLL = 0;
function pageScroll(t) {
  return track(t, 0, [
    { t: K.snap - 0.35, to: 740, d: 0.85, e: E.smooth },
    { t: K.back - 0.35, to: 0, d: 0.85, e: E.smooth },    { t: K.panel - 0.3, to: 440, d: 0.7, e: E.smooth },
  ]);
}

function applyNav(t) {
  const inP = prog(t, K.nav, 0.5, E.out);
  setT($.navBar, `translateY(${((1 - inP) * -16).toFixed(2)}px)`);
  show($.navBar, t >= K.nav);

  /* The app gives the bar a surface once the page has scrolled, so the
     content passing under it is not seen through it. It does the same while
     a route change pushes the old page up past it — and only then, so the
     bar is transparent at the top of an unscrolled page, as the app is. */
  const routeChanging = (t > K.route && t < K.route + 0.7) || (t > K.time && t < K.time + 0.7);
  const floated = PAGE_SCROLL > 16 || routeChanging ? 1 : 0;
  $.navBar.style.background = floated ? "rgba(10,10,10,.80)" : "transparent";
  $.navBar.style.border = floated ? "1px solid #2e2e2e" : "1px solid transparent";
  $.navBar.style.backdropFilter = floated ? "blur(12px) saturate(140%)" : "none";

  /* The pill slides from Courses to Timetable — the app's own indicator. */
  const slide = prog(t, K.drop, 0.4, E.out);
  $.navPill.style.left = Math.round(lerp(TABS_X[0] - PAD, TABS_X[1] - PAD, slide)) + "px";
  $.navPill.style.width = Math.round(lerp(TABS_W[0], TABS_W[1], slide)) + "px";
  TABS.forEach((_, i) => {
    const el = $["tab" + i];
    const active = i === 0 ? 1 - slide : slide;
    el.style.color = active > 0.5 ? "#ffffff" : "#9a9a9a";
  });

  /* The nav's split-flap clock ticks throughout. */
  $.navClockInner.innerHTML = clockHtml(remaining(t), 27.2);
}

function applyHome(t) {
  /* Three pages, two route changes. Each is a push: the page that is
     leaving goes up, the one arriving comes up from below. The reader
     sits between the home page and the timetable, because that is where
     a file goes when it is opened.

     The push starts just after the click and lands exactly on the drop,
     so the change and the music's drop are the same moment. */
  const route = K.route + 0.12;
  const pHome = prog(t, route, FILM.P - 0.12, E.inOut);
  const pRead = prog(t, route, FILM.P - 0.12, E.inOut);
  const pReadOut = prog(t, K.time, 0.45, E.inOut);
  const pTime = prog(t, K.time, 0.45, E.inOut);
  setT($.homeLayer, `translateY(${(-APPH * pHome).toFixed(2)}px)`);
  setT($.readLayer, `translateY(${(APPH * (1 - pRead) - APPH * pReadOut).toFixed(2)}px)`);
  setT($.timeLayer, `translateY(${((1 - pTime) * APPH).toFixed(2)}px)`);
  show($.homeLayer, pHome < 0.999);
  show($.readLayer, pRead > 0.001 && pReadOut < 0.999);
  show($.timeLayer, pTime > 0.001);
  if (pRead >= 0.999) return;

  /* The page scrolls: down to the session snapshot, back to the field, and
     up again when the user leaves for the timetable. */
  const sc = PAGE_SCROLL;
  setT($.homeScroll, `translateY(${(-sc).toFixed(2)}px)`);

  /* The hero rises. */
  show($.dept, t >= K.head - 0.2);
  rise($.dept, prog(t, K.head - 0.2, 0.4, E.out));
  show($.head1, t >= K.head - 0.05);
  rise($.head1, prog(t, K.head, 0.45, E.out));
  show($.head2, t >= K.head + 0.08);
  rise($.head2, prog(t, K.head + 0.12, 0.45, E.out));

  const c = prog(t, K.head + 0.2, 0.5, E.out);
  show($.copy, t >= K.head + 0.15);
  rise($.copy, c);
  show($.heroArt, t >= K.head + 0.15);
  setT($.heroArt, `scale(${(0.97 + 0.03 * c).toFixed(4)})`);

  show($.stats, t >= K.stats - 0.05);
  rise($.stats, prog(t, K.stats, 0.45, E.out));

  /* The session snapshot: the big split-flap clock and the class card. */
  const snapOn = t >= K.snap - 0.4 && t < K.back - 0.2;
  show($.snapSec, snapOn);
  if (snapOn) {
    show($.snapLabel, t >= K.snap - 0.05);
    rise($.snapLabel, prog(t, K.snap, 0.5, E.out));
    show($.snapClock, t >= K.snap + 0.03);
    rise($.snapClock, prog(t, K.snap + 0.08, 0.5, E.out));
    show($.snapUntil, t >= K.snap + 0.11);
    rise($.snapUntil, prog(t, K.snap + 0.16, 0.45, E.out));
    show($.snapCard, t >= K.nextcard - 0.05);
    riseXC($.snapCard, prog(t, K.nextcard, 0.5, E.out), 22);
    show($.snapFoot, t >= K.nextcard + 0.2);
    $.snapClock.innerHTML = clockHtml(remaining(t), 104);
    const s2 = Math.max(0, Math.floor(remaining(t)));
    const hh = String(Math.floor(s2 / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s2 % 3600) / 60)).padStart(2, "0");
    const ss = String(s2 % 60).padStart(2, "0");
    $.snapFoot.innerHTML = `Starts ${hh}:${mm}:${ss} · <span style="color:#9a9a9a;text-decoration:underline;text-underline-offset:2px">full timetable</span>`;
  }
}

/* The file viewer, from app/view/[id]/page.tsx. The page arrives on the
   drop, the reader draws its page, and the pager settles. */
function applyReader(t) {
  const on = t >= K.route && t < K.time + 0.5;
  show($.readLayer, on);
  if (!on) return;
  show($.rdBack, true);
  show($.rdTitle, true);
  show($.rdKind, true);
  show($.rdDownload, true);
  show($.rdPanel, true);
  /* The page draws itself in, the way a PDF renders. */
  const draw = prog(t, K.route + 0.16, 0.45, E.out);
  show($.pdfPage, t >= K.route + 0.1);
  setT($.pdfPage, `translateY(${((1 - draw) * 14).toFixed(2)}px)`);
  show($.rdPager, t >= K.route + 0.3);
  setT($.rdPager, `translateY(${((1 - prog(t, K.route + 0.3, 0.4, E.out)) * 20).toFixed(2)}px)`);
  const cd = prog(t, K.route + 0.1, 0.3, E.out);
  setT($.rdDownload, `scale(${(0.9 + 0.1 * cd).toFixed(4)})`);
}

/* The search field, its caret and the characters. */
function applyField(t) {
  const field = $.field;
  const on = t >= K.click;
  field.style.borderColor = on ? "rgba(34,197,94,.5)" : "#1f1f1f";
  field.style.background = on ? "#1a1a1a" : "#0a0a0a";
  field.style.boxShadow = on ? "0 0 0 3px rgba(34,197,94,.10), 0 10px 30px -12px rgba(34,197,94,.35)" : "";
  $.fieldIcon.querySelector("svg").setAttribute("stroke", on ? "#22c55e" : "#9a9a9a");
  setT($.fieldIcon, `scale(${on ? 1.1 : 1})`);

  const typed = t >= K.type
    ? QUERY.slice(0, Math.max(0, Math.min(QUERY.length, Math.floor((t - K.type) / 0.16) + 1)))
    : "";
  $.fieldText.textContent = typed || "Search courses, lecturers, or a file name";
  $.fieldText.style.color = typed ? "#ffffff" : "#9a9a9a";
  show($.fieldSlash, !typed);
  show($.fieldCaret, t >= K.click && Math.floor((t - K.click) / 0.45) % 2 === 0);
}

function applyPanel(t) {
  const open = clamp(spring(t, K.panel, 0.45, 0.85), 0, 1.02);
  const on = t >= K.panel;
  show($.panel, on && open > 0.001);
  if (!on) return;
  /* The panel opens out of the search field, the way a palette does. No
     fade: the shape grows, and the rows rise inside it as it opens. */
  const h = 56 + Math.min(1, open) * (PANEL.h - 56);
  $.panel.style.height = h.toFixed(2) + "px";
  $.panelScroll.style.height = (h - 30).toFixed(2) + "px";

  rise($.groupCourses, prog(t, K.panel + 0.08, 0.4, E.out));
  rise($.courseHit, prog(t, K.panel + 0.14, 0.45, E.out));
  rise($.groupFiles, prog(t, K.panel + 0.26, 0.4, E.out));
  for (let i = 0; i < CYB305_FILES.length; i++) {
    const el = $["file" + i];
    show(el, t >= K.panel + 0.32 + i * 0.05 - 0.01);
    rise(el, prog(t, K.panel + 0.32 + i * 0.05, 0.4, E.out));
  }
  show($.panelFoot, t >= K.panel + 0.34);

  /* The cursor lands on the file the film opens. */
  const sel = prog(t, K.sel, 0.3, E.snappy);
  const row = $["file" + OPENED_INDEX];
  row.style.background = sel > 0.5 ? "rgba(34,197,94,.12)" : "";
  $["fileIcon" + OPENED_INDEX].querySelector("svg").setAttribute("stroke", sel > 0.5 ? "#22c55e" : "#9a9a9a");
}

function applyTimetable(t) {
  if (t < K.drop) return;

  /* The grid is replaced by the perspective list when the view changes. */
  const view = prog(t, K.persp, 0.4, E.inOut);
  const on = t >= K.drop + 0.24;
  show($.ttGrid, on && view < 0.999);
  show($.ttPersp, on && view > 0.001);
  setT($.ttPersp, `translateY(${((1 - view) * 20).toFixed(2)}px)`);
  $.ttGrid.style.opacity = (1 - view).toFixed(3);
  $.ttPersp.style.opacity = view.toFixed(3);

  /* The slicer's thumb slides onto Perspective, growing to cover it. The app
     measures the active button rather than assuming a fixed width. */
  setT($.slicerThumb, `translateX(${(view * 82).toFixed(2)}px)`);
  $.slicerThumb.style.width = Math.round(lerp(78, 120, view)) + "px";
  const onPer = view > 0.5;
  $.slicerGrid.style.color = onPer ? "#9a9a9a" : "#ffffff";
  $.slicerGrid.querySelector("svg").setAttribute("stroke", onPer ? "#9a9a9a" : "#ffffff");
  $.slicerPer.style.color = onPer ? "#ffffff" : "#9a9a9a";
  $.slicerPer.querySelector("svg").setAttribute("stroke", onPer ? "#ffffff" : "#9a9a9a");

  /* The perspective rows recede by distance; the running one is forward. */
  for (let i = 0; i < PERSPECTIVE.length; i++) {
    const el = $["prow" + i];
    const d = PERSPECTIVE[i].d;
    const near = d === 0;
    el.style.opacity = (1 - Math.min(d, 6) * 0.09).toFixed(3);
    el.style.transform = near ? "none" : `scale(${(1 - Math.min(d, 6) * 0.004).toFixed(4)})`;
    el.style.background = near ? "#1a1a1a" : "";
    el.style.border = near ? "1px solid #2e2e2e" : "1px solid transparent";
    el.style.boxShadow = near ? "0 18px 40px -18px rgba(0,0,0,.95), 0 0 0 1px rgba(34,197,94,.28)" : "";
    el.style.height = near ? "58px" : "54px";
    $["prowNow" + i].style.display = near ? "flex" : "none";
    /* The rows rise in, staggered, and the running one is first. */
    const riseP = prog(t, K.persp + (near ? 0 : 0.05 + i * 0.03), 0.45, E.out);
    setT(el, `translateY(${((1 - riseP) * 22).toFixed(2)}px)`);
  }

  /* The page assembles. */
  show($.ttTitle, t >= K.drop);
  rise($.ttTitle, prog(t, K.drop + 0.1, 0.5, E.out));
  show($.ttSub, t >= K.drop + 0.08);
  rise($.ttSub, prog(t, K.drop + 0.18, 0.45, E.out));
  show($.ttBtns, t >= K.drop + 0.14);
  show($.slicer, t >= K.drop + 0.2);
  show($.ttTotal, t >= K.drop + 0.3);
}

/* ============================================================
   THE END CARD
   ============================================================ */

/* A rise in pixels, so the travel reads the same whatever the type size. */
const riseY = (el, p, dy = 24) => setT(el, `translateY(${((1 - p) * dy).toFixed(2)}px)`);
/* The same, for an element centred on the stage. */
const riseYC = (el, p, dy = 24) => setT(el, `translateX(-50%) translateY(${((1 - p) * dy).toFixed(2)}px)`);
/* The same, for an element centred on its parent with translateX(-50%). */
const riseXC = (el, p, dy = 24) => setT(el, `translateX(-50%) translateY(${((1 - p) * dy).toFixed(2)}px)`);

function applyEnd(t) {
  const on = t >= K.card2;
  show($.endCard, on);
  if (!on) return;

  /* Everything sinks away at the end, so the last frame is the first one. */
  const gone = t >= K.sink;

  /* rise() only moves an element; it does not hide it. Every element here
     therefore needs its own visibility gate, or it would sit in place from
     the moment the end card appears. */
  const markOn = !gone && t >= K.mark - 0.05;
  show($.endMark, markOn);
  if (markOn) {
    setT($.endMark, `scale(${(1 + 0.04 * pulse(t, K.final, 0.6) + 0.008 * loop(t, 1)).toFixed(4)})`);
    riseY($.endMark, prog(t, K.mark, 0.5, E.out), 22);
  }

  const wmOn = !gone && t >= K.mark - 0.05;
  show($.endWm, wmOn);
  show($.endSub, !gone && t >= K.mark + 0.03);
  if (wmOn) {
    riseYC($.endWm, prog(t, K.mark, 0.45, E.out), 22);
    riseYC($.endSub, prog(t, K.mark + 0.08, 0.4, E.out), 18);
  }

  const lineOn = !gone && t >= K.line - 0.05;
  show($.endLine, lineOn);
  if (lineOn) {
    riseYC($.endLine, prog(t, K.line, 0.5, E.out), 30);
    /* The accent word types in, letter by letter, after the line has landed. */
    const word = "handout.";
    const typed = t >= K.accent
      ? word.slice(0, Math.max(0, Math.min(word.length, Math.floor((t - K.accent) / 0.07) + 1)))
      : "";
    $.endAccent.textContent = typed;
  }

  const factsOn = !gone && t >= K.facts - 0.05;
  show($.endFacts, factsOn);
  if (factsOn) riseYC($.endFacts, prog(t, K.facts, 0.45, E.out), 20);

  const ctaOn = !gone && t >= K.cta - 0.05;
  show($.endCta, ctaOn);
  if (ctaOn) {
    const c = clamp(spring(t, K.cta, 0.5, 0.8), 0, 1.04);
    setT($.endCta, `translateX(-50%) translateY(${((1 - c) * 24).toFixed(2)}px) scale(${(0.9 + 0.1 * c).toFixed(4)})`);
    setT($.endArrow, `translateX(${(prog(t, K.url, 0.4, E.out) * 6).toFixed(2)}px)`);
  }

  const urlOn = !gone && t >= K.url - 0.05;
  show($.endUrl, urlOn);
  if (urlOn) riseYC($.endUrl, prog(t, K.url, 0.4, E.out), 18);
}
