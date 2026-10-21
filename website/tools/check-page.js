/**
 * Looks at the server's own html for a course page, so what a reader gets
 * before any script runs can be checked from a terminal.
 *
 * Run: node tools/check-page.js /courses/cyb-305
 */
const http = require("http");

const path = process.argv[2] || "/courses/cyb-305";
const want = process.argv.slice(3);

http
  .get(`http://localhost:3100${path}`, (res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => {
      console.log(`  ${path} -> ${res.statusCode}, ${body.length} bytes`);

      const text = body
        .replace(/<script[\s\S]*?<\/script>/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z]+;/g, " ")
        .replace(/\s+/g, " ");

      if (want.length === 0) {
        // The shape of the page.
        const counts = [...text.matchAll(/(\d+)\s+(files?|folders?|courses?|articles?|stories?)/gi)]
          .map((m) => `${m[1]} ${m[2]}`)
          .slice(0, 6);
        console.log(`  mentions: ${counts.join(", ") || "(none)"}`);
        for (const word of [
          "Download everything",
          "Download this folder",
          "SOURCE_EVIDENCE",
          "Nothing here yet",
          "Resources",
        ]) {
          console.log(`  ${text.includes(word) ? "yes" : "no "}  ${word}`);
        }
      } else {
        for (const word of want) {
          console.log(`  ${text.includes(word) ? "yes" : "no "}  ${word}`);
        }
      }
    });
  })
  .on("error", (e) => {
    console.error("  ERR " + e.message);
    process.exit(1);
  });
