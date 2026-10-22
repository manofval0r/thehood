// Reproduce the check's order-independence probe and report which pixels differ.
//   node tools/ordertest.mjs <page.html>
import { resolve } from "node:path";
import { openFilm } from "file:///C:/Users/HomePC/.agents/skills/motion-designer/scripts/cdp.mjs";
import { writeFileSync } from "node:fs";

const { page, info } = await openFilm(resolve(process.argv[2]));
const end = (info.frames - 1) / info.FPS;
const probes = [0, end * 0.23, end * 0.51, end * 0.77, end];
console.log("probes", probes.map((p) => p.toFixed(4)).join(", "));

const shot = async (t) => {
  await page.evaluate(`seek(${t})`);
  return (await page.screenshot()).toString("base64");
};

const inOrder = [];
for (const t of probes) inOrder.push(await shot(t));

for (const k of [3, 0, 4, 1, 2]) {
  const b = await shot(probes[k]);
  if (b !== inOrder[k]) {
    console.log("DIFFERS at", probes[k].toFixed(4), "s");
    writeFileSync("out/qa/order-a.png", Buffer.from(inOrder[k], "base64"));
    writeFileSync("out/qa/order-b.png", Buffer.from(b, "base64"));
  }
}
await page.close();
