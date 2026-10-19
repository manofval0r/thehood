/**
 * Asserts that every icon the layout declares actually exists and that each
 * `sizes` attribute matches the file's real pixel dimensions.
 *
 * This exists because the layout shipped `sizes="48x48"` pointing at a 64x64
 * file. Nothing threw, the page rendered, the icon looked plausible on the
 * machine that generated it, and the mismatch was only visible by reading the
 * two numbers against each other. A browser is entitled to act on a wrong
 * `sizes`, and anything that ignores the link tags entirely falls back to a
 * default globe rather than to the artwork.
 *
 * Run: node tools/check-icons.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const LAYOUT = path.join(ROOT, "src", "app", "layout.tsx");
const PUBLIC = path.join(ROOT, "public");

const src = fs.readFileSync(LAYOUT, "utf8");

/** Real dimensions of a PNG, straight out of the IHDR chunk. */
function pngSize(file) {
  const b = fs.readFileSync(file);
  const isPng =
    b.length > 24 &&
    b.readUInt32BE(0) === 0x89504e47 &&
    b[12] === 0x49 &&
    b[13] === 0x48 &&
    b[14] === 0x44 &&
    b[15] === 0x52;
  if (!isPng) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

/** Every <link rel="icon|apple-touch-icon"> in the layout. */
const tags = [...src.matchAll(/<link\s+rel="([^"]+)"[^>]*?>/g)].map((m) => {
  const raw = m[0];
  return {
    rel: m[1],
    href: (raw.match(/href="([^"]+)"/) || [])[1],
    sizes: (raw.match(/sizes="([^"]+)"/) || [])[1],
  };
});

const problems = [];
let checked = 0;

for (const tag of tags) {
  // A manifest is not a sized image; it takes no sizes attribute.
  if (tag.rel === "manifest") continue;
  if (!tag.href) {
    problems.push(`${tag.rel}: no href`);
    continue;
  }
  const file = path.join(PUBLIC, tag.href.replace(/^\//, ""));
  if (!fs.existsSync(file)) {
    problems.push(`${tag.rel} ${tag.href}: file does not exist`);
    continue;
  }
  checked++;

  // "any" is a promise that the icon is scalable, which favicon.ico is.
  if (tag.sizes === "any") continue;
  if (!tag.sizes) {
    problems.push(`${tag.rel} ${tag.href}: no sizes attribute`);
    continue;
  }

  const declared = tag.sizes.match(/^(\d+)x(\d+)$/);
  if (!declared) {
    problems.push(`${tag.rel} ${tag.href}: unparseable sizes "${tag.sizes}"`);
    continue;
  }

  const actual = pngSize(file);
  if (!actual) continue; // favicon.ico and friends are not PNGs

  if (actual.w !== Number(declared[1]) || actual.h !== Number(declared[2])) {
    problems.push(
      `${tag.rel} ${tag.href}: declared ${tag.sizes}, file is ${actual.w}x${actual.h}`
    );
  }
}

/* The manifest has to agree with itself too. */
const manifestPath = path.join(PUBLIC, "site.webmanifest");
if (!fs.existsSync(manifestPath)) {
  problems.push("site.webmanifest: missing");
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const icon of manifest.icons || []) {
    const file = path.join(PUBLIC, icon.src.replace(/^\//, ""));
    if (!fs.existsSync(file)) {
      problems.push(`manifest ${icon.src}: file does not exist`);
      continue;
    }
    const actual = pngSize(file);
    if (actual && actual.w + "x" + actual.h !== icon.sizes) {
      problems.push(
        `manifest ${icon.src}: declared ${icon.sizes}, file is ${actual.w}x${actual.h}`
      );
    }
  }
}

/* favicon.ico must exist, whatever the markup says. It is the one path a
   browser will try with no prompting at all. */
if (!fs.existsSync(path.join(PUBLIC, "favicon.ico"))) {
  problems.push("favicon.ico: missing, a browser told nothing will probe it");
}

console.log(`checked ${checked} icon link(s)`);
if (problems.length) {
  for (const p of problems) console.error("FAIL " + p);
  process.exit(1);
}
console.log("ok: every declared icon exists and every sizes matches the file");