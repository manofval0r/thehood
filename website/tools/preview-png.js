/**
 * Prints a PNG as terminal ASCII so an icon can be checked without a browser.
 *
 * Handles the subset this project writes: 8-bit, non-interlaced, filter 0
 * scanlines only. Anything else is reported rather than guessed at, because a
 * silent misread of an icon is worse than no read at all.
 *
 * Run: node tools/preview-png.js public/favicon.png
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const file = process.argv[2] || "public/favicon.png";
const buf = fs.readFileSync(file);

if (
  buf.readUInt32BE(0) !== 0x89504e47 ||
  buf[12] !== 0x49 ||
  buf[13] !== 0x48 ||
  buf[14] !== 0x44
) {
  console.error("not a PNG");
  process.exit(1);
}

const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
const depth = buf[24];
const colourType = buf[25];
const interlace = buf[28];

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

if (depth !== 8 || interlace !== 0 || colourType === 3) {
  console.error(
    `unsupported: depth=${depth} colourType=${colourType} interlace=${interlace}`
  );
  process.exit(1);
}

let p = 8;
const idat = [];
let palette = null;
let trns = null;
while (p < buf.length) {
  const len = buf.readUInt32BE(p);
  const type = buf.slice(p + 4, p + 8).toString("ascii");
  const data = buf.slice(p + 8, p + 8 + len);
  if (type === "IDAT") idat.push(data);
  if (type === "PLTE") palette = data;
  if (type === "tRNS") trns = data;
  p += 12 + len;
}

const raw = zlib.inflateSync(Buffer.concat(idat));
const ch = CHANNELS[colourType];
const stride = width * ch;

/** Undo PNG per-scanline filtering. */
function paeth(a, b, c) {
  const pp = a + b - c;
  const pa = Math.abs(pp - a);
  const pb = Math.abs(pp - b);
  const pc = Math.abs(pp - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

const out = Buffer.alloc(stride * height);
let pos = 0;
for (let y = 0; y < height; y++) {
  const filter = raw[pos++];
  for (let x = 0; x < stride; x++) {
    const v = raw[pos + x];
    const a = x >= ch ? out[y * stride + x - ch] : 0;
    const b = y > 0 ? out[(y - 1) * stride + x] : 0;
    const c = x >= ch && y > 0 ? out[(y - 1) * stride + x - ch] : 0;
    let r;
    switch (filter) {
      case 0: r = v; break;
      case 1: r = v + a; break;
      case 2: r = v + b; break;
      case 3: r = v + ((a + b) >> 1); break;
      case 4: r = v + paeth(a, b, c); break;
      default:
        console.error("unknown filter " + filter);
        process.exit(1);
    }
    out[y * stride + x] = r & 0xff;
  }
  pos += stride;
}

function px(x, y) {
  const i = y * stride + x * ch;
  if (colourType === 3) {
    const idx = out[i];
    const pr = palette[idx * 3], pg = palette[idx * 3 + 1], pb = palette[idx * 3 + 2];
    const a = trns && idx < trns.length ? trns[idx] : 255;
    return [pr, pg, pb, a];
  }
  if (ch === 1) return [out[i], out[i], out[i], 255];
  if (ch === 2) return [out[i], out[i], out[i], out[i + 1]];
  if (ch === 3) return [out[i], out[i + 1], out[i + 2], 255];
  return [out[i], out[i + 1], out[i + 2], out[i + 3]];
}

// Distinct colours, most-used first, so the ramp reads as a ramp.
const seen = new Map();
for (let y = 0; y < height; y++)
  for (let x = 0; x < width; x++) {
    const k = px(x, y).join(",");
    seen.set(k, (seen.get(k) || 0) + 1);
  }
const ramp = " .:-=+*#%@";
const ordered = [...seen.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
const glyph = new Map(ordered.map((k, i) => [k, i === 0 ? " " : ramp[Math.min(ramp.length - 1, i)]]));

console.log(`${path.basename(file)}  ${width}x${height}  ${seen.size} distinct colours`);
console.log("legend (most common first):");
for (const [k] of [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
  const [r, g, b, a] = k.split(",").map(Number);
  console.log(`  "${glyph.get(k)}"  rgb(${r},${g},${b}) a=${a}  x${seen.get(k)}`);
}
console.log();
for (let y = 0; y < height; y++) {
  let line = "";
  for (let x = 0; x < width; x++) line += glyph.get(px(x, y).join(",")) ?? "?";
  console.log("  " + line);
}