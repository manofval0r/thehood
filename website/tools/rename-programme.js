/**
 * Renames the programme from "Cyber-Security" to "Cybersecurity".
 *
 * Guards the asset path, which contains the same characters and must keep
 * matching the real file on disk: 300L_Cyber-Security_Timetable (1).pdf
 *
 * Run: node tools/rename-programme.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");

const GUARD = "300L_Cyber-Security_Timetable (1).pdf";

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
  );
}

let filesChanged = 0;
let total = 0;

for (const file of walk(SRC)) {
  if (!/\.(tsx|ts)$/.test(file)) continue;
  const before = fs.readFileSync(file, "utf8");
  if (!/Cyber-Security|Cyber Security/.test(before)) continue;

  const protectedSrc = before.split(GUARD).join("__GUARD__");
  let after = protectedSrc
    .split("Cyber-Security")
    .join("Cybersecurity")
    .split("Cyber Security")
    .join("Cybersecurity")
    .split("__GUARD__")
    .join(GUARD);

  if (after !== before) {
    fs.writeFileSync(file, after);
    filesChanged++;
    const count = (before.match(/Cyber-Security|Cyber Security/g) || []).length;
    total += count;
    console.log(`  ${path.relative(ROOT, file)}  (${count})`);
  }
}

console.log(`\n${total} occurrences across ${filesChanged} files`);
