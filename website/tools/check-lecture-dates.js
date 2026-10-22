/**
 * Checks the lectures that were written out, against the calendar.
 *
 * The calendar is the source of truth for when there is no lecture, so the
 * check reads the .ics the site actually serves and asks the academic
 * calendar whether each of those days should have had a class.
 *
 * Run: node tools/check-lecture-dates.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

/* The calendar's events, read out of the source. */
const calendarSource = fs.readFileSync(
  path.join(root, "src", "lib", "calendar.ts"),
  "utf8"
);

const MONTHS = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

/* Every event the calendar puts an examination or a holiday on. */
const blocked = [];
const eventRe =
  /activity:\s*"([^"]+)",\s*category:\s*"(Exams & Results|Holidays & Breaks)"/g;
let match;
while ((match = eventRe.exec(calendarSource)) !== null) {
  blocked.push({ activity: match[1], category: match[2] });
}

/* The dates each of them covers, read from the row above it. */
const dates = {};
const rowRe = /date:\s*"([^"]+)",\s+day:\s*"[^"]*",\s+activity:\s*"([^"]+)",\s+category:\s*"(Exams & Results|Holidays & Breaks)"/g;
while ((match = rowRe.exec(calendarSource)) !== null) {
  dates[match[2]] = match[1];
}

function parseDate(value, monthLabel) {
  const m = value.match(/([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[1]];
  if (month === undefined) return null;
  return new Date(Date.UTC(Number(m[3]), month, Number(m[2])));
}

/* The blocked days, as a set of ISO dates. */
const blockedDays = new Set();
for (const event of blocked) {
  const label = dates[event.activity];
  if (!label) continue;

  const span = label.match(/([A-Z][a-z]+)\s+(\d{1,2})\s*-\s*([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (span) {
    const month = MONTHS[span[1]];
    const lastMonth = MONTHS[span[3]];
    let d = new Date(Date.UTC(Number(span[5]), month, Number(span[2])));
    const last = new Date(Date.UTC(Number(span[5]), lastMonth, Number(span[4])));
    while (d <= last) {
      blockedDays.add(d.toISOString().slice(0, 10));
      d = new Date(d.getTime() + 86400000);
    }
    continue;
  }

  const single = parseDate(label, "");
  if (single) blockedDays.add(single.toISOString().slice(0, 10));
}

/* The .ics the site serves. */
const icsPath = path.join(__dirname, "..", ".ics-check.tmp");
if (!fs.existsSync(icsPath)) {
  console.log("  no .ics to check; start the site and run this again");
  process.exit(1);
}
const ics = fs.readFileSync(icsPath, "utf8");

const eventDates = [...ics.matchAll(/DTSTART;TZID=Africa\/Lagos:(\d{4})(\d{2})(\d{2})T/g)].map(
  (m) => `${m[1]}-${m[2]}-${m[3]}`
);

const problems = [];
for (const date of new Set(eventDates)) {
  if (blockedDays.has(date)) {
    problems.push(`${date} has a lecture, but the calendar says it is not a teaching day`);
  }
}

if (problems.length > 0) {
  for (const p of problems) console.log("  FAIL  " + p);
  console.log(`\n  ${problems.length} problem(s)`);
  process.exit(1);
}

console.log(`  ok   ${eventDates.length} lectures, on ${new Set(eventDates).size} days`);
console.log(`  ok   none of them is on an examination day or a public holiday`);
console.log(`  ok   ${blockedDays.size} days the calendar blocks are all free`);
console.log("\n  ok");
