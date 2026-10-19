/**
 * One-off: tag every study resource with the kind of thing it is, and give
 * each section a category tone.
 *
 * Run: node tools/tag-resources.js
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "src", "app", "resources", "page.tsx");

const KINDS = {
  "Google Scholar": "search",
  "Semantic Scholar": "search",
  "arXiv cs.CR": "journal",
  "IEEE Xplore": "journal",
  "NCC Group Research": "journal",
  "CISA/NIST publications": "journal",
  "Computerphile": "video",
  "Ben Eater": "video",
  "NetworkChuck": "video",
  "The Cyber Mentor": "video",
  "Neso Academy": "video",
  "TryHackMe": "practice",
  "Hack The Box Academy": "practice",
  "PortSwigger Web Security Academy": "practice",
  "OverTheWire: Bandit": "practice",
  "Google Cybersecurity Professional": "course",
  NotebookLM: "notebook",
  "Autopsy / The Sleuth Kit": "tool",
  Wireshark: "tool",
  Nmap: "tool",
  "OWASP Cheat Sheet": "reference",
  "RFC Editor": "reference",
};

const TONES = {
  papers: "academic",
  lectures: "ceremony",
  practice: "exams",
  tools: "statutory",
  route: "holiday",
};

let src = fs.readFileSync(FILE, "utf8");
const missKind = [];
const missTone = [];

for (const [label, kind] of Object.entries(KINDS)) {
  // Insert kind: "..." directly after the note line of that item.
  const re = new RegExp(
    `(label: "${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",\\s*\\n\\s*href: "[^"]+",\\s*\\n\\s*note:\\s*(?:"(?:[^"\\\\]|\\\\.)*"),)`
  );
  if (re.test(src)) {
    src = src.replace(re, `$1\n        kind: "${kind}",`);
  } else {
    missKind.push(label);
  }
}

for (const [id, tone] of Object.entries(TONES)) {
  const re = new RegExp(`(id: "${id}",[\\s\\S]{0,600}?icon: \\w+,)`);
  if (re.test(src)) {
    src = src.replace(re, `$1\n    tone: "${tone}",`);
  } else {
    missTone.push(id);
  }
}

fs.writeFileSync(FILE, src);

const kindsFound = (src.match(/kind: "/g) || []).length;
const tonesFound = (src.match(/tone: "/g) || []).length;
console.log(`kinds: ${kindsFound}/${Object.keys(KINDS).length}`);
console.log(`tones: ${tonesFound}/${Object.keys(TONES).length}`);
if (missKind.length) console.log("missing kind for:", missKind.join(", "));
if (missTone.length) console.log("missing tone for:", missTone.join(", "));