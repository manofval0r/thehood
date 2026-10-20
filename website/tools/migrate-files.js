/**
 * Indexes the archive files.
 *
 * The course files live in the repository under public/courses, and the site
 * serves them from there. This puts them into the file index so the course
 * pages, the search and the counts all read one list instead of two.
 *
 * It does not move anything. The files stay where they are, and the index
 * points at them.
 *
 * Run: node tools/migrate-files.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function env(name) {
  // .env.local is read by hand here. The script runs outside Next, so it
  // cannot rely on the framework loading it.
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

// The manifest is the source of truth for what belongs to which course.
const resourcesSrc = fs.readFileSync(
  path.join(ROOT, "src", "lib", "resources.ts"),
  "utf8"
);

const coursesSrc = fs.readFileSync(
  path.join(ROOT, "src", "lib", "resources.ts"),
  "utf8"
);

/** Pulls each course's code and its resource entries out of the manifest. */
function parseManifest() {
  const out = [];
  const courseRe =
    /code:\s*"([^"]+)",\s*\n\s*slug:\s*"([^"]+)",\s*\n\s*title:\s*"([^"]+)"/g;
  const blocks = [];
  let m;
  while ((m = courseRe.exec(coursesSrc))) {
    blocks.push({ code: m[1], slug: m[2], title: m[3], from: m.index });
  }

  for (let i = 0; i < blocks.length; i++) {
    const start = blocks[i].from;
    const end = i + 1 < blocks.length ? blocks[i + 1].from : coursesSrc.length;
    const body = coursesSrc.slice(start, end);

    const resourceRe =
      /id:\s*"([^"]+)",\s*\n\s*title:\s*"([^"]+)",\s*\n\s*type:\s*"([^"]+)",\s*\n\s*url:\s*`([^`]+)`/g;
    let r;
    const files = [];
    while ((r = resourceRe.exec(body))) {
      files.push({
        id: r[1],
        title: r[2],
        type: r[3],
        url: r[4].replace("${base}", "/courses"),
      });
    }
    out.push({ ...blocks[i], files });
  }
  return out;
}

async function ensureBucket() {
  const head = await fetch(`${URL_BASE}/storage/v1/bucket/course-files`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (head.ok) {
    console.log("bucket course-files: already there");
    return;
  }
  const create = await fetch(`${URL_BASE}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: "course-files",
      name: "course-files",
      public: true,
      file_size_limit: 25 * 1024 * 1024,
    }),
  });
  if (!create.ok) {
    console.error("FAIL: could not create the bucket: " + (await create.text()));
    process.exit(1);
  }
  console.log("bucket course-files: created");
}

async function main() {
  await ensureBucket();

  const courses = parseManifest();
  const rows = [];

  for (const course of courses) {
    for (const file of course.files) {
      // The file has to actually exist, or the index would point at nothing.
      const local = path.join(ROOT, "public", file.url.replace(/^\//, ""));
      if (!fs.existsSync(local)) {
        console.error(`FAIL: ${file.url} is in the manifest but not on disk`);
        process.exit(1);
      }
      const size = fs.statSync(local).size;
      rows.push({
        id: file.id,
        course: course.code,
        title: file.title,
        type: file.type,
        url: file.url,
        size,
        source: "archive",
        storage_path: null,
        uploaded_by: null,
      });
    }
  }

  console.log(`indexing ${rows.length} archive files`);

  const res = await fetch(`${URL_BASE}/rest/v1/files?on_conflict=id`, {
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
    console.error("FAIL: the index was refused: " + (await res.text()));
    process.exit(1);
  }

  // Confirm what the index now holds.
  const check = await fetch(`${URL_BASE}/rest/v1/files?select=id,source`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const all = await check.json();
  console.log(
    `ok: ${all.length} files in the index (${all.filter((f) => f.source === "archive").length} archive)`
  );
}

main().catch((e) => {
  console.error("FAIL: " + (e && e.message ? e.message : e));
  process.exit(1);
});
