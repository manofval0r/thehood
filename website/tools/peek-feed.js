/** Dumps the parsed shape of one feed's first item, to write the parser against
 *  reality. Run: node tools/peek-feed.js <url> */
const { XMLParser } = require("fast-xml-parser");
const url = process.argv[2] || "https://krebsonsecurity.com/feed/";
const UA = "Mozilla/5.0 (compatible; Cyber300L/1.0) news reader";

(async () => {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { "user-agent": UA, accept: "application/rss+xml, application/xml, text/xml" },
  });
  const xml = await res.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    processEntities: true,
    trimValues: true,
  });
  const doc = parser.parse(xml);
  const root = doc.rss ? "rss/channel" : doc.feed ? "feed" : "?";
  console.log("root:", root);
  const items =
    (root === "rss/channel" && doc.rss.channel.item) ||
    (root === "feed" && doc.feed.entry) ||
    [];
  const first = Array.isArray(items) ? items[0] : items;
  console.log("raw first item keys:");
  for (const k of Object.keys(first || {})) {
    const v = first[k];
    const s =
      typeof v === "object" ? `<${Array.isArray(v) ? "array" : "object"}>` : String(v).slice(0, 90);
    console.log("  " + k + " = " + JSON.stringify(s));
  }
})();
