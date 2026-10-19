/**
 * Renders the hero pixel art to wallpaper PNGs.
 *
 * The artwork lives as a grid inside PixelArt.tsx, so this reads that grid
 * rather than duplicating it. PNG is written by hand with zlib, which Node
 * already ships, to avoid pulling an image library into the build for two
 * files. Nearest-neighbour scaling only: smoothing the blocks would turn
 * pixel art into a blurry rectangle.
 *
 * Run: node tools/gen-wallpapers.js
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "src/components/PixelArt.tsx"), "utf8");

/* ---------- read the grid and palette out of the component ---------- */

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
console.log(`grid ${GW}x${GH}, ${Object.keys(COLORS).length} palette entries`);

/* ---------- minimal PNG writer ---------- */

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

/** 8-bit truecolour, no interlacing. `rgb` is width*height*3 bytes. */
function encodePNG(width, height, rgb) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  // One filter byte (0 = None) per scanline.
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- paint ---------- */

function hex(c) {
  return [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
  ];
}

function render(width, height, scale, opts = {}) {
  const bg = hex(opts.bg || "#000000");
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    rgb[i * 3] = bg[0];
    rgb[i * 3 + 1] = bg[1];
    rgb[i * 3 + 2] = bg[2];
  }

  const artW = GW * scale;
  const artH = GH * scale;
  const originX = Math.round((width - artW) / 2);
  // Sit the figure low and let it breathe. Centred at full scale reads as a
  // logo stamped on the wallpaper rather than a picture in a dark room.
  const originY = Math.round((height - artH) * (opts.offsetY ?? 0.55));

  const put = (x, y, c) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const o = (y * width + x) * 3;
    rgb[o] = c[0];
    rgb[o + 1] = c[1];
    rgb[o + 2] = c[2];
  };

  // Screen glow spilling into the room. Added to the background before the
  // figure so it never washes over the silhouette.
  if (opts.glow !== false) {
    const cx = originX + artW / 2;
    const cy = originY + artH * 0.72;
    const reach = Math.max(artW, artH) * 1.5;
    const [gr, gg, gb] = hex(opts.glowColor || "#0d3d1f");
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = (y - cy) * 1.35;
        const d = Math.sqrt(dx * dx + dy * dy) / reach;
        if (d >= 1) continue;
        const f = (1 - d) * (1 - d);
        const o = (y * width + x) * 3;
        rgb[o] = Math.min(255, rgb[o] + gr * f);
        rgb[o + 1] = Math.min(255, rgb[o + 1] + gg * f);
        rgb[o + 2] = Math.min(255, rgb[o + 2] + gb * f);
      }
    }
  }

  for (let gy = 0; gy < GH; gy++) {
    const row = GRID[gy];
    for (let gx = 0; gx < row.length; gx++) {
      const fill = COLORS[row[gx]];
      if (!fill) continue;
      const c = hex(fill);
      const px = originX + gx * scale;
      const py = originY + gy * scale;
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) put(px + x, py + y, c);
      }
    }
  }

  return { rgb, artW, artH, originX, originY };
}

/* ---------- output ---------- */

/**
 * `fill` caps how much of the shorter axis the artwork may occupy. Full bleed
 * looked crude once the blocks were this large; ~55% leaves the darkness
 * doing the work.
 */
const TARGETS = [
  { name: "wallpaper-1920x1080.png", w: 1920, h: 1080, fill: 0.55, offsetY: 0.5 },
  { name: "wallpaper-2560x1440.png", w: 2560, h: 1440, fill: 0.55, offsetY: 0.5 },
  { name: "wallpaper-1170x2532.png", w: 1170, h: 2532, fill: 0.4, offsetY: 0.42 },
];

for (const t of TARGETS) {
  const raw = Math.max(1, Math.floor(Math.min(t.w / GW, t.h / GH) * t.fill));
  const scale = Math.max(1, raw);
  const painted = render(t.w, t.h, scale, { offsetY: t.offsetY ?? 0.55 });
  const png = encodePNG(t.w, t.h, painted.rgb);
  fs.writeFileSync(path.join(ROOT, "public", t.name), png);
  console.log(
    `${t.name}  ${t.w}x${t.h}  scale ${scale}  art ${painted.artW}x${painted.artH}  ` +
      `${Math.round(png.length / 1024)} KB`
  );
}
