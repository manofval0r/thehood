/**
 * Prints each pixel motif as a terminal silhouette, so the shape can be
 * checked without a browser. Tone letters map to block characters.
 *
 * Run: node tools/preview-motifs.js
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "..", "src", "components", "PixelMotif.tsx"),
  "utf8"
);

const MAP = { d: "#", m: "+", l: "*", a: "@", b: "o" };
const KINDS = [
  "search",
  "journal",
  "video",
  "practice",
  "course",
  "notebook",
  "tool",
  "reference",
];

const raw = src.slice(src.indexOf("const RAW"));

for (const kind of KINDS) {
  const at = raw.indexOf(`"${kind}": [`);
  if (at < 0) {
    console.log(`--- ${kind}: MISSING ---`);
    continue;
  }
  const open = raw.indexOf("[", at);
  const close = raw.indexOf("]", open);
  const rows = raw
    .slice(open, close)
    .match(/"([.#dmlabo]{20})"/g)
    .map((s) => s.slice(1, -1));

  console.log(`--- ${kind} (${rows.length} rows) ---`);
  for (const row of rows) {
    console.log(
      "  " +
        row
          .split("")
          .map((c) => MAP[c] || ".")
          .join("")
    );
  }
  console.log();
}