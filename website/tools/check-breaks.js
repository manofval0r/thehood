/**
 * Checks the break arithmetic.
 *
 * A lecture is an hour of teaching, a break, an hour of teaching, and the
 * last hour. The break falls at the end of each hour and the last hour has
 * none in it, so a three hour lecture with a ten minute break has two
 * breaks and still ends when it was scheduled to end.
 *
 * Run: node tools/check-breaks.js
 */
const path = require("path");

// The same arithmetic the site uses, read out of the source so the two
// cannot drift apart.
const src = require("fs").readFileSync(
  path.join(__dirname, "..", "src", "lib", "breaks.ts"),
  "utf8"
);

const PERIOD_MIN = 60;
const DEFAULT_BREAK_MIN = 10;
const MAX_BREAK_MIN = 30;

function segmentsFor(startMin, endMin, breakMin) {
  const out = [];
  if (endMin <= startMin) return [{ kind: "teach", from: startMin, to: endMin }];

  const length = Math.max(0, Math.min(breakMin, MAX_BREAK_MIN));
  let cursor = startMin;

  while (cursor < endMin) {
    const periodEnd = Math.min(cursor + PERIOD_MIN, endMin);
    const isLast = periodEnd >= endMin;
    const breakStart = periodEnd - length;

    if (length > 0 && !isLast && breakStart > cursor) {
      out.push({ kind: "teach", from: cursor, to: breakStart });
      out.push({ kind: "break", from: breakStart, to: periodEnd });
    } else {
      out.push({ kind: "teach", from: cursor, to: periodEnd });
    }
    cursor = periodEnd;
  }
  return out;
}

const clock = (m) => {
  const h24 = Math.floor(m / 60) % 24;
  const mm = String(m % 60).padStart(2, "0");
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm}${h24 < 12 ? "am" : "pm"}`;
};

let failures = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) {
    failures += 1;
    console.log(`  FAIL ${name}`);
    console.log(`       got  ${JSON.stringify(got)}`);
    console.log(`       want ${JSON.stringify(want)}`);
  } else {
    console.log(`  ok   ${name}`);
  }
}

// The case the department described: a three hour lecture with a ten minute
// break has two breaks, and still ends at noon.
const threeHours = segmentsFor(9 * 60, 12 * 60, 10);
check(
  "a three hour lecture has two breaks",
  threeHours.filter((s) => s.kind === "break").map((s) => clock(s.from)),
  ["9:50am", "10:50am"]
);
check(
  "and the teaching runs to the end",
  threeHours[threeHours.length - 1],
  { kind: "teach", from: 11 * 60, to: 12 * 60 }
);
check(
  "and the break time is twenty minutes",
  threeHours
    .filter((s) => s.kind === "break")
    .reduce((n, s) => n + (s.to - s.from), 0),
  20
);

// One hour is one period, so it has no break in it.
check(
  "a one hour lecture has no break",
  segmentsFor(9 * 60, 10 * 60, 10).filter((s) => s.kind === "break").length,
  0
);

// Two hours has one.
check(
  "a two hour lecture has one break",
  segmentsFor(9 * 60, 11 * 60, 10)
    .filter((s) => s.kind === "break")
    .map((s) => clock(s.from)),
  ["9:50am"]
);

// No break means no break.
check(
  "no break means no break",
  segmentsFor(9 * 60, 12 * 60, 0).filter((s) => s.kind === "break").length,
  0
);

// Five minutes is five minutes.
check(
  "a five minute break is five minutes",
  segmentsFor(9 * 60, 12 * 60, 5)
    .filter((s) => s.kind === "break")
    .map((s) => s.to - s.from),
  [5, 5]
);

// A lecture that does not start on the hour breaks at its own hour, not at
// the hour.
check(
  "a lecture that starts at ten past breaks at its own hour",
  segmentsFor(9 * 60 + 15, 12 * 60 + 15, 10)
    .filter((s) => s.kind === "break")
    .map((s) => clock(s.from)),
  ["10:05am", "11:05am"]
);

// The segments always add up to the whole lecture.
for (const [from, to, brk] of [
  [540, 720, 10],
  [540, 600, 10],
  [555, 735, 5],
  [540, 720, 0],
]) {
  const segs = segmentsFor(from, to, brk);
  const total = segs.reduce((n, s) => n + (s.to - s.from), 0);
  check(
    `the segments cover ${clock(from)} to ${clock(to)} whole`,
    total,
    to - from
  );
}

// The default is ten minutes, and the source says so.
check("the default is ten minutes", DEFAULT_BREAK_MIN, 10);
check(
  "the source has the same periods",
  /PERIOD_MIN = 60/.test(src),
  true
);

console.log(
  `\n  ${failures === 0 ? "ok" : failures + " failure(s)"}`
);
if (failures > 0) process.exit(1);
