/**
 * Renders the weekly timetable as wallpaper PNGs.
 *
 * The "Add as wallpaper" control downloads the timetable, not the hooded
 * figure: what a student pins to a laptop wall is the thing they will look at
 * all day, which is when and where they are meant to be.
 *
 * The schedule is read from the same manifest the site renders from, by
 * evaluating the schedule module directly. Nothing here re-types the courses,
 * so the wallpaper cannot show a week the site does not believe in.
 *
 * Text is drawn with a 5x7 pixel font defined below. A timetable with no
 * labels is a pattern, not a timetable.
 *
 * Run: node tools/gen-timetable-wallpapers.js
 */
const fs = require("fs");
const path = require("path");
const { encodePNG, hex } = require("./png");

const ROOT = path.join(__dirname, "..");

/* ---------- the schedule, straight from the manifest ---------- */

const COURSES = require(path.join(ROOT, "src", "lib", "resources.ts"));
// resources.ts is TypeScript. Read the two fields we need out of the source
// rather than pulling in a TS loader for a generator.
const SRC = fs.readFileSync(path.join(ROOT, "src", "lib", "resources.ts"), "utf8");

const DAY_INDEX = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

function parseClock(v, fallback) {
  const m = String(v).match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return fallback;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + Number(m[2]);
}

/** Shorten a course title to fit a wallpaper block: first significant word,
   or up to ~8 chars. "Digital Sovereignty..." -> "Digital", "Peace and
   Conflict Resolution" -> "Peace". Keeps the room name on the second line so
   the title can stay short. */
function shortTitle(title) {
  const firstWord = title.split(/\s+/)[0];
  if (firstWord.length <= 10) return firstWord;
  return firstWord.slice(0, 8) + ".";
}

/** Pulls every session out of the manifest source: the primary slot and any extras. */
function readSessions() {
  const sessions = [];
  const blocks = SRC.match(/\{[^{}]*?code:\s*"([^"]+)"[\s\S]*?\n  \},/g) || [];
  for (const b of blocks) {
    const code = (b.match(/code:\s*"([^"]+)"/) || [])[1];
    const title = (b.match(/title:\s*"([^"]+)"/) || [])[1];
    if (!code) continue;
    const day = (b.match(/\n\s+day:\s*"([^"]+)"/) || [])[1];
    const time = (b.match(/\n\s+time:\s*"([^"]+)"/) || [])[1];
    const venue = (b.match(/\n\s+venue:\s*"([^"]+)"/) || [])[1];
    const units = (b.match(/\n\s+units:\s*(\d+)/) || [])[1];
    if (!day || !time) continue;

    const add = (d, t, v, extra) => {
      const [from, to] = t.split(/\s*-\s*/);
      sessions.push({
        code,
        title,
        day: d,
        venue: v,
        units: Number(units || 0),
        start: parseClock(from, 9 * 60),
        end: parseClock(to, 12 * 60),
        extra,
      });
    };
    add(day, time, venue, false);

    const extras = b.match(/extraSessions:\s*\[([^\]]*)\]/);
    if (extras) {
      for (const e of extras[1].matchAll(/day:\s*"([^"]+)",\s*time:\s*"([^"]+)",\s*venue:\s*"([^"]+)"/g)) {
        add(e[1], e[2], e[3], true);
      }
    }
  }
  return sessions;
}

const SESSIONS = readSessions();
if (SESSIONS.length === 0) {
  console.error("FAIL: no sessions read from resources.ts");
  process.exit(1);
}

/* ---------- a 5x7 pixel font ---------- */

const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "11110", "10001", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "11110", "10000", "10000", "10000", "11111"],
  F: ["11111", "10000", "11110", "10000", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "11100", "10100", "10010", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10101", "10011", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10011", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  3: ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  6: ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  ":": ["00000", "00100", "00100", "00000", "00100", "00100", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};
const CH_W = 5;
const CH_H = 7;

/* ---------- canvas ---------- */

function canvas(w, h, bg) {
  const rgb = Buffer.alloc(w * h * 3);
  const c = hex(bg);
  for (let i = 0; i < w * h; i++) {
    rgb[i * 3] = c[0];
    rgb[i * 3 + 1] = c[1];
    rgb[i * 3 + 2] = c[2];
  }
  const put = (x, y, col) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const o = (y * w + x) * 3;
    const k = hex(col);
    rgb[o] = k[0];
    rgb[o + 1] = k[1];
    rgb[o + 2] = k[2];
  };
  const rect = (x, y, rw, rh, col) => {
    for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) put(x + i, y + j, col);
  };
  const text = (str, x, y, col, scale = 1, tracking = 1) => {
    let cx = x;
    for (const ch of String(str).toUpperCase()) {
      const glyph = FONT[ch] || FONT[" "];
      for (let gy = 0; gy < CH_H; gy++) {
        for (let gx = 0; gx < CH_W; gx++) {
          if (glyph[gy][gx] !== "1") continue;
          for (let sy = 0; sy < scale; sy++)
            for (let sx = 0; sx < scale; sx++)
              put(cx + gx * scale + sx, y + gy * scale + sy, col);
        }
      }
      cx += (CH_W + tracking) * scale;
    }
    return cx;
  };
  const textWidth = (str, scale = 1, tracking = 1) =>
    String(str).length * (CH_W + tracking) * scale - tracking * scale;
  return { rgb, w, h, put, rect, text, textWidth };
}

/* ---------- the board ---------- */

const PALETTE = {
  bg: "#000000",
  ink: "#ffffff",
  dim: "#6b6b6b",
  faint: "#1f1f1f",
  grid: "#141414",
  accent: "#22c55e",
  accentDim: "#14532d",
  todayBg: "#0a150f",
};

const DAYS = [
  { name: "MON", idx: 1 },
  { name: "TUE", idx: 2 },
  { name: "WED", idx: 3 },
  { name: "THU", idx: 4 },
  { name: "FRI", idx: 5 },
];

/** The window the axis shows: padded around the earliest and latest class. */
function windowOf(sessions) {
  const starts = sessions.map((s) => s.start);
  const ends = sessions.map((s) => s.end);
  let lo = Math.floor(Math.min(...starts) / 60) - 1;
  let hi = Math.ceil(Math.max(...ends) / 60) + 1;
  lo = Math.max(0, lo);
  hi = Math.min(24, hi);
  return { lo, hi };
}

function clockLabel(min) {
  const h24 = Math.floor(min / 60);
  const mm = String(min % 60).padStart(2, "0");
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm}${h24 < 12 ? "AM" : "PM"}`;
}

function renderBoard(w, h) {
  const cv = canvas(w, h, PALETTE.bg);
  const now = new Date();
  const todayIdx = now.getDay();

  const scale = Math.max(2, Math.round(Math.min(w, h) / 220));
  const padX = Math.round(w * 0.07);
  const padTop = Math.round(h * 0.11);

  const { lo, hi } = windowOf(SESSIONS);
  const hours = hi - lo;
  const gridW = w - padX * 2 - Math.round(cv.textWidth("WED", scale + 1) + 30 * scale);

  // ---- header ----
  cv.text("CYBERSECURITY 300L", padX, Math.round(h * 0.04), PALETTE.ink, scale * 2);
  cv.text(
    "FIRST SEMESTER - WEEKLY TIMETABLE",
    padX,
    Math.round(h * 0.04) + CH_H * scale * 2 + 10 * scale,
    PALETTE.dim,
    scale
  );

  // ---- day rows ----
  const rowH = Math.floor((h - padTop - Math.round(h * 0.16)) / DAYS.length);
  // Day labels are the primary scan axis on a wall, so they are set larger
  // than the course codes inside the blocks.
  const dayScale = scale + 1;
  const gutter = Math.round(cv.textWidth("WED", dayScale) + 14 * scale);
  const gridX = padX + gutter + Math.round(16 * scale);

  DAYS.forEach((day, i) => {
    const y = padTop + i * rowH;
    const isToday = day.idx === todayIdx;

    if (isToday) {
      cv.rect(padX - 6 * scale, y, w - padX * 2 + 12 * scale, rowH - 6 * scale, PALETTE.todayBg);
    }

    // Day label.
    const labelY = y + Math.floor(rowH / 2) - Math.floor((CH_H * dayScale) / 2);
    cv.text(day.name, padX, labelY, isToday ? PALETTE.accent : PALETTE.dim, dayScale);
    // A rule under today's label, so today is findable without reading colour.
    if (isToday) {
      cv.rect(padX, labelY + CH_H * dayScale + 6 * scale, gutter - 8 * scale, Math.max(2, scale), PALETTE.accent);
    }

    // Row rule.
    cv.rect(gridX, y + rowH - 5 * scale, w - gridX - padX, Math.max(1, scale), isToday ? PALETTE.accentDim : PALETTE.faint);

    // Hour ticks.
    for (let hr = lo; hr <= hi; hr++) {
      const gx = gridX + ((hr - lo) / hours) * gridW;
      const major = hr % 2 === 0;
      cv.rect(gx, y, Math.max(1, scale), major ? 5 * scale : 3 * scale, major ? PALETTE.dim : PALETTE.faint);
      if (major && i === DAYS.length - 1) {
        cv.text(String(hr).padStart(2, "0") + ":00", gx + 3 * scale, y + rowH - 3 * scale, PALETTE.dim, Math.max(1, scale));
      }
    }
  });

  // ---- hour gridlines down the page ----
  for (let hr = lo + 1; hr < hi; hr++) {
    const gx = gridX + ((hr - lo) / hours) * gridW;
    for (let i = 0; i < DAYS.length; i++) {
      const y = padTop + i * rowH;
      cv.rect(gx, y, Math.max(1, Math.floor(scale / 2)), rowH - 5 * scale, PALETTE.grid);
    }
  }

  // ---- sessions ----
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (const s of SESSIONS) {
    const dayIndex = DAYS.findIndex((d) => d.idx === DAY_INDEX[s.day]);
    if (dayIndex < 0) continue;
    const y = padTop + dayIndex * rowH;
    const innerH = rowH - 5 * scale - 4 * scale;

    const x0 = gridX + ((s.start - lo * 60) / (hours * 60)) * gridW;
    const x1 = gridX + ((s.end - lo * 60) / (hours * 60)) * gridW;
    const bw = Math.max(scale * 8, x1 - x0 - 3 * scale);
    const by = y + Math.floor(scale * 2);
    const bh = innerH;

    const running =
      todayIdx === DAY_INDEX[s.day] && nowMin >= s.start && nowMin < s.end;
    const isTodayRow = todayIdx === DAY_INDEX[s.day];

    cv.rect(x0, by, bw, bh, running ? PALETTE.accentDim : PALETTE.faint);
    // The left edge carries the state: accent when it is running, dim otherwise.
    cv.rect(x0, by, Math.max(2, scale), bh, running ? PALETTE.accent : isTodayRow ? PALETTE.accentDim : PALETTE.dim);

    // Course title (shortened to first word) inside the block, clipped to
    // what fits. A short title reads better on a wall than a course code.
    const label = shortTitle(s.title);
    const ts = Math.max(1, Math.floor(scale / 2) + 1);
    const room = String(s.venue || "")
      .replace(/Lab/i, "LAB")
      .replace(/^PG\s*/i, "PG")
      .toUpperCase();
    const tsSmall = Math.max(1, ts - 1);
    const twoLines = bh > CH_H * ts + CH_H * tsSmall + 12 * ts;

    let text = label;
    while (cv.textWidth(text, ts) > bw - 6 * ts && text.length > 2) {
      text = text.slice(0, -1);
    }

    const blockH = twoLines
      ? CH_H * ts + CH_H * tsSmall + 4 * ts
      : CH_H * ts;
    const top = by + Math.max(2 * ts, Math.floor((bh - blockH) / 2));

    cv.text(text, x0 + 3 * ts, top, PALETTE.ink, ts);

    // Room under the code when the block is tall enough. Which room a class is
    // in is the thing a student checks most and the font is the only place it
    // can live.
    if (twoLines) {
      let r = room;
      while (cv.textWidth(r, tsSmall) > bw - 6 * tsSmall && r.length > 2) {
        r = r.slice(0, -1);
      }
      cv.text(r, x0 + 3 * ts, top + CH_H * ts + 4 * ts, running ? PALETTE.accent : PALETTE.dim, tsSmall);
    }

    // Time above the block when there is room for a third line.
    if (bh > blockH + CH_H * tsSmall + 10 * ts) {
      cv.text(clockLabel(s.start), x0, top - CH_H * tsSmall - 3 * ts, running ? PALETTE.accent : PALETTE.dim, tsSmall);
    }
  }

  // ---- footer ----
  const footY = h - Math.round(h * 0.075);
  cv.rect(padX, footY - 14 * scale, w - padX * 2, Math.max(1, scale), PALETTE.faint);
  cv.text("WALL AS YOUR REMINDER", padX, footY, PALETTE.dim, scale);
  const totalUnits = new Set(SESSIONS.map((s) => s.code)).size;
  const right = `${totalUnits} COURSES ${SESSIONS.length} SESSIONS A WEEK`;
  cv.text(right, w - padX - cv.textWidth(right, scale), footY, PALETTE.dim, scale);

  return cv.rgb;
}

/* ---------- output ---------- */

const TARGETS = [
  { name: "timetable-wallpaper-1920x1080.png", w: 1920, h: 1080 },
  { name: "timetable-wallpaper-2560x1440.png", w: 2560, h: 1440 },
  { name: "timetable-wallpaper-1170x2532.png", w: 1170, h: 2532 },
];

const OUT = path.join(ROOT, "public");
for (const t of TARGETS) {
  const rgb = renderBoard(t.w, t.h);
  const png = encodePNG(t.w, t.h, rgb);
  fs.writeFileSync(path.join(OUT, t.name), png);
  console.log(`${t.name}  ${t.w}x${t.h}  ${Math.round(png.length / 1024)} KB`);
}
console.log(`\n${SESSIONS.length} sessions across ${new Set(SESSIONS.map((s) => s.code)).size} courses`);