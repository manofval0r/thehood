// Print the film's computed timeline, for checking the beat map.
import { resolve } from "node:path";
import { openFilm } from "file:///C:/Users/HomePC/.agents/skills/motion-designer/scripts/cdp.mjs";

const { page, info } = await openFilm(resolve(process.argv[2]));
const out = await page.evaluate(`(() => {
  const names = Object.keys(K);
  const rows = names.map((n) => [n, K[n]]);
  return JSON.stringify({ info: window.FILM_INFO, rows });
})()`);
const d = JSON.parse(out);
console.log("duration", (d.info.frames / d.info.FPS).toFixed(3), "frames", d.info.frames, "bpm", d.info.BPM.toFixed(3), "beats", d.info.BEATS);
for (const [n, t] of d.rows) console.log(n.padEnd(10), t.toFixed(3), "s   beat", (t / (60 / d.info.bpm) + 1).toFixed(2));
await page.close();
