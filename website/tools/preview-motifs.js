/**
 * Prints each pixel motif as a terminal silhouette, so the shape can be
 * checked without a browser. Tone letters map to block characters.
 *
 * Run: node tools/preview-motifs.js [kind...]   (default: all, in registry order)
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "..", "src", "components", "PixelMotif.tsx"),
  "utf8"
);

const MAP = { d: "#", m: "+", l: "*", a: "@", b: "o" };
const requested = process.argv.slice(2);

const start = src.indexOf("export const MOTIFS");
if (start < 0) {
  console.error("could not find MOTIFS in generated file");
  process.exit(1);
}
const tail = src.slice(start);

// Pull each `"kind": { colors: {...}, grid: [ ... ] }` entry.
const kinds = [];
const re = /"([a-z0-9-]+)":\s*\{([\s\S]*?)\n\s*\},(?=\n\s*"[a-z0-9-]+":|;)/g;
let m;
while ((m = re.exec(tail))) kinds.push({ kind: m[1], body: m[2] });

if (!kinds.length) {
  console.error("no motif entries parsed");
  process.exit(1);
}

for (const { kind, body } of kinds) {
  if (requested.length && !requested.includes(kind)) continue;
  const gridBlock = body.match(/grid:\s*\[([\s\S]*?)\]/);
  if (!gridBlock) continue;
  const rows = gridBlock[1].match(/"([^"]+)"/g).map((s) => s.slice(1, -1));
  console.log(`--- ${kind} (${rows.length} rows) ---`);
  for (const row of rows) {
    console.log("  " + row.split("").map((c) => MAP[c] || ".").join(""));
  }
  console.log();
}
