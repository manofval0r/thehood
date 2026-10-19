import type { Metadata } from "next";
import PixelMotif from "@/components/PixelMotif";
import Reveal from "@/components/Reveal";
import { NewsStream } from "@/components/NewsStream";
import { getNews } from "@/lib/news";
import { NEWS_SOURCES } from "@/lib/news-sources";

export const metadata: Metadata = {
  title: "Security news · Cybersecurity 300L",
  description:
    "Headlines from eight feeds, fetched server-side and reissued hourly. Threats, advisories, breaches and research, with Nigerian coverage included.",
};

export default async function NewsPage() {
  const news = await getNews();
  const live = news.reached === news.total;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <header className="rise max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          News
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          The week in security
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Headlines from trustworthy feeds, normalised and de-duplicated
          server-side so you read the story once. Everything below is fetched by
          this site on your behalf, none of it from your browser, so no tracker
          learns you were here.
        </p>
      </header>

      <Reveal className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={
              "h-1.5 w-1.5 shrink-0 rounded-full " + (live ? "bg-accent" : "bg-amber-400")
            }
            aria-hidden="true"
          />
          {news.reached} of {news.total} sources live
        </span>
        <span aria-hidden="true" className="text-border-strong">
          ·
        </span>
        <span>refreshed hourly</span>
        <span aria-hidden="true" className="text-border-strong">
          ·
        </span>
        <span>no trackers contacted</span>
      </Reveal>

      <Reveal className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {NEWS_SOURCES.map((s) => (
            <li key={s.id}>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1.5 pr-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-black">
                  <PixelMotif kind={s.beat} title={s.name} className="h-4 w-4" />
                </span>
                <span className="text-[12px] font-medium text-foreground">
                  {s.name}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Reveal>

      <NewsStream items={news.items} />
    </div>
  );
}
