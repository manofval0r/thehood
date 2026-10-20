/**
 * Guards the career manifest against dangling references.
 *
 * The manifest points roles at courses, certifications and practice
 * platforms. A typo in any of those lists would not throw: the page would
 * simply render one card fewer than it should, which is the kind of error
 * that survives to production because nothing is broken, just quieter.
 * This asserts that every reference resolves.
 *
 * It reads the shipped source rather than a copy, so the check exercises what
 * actually ships.
 *
 * Run: node tools/check-career.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function fail(msg) {
  console.error("FAIL: " + msg);
  process.exit(1);
}

/** Every `slug: "x"` or `id: "x"` inside the given slice of source. */
function idsIn(src, marker, endMarker) {
  const start = src.indexOf(marker);
  if (start < 0) fail(`could not locate ${marker}`);

  let end;
  if (endMarker) {
    end = src.indexOf(endMarker, start);
    if (end < 0) fail(`could not locate ${endMarker}`);
  } else {
    // Stop at the next export, so one array cannot swallow the one after it.
    const next = src.indexOf("\nexport ", start + marker.length);
    end = next < 0 ? src.length : next;
  }

  const body = src.slice(start, end);
  const out = new Set();
  const re = /(?:slug|id):\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(body))) out.add(m[1]);
  return out;
}

/** Every quoted string inside a `key: [...]` list. */
function listIn(src, key, from) {
  const start = from ?? 0;
  const slice = src.slice(start);
  const re = new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`, "g");
  const out = [];
  let m;
  while ((m = re.exec(slice))) {
    const items = m[1].match(/"([^"]+)"/g) || [];
    for (const i of items) out.push(i.slice(1, -1));
  }
  return out;
}

const career = read("src/lib/career.ts");
const resources = read("src/lib/resources.ts");

const courseSlugs = idsIn(resources, "export const COURSES");
const roleSlugs = idsIn(career, "export const ROLES", "export const CERTIFICATIONS");
const certIds = idsIn(
  career,
  "export const CERTIFICATIONS",
  "export const PLATFORMS"
);
const platformIds = idsIn(
  career,
  "export const PLATFORMS",
  "/* ------------------------------------------------------------- lookups */"
);

if (roleSlugs.size < 4) fail(`expected several roles, found ${roleSlugs.size}`);
if (certIds.size < 6) fail(`expected several certifications, found ${certIds.size}`);
if (platformIds.size < 4) fail(`expected several platforms, found ${platformIds.size}`);

// Each role's cross references, pulled from the object that holds them.
const problems = [];
const rolesStart = career.indexOf("export const ROLES");
const certsStart = career.indexOf("export const CERTIFICATIONS");

// Split the ROLES array into one chunk per role so each one's lists are
// checked against its own entries.
const rolesBody = career.slice(rolesStart, certsStart);
const roleChunks = rolesBody.split(/\n  \{\n/).slice(1);

for (const chunk of roleChunks) {
  const slug = (chunk.match(/slug:\s*"([^"]+)"/) || [])[1] ?? "(unknown)";
  for (const c of listIn(chunk, "courses")) {
    if (!courseSlugs.has(c)) problems.push(`role ${slug} points at unknown course "${c}"`);
  }
  for (const c of listIn(chunk, "certs")) {
    if (!certIds.has(c)) problems.push(`role ${slug} points at unknown certification "${c}"`);
  }
  for (const p of listIn(chunk, "practice")) {
    if (!platformIds.has(p)) problems.push(`role ${slug} points at unknown platform "${p}"`);
  }
}

// Every platform should be reachable from at least one role, or it is
// content nobody will ever see.
const usedPlatforms = new Set();
const usedCerts = new Set();
for (const chunk of roleChunks) {
  for (const p of listIn(chunk, "practice")) usedPlatforms.add(p);
  for (const c of listIn(chunk, "certs")) usedCerts.add(c);
}
for (const p of platformIds) {
  if (!usedPlatforms.has(p)) problems.push(`platform "${p}" is not linked from any role`);
}
for (const c of certIds) {
  if (!usedCerts.has(c)) problems.push(`certification "${c}" is not linked from any role`);
}

if (problems.length) {
  for (const p of problems) console.error("FAIL: " + p);
  process.exit(1);
}

console.log(
  `ok: ${roleSlugs.size} roles, ${certIds.size} certifications, ` +
    `${platformIds.size} platforms, every reference resolves`
);
