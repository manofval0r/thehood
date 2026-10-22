// Find what changes between two seeks of the same time.
//   node tools/diffseek.mjs <page.html> <t> [before-times]
import { resolve } from "node:path";
import { openFilm } from "file:///C:/Users/HomePC/.agents/skills/motion-designer/scripts/cdp.mjs";

const page_ = resolve(process.argv[2]);
const t = Number(process.argv[3]);
const before = (process.argv[4] || "").split(",").filter(Boolean).map(Number);

const { page } = await openFilm(page_);
const shot = async () => (await page.screenshot()).toString("base64");

await page.evaluate(`seek(${t})`);
const a = await shot();

for (const b of before) await page.evaluate(`seek(${b})`);
await page.evaluate(`seek(${t})`);
const c = await shot();

console.log("identical:", a === c, a.length, c.length);
if (a !== c) {
  // Decode and find the differing rows.
  const sharp = null;
  const fs = await import("node:fs");
  fs.writeFileSync("out/qa/diff-a.png", Buffer.from(a, "base64"));
  fs.writeFileSync("out/qa/diff-b.png", Buffer.from(c, "base64"));
  console.log("wrote out/qa/diff-a.png and out/qa/diff-b.png");
}
await page.close();
