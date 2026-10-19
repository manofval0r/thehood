/**
 * Writes the favicon set.
 *
 * Reads the grid out of PixelArt.tsx, the same way gen-wallpapers does, so
 * the icon and the artwork cannot drift apart. A 16px favicon cannot show a
 * whole figure: at that size only the hood silhouette survives, so the icon
 * crops to the head and shoulder region and brightens it. Anything busier
 * turns to mud.
 *
 * Outputs, and why each exists:
 *   favicon.ico      16/32/48. A browser told nothing still probes
 *                    /favicon.ico, and a 404 there is a broken tab strip
 *                    rather than a default one.
 *   favicon-<n>.png  a modern set, so the browser picks a size instead of
 *                    resampling whichever single file happened to ship.
 *   apple-touch-icon 180, the size Apple crops to, and it does not mask.
 *   icon-192/512     for the web manifest, which is what an installed app and
 *                    an Android home screen read.
 *
 * The `sizes` attribute in the layout must match these files exactly. It was
 * declaring 48x48 for a 64x64 file, and browsers are entitled to act on it.
 *
 * Run: node tools/gen-icons.js
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "src/components/PixelArt.tsx"), "utf8");

/* ---------- shared PNG writer (same approach as gen-wallpapers) ---------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour with alpha
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- read the grid ---------- */

const colorsBlock = SRC.match(/const COLORS[\s\S]*?= \{([\s\S]*?)\n\};/);
if (!colorsBlock) fail("could not locate COLORS in PixelArt.tsx");
const COLORS = {};
for (const m of colorsBlock[1].matchAll(/(\w):\s*"(#[0-9a-fA-F]{6})"/g)) {
  COLORS[m[1]] = m[2];
}

const gridBlock = SRC.match(/const GRID = \[([\s\S]*?)\n\];/);
if (!gridBlock) fail("could not locate GRID in PixelArt.tsx");
const GRID = [...gridBlock[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]);

const GW = GRID[0].length;
const GH = GRID.length;

function fail(msg) {
  console.error("FAIL: " + msg);
  process.exit(1);
}

/**
 * Icon crop: the hood and upper shoulders. `cols`/`rows` are the source region
 * and the padding keeps the silhouette off the very edge of the tile.
 */
const CROP = { x: 13, y: 1, w: 30, h: 34 };
const PAD = 2;

/**
 * Crops for the small sizes.
 *
 * The hood is 34 rows tall, so on a 16px or 32px tile the integer scale lands
 * on 1 and a 30x34 crop does not fit: it was being drawn at scale 1 into a
 * 16px square, which shows the top-left corner of the artwork rather than the
 * artwork. Pixel art cannot be scaled fractionally, so the region has to get
 * smaller instead. These tighten onto the dome of the hood, which is the one
 * part that still reads at 16 pixels.
 */
const SMALL_CROPS = {
  16: { x: 21, y: 7, w: 12, h: 12 },
  32: { x: 14, y: 2, w: 26, h: 28 },
  48: { x: 13, y: 1, w: 30, h: 34 },
};

function cropFor(size) {
  return SMALL_CROPS[size] || CROP;
}

/**
 * At icon sizes the artwork is lifted so it reads on both light and dark
 * surfaces: the ground goes mid-grey rather than black, because a black square
 * is invisible in a dark tab bar, and the silhouette goes lighter.
 */
const LIFT = {
  // background
  ".": { bg: [26, 26, 26] },
  h: [58, 58, 58],
  H: [92, 92, 92],
  K: [20, 20, 20],
  B: [34, 34, 34],
  b: [52, 52, 52],
  S: [20, 70, 42],
  G: [34, 197, 94],
  g: [74, 222, 128],
  w: [167, 243, 196],
};

function rgbaFor(ch) {
  const hexv = COLORS[ch];
  if (!hexv) return LIFT["."].bg.concat(255);
  const r = parseInt(hexv.slice(1, 3), 16);
  const g = parseInt(hexv.slice(3, 5), 16);
  const b = parseInt(hexv.slice(5, 7), 16);
  const mapped = LIFT[ch];
  if (mapped) return [mapped[0], mapped[1], mapped[2], 255];
  return [r, g, b, 255];
}

function renderIcon(size) {
  const crop = cropFor(size);
  // Largest whole-pixel scale that fits the crop inside the tile with padding.
  const inner = size - PAD * 2;
  const scale = Math.max(1, Math.floor(inner / Math.max(crop.w, crop.h)));
  const artW = crop.w * scale;
  const artH = crop.h * scale;
  const ox = Math.round((size - artW) / 2);
  const oy = Math.round((size - artH) / 2);

  const buf = Buffer.alloc(size * size * 4);
  const put = (x, y, c) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const o = (y * size + x) * 4;
    buf[o] = c[0];
    buf[o + 1] = c[1];
    buf[o + 2] = c[2];
    buf[o + 3] = c.length > 3 ? c[3] : 255;
  };

  // Rounded tile background so the icon has a shape in a tab bar.
  const r = Math.max(2, Math.round(size * 0.18));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.max(r - x, x - (size - 1 - r), 0);
      const dy = Math.max(r - y, y - (size - 1 - r), 0);
      const d = Math.hypot(dx, dy);
      if (d <= r) put(x, y, LIFT["."].bg.concat(255));
      else if (d <= r + 1) put(x, y, [26, 26, 26, 90]);
    }
  }

  for (let gy = 0; gy < crop.h; gy++) {
    const row = GRID[crop.y + gy] || "";
    for (let gx = 0; gx < crop.w; gx++) {
      const ch = row[crop.x + gx];
      if (!ch) continue;
      const c = rgbaFor(ch);
      const px = ox + gx * scale;
      const py = oy + gy * scale;
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) put(px + x, py + y, c);
      }
    }
  }

  return encodePNG(size, size, buf);
}

/**
 * Packs PNG frames into a single .ico.
 *
 * Windows still reads the directory entries, but every browser that has
 * mattered for years will take a PNG frame verbatim, so this is a real ICO
 * header around real PNGs rather than a BMP encoder nobody needs.
 */
function buildICO(frames) {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0); // reserved
  dir.writeUInt16LE(1, 2); // type: icon
  dir.writeUInt16LE(frames.length, 4);

  const entries = [];
  let offset = 6 + frames.length * 16;
  for (const f of frames) {
    const e = Buffer.alloc(16);
    e[0] = f.size >= 256 ? 0 : f.size; // 0 means 256
    e[1] = f.size >= 256 ? 0 : f.size;
    e[2] = 0; // palette size
    e[3] = 0; // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(f.png.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += f.png.length;
  }

  return Buffer.concat([dir, ...entries, ...frames.map((f) => f.png)]);
}

const PNG_SIZES = [16, 32, 48, 64, 96, 128, 192, 256, 512];

const rendered = new Map();
for (const size of [...new Set([...PNG_SIZES, 180])]) {
  const png = renderIcon(size);
  rendered.set(size, png);
  const name = size === 180 ? "apple-touch-icon.png" : `favicon-${size}.png`;
  fs.writeFileSync(path.join(ROOT, "public", name), png);
}

// The single file, kept for anything that hardcodes /favicon.png.
fs.writeFileSync(path.join(ROOT, "public", "favicon.png"), rendered.get(64));

fs.writeFileSync(
  path.join(ROOT, "public", "favicon.ico"),
  buildICO([16, 32, 48].map((size) => ({ size, png: rendered.get(size) })))
);

fs.writeFileSync(
  path.join(ROOT, "public", "site.webmanifest"),
  JSON.stringify(
    {
      name: "Cybersecurity 300L Course Resources",
      short_name: "Cyb 300L",
      description:
        "Lecture notes, lab manuals, timetables and the academic calendar for the Cybersecurity 300 Level programme.",
      start_url: "/",
      display: "standalone",
      background_color: "#000000",
      theme_color: "#000000",
      icons: [
        { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/favicon-256.png", sizes: "256x256", type: "image/png" },
        { src: "/favicon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      ],
    },
    null,
    2
  ) + "\n"
);

const written = PNG_SIZES.map((s) => `favicon-${s}.png(${rendered.get(s).length}b)`);
written.push(`apple-touch-icon.png(${rendered.get(180).length}b)`);
console.log(written.join(" "));
console.log("favicon.ico(16/32/48), favicon.png(64), site.webmanifest");
