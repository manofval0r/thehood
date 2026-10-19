/**
 * Probes candidate feeds and reports what actually answers.
 *
 * Run: node tools/probe-feeds.js
 *
 * A manifest is a claim about the network. Claims rot. This checks each one
 * against the live feed, prints the shape it came back in, and fails if a feed
 * that is supposed to work is not there.
 */
const CANDIDATES = [
  // International security press
  ["The Hacker News", "https://feeds.feedburner.com/TheHackersNews"],
  ["Krebs on Security", "https://krebsonsecurity.com/feed/"],
  ["BleepingComputer", "https://www.bleepingcomputer.com/feed/"],
  ["The Record", "https://therecord.media/feed"],
  ["SecurityWeek", "https://www.securityweek.com/feed/"],
  ["Dark Reading", "https://www.darkreading.com/rss.xml"],
  ["Schneier on Security", "https://www.schneier.com/feed/atom/"],
  ["Rapid7", "https://www.rapid7.com/blog/rss/"],
  ["Project Zero", "https://googleprojectzero.blogspot.com/feeds/posts/default"],
  ["NCC Group", "https://research.nccgroup.com/feed/"],
  ["SANS ISC", "https://isc.sans.edu/rssfeed_full.xml"],
  ["The Hacker News (direct)", "https://thehackernews.com/feeds/posts/default"],
  ["Help Net Security", "https://www.helpnetsecurity.com/feed/"],
  ["Security Affairs", "https://securityaffairs.com/feed/"],
  ["Troy Hunt", "https://www.troyhunt.com/blog/index.xml"],
  ["Cloudflare Blog", "https://blog.cloudflare.com/rss/"],
  ["Mozilla Security", "https://blog.mozilla.org/security/feed/"],
  ["Google Security Blog", "https://googleprojectzero.blogspot.com/feeds/posts/default?alt=rss"],

  // Official / government advisories
  ["CISA Advisories", "https://www.cisa.gov/cybersecurity-advisories/all.xml"],
  ["CISA Alerts", "https://www.cisa.gov/cybersecurity-advisories/all.xml"],
  ["US-CERT", "https://www.cisa.gov/cybersecurity-advisories/all.xml"],
  ["NVD", "https://nvd.nist.gov/feed/xml/feed.rss"],

  // Nigerian and African coverage
  ["Premium Times (security)", "https://www.premiumtimesng.com/tag/cyber-security/feed/"],
  ["Premium Times (tech)", "https://www.premiumtimesng.com/category/technology/feed/"],
  ["Punch (security)", "https://punchng.com/tag/cyber-security/feed/"],
  ["Vanguard (cybercrime)", "https://www.vanguardngr.com/category/news/cybercrime/feed/"],
  ["Daily Trust (technology)", "https://dailytrust.com/category/technology/feed/"],
  ["TechCabal", "https://techcabal.com/feed/"],
  ["ITWeb Africa", "https://itwebafrica.com/feed/"],
  ["TechCentral", "https://techcentral.co.za/feed/"],
  ["Security Africa", "https://securityafrica.com/feed/"],
  ["Nairametrics", "https://nairametrics.com/feed/"],
  ["Arise TV", "https://www.arisetv.com/feed/"],
  ["ThisDay", "https://www.thisdaylive.com/index.php/category/life-times/feed/"],
  ["BusinessDay", "https://businessday.ng/feed/"],
];

const UA =
  "Mozilla/5.0 (compatible; Cyber300L/1.0; +course-resource-site) news reader";

async function probe(name, url) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { "user-agent": UA, accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
      redirect: "follow",
    });
    const ms = Date.now() - started;
    const body = await res.text();
    const ct = (res.headers.get("content-type") || "").split(";")[0];

    if (!res.ok) {
      return { name, url, ok: false, why: `HTTP ${res.status}`, ms };
    }
    // Detect the shape without fully parsing it.
    const rss = /<rss[\s>]/i.test(body) || /<channel[\s>]/i.test(body);
    const atom = /<feed[\s>][^>]*xmlns/i.test(body);
    const count =
      (body.match(/<item[\s>]/gi) || []).length ||
      (body.match(/<entry[\s>]/gi) || []).length;
    const looksHtml = /^\s*<!doctype html/i.test(body);

    return {
      name,
      url,
      ok: !looksHtml && (rss || atom) && count > 0,
      why: looksHtml
        ? "returned HTML, not a feed"
        : `shape=${rss ? "rss" : atom ? "atom" : "unknown"} items=${count} ct=${ct} ${(body.length / 1024).toFixed(0)}kb`,
      ms,
    };
  } catch (e) {
    return {
      name,
      url,
      ok: false,
      why: e.name === "TimeoutError" ? "timeout" : e.message.slice(0, 60),
      ms: Date.now() - started,
    };
  }
}

const results = [];
for (const [name, url] of CANDIDATES) {
  const r = await probe(name, url);
  results.push(r);
  console.log(
    `${r.ok ? "OK  " : "FAIL"} ${name.padEnd(26)} ${String(r.ms).padStart(5)}ms  ${r.why}`
  );
}

const good = results.filter((r) => r.ok);
console.log(`\n${good.length}/${results.length} reachable`);
console.log("\nusable:");
for (const r of good) console.log(`  ${r.name.padEnd(26)} ${r.url}`);