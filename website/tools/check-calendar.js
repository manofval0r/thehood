/**
 * Checks the academic calendar's days.
 *
 * A date is an instant and an instant is not a day. The calendar used to
 * answer "is this today" by comparing instants against the reader's
 * midnight, which said one thing on a server in UTC and another in a
 * browser in Lagos, so today's row lost its badge for everybody the site
 * is for.
 *
 * So the day is written down as text when the row is parsed, and every
 * question about days is answered by comparing text. This checks that the
 * text is there, that it is a real day, and that it is the day the row
 * says it is.
 *
 * Run: node tools/check-calendar.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
}

const calendarSource = read("src/lib/calendar.ts");

/* Every row in the published calendar. */
const rows = [
  ...calendarSource.matchAll(
    /date:\s*"([^"]+)",\s*day:\s*"([^"]*)",\s*activity:\s*"([^"]+)",\s*category:\s*"([^"]+)"/g
  ),
].map((m) => ({ date: m[1], day: m[2], activity: m[3], category: m[4] }));

check(rows.length > 0, "the calendar's rows could not be read out of the source");

/* The days have to be written down as text. */
check(
  /iso:\s*string\s*\|\s*null/.test(calendarSource),
  "the calendar does not write the day down as text"
);
check(
  /dayOf\(/.test(calendarSource),
  "the calendar does not turn a date into a day"
);

/* And "is this today" has to compare the text, not the instants. */
const isToday = calendarSource.match(/export function isToday[\s\S]{0,400}?\n}/);
check(!!isToday, "isToday could not be read out of the source");
if (isToday) {
  check(
    isToday[0].includes("e.iso ==="),
    "isToday compares instants, so it says one thing in Lagos and another in UTC"
  );
  check(
    isToday[0].includes("todayIso"),
    "isToday does not ask what day it is in Lagos"
  );
  check(
    !isToday[0].includes("setHours"),
    "isToday takes the reader's midnight, which is the bug it was meant to fix"
  );
}

/* The days themselves, parsed out of the rows, must be real and in order. */
const MONTHS = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

let last = "";
for (const row of rows) {
  const m = row.date.match(/([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) continue; // a span, which is checked below.
  const month = MONTHS[m[1]];
  const iso = `${m[3]}-${String(month + 1).padStart(2, "0")}-${String(
    Number(m[2])
  ).padStart(2, "0")}`;
  check(month !== undefined, `${row.activity} has a month nobody knows`);
  check(last === "" || iso >= last, `${row.activity} is out of order`);
  last = iso;
}

/* The spans have to end on the day they end. */
for (const row of rows) {
  const span = row.date.match(
    /([A-Z][a-z]+)\s+(\d{1,2})\s*-\s*(?:([A-Z][a-z]+)\s+)?(\d{1,2}),\s*(\d{4})/
  );
  if (!span) continue;
  const startMonth = MONTHS[span[1]];
  const endMonth = span[3] ? MONTHS[span[3]] : startMonth;
  check(startMonth !== undefined, `${row.activity} starts in a month nobody knows`);
  check(endMonth !== undefined, `${row.activity} ends in a month nobody knows`);
}

if (problems.length > 0) {
  for (const p of problems) console.log("  FAIL  " + p);
  console.log(`\n  ${problems.length} problem(s)`);
  process.exit(1);
}

console.log(`  ok   ${rows.length} published rows`);
console.log("  ok   every row's day is written down as text");
console.log("  ok   isToday compares days, not instants");
console.log("  ok   the days run in order");
console.log("\n  ok");
