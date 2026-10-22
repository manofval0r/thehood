/**
 * Checks the catalogue of notifications.
 *
 * The catalogue is the list a super admin reads to find out what the site
 * is able to say, and every entry in it has a button that sends it. If an
 * entry and a button drift apart, the page is telling a lie, and a lie in
 * a list of notifications is worse than no list.
 *
 * It also checks that every kind of notification the reader can turn on has
 * a switch for it, because a kind that can be received but not switched
 * off is a kind nobody can get rid of.
 *
 * Run: node tools/check-notifications.js
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

/* The kinds, read out of the source so the two cannot drift apart. */
const kindsSource = read("src/lib/notification-kinds.ts");
const kinds = [...kindsSource.matchAll(/^\s*\|\s*"([a-z]+)";?$/gm)].map((m) => m[1]);
const kindList = [...kindsSource.matchAll(/export const KINDS[^=]*=\s*\[([^\]]*)\]/gs)]
  .map((m) => m[1])
  .join("")
  .split(",")
  .map((s) => s.trim().replace(/^"|"$/g, ""))
  .filter(Boolean);

check(kinds.length > 0, "the kinds could not be read out of the source");
check(
  kindList.length === kinds.length,
  `the kinds list has ${kindList.length} and the type has ${kinds.length}`
);

/* The catalogue. */
const catalogueSource = read("src/lib/notification-catalogue.ts");
const entries = [...catalogueSource.matchAll(/id:\s*"([a-z-]+)"/g)].map((m) => m[1]);
const kindsUsed = [...catalogueSource.matchAll(/kind:\s*"([a-z]+)"/g)].map((m) => m[1]);

check(entries.length > 0, "the catalogue is empty");
check(
  new Set(entries).size === entries.length,
  "the catalogue has the same entry twice"
);

for (const kind of kindsUsed) {
  check(
    kinds.includes(kind),
    `the catalogue uses "${kind}", which is not a kind the reader knows`
  );
}

/* Every kind has a switch for it. */
const switchesSource = read("src/components/NotificationKindSwitches.tsx");
check(
  switchesSource.includes("KINDS.map"),
  "the switches do not cover every kind"
);
check(
  !switchesSource.includes("useFormStatus"),
  "a button that is not in a form is asking for the form's status"
);

/* The samples. */
const samples = [...catalogueSource.matchAll(/case "([a-z-]+)":/g)].map((m) => m[1]);
for (const entry of entries) {
  check(
    samples.includes(entry),
    `the catalogue has "${entry}" but the samples do not`
  );
}

/* The page has a button for every entry. */
const catalogueComponent = read("src/components/NotificationCatalogue.tsx");
check(
  catalogueComponent.includes("CATALOGUE.map"),
  "the page does not list the catalogue"
);
check(
  catalogueComponent.includes("sendNotificationTest"),
  "the page cannot send a test"
);

/* The scheduler sends the class reminders and the breaks. */
const pushSource = read("src/lib/push.ts");
for (const id of ["class-soon", "class-ended", "break-soon", "break-over"]) {
  check(
    pushSource.includes(id),
    `the scheduler does not send "${id}"`
  );
}

/* The material and the announcements are event-driven, not scheduled. */
check(
  pushSource.includes("announceMaterial"),
  "a new file does not tell anybody"
);
check(
  pushSource.includes("announceBroadcast"),
  "an announcement does not tell anybody"
);

if (problems.length > 0) {
  for (const p of problems) console.log("  FAIL  " + p);
  console.log(`\n  ${problems.length} problem(s)`);
  process.exit(1);
}

console.log(`  ok   the catalogue has ${entries.length} entries`);
console.log(`  ok   every one of them has a sample and a button`);
console.log(`  ok   every kind of notification has a switch`);
console.log(`  ok   the scheduler sends the class reminders and the breaks`);
console.log("\n  ok");
