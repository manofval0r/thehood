import type { Metadata } from "next";
import Link from "next/link";
import AppleCard from "@/components/AppleCard";
import PixelMotif from "@/components/PixelMotif";
import Reveal from "@/components/Reveal";
import { NewsStream } from "@/components/NewsStream";
import {
  CERTIFICATIONS,
  PLATFORMS,
  ROLES,
  rolesForCert,
} from "@/lib/career";
import { getNews } from "@/lib/news";
import { NEWS_SOURCES } from "@/lib/news-sources";

export const metadata: Metadata = {
  title: "Careers · Cybersecurity 300L",
  description:
    "The jobs this programme feeds, the certifications that count for each of them, where to practise for free, and what the industry is doing this week.",
};

/**
 * Careers.
 *
 * Three things a student at this level actually asks, in this order: what
 * job can I get, what paper proves I can do it, and where do I practise.
 * The page answers them in that order and does not hide the cost, because the
 * cost is the part people get wrong.
 *
 * The news is here rather than on a page of its own, because a job title is
 * an abstraction and this is what the work behind it actually looks like
 * this week. The breaches, the advisories, the research, and the things
 * happening close to home.
 */
export default async function CareersPage() {
  const news = await getNews();
  const live = news.reached === news.total;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <header className="rise max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Careers
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          What this programme is for
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Eight jobs this course actually feeds, the certifications that count
          for each of them, and a dozen places to practise without spending
          anything. Prices are indicative bands rather than quotes, because
          vendors move them and a number written here would be wrong by next
          term.
        </p>
      </header>

      {/* The roles */}
      <section className="mt-14">
        <h2 className="text-[19px] font-semibold tracking-tight text-foreground">
          The jobs
        </h2>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          Each one opens with what the work actually is, then the route in.
          Every job also names the courses on this site that feed it, because a
          pathway that ignores your timetable is not a pathway.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {ROLES.map((role) => (
            <Reveal key={role.slug}>
              <AppleCard maxTilt={4} className="h-full">
                <Link
                  href={`/careers/${role.slug}`}
                  className="card-tilt settle flex h-full flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-surface-hover"
                >
                  <span className="card-cast" aria-hidden="true" />
                  <span className="card-bevel" aria-hidden="true" />

                  <div className="card-depth flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-black">
                      <PixelMotif
                        kind={role.motif}
                        title={role.title}
                        className="h-7 w-7"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                        {role.title}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
                        {role.summary}
                      </span>
                    </span>
                  </div>

                  <span className="card-depth mt-auto pt-4 text-[12px] font-medium text-accent">
                    {role.courses.length} courses here feed it →
                  </span>
                </Link>
              </AppleCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* The certifications */}
      <section className="mt-16">
        <h2 className="text-[19px] font-semibold tracking-tight text-foreground">
          The certifications
        </h2>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          What each one proves, who it is for, and what it tends to cost. Read
          the last line of each card before you plan around it, because the
          cheapest way to take any of these exams is rarely the way the vendor
          advertises.
        </p>

        <div className="mt-6 space-y-3">
          {CERTIFICATIONS.map((cert) => {
            const roles = rolesForCert(cert.id);
            return (
              <Reveal key={cert.id}>
                <AppleCard maxTilt={3} className="h-full">
                  <div className="card-tilt settle rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-surface-hover">
                    <span className="card-cast" aria-hidden="true" />
                    <span className="card-bevel" aria-hidden="true" />

                    <div className="card-depth flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                        {cert.name}
                      </h3>
                      <span className="text-[12px] text-muted">{cert.vendor}</span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        {cert.level}
                      </span>
                    </div>

                    <p className="card-depth mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                      {cert.proves}
                    </p>
                    <p className="card-depth mt-2 text-[13px] leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">Who it is for.</span>{" "}
                      {cert.for}
                    </p>

                    <div className="card-depth mt-4 grid gap-2 border-t border-border pt-4 text-[12.5px] leading-relaxed sm:grid-cols-2">
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Cost.</span>{" "}
                        {cert.cost}.
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Pay less.
                        </span>{" "}
                        {cert.cheaper}
                      </p>
                    </div>

                    {roles.length > 0 && (
                      <p className="card-depth mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-muted">
                        <span>Counts towards</span>
                        {roles.map((r) => (
                          <Link
                            key={r.slug}
                            href={`/careers/${r.slug}`}
                            className="text-accent underline underline-offset-4 hover:opacity-80"
                          >
                            {r.title}
                          </Link>
                        ))}
                      </p>
                    )}
                  </div>
                </AppleCard>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Where to practise */}
      <section className="mt-16">
        <h2 className="text-[19px] font-semibold tracking-tight text-foreground">
          Where to practise
        </h2>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          Most of these have a free tier that is genuinely usable. Practise
          before you pay for anything, including before you pay for an exam.
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 25, 300)}>
              <li className="h-full">
                <AppleCard maxTilt={4} className="h-full">
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-tilt settle relative flex h-full flex-col rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-hover"
                  >
                    <span className="card-cast" aria-hidden="true" />
                    <span className="card-accent-glow" aria-hidden="true" />
                    <span className="card-bevel" aria-hidden="true" />

                    <span className="card-depth text-[14px] font-semibold leading-snug tracking-tight text-foreground">
                      {p.name}
                    </span>
                    <span className="card-depth mt-1.5 flex-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {p.what}
                    </span>
                    <span className="card-depth mt-3 flex items-center gap-2 text-[11.5px]">
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-muted">
                        {p.kind}
                      </span>
                      <span className="font-medium text-accent">{p.price}</span>
                    </span>
                  </a>
                </AppleCard>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Events */}
      <section className="mt-16">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
            What is coming up
          </h2>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
            Capture-the-flag competitions you can enter, the department's own
            calendar, and the events that happen every year. The competition
            list is fetched from CTFtime on the server once an hour, so
            reading this page never tells anybody where you were.
          </p>
          <Link
            href="/events"
            className="pressable mt-4 inline-block rounded-md bg-accent px-4 py-2 text-[13.5px] font-semibold text-accent-foreground"
          >
            See the events
          </Link>
        </div>
      </section>
      {/* The industry */}
      <section className="mt-16" id="industry">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[19px] font-semibold tracking-tight text-foreground">
            The industry right now
          </h2>
          <span className="text-[12px] text-muted">refreshed hourly</span>
        </div>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          The jobs above are not abstractions. This is what the work behind
          them actually looks like this week: the breaches, the advisories,
          the research, and the things happening close to home. Everything
          here is fetched by this site on your behalf, so no tracker learns
          you were here.
        </p>

        <Reveal className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={
                "h-1.5 w-1.5 shrink-0 rounded-full " +
                (live ? "bg-accent" : "bg-amber-400")
              }
              aria-hidden="true"
            />
            {news.reached} of {news.total} sources live
          </span>
          <span aria-hidden="true" className="text-border-strong">
            ·
          </span>
          <span>no trackers contacted</span>
        </Reveal>

        <Reveal className="mt-5">
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
      </section>
    </div>
  );
}
