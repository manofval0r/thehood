/**
 * Finds text that has been through the wrong encoding.
 *
 * A file written as UTF-8 and read as Latin-1 comes back with a character
 * that is not a character any more: a middot becomes two characters, a dash
 * becomes three, and the site shows the reader "Â·" where it means "·".
 *
 * The check is for the tell-tale sequences rather than for the replacement
 * character, because the wrong encoding produces perfectly valid characters
 * that simply mean the wrong thing.
 *
 * Run: node tools/check-mojibake.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

/** The sequences a UTF-8 byte range turns into when read as Latin-1. */
const MARKS = [
  ["Â·", "a middot read as Latin-1"],
  ["â€", "a dash or quote read as Latin-1"],
  ["â€™", "a right single quote read as Latin-1"],
  ["â€œ", "a left double quote read as Latin-1"],
  ["â€", "a right double quote read as Latin-1"],
  ["â€¦", "an ellipsis read as Latin-1"],
  ["Ã©", "an accent read as Latin-1"],
  ["Â°", "a degree sign read as Latin-1"],
  ["Â£", "a pound sign read as Latin-1"],
  ["Â½", "a half read as Latin-1"],
  ["Â§", "a section sign read as Latin-1"],
  ["Â ", "a non breaking space read as Latin-1"],
  ["Ã—", "a multiplication sign read as Latin-1"],
  ["Ã©", "an e-acute read as Latin-1"],
  ["Ã¼", "a u-umlaut read as Latin-1"],
  ["Ã¶", "an o-umlaut read as Latin-1"],
  ["Ã¤", "an a-umlaut read as Latin-1"],
  ["Ã¶", "an o-umlaut read as Latin-1"],
  ["Ã±", "a plus-minus read as Latin-1"],
  ["â‰ˆ", "a character read as Latin-1"],
];

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx|css|md|json|html)$/.test(entry.name)) {
      files.push(full);
    }
  }
}
walk(path.join(ROOT, "src"));
walk(path.join(ROOT, "tools"));
for (const extra of ["README.md", "ROADMAP.md"]) {
  const p = path.join(ROOT, "..", extra);
  if (fs.existsSync(p)) files.push(p);
}

let problems = 0;

for (const file of files) {
  // This file names the marks it looks for, so it would find itself.
  if (path.basename(file) === "check-mojibake.js") continue;

  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const [mark, why] of MARKS) {
      if (!line.includes(mark)) continue;
      problems += 1;
      console.log(
        `  ${path.relative(ROOT, file)}:${i + 1}  ${why}`
      );
      console.log(`      ${line.trim().slice(0, 100)}`);
    }
  });
}

console.log(`\n  ${problems} line(s) with the wrong encoding`);
if (problems > 0) process.exitCode = 1;
