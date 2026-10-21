/**
 * Checks the copy a reader actually sees.
 *
 * Two things go wrong in a text file that has been edited a lot. A byte
 * sequence stops being a character and becomes a question mark, which is a
 * title reading "Session 1 ? Peace and Conflict Resolution". And a dash
 * arrives from a word processor, which is an em dash or an en dash where
 * the house style wants a hyphen.
 *
 * Comments are removed before the check, because a dash in a comment is a
 * dash between two people reading the code and the rule is about the words
 * on the screen. The prose in the readme is left in, because somebody
 * reads that too.
 *
 * Run: node tools/check-copy.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|md|js|css|json)$/.test(entry.name)) files.push(full);
  }
}
walk(path.join(ROOT, "src"));
walk(path.join(ROOT, "tools"));
for (const extra of ["README.md", "ROADMAP.md"]) {
  const p = path.join(ROOT, "..", extra);
  if (fs.existsSync(p)) files.push(p);
}

/**
 * Takes the comments out of a file, leaving what is left holding the copy.
 *
 * A block comment is removed with everything between the markers. A line
 * comment is removed from its marker onwards. It is not a parser, and it
 * does not need to be: it only has to be right about where a comment starts
 * and stops, and a string that contains "//" is rare enough to check by
 * hand when it turns up.
 */
function stripComments(text, file) {
  const isCss = file.endsWith(".css");
  const isMarkdown = file.endsWith(".md");
  if (isMarkdown) return text;

  let out = "";
  let inBlock = false;

  for (const line of text.split(/\r?\n/)) {
    if (isCss) {
      let rest = line;
      let kept = "";
      while (rest.length > 0) {
        if (inBlock) {
          const end = rest.indexOf("*/");
          if (end === -1) {
            rest = "";
            break;
          }
          rest = rest.slice(end + 2);
          inBlock = false;
          continue;
        }
        const start = rest.indexOf("/*");
        if (start === -1) {
          kept += rest;
          rest = "";
          break;
        }
        kept += rest.slice(0, start);
        rest = rest.slice(start + 2);
        inBlock = true;
      }
      out += kept + "\n";
      continue;
    }

    // A line comment runs to the end of the line, unless it is inside a
    // string, which the check below will notice.
    const marker = line.indexOf("//");
    const quote = line.indexOf('"');
    const tick = line.indexOf("`");
    const cut =
      marker === -1
        ? -1
        : (quote !== -1 && quote < marker) || (tick !== -1 && tick < marker)
          ? -1
          : marker;
    out += (cut === -1 ? line : line.slice(0, cut)) + "\n";
  }

  return out;
}

let broken = 0;
let dashes = 0;

for (const file of files) {
  const text = stripComments(fs.readFileSync(file, "utf8"), file);
  const lines = text.split(/\r?\n/);

  lines.forEach((line, i) => {
    const where = `${path.relative(ROOT, file)}:${i + 1}`;

    const bad = line.match(/[\uFFFD]/g);
    if (bad) {
      broken += bad.length;
      console.log(`  ${where}  ${bad.length} replacement character(s)`);
      console.log(`      ${line.trim().slice(0, 110)}`);
    }

    // A broken byte is wrong anywhere, including in the readme. A dash in
    // the readme is prose between two people, and the rule is about the
    // words on the screen.
    const isMarkdown = file.endsWith(".md");
    if (isMarkdown) return;

    const found = line.match(/[\u2013\u2014]/g);
    if (found) {
      dashes += found.length;
      console.log(
        `  ${where}  ${found
          .map((d) => (d === "\u2013" ? "en dash" : "em dash"))
          .join(" and ")}`
      );
      console.log(`      ${line.trim().slice(0, 110)}`);
    }
  });
}

console.log(
  `\n  ${broken} broken characters, ${dashes} dashes, in ${files.length} files`
);
if (broken > 0 || dashes > 0) process.exitCode = 1;
