// Contact sheet for a time range, on Windows.
//
// The skill's render.mjs sheet mode calls sheet.py, which splits paths on
// "/t" and so cannot read the backslash paths Windows produces. This does
// the same job with a Windows-safe tiler.
//
//   node tools/sheet.mjs <page.html> <out.png> <from> <to> <step>
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { openFilm } from "file:///C:/Users/HomePC/.agents/skills/motion-designer/scripts/cdp.mjs";

const [pageArg, out, a, b, step] = process.argv.slice(2);
const from = Number(a), to = Number(b), st = Number(step);

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const frames = join(root, "out", "qa", "frames-" + out.replace(/\.png$/, "").replace(/[^\w.-]+/g, "_"));
mkdirSync(frames, { recursive: true });

const { page, info } = await openFilm(resolve(pageArg));
for (let t = from; t <= to + 1e-9; t += st) {
  const at = +t.toFixed(3);
  await page.evaluate(`seek(${at})`);
  writeFileSync(join(frames, `t${at.toFixed(3)}.png`), await page.screenshot());
}
await page.close();

const py = spawnSync("python3", [join(root, "tools", "sheet.py"), out, frames, String(info.BPM || 0)], {
  stdio: "inherit",
});
process.exit(py.status || 0);
