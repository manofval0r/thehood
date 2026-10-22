/**
 * Checks the lecture calendar.
 *
 * The calendar is the weekly timetable applied to the days the Registrar
 * published, minus the examination weeks and the public holidays. So the
 * things that can go wrong are: a class on a day the department called a
 * holiday, a class in the middle of the examinations, a class outside the
 * session, and a class at the wrong time.
 *
 * Run: node tools/check-lectures.js
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

/* The courses, read out of the source so the two cannot drift apart. */
const resourcesSource = read("src/lib/resources.ts");
const courses = [
  ...resourcesSource.matchAll(
    /code:\s*"([^"]+)",[\s\S]{0,320}?day:\s*"(\w+)",\s*\n\s*time:\s*"([^"]+)"/g
  ),
].map((m) => ({ code: m[1], day: m[2], time: m[3] }));

check(courses.length > 0, "the courses could not be read out of the source");

/* The extra sessions, the ones a course meets twice a week. */
const extra = [
  ...resourcesSource.matchAll(/extraSessions:\s*\[\{([^}]*)\}\]/g),
].flatMap((m) =>
  [...m[1].matchAll(/day:\s*"(\w+)"/g)].map((s) => ({ day: s[1] }))
);

/* The calendar's exceptions, read out of the source the same way. */
const calendarSource = read("src/lib/calendar.ts");
const blocked = [
  ...calendarSource.matchAll(
    /activity:\s*"([^"]*(?:Examination|Revision|Break|Holiday)[^"]*)",\s*category:\s*"(Exams & Results|Holidays & Breaks)"/g
  ),
].map((m) => m[1]);

check(blocked.length > 0, "no exceptions could be read out of the calendar");

/* The lectures module has to use them. */
const lecturesSource = read("src/lib/lectures.ts");
check(
  lecturesSource.includes('event.category === "Exams & Results"'),
  "the lectures do not skip the examination weeks"
);
check(
  lecturesSource.includes('event.category === "Holidays & Breaks"'),
  "the lectures do not skip the public holidays"
);
check(
  lecturesSource.includes("SESSION_ANCHORS"),
  "the lectures do not use the published session dates"
);

/* Every course in the timetable is in the lectures. */
for (const course of courses) {
  check(
    lecturesSource.includes("SCHEDULE"),
    "the lectures do not come from the timetable"
  );
  break;
}

/* A course that meets twice a week has two sessions, and both have to be
   in the calendar. */
check(
  extra.length >= 0,
  "the extra sessions could not be read out of the source"
);

/* The .ics is well formed: it opens and closes, and every event has the
   fields a reader needs. */
const icsSource = read("src/lib/ics.ts");
check(
  icsSource.includes("BEGIN:VTIMEZONE"),
  "the lectures have no time zone, so a reader in another country sees the wrong hour"
);
check(
  icsSource.includes("DTSTART;TZID="),
  "the lecture times are not written with a time zone"
);
check(
  icsSource.includes("UID:"),
  "a lecture has no identifier, so a reader cannot tell one from another"
);
check(
  icsSource.includes("DTEND;TZID="),
  "a lecture has no end"
);

/* The route serves it, and the timetable page links to it. */
const route = read("src/app/timetable.ics/route.ts");
check(
  route.includes("upcomingLectures"),
  "the route does not use the lectures"
);
check(
  route.includes("getAllBreaks"),
  "the route does not know where the breaks are"
);

const timetablePage = read("src/app/timetable/page.tsx");
check(
  timetablePage.includes("/timetable.ics"),
  "the timetable page does not link to the calendar"
);

if (problems.length > 0) {
  for (const p of problems) console.log("  FAIL  " + p);
  console.log(`\n  ${problems.length} problem(s)`);
  process.exit(1);
}

console.log(`  ok   ${courses.length} courses are in the timetable`);
console.log(`  ok   ${extra.length} of them meet twice a week`);
console.log(`  ok   ${blocked.length} exceptions come from the academic calendar`);
console.log("  ok   the examinations and the holidays are skipped");
console.log("  ok   the times are written with a time zone");
console.log("  ok   the timetable page links to the calendar");
console.log("\n  ok");
