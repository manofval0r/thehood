import type { Metadata } from "next";
import Link from "next/link";
import AppleCard from "@/components/AppleCard";
import PixelMotif from "@/components/PixelMotif";
import Reveal from "@/components/Reveal";
import CompetitionList from "@/components/CompetitionList";
import {
  ANNUAL_EVENTS,
  getCtfEvents,
  getDepartmentEvents,
} from "@/lib/events";
import { isJoinable } from "@/lib/competition-kinds";

export const metadata: Metadata = {
  title: "Events · Cybersecurity 300L",
  description:
    "Capture-the-flag competitions you can enter from Nigeria, the department's calendar, and the security events that happen every year.",
};

/**
 * Events.
 *
 * Three feeds in one page, and they are different kinds of thing:
 *
 *   - The competitions are announced, so they come from a feed, and the feed
 *     is read on the server so that reading this page is not reported to
 *     anybody. Only the ones a student here can enter are listed: a
 *     competition that needs you in a room in another country is not one
 *     they can enter, and listing it would be a list of things they cannot
 *     do.
 *   - The department's own dates are in the manifest already.
 *   - The annual events are not announced, because they are the shape of the
 *     year rather than news.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * When a competition is, in the reader's own time.
 *
 * The feed gives its times in UTC, and a student in Nigeria reads a clock
 * that is an hour ahead of that. A competition that starts at 23:00 on a
 * Saturday in UTC starts at midnight on the Sunday here, and a card that
 * said Saturday would be a day wrong. The rest of the site is in Lagos time
 * because Lagos is where the students are, and this is the same rule.
 */
function dayLabel(ms: number): {
  day: string;
  month: string;
  weekday: string;
  time: string;
} {
  const d = new Date(ms + 60 * 60 * 1000); // Lagos is UTC+1 all year.
  return {
    day: String(d.getUTCDate()),
    month: MONTHS[d.getUTCMonth()],
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()],
    time: `${String(d.getUTCHours()).padStart(2, "0")}:${String(
      d.getUTCMinutes()
    ).padStart(2, "0")}`,
  };
}

export default async function EventsPage() {
  const [allCtf, department] = await Promise.all([
    getCtfEvents(60),
    getDepartmentEvents(),
  ]);

  // Only the competitions a student here can enter. The rest need you in a
  // room in another country.
  const ctfs = allCtf.filter(isJoinable);
  const leftOut = allCtf.length - ctfs.length;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <header className="rise max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Events
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          What is coming up
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          The competitions you can enter from here, the department&apos;s own
          dates, and the events that happen every year. The competition list
          is fetched here on the server once an hour, so opening this page
          does not report you to anybody.
        </p>
      </header>

      {/* Competitions */}
      <section className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[19px] font-semibold tracking-tight text-foreground">
            Capture the flag
          </h2>
          <a
            href="https://ctftime.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-muted transition-colors hover:text-foreground"
          >
            Listed by CTFtime →
          </a>
        </div>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          Only competitions that are online, or that are in Nigeria. One that
          needs you in a room in another country is not one you can enter
          from here, so it is not listed.
          {leftOut > 0 && (
            <>
              {" "}
              {leftOut} other competition{leftOut === 1 ? "" : "s"} in the
              next few months {leftOut === 1 ? "is" : "are"} in person
              somewhere else.
            </>
          )}{" "}
          Most of these are open to anyone who signs up. Weight is how much
          the competition counts towards the CTFtime rating, so a higher
          number is a harder field.
        </p>

        {ctfs.length === 0 ? (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h3 className="text-[14.5px] font-semibold text-foreground">
              {allCtf.length === 0
                ? "The competition feed is unreachable"
                : "Nothing you can enter just yet"}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {allCtf.length === 0
                ? "CTFtime did not answer on the last attempt. This page will try again on the next hourly pass. The department dates below are unaffected."
                : "There are competitions coming up, but every one of them needs you in the room somewhere else. The department dates below are unaffected."}
            </p>
          </div>
        ) : (
          <CompetitionList competitions={ctfs} />
        )}
      </section>

      {/* The department */}
      <section className="mt-16">
        <h2 className="text-[19px] font-semibold tracking-tight text-foreground">
          The department
        </h2>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          From the published academic calendar.
        </p>

        <ul className="mt-6 space-y-3">
          {department.map((e, i) => (
            <Reveal key={`${e.date}-${e.title}`} delay={Math.min(i * 25, 300)}>
              <li>
                <AppleCard maxTilt={4} className="h-full">
                  <div className="card-tilt settle relative flex h-full items-start gap-4 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-hover">
                    <span className="card-cast" aria-hidden="true" />
                    <span className="card-accent-glow" aria-hidden="true" />
                    <span className="card-bevel" aria-hidden="true" />

                    <span className="card-depth grid h-9 w-9 shrink-0 place-items-center rounded-md bg-black">
                      <PixelMotif kind="flag" title="" className="h-6 w-6" />
                    </span>
                    <span className="card-depth min-w-0 flex-1">
                      <span className="block text-[14px] font-medium leading-snug text-foreground">
                        {e.title}
                      </span>
                      <span className="mt-1 block text-[11.5px] text-muted">
                        {e.when} · {e.category}
                      </span>
                      <span className="mt-1.5 block text-[12.5px] leading-relaxed text-muted-foreground">
                        {e.note}
                      </span>
                    </span>
                  </div>
                </AppleCard>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Every year */}
      <section className="mt-16">
        <h2 className="text-[19px] font-semibold tracking-tight text-foreground">
          Every year
        </h2>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          These are not announcements, so no feed reports them. They are the
          shape of the year, and knowing they exist is the difference between
          planning for them and hearing about them afterwards.
        </p>

        <ul className="mt-6 space-y-3">
          {ANNUAL_EVENTS.map((e, i) => (
            <Reveal key={e.name} delay={Math.min(i * 25, 300)}>
              <li>
                <AppleCard maxTilt={4} className="h-full">
                  <a
                    href={e.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-tilt settle group relative block h-full rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-hover"
                  >
                    <span className="card-cast" aria-hidden="true" />
                    <span className="card-accent-glow" aria-hidden="true" />
                    <span className="card-bevel" aria-hidden="true" />

                    <div className="card-depth relative flex flex-wrap items-baseline gap-x-3">
                      <span className="text-[14px] font-semibold text-foreground underline decoration-border-strong underline-offset-4 transition-colors group-hover:text-accent">
                        {e.name}
                      </span>
                      <span className="text-[12px] text-muted">{e.when}</span>
                    </div>
                    <p className="card-depth mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                      {e.what}
                    </p>
                  </a>
                </AppleCard>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      <p className="mt-14 max-w-2xl text-[12px] leading-relaxed text-muted">
        Competition details come from the{" "}
        <a
          href="https://ctftime.org/api/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-4"
        >
          CTFtime API
        </a>
        , which asks that it be used for data analysis rather than for copying
        their site. This is a short list with a link back to each event, and
        it is fetched here rather than in your browser. Times are shown in
        Lagos time, which is an hour ahead of the times the feed gives. Ready
        for the competitions instead?{" "}
        <Link href="/careers" className="text-accent underline underline-offset-4">
          Start with the jobs
        </Link>
        .
      </p>
    </div>
  );
}