/**
 * The news feeds the site reads, and nothing else.
 *
 * This is a manifest, which is a claim about the network. Every URL in it was
 * checked by tools/probe-feeds.js before it was trusted (delete a feed first,
 * and run that again). A feed that quietly stops is worse than not listing it,
 * because it makes the page slower for no content; the page handles a dead
 * feed without failing, but it should be removed, not worked around.
 *
 * `beat` selects the pixel motif and its accent, so the visual identity stays
 * in one place. `home` is the domain a reader is sent to for more, and the
 * only link out to a third party a reader ever follows: the content itself is
 * fetched server-side, so no reader's browser ever talks to these sites.
 */

export interface NewsSource {
  /** Stable id; part of the cache key, so never change it casually. */
  id: string;
  /** Short name shown against articles and in the source pill. */
  name: string;
  /** Domain shown and linked as "more from <home>". */
  home: string;
  /** Feed URL. */
  url: string;
  /** Motif id from the pixel-motif registry; picks the accent too. */
  beat: "threat" | "advisory" | "breach" | "research" | "region" | "industry";
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    id: "hacker-news",
    name: "The Hacker News",
    home: "thehackernews.com",
    url: "https://thehackernews.com/feeds/posts/default",
    beat: "threat",
  },
  {
    id: "bleeping",
    name: "BleepingComputer",
    home: "bleepingcomputer.com",
    url: "https://www.bleepingcomputer.com/feed/",
    beat: "breach",
  },
  {
    id: "krebs",
    name: "Krebs on Security",
    home: "krebsonsecurity.com",
    url: "https://krebsonsecurity.com/feed/",
    beat: "research",
  },
  {
    id: "record",
    name: "The Record",
    home: "therecord.media",
    url: "https://therecord.media/feed",
    beat: "industry",
  },
  {
    id: "securityweek",
    name: "SecurityWeek",
    home: "securityweek.com",
    url: "https://www.securityweek.com/feed/",
    beat: "industry",
  },
  {
    id: "sans-isc",
    name: "SANS ISC",
    home: "isc.sans.edu",
    url: "https://isc.sans.edu/rssfeed_full.xml",
    beat: "advisory",
  },
  {
    id: "premiumtimes-ng",
    name: "Premium Times · Cybersecurity",
    home: "premiumtimesng.com",
    url: "https://www.premiumtimesng.com/tag/cyber-security/feed/",
    beat: "region",
  },
  {
    id: "techcabal",
    name: "TechCabal",
    home: "techcabal.com",
    url: "https://techcabal.com/feed/",
    beat: "region",
  },
];

/** How many of the newest, deduplicated articles to show. */
export const NEWS_LIMIT = 36;
