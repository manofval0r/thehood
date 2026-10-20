/**
 * Prints the course manifest as a flat list, so content that has to point at
 * a real course can be written against the actual slugs instead of guesses.
 *
 * Run: node tools/list-courses.js
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "..", "src", "lib", "resources.ts"),
  "utf8"
);

const re =
  /code:\s*"([^"]+)",\s*\n\s*slug:\s*"([^"]+)",\s*\n\s*title:\s*"([^"]+)"/g;
const out = [];
let m;
while ((m = re.exec(src))) {
  out.push({ code: m[1], slug: m[2], title: m[3] });
}

for (const c of out) {
  console.log(`${c.code} | ${c.slug} | ${c.title}`);
}
console.log(`total ${out.length}`);
