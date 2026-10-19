import { XMLParser } from "fast-xml-parser";
import { cacheLife } from "next/cache";
import { NEWS_SOURCES, NEWS_LIMIT } from "./news-sources";

/**
 * Fetches and normalises the news feed server-side.
 *
 * Two rules this file exists to enforce. The first is graceful degradation:
 * a news page that stops loading because one blog is down is a worse product
 * than a news page with a stale headline, so every feed is fetched with a
 * timeout through allSettled and nothing throws. The extreme case - every
 * feed down at once - renders an honest empty state rather than an error.
 *
 * The second is that no reader's browser ever talks to a news site. All
 * fetching happens here, on the server, so the reader makes one request to
 * this site and nothing else. That is why the page shows no third-party
 * images: pulling them would re-link every viewer to a feed they did not ask
 * for, which is the exact privacy leak this site was built not to make.
 */

export interface NewsItem {
  /** Stable id, derived from the title so a deduplicated title collapses. */
  id: string;
  title: string;
  url: string;
  /** Short byline for the source. */
  source: string;
  /** Domain of the article's own site, for "more from". */
  home: string;
  /** Beat id, selects the pixel motif and tone. */
  beat: string;
  /** Epoch ms; 0 when the feed gave no usable date. */
  published: number;
  /** Plain text, HTML stripped, clamped. */
  summary: string;
}

export interface NewsResult {
  items: NewsItem[];
  /** Feeds that answered, vs how many there are. */
  reached: number;
  total: number;
}

const UA =
  "Mozilla/5.0 (compatible; +course-resource-site; reading RSS/Atom server-side)";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  processEntities: true,
  trimValues: true,
});

export async function getNews(): Promise<NewsResult> {
  "use cache";
  cacheLife("hours");

  const settled = await Promise.allSettled(
    NEWS_SOURCES.map(async (source) => {
      const res = await fetch(source.url, {
        signal: AbortSignal.timeout(12000),
        headers: {
          "user-agent": UA,
          accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const doc = parser.parse(xml) as any;
      const raw = extractEntries(doc);
      return raw.map((e) => toItem(source, e)).filter(Boolean) as NewsItem[];
    })
  );

  const flat: NewsItem[] = [];
  let reached = 0;
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value.length) {
      reached++;
      flat.push(...r.value);
    }
  }

  const items = dedupe(flat)
    .sort((a, b) => b.published - a.published)
    .slice(0, NEWS_LIMIT);

  return {
    items,
    reached,
    total: NEWS_SOURCES.length,
  };
}

/** Returns the RSS `<item>` or Atom `<entry>` array, either empty. */
function extractEntries(doc: any): any[] {
  if (doc?.rss?.channel?.item) return toArray(doc.rss.channel.item);
  if (doc?.feed?.entry) return toArray(doc.feed.entry);
  return [];
}

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/** Wrapper text: fast-xml-parser gives a string, or { "#text": ... } when the
 *  element carried attributes (atom title/summary do). */
function textOf(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && "#text" in (v as any)) return String((v as any)["#text"]);
  return "";
}

function toItem(source: (typeof NEWS_SOURCES)[number], e: any): NewsItem | null {
  const title = textOf(e.title).replace(/\s+/g, " ").trim();
  if (!title) return null;

  const url = pickHref(e);
  if (!url) return null;

  const published = pickDate(e);
  const summary = clamp(cleanHtml(textOf(e.summary) || textOf(e.description) || ""));

  return {
    id: idOf(title),
    title,
    url,
    source: source.name,
    home: source.home,
    beat: source.beat,
    published,
    summary,
  };
}

/** Link, coping with atom's array of { href, rel }. */
function pickHref(e: any): string {
  const link = e?.link;
  if (typeof link === "string") return link;
  if (Array.isArray(link)) {
    const alt = link.find((l) => l?.["@_rel"] === "alternate") || link[0];
    return alt?.["@_href"] || alt?.href || "";
  }
  if (link && typeof link === "object") return link["@_href"] || link.href || "";
  return "";
}

/** The first usable date across RSS pubDate / Atom updated / published. */
function pickDate(e: any): number {
  for (const raw of [textOf(e.pubDate), textOf(e.updated), textOf(e.published)]) {
    if (!raw) continue;
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

/** Strip tags and squeeze whitespace out of a feed summary. */
function cleanHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\s*(br|\/p|\/div|p|div|li|h\d)\s*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Clamp to a whole-word length. */
function clamp(s: string, max = 190): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,\s]+$/, "") + "…";
}

/** A stable id from the title: keccak-like not needed, a hash is enough. */
function idOf(title: string): string {
  let h = 0;
  const key = title.toLowerCase().replace(/[^a-z0-9]+/gi, " ");
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return "n" + (h >>> 0).toString(36);
}

/**
 * Collapse near-duplicate headlines to one story. Feeds echo each other, so
 * the same breach appears five times on one page otherwise. A title is a
 * duplicate if it shares its first forty letters with one already seen,
 * keeping the first (usually the named source) and dropping the rest.
 */
function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const it of items) {
    const sig = it.title.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 40);
    if (!sig || seen.has(sig)) continue;
    seen.add(sig);
    out.push(it);
  }
  return out;
}
