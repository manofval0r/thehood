/**
 * Seeds the roll with the cohort.
 *
 * The students are the cohort, not a course's private list, so the same
 * people turn up on more than one course. They are put on every course in
 * the programme, because that is what the course lists say: the core ones
 * are taken by every student, and the shared ones are taken by them too.
 *
 * The roster lives in the database rather than in the repository. This site
 * is public, and a student list committed to git is a student list
 * published.
 *
 * Run: node tools/seed-roster.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function env(name) {
  const file = path.join(ROOT, ".env.local");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
  const value = process.env[name];
  if (!value) {
    console.error(`FAIL: ${name} is not set`);
    process.exit(1);
  }
  return value;
}

const URL_BASE = env("SUPABASE_URL");
const KEY = env("SUPABASE_SERVICE_ROLE_KEY");

/**
 * The cohort.
 *
 * Surname and first name, as the attendance sheet has them. The name a
 * student is known by is the first name and then the surname, which is how
 * the sheet is ordered and how the department refers to them.
 */
const COHORT = [
  ["Demkiir", "Msugh", "2423131001"],
  ["Ibeleme", "Ifechukwu", "2423131002"],
  ["Adigwe", "Phillip", "2423131003"],
  ["Agu", "Chibuchi", "2423131004"],
  ["Balogun", "Kikianuloluwa", "2423131005"],
  ["Hammed", "Oluwashola", "2423131006"],
  ["Abdullahi", "Sherifa", "2423131007"],
  ["Asigbe", "Stephanie", "2423131008"],
  ["Sutton", "Oluwadarasimi", "2423131009"],
  ["Davou", "Evans", "2423131010"],
  ["Adegite", "Oluwapelumi", "2423131011"],
  ["Ahmad", "Khadijah", "2423131012"],
  ["Sabastine", "Somtochukwu", "2423131013"],
  ["Moses", "Augustina", "2423131015"],
  ["Abubakr", "Farid", "2423131016"],
  ["Odulana", "Titobioluwa", "2423131018"],
  ["Idowu", "David", "2423131019"],
];

/** Every course code, from the manifest. */
function courseCodes() {
  const src = fs.readFileSync(
    path.join(ROOT, "src", "lib", "resources.ts"),
    "utf8"
  );
  const codes = [];
  const re = /code:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) codes.push(m[1]);
  return codes;
}

async function main() {
  const courses = courseCodes();
  const rows = [];

  for (const course of courses) {
    for (const [surname, first, matric] of COHORT) {
      rows.push({
        course,
        matric,
        name: `${first} ${surname}`,
      });
    }
  }

  console.log(
    `seeding ${COHORT.length} students onto ${courses.length} courses (${rows.length} rows)`
  );

  // Clear the old roll first: the sample students that were there are not
  // real and must not survive into a live attendance record.
  const wipe = await fetch(`${URL_BASE}/rest/v1/roster?matric=neq.keep`, {
    method: "DELETE",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
    },
  });
  if (!wipe.ok) {
    console.error("FAIL: the old roll could not be cleared: " + (await wipe.text()));
    process.exit(1);
  }

  const res = await fetch(`${URL_BASE}/rest/v1/roster?on_conflict=course,matric`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    console.error("FAIL: the roll was refused: " + (await res.text()));
    process.exit(1);
  }

  const check = await fetch(`${URL_BASE}/rest/v1/roster?select=matric,name,course`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const all = await check.json();
  const people = new Set(all.map((r) => r.matric));
  console.log(
    `ok: ${all.length} rows, ${people.size} students, across ${courses.length} courses`
  );
  for (const row of all.slice(0, 3)) {
    console.log(`  ${row.matric}  ${row.name}  (${row.course})`);
  }
}

main().catch((e) => {
  console.error("FAIL: " + (e && e.message ? e.message : e));
  process.exit(1);
});
