/**
 * Pixel motifs for the study resources page.
 *
 * Same reasoning as pixelart-gen.js: authoring grid rows by hand produces
 * ragged silhouettes, so each motif is described as geometry and rasterised
 * here. One motif per KIND of resource, so a card's art says what kind of
 * thing it is at the same moment its label says it.
 *
 * Written into src/components/PixelMotif.tsx between the generated markers,
 * so the grid cannot drift from the shapes that produced it.
 *
 * Run: node tools/pixel-motifs.js
 */

const W = 20;
const H = 20;

/** Neutral structure. The accent is per-kind and applied at render time. */
const TONE = {
  ".": null, // transparent
  d: "#202020", // body
  m: "#3a3a3a", // shaded side
  l: "#6b6b6b", // highlight
  a: null, // accent, filled per kind
  b: null, // accent shade, filled per kind
};

/* ---------------- rasterising primitives ---------------- */

const grid = () =>
  Array.from({ length: H }, () => new Array(W).fill("."));

const put = (g, x, y, ch) => {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  g[y][x] = ch;
};

const rect = (g, x, y, w, h, ch) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(g, x + i, y + j, ch);
};

const disc = (g, cx, cy, r, ch) => {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.3) put(g, x, y, ch);
};

const ring = (g, cx, cy, rOuter, rInner, ch) => {
  for (let y = cy - rOuter; y <= cy + rOuter; y++)
    for (let x = cx - rOuter; x <= cx + rOuter; x++) {
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d <= rOuter * rOuter + 0.3 && d >= rInner * rInner - 0.3) put(g, x, y, ch);
    }
};

/** Filled isoceles triangle, apex at (ax, ay), opening downward to `width`. */
const wedge = (g, ax, ay, width, ch) => {
  for (let i = 0; i <= width; i++) {
    const hgt = i;
    for (let j = 0; j <= hgt; j++) {
      put(g, ax - i + j, ay + i, ch);
      if (i > 0) put(g, ax + i - j, ay + i, ch);
    }
  }
};

/** Line, used for handles and stems. */
const line = (g, x0, y0, x1, y1, ch) => {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    put(g, x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, ch);
  }
};

/* ---------------- the motifs ---------------- */

const MOTIFS = {
  /** Search: a lens over ruled lines. */
  search(g) {
    rect(g, 2, 2, 16, 16, "d");
    disc(g, 9, 9, 7, ".");
    ring(g, 9, 9, 7, 5.4, "m");
    ring(g, 9, 9, 6, 4.6, "a");
    line(g, 14, 14, 18, 18, "m");
    line(g, 15, 15, 18, 18, "l");
    for (let i = 0; i < 3; i++) rect(g, 5, 6 + i * 2, 6, 1, "a");
    put(g, 9, 9, "b");
  },

  /** Papers: a page with a folded corner and ruled lines. */
  journal(g) {
    // One sheet behind, offset by two, so it reads as a small stack without
    // turning the right edge into a staircase.
    rect(g, 4, 4, 13, 15, "m");
    rect(g, 2, 2, 14, 16, "d");
    rect(g, 2, 2, 2, 16, "m");
    rect(g, 2, 2, 14, 1, "l");
    // Folded corner: a single clean diagonal notch. Shading under it as well
    // is what made the edge ragged.
    for (let i = 0; i < 5; i++) put(g, 11 + i, 2 + i, ".");
    for (let i = 0; i < 5; i++) rect(g, 5, 8 + i * 2, 8, 1, "a");
    rect(g, 5, 16, 5, 1, "m");
  },

  /** Watch: a player. */
  video(g) {
    rect(g, 1, 4, 18, 13, "d");
    rect(g, 1, 4, 18, 1, "m");
    rect(g, 2, 5, 16, 11, "m");
    rect(g, 3, 6, 14, 9, "d");
    wedge(g, 9, 7, 4, "a");
    // Progress line along the foot, the way a player shows elapsed time.
    rect(g, 3, 17, 8, 1, "a");
    rect(g, 11, 17, 6, 1, "m");
  },

  /** Practise: a target, with the hit marked.

    Bands are deliberately far apart. Rings one pixel wide alternate colour
    every other cell and rasterise into noise rather than into rings. */
  practice(g) {
    disc(g, 10, 10, 9, "d");
    ring(g, 10, 10, 9, 6.6, "m");
    ring(g, 10, 10, 6.6, 4.4, "a");
    disc(g, 10, 10, 4.4, "d");
    disc(g, 10, 10, 2.4, "a");
    disc(g, 10, 10, 1, "l");
  },

  /** Course: waypoints joined, the last one flagged. */
  course(g) {
    rect(g, 2, 2, 16, 16, "d");
    for (let i = 0; i < 5; i++) rect(g, 4, 3 + i, 1, 1, "m");
    line(g, 5, 4, 5, 15, "m");
    line(g, 5, 15, 10, 11, "m");
    line(g, 10, 11, 15, 7, "a");
    disc(g, 5, 15, 2, "a");
    disc(g, 5, 15, 1, "l");
    wedge(g, 15, 3, 3, "a");
    rect(g, 15, 9, 1, 7, "a");
  },

  /** Notes: a page with a lit line. */
  notebook(g) {
    rect(g, 3, 2, 14, 16, "d");
    rect(g, 3, 2, 2, 16, "m");
    rect(g, 3, 2, 14, 1, "l");
    for (let i = 0; i < 5; i++) rect(g, 7, 5 + i * 2, 8, 1, i === 2 ? "a" : "m");
    rect(g, 7, 15, 5, 1, "m");
    // A mark in the margin, the thing that makes it a note and not a form.
    rect(g, 4, 8, 1, 4, "a");
  },

  /** Tool: a spanner head. */
  tool(g) {
    rect(g, 2, 2, 16, 16, "d");
    // Open jaw, upper left.
    rect(g, 3, 3, 4, 8, "m");
    rect(g, 3, 3, 8, 3, "m");
    rect(g, 5, 5, 3, 3, ".");
    // Handle sweeping to the lower right.
    for (let i = 0; i < 9; i++) {
      rect(g, 8 + i, 8 + i, 3, 3, i % 2 === 0 ? "a" : "m");
    }
    rect(g, 14, 14, 4, 4, "m");
    rect(g, 15, 15, 2, 2, "a");
  },

  /** Reference: a closed book, spine at the left. */
  reference(g) {
    rect(g, 2, 4, 16, 13, "d");
    rect(g, 2, 4, 3, 13, "m");
    rect(g, 2, 4, 16, 1, "l");
    rect(g, 5, 16, 13, 1, "m");
    rect(g, 7, 7, 8, 1, "a");
    rect(g, 7, 9, 8, 1, "m");
    rect(g, 7, 11, 5, 1, "m");
    // Bookmark ribbon.
    rect(g, 13, 4, 2, 7, "a");
    rect(g, 13, 10, 2, 2, "b");
  },
};

/* ---------------- emit ---------------- */

function render(kind) {
  const g = grid();
  MOTIFS[kind](g);
  return g.map((row) => row.join(""));
}

/** Per-kind accent pair. Matches KIND_STYLE in ResourceMark, which is being
 *  retired; keeping the colours here means one source of truth for the page. */
const ACCENTS = {
  search: ["#60a5fa", "#1d4ed8"],
  journal: ["#c084fc", "#7e22ce"],
  video: ["#fb923c", "#c2410c"],
  practice: ["#22c55e", "#15803d"],
  course: ["#f59e0b", "#b45309"],
  notebook: ["#f472b6", "#be185d"],
  tool: ["#2dd4bf", "#0f766e"],
  reference: ["#94a3b8", "#475569"],
};

const entries = Object.keys(MOTIFS);

const out = `import { cn } from "@/lib/utils";

/**
 * Pixel motifs, one per kind of study resource.
 *
 * Generated by tools/pixel-motifs.js from geometry, so the grid cannot drift
 * from the shapes that produced it. Hand-editing the rows is how a silhouette
 * goes ragged.
 *
 * These replaced drawn line icons. At card size a 1.7px stroke reads as a
 * smudge and every card looks identical; a pixel motif has a silhouette you
 * can name from across the room, which is the same reason the rest of this
 * site is drawn in pixels.
 */

// The grid and its colours live together in one object. An earlier version
// declared two parallel tables and filled them in a loop at module scope,
// which runs before the consts below are initialised and throws on load.
// </generated>
export const MOTIFS: Record<string, { grid: string[]; colors: Record<string, string> }> = {
${entries
  .map((kind) => {
    const rows = render(kind);
    const [accent, shade] = ACCENTS[kind];
    const colors = { ...TONE, a: accent, b: shade };
    const used = [...new Set(rows.join("").split(""))].filter((c) => c !== ".");
    const colorLines = used
      .filter((c) => colors[c])
      .map((c) => `      ${JSON.stringify(c)}: ${JSON.stringify(colors[c])},`)
      .join("\n");
    return `  ${JSON.stringify(kind)}: {
    colors: {
${colorLines}
    },
    grid: [
${rows.map((r) => `      ${JSON.stringify(r)},`).join("\n")}
    ],
  },`;
  })
  .join("\n")}
};
// </generated>

export default function PixelMotif({
  kind,
  className,
  title,
}: {
  kind: string;
  className?: string;
  /** Describes the motif, for anyone who cannot see it. */
  title: string;
}) {
  const def = MOTIFS[kind];
  if (!def) return null;

  const rects: React.ReactNode[] = [];
  def.grid.forEach((row, y) => {
    row.split("").forEach((ch, x) => {
      const fill = def.colors[ch];
      if (!fill) return;
      rects.push(
        <rect key={\`\${y}-\${x}\`} x={x} y={y} width={1} height={1} fill={fill} />
      );
    });
  });

  return (
    <svg
      viewBox={\`0 0 \${def.grid[0].length} \${def.grid.length}\`}
      className={cn("h-auto w-full", className)}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title}
    >
      {rects}
    </svg>
  );
}
`;

const target = require("path").join(
  __dirname,
  "..",
  "src",
  "components",
  "PixelMotif.tsx"
);
require("fs").writeFileSync(target, out, "utf8");

console.log(`wrote ${entries.length} motifs, ${W}x${H} each, to PixelMotif.tsx`);
for (const kind of entries) {
  const rows = render(kind);
  const filled = rows.join("").replace(/\./g, "").length;
  console.log(`  ${kind.padEnd(10)} ${filled} filled cells`);
}