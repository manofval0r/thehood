/**
 * Guards the academic calendar against ordering regressions.
 *
 * A date range that crosses a year boundary once parsed to the wrong year and
 * silently sorted to the far end of the session, which split a single month
 * into two non-adjacent groups. Nothing threw, the row count stayed correct,
 * and it was only visible by reading the rendered order. This asserts it.
 *
 * Run: node tools/check-calendar.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MONTHS = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

const src = fs.readFileSync(path.join(ROOT, "src/lib/calendar.ts"), "utf8");

// Pull the RAW rows and the parseDate body straight out of the source, so the
// test exercises the shipped implementation rather than a copy of it.
const rawBlock = src.match(/const RAW[^=]*=\s*(\[[\s\S]*?\n\];)/);
if (!rawBlock) fail("could not locate the RAW calendar array");
const RAW = eval(rawBlock[1].replace(/;$/, ""));

const parseBody = src.match(/function parseDate\([\s\S]*?\n}\n/);
if (!parseBody) fail("could not locate parseDate");
const parseDate = eval(
  "(" +
    parseBody[0]
      .replace("function parseDate(date: string, month: string)", "function parseDate(date, month)")
      .replace(": { start: Date | null; end: Date | null }", "")
      .replace(/: Date \| null/g, "")
      .replace(/\n}\n$/, "\n}") +
    ")"
);

function fail(msg) {
  console.error("FAIL: " + msg);
  process.exit(1);
}

const dated = RAW.map((e) => ({ ...e, ...parseDate(e.date, e.month) }))
  .filter((e) => e.start !== null)
  .sort((a, b) => a.start.getTime() - b.start.getTime());

console.log("dated events:", dated.length);

// 1. Strictly ascending: no event may share a start with an earlier row in a
//    way that reorders the month labels.
let ordered = true;
for (let i = 1; i < dated.length; i++) {
  if (dated[i].start.getTime() < dated[i - 1].start.getTime()) ordered = false;
}
if (!ordered) fail("events are not in ascending date order");

// 2. Each month must appear in exactly one contiguous run.
const runs = [];
for (const e of dated) {
  const last = runs[runs.length - 1];
  if (last && last.month === e.month) last.n++;
  else runs.push({ month: e.month, n: 1 });
}
const seen = new Set();
for (const r of runs) {
  if (seen.has(r.month)) fail(`month "${r.month}" appears in more than one run`);
  seen.add(r.month);
}

// 3. The runs themselves must be in chronological order.
const monthKey = (m) => {
  const [name, year] = m.split(" ");
  return Number(year) * 12 + MONTHS[name];
};
for (let i = 1; i < runs.length; i++) {
  if (monthKey(runs[i].month) <= monthKey(runs[i - 1].month)) {
    fail(`month "${runs[i].month}" does not follow "${runs[i - 1].month}"`);
  }
}

// 4. Every start date must agree with its own month label. This is the check
//    that catches the year-boundary bug directly.
const MONTH_NAME = Object.fromEntries(
  Object.entries(MONTHS).map(([k, v]) => [v, k])
);
for (const e of dated) {
  const expected = e.month.split(" ")[0];
  const actual = MONTH_NAME[e.start.getMonth()];
  const expectedYear = Number(e.month.split(" ")[1]);
  if (actual !== expected || e.start.getFullYear() !== expectedYear) {
    fail(
      `"${e.activity}" (${e.month}) parsed to ${actual} ${e.start.getFullYear()}, ` +
        `expected ${expected} ${expectedYear}`
    );
  }
}

// 5. End must never precede start.
for (const e of dated) {
  if (e.end && e.end.getTime() < e.start.getTime()) {
    fail(`"${e.activity}" ends before it starts`);
  }
}

console.log("month runs:", runs.map((r) => `${r.month}(${r.n})`).join(", "));
console.log("OK: calendar parses, sorts and groups correctly");
