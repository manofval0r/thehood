/**
 * Scans the archive folder and writes what is in it.
 *
 * The files in public/courses are the course material. The manifest lists
 * some of them with good titles and stable ids, but it was written by hand
 * and it is behind: the lab manual has a whole tree of evidence files and a
 * set of working copies that are in the folder and in nobody's list.
 *
 * So the folder is the truth about what exists, and the manifest is the
 * truth about what to call things. This walks the folder, takes the title
 * and the id from the manifest where the manifest knows the file, and makes
 * up a sensible id where it does not.
 *
 * The result is written into src/lib/archive.ts, between the generated
 * markers, so the file list is known when the site is built and costs
 * nothing at request time.
 *
 * Run: node tools/scan-archive.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ARCHIVE_DIR = path.join(ROOT, "public", "courses");
const TARGET = path.join(ROOT, "src", "lib", "archive.ts");

/* ---------------------------------------------------------------- manifest */

/**
 * The course code, the title and the id of every file the manifest knows.
 *
 * Read out of the source rather than imported, because the source is
 * TypeScript and this is a plain script.
 */
function readManifest() {
  const src = fs.readFileSync(
    path.join(ROOT, "src", "lib", "resources.ts"),
    "utf8"
  );

  // The courses, with the code and the slug.
  const courses = [];
  const courseRe =
    /code:\s*"([^"]+)",\s*\n\s*slug:\s*"([^"]+)",\s*\n\s*title:\s*"([^"]+)"/g;
  let m;
  while ((m = courseRe.exec(src))) {
    courses.push({ code: m[1], slug: m[2], title: m[3] });
  }

  // The resources. Each one is inside a course block, so the course is
  // whatever block the resource is in.
  const resources = [];
  const blockRe =
    /code:\s*"([^"]+)"[\s\S]*?(?=\n  \{\n    code:|\n\];)/g;
  while ((m = blockRe.exec(src))) {
    const code = m[1];
    const resRe =
      /\{\s*\n\s*id:\s*"([^"]+)",\s*\n\s*title:\s*"([^"]+)",\s*\n\s*type:\s*"([^"]+)",\s*\n\s*url:\s*`([^`]+)`/g;
    let r;
    while ((r = resRe.exec(m[0]))) {
      resources.push({
        id: r[1],
        title: r[2],
        type: r[3],
        course: code,
        url: r[4].replace("${base}", "/courses"),
      });
    }
  }

  return { courses, resources };
}

/* -------------------------------------------------------------- the folder */

/** Every file under public/courses, as a path relative to it. */
function walk(dir, prefix = "") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...walk(path.join(dir, entry.name), rel));
    } else if (entry.isFile()) {
      const stat = fs.statSync(path.join(dir, entry.name));
      out.push({ rel, size: stat.size });
    }
  }
  return out;
}

/** A stable, readable id from a path. */
function idFromPath(rel) {
  return rel
    .replace(/\.[^.]+$/, "")
    .split("/")
    .map((part) =>
      part
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    )
    .filter(Boolean)
    .join("-");
}

/** The title a file gets when the manifest has nothing to say about it. */
function titleFromName(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ build */

const { courses, resources } = readManifest();

// The manifest's url is the join key: the same file, the same address.
const byUrl = new Map(resources.map((r) => [r.url, r]));

// The course folder is the first segment after /courses/. The manifest says
// which course each of those folders belongs to.
const courseOfFolder = new Map();
for (const r of resources) {
  const parts = r.url.replace("/courses/", "").split("/");
  if (parts.length > 1) courseOfFolder.set(parts[0], r.course);
}
// A folder with nothing in the manifest yet still belongs to a course, so
// the course titles are matched on their folder names as well.
for (const c of courses) {
  if (!courseOfFolder.has(c.title)) courseOfFolder.set(c.title, c.code);
}

if (!fs.existsSync(ARCHIVE_DIR)) {
  console.error("FAIL: public/courses is not there");
  process.exit(1);
}

const files = walk(ARCHIVE_DIR).sort((a, b) => a.rel.localeCompare(b.rel));

const entries = files.map(({ rel, size }) => {
  const url = `/courses/${rel}`;
  const known = byUrl.get(url);
  const segments = rel.split("/");
  const courseFolder = segments[0];
  const course = known?.course ?? courseOfFolder.get(courseFolder) ?? courseFolder;

  // The folder inside the course: everything between the course folder and
  // the file itself.
  const folder = segments.slice(1, -1).join("/");

  return {
    id: known?.id ?? idFromPath(rel),
    course,
    title: known?.title ?? titleFromName(segments[segments.length - 1]),
    url,
    folder,
    size,
    named: Boolean(known),
  };
});

// The manifest may know a file that is not in the folder. It still belongs.
for (const r of resources) {
  if (entries.some((e) => e.url === r.url)) continue;
  entries.push({
    id: r.id,
    course: r.course,
    title: r.title,
    url: r.url,
    folder: "",
    size: 0,
    named: true,
  });
}

entries.sort((a, b) => a.url.localeCompare(b.url));

/* ------------------------------------------------------------------ write */

const rows = entries
  .map(
    (e) =>
      `  {\n` +
      `    id: ${JSON.stringify(e.id)},\n` +
      `    course: ${JSON.stringify(e.course)},\n` +
      `    title: ${JSON.stringify(e.title)},\n` +
      `    url: ${JSON.stringify(e.url)},\n` +
      `    folder: ${JSON.stringify(e.folder)},\n` +
      `    size: ${e.size},\n` +
      `  },`
  )
  .join("\n");

const out = `/**
 * The archive.
 *
 * Every file in public/courses, with the course it belongs to, the folder it
 * sits in and the title it should be read with.
 *
 * Generated by tools/scan-archive.js, so the list cannot drift from what is
 * actually in the folder. The manifest still decides the title and the id
 * of the files it knows about; the rest are named after themselves.
 *
 * The file is written at build time rather than read at request time
 * because the serverless function does not have the public folder on its
 * disk. The folder is served by the CDN, not carried in the function.
 */

// <generated>
export interface ArchiveEntry {
  id: string;
  course: string;
  title: string;
  /** The address, relative to the site root. */
  url: string;
  /** The folder inside the course. Empty for a file at the top. */
  folder: string;
  size: number;
}

export const ARCHIVE: ArchiveEntry[] = [
${rows}
];
// </generated>
`;

const existing = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, "utf8") : "";
const start = out.indexOf("// <generated>");
const end = out.indexOf("// </generated>") + "// </generated>".length;
const generated = out.slice(start, end);

if (existing.includes("// <generated>")) {
  const s = existing.indexOf("// <generated>");
  const e = existing.indexOf("// </generated>") + "// </generated>".length;
  fs.writeFileSync(TARGET, existing.slice(0, s) + generated + existing.slice(e));
} else {
  fs.writeFileSync(TARGET, out);
}

const named = entries.filter((e) => e.named).length;
const folders = new Set(entries.map((e) => `${e.course}|${e.folder}`)).size;
console.log(
  `  ${entries.length} files (${named} named by the manifest), ${folders} folders -> ${path.relative(
    ROOT,
    TARGET
  )}`
);
