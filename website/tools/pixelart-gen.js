/**
 * Generates the hooded-figure pixel art as a GRID literal.
 *
 * Authoring 56x42 rows by hand produces ragged silhouettes, so the shapes are
 * described here as geometry and the rim light is derived from a light
 * direction. Run: node tools/pixelart-gen.js
 */
const W = 56;
const H = 42;

// Light sits at the laptop, in front of and slightly left of the figure.
// We are viewing from behind, so the screen rims the silhouette's lower-left.
const LX = -1;
const LY = 1;

const PALETTE = {
  ".": null, // background
  H: "#2a2a2a", // hood lit side
  h: "#171717", // hood mid
  K: "#0a0a0a", // silhouette core
  B: "#121212", // torso
  b: "#1f1f1f", // shoulder catch
  G: "#22c55e", // rim light
  g: "#4ade80", // rim hotspot
  w: "#a7f3c4", // screen edge
  S: "#14532d", // screen spill
};

// ---- shapes -------------------------------------------------------------

const inEllipse = (x, y, cx, cy, rx, ry) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

// The figure: a hood seen from behind, tapering into shoulders.
function silhouette(x, y) {
  const head = inEllipse(x - 0.5, y, 27.5, 16, 12.5, 13);
  const hoodPeak = inEllipse(x - 0.5, y, 27.5, 9, 9, 7.5);

  // Shoulders. Narrower than the first pass and sloped: a wide flat
  // trapezoid reads as a hill, which made the figure look like a landscape.
  const top = 27;
  if (y >= top) {
    const t = Math.min(1, (y - top) / 10);
    const halfWidth = 12.5 + t * 7.5;
    const cx = 27.5 + t * 1.4; // slight lean, so it is not a mirror
    const corner = inEllipse(x - cx, y - (top + 10), 0, 0, halfWidth - 2.5, 2.5);
    if (Math.abs(x - cx) <= halfWidth || corner) return "shoulder";
  }
  if (head || hoodPeak) return "hood";
  return null;
}

function screenPlane(x, y) {
  /**
   * The laptop lid, tipped away from the viewer so it reads as an object on a
   * desk rather than a lit bar across the bottom. The right edge steps in
   * row by row; that perspective cue is what sells it as a screen.
   */
  const rows = [
    { y: 35, x1: 45 },
    { y: 36, x1: 44 },
    { y: 37, x1: 43 },
    { y: 38, x1: 42 },
    { y: 39, x1: 41 },
  ];
  for (const r of rows) if (y === r.y && x >= 7 && x <= r.x1) return "laptop";
  return null;
}

// ---- lighting -----------------------------------------------------------

const solid = (x, y) => silhouette(Math.round(x), Math.round(y));

function build() {
  const grid = Array.from({ length: H }, () => Array(W).fill("."));

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const s = silhouette(x, y);
      const l = screenPlane(x, y);
      if (s) grid[y][x] = s === "hood" ? "h" : "B";
      else if (l) grid[y][x] = "S";
    }
  }

  // Screen spill: a soft halo bleeding out of the lower-left of the figure.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x] !== ".") continue;
      let near = 0;
      for (let d = 1; d <= 4; d++) {
        if (solid(x + LX * d, y + LY * d)) near++;
      }
      if (near >= 3 && y > 20) grid[y][x] = "S";
    }
  }

  // Rim light on the silhouette edge facing the screen.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x] === "." ) continue;
      let lit = 0;
      let total = 0;
      for (let d = 1; d <= 3; d++) {
        total++;
        const nx = x + LX * d;
        const ny = y + LY * d;
        if (nx < 0 || ny >= H || grid[ny][nx] === ".") lit++;
      }
      if (lit === 0) continue;
      // Hotter where more of the light-facing neighbourhood is open.
      const strength = lit / total;
      if (y >= 38 && y <= 40) grid[y][x] = "w";
      else if (strength >= 0.99) grid[y][x] = "g";
      else if (strength >= 0.66) grid[y][x] = "G";
      else if (strength >= 0.33) grid[y][x] = "H";
    }
  }

  // A cool crown catch so the top of the hood is not a dead flat mass.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x] !== "h") continue;
      if (inEllipse(x, y, 25, 9, 6.5, 5)) grid[y][x] = "H";
    }
  }

  /**
   * The spine. A narrow lighter seam down the centre of the hood is the single
   * cue that tells the eye this is the back of a head rather than an egg. It
   * sits slightly left of centre to match the lean in the shoulders.
   */
  for (let y = 5; y <= 26; y++) {
    for (let x = 0; x < W; x++) {
      const cell = grid[y][x];
      if (cell !== "h" && cell !== "H") continue;
      if (Math.abs(x - 26) <= 1) grid[y][x] = "H";
    }
  }

  // Push the deepest interior to near-black so the form stays a silhouette.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x] === "h" && inEllipse(x, y, 29, 18, 7, 8)) grid[y][x] = "K";
      if (grid[y][x] === "B" && y > 33) grid[y][x] = "b";
    }
  }

  return grid;
}

const grid = build();
const rows = grid.map((r) => r.join(""));

/* ---- emit ---- */

const used = [...new Set(rows.join(""))].filter((c) => c !== ".");
const count = (c) => rows.join("").split(c).length - 1;

const colorsBlock =
  "const COLORS: Record<string, string> = {\n" +
  used.map((c) => `  ${c}: "${PALETTE[c]}",`).join("\n") +
  "\n};\n\nconst GRID = [\n" +
  rows.map((r) => `  "${r}",`).join("\n") +
  "\n];";

/**
 * With --write, splice the block into PixelArt.tsx between its markers.
 * Without it, print to stdout. Editing the rows inside the component is
 * exactly how the silhouette goes ragged; this makes the component a build
 * artefact of the shapes instead of a second hand-maintained copy.
 */
const COMPONENT = "src/components/PixelArt.tsx";

if (process.argv.includes("--write")) {
  const fs = require("fs");
  const path = require("path");
  const file = path.join(__dirname, "..", COMPONENT);
  const src = fs.readFileSync(file, "utf8");
  const MARK_A = "// <generated>";
  const MARK_B = "// </generated>";
  const a = src.indexOf(MARK_A);
  const b = src.indexOf(MARK_B);
  if (a === -1 || b === -1) {
    console.error(`FAIL: ${COMPONENT} is missing the generated markers`);
    process.exit(1);
  }
  fs.writeFileSync(
    file,
    src.slice(0, a + MARK_A.length) + "\n" + colorsBlock + "\n" + src.slice(b)
  );
  console.log(`wrote ${COMPONENT} (${rows.length} rows, ${rows[0].length} cols)`);
} else {
  console.log(`// ${W}x${H}, generated by tools/pixelart-gen.js`);
  console.log(colorsBlock);
}

console.log(
  "// palette usage:",
  used.map((c) => `${c}=${count(c)}`).join("  ")
);
