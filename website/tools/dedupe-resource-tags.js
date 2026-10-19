/**
 * Collapses duplicated `kind:` / `tone:` lines in the resources manifest.
 *
 * tools/tag-resources.js is not idempotent: it inserts after the note line, so
 * running it twice inserts twice. This undoes that, and asserts afterwards
 * that every item has exactly one kind and every section exactly one tone.
 *
 * Run: node tools/dedupe-resource-tags.js
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "src", "app", "resources", "page.tsx");

const lines = fs.readFileSync(FILE, "utf8").split(/\r?\n/);
const out = [];
let removed = 0;

for (const line of lines) {
  const trimmed = line.trim();
  const prev = out.length ? out[out.length - 1].trim() : "";
  // A tag line immediately repeating its predecessor is a second run of the
  // tagger. Duplicates are always adjacent, because that is what the pattern
  // produces.
  if (/^(kind|tone): "/.test(trimmed) && prev === trimmed) {
    removed++;
    continue;
  }
  out.push(line);
}

fs.writeFileSync(FILE, out.join("\n"), "utf8");

const src = out.join("\n");
const kinds = (src.match(/kind: "/g) || []).length;
const tones = (src.match(/tone: "/g) || []).length;
// One extra tone is the type declaration, which also reads tone: ".
console.log(`removed ${removed} duplicate line(s)`);
console.log(`kinds: ${kinds}  tones: ${tones - 1} sections`);

if (kinds !== 22) {
  console.error(`FAIL: expected 22 kinds, found ${kinds}`);
  process.exit(1);
}
if (tones - 1 !== 5) {
  console.error(`FAIL: expected 5 tones, found ${tones - 1}`);
  process.exit(1);
}
console.log("ok");