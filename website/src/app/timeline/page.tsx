import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  Download,
  Flag,
  Image as ImageIcon,
  TrendingUp,
} from "lucide-react";
import { sessionStats } from "@/lib/calendar";
import TimelineInteractive from "@/components/TimelineInteractive";
import TakeawayPills from "@/components/TakeawayPills";

export const metadata = {
  title: "Academic Calendar · Cybersecurity 300L",
  description:
    "Unified Academic Calendar 2026/2027. Drag through the session to see where each milestone falls and how long until exams.",
};

// Session state is computed on the server at build/render time and passed
// down, so the client scrubber never disagrees with the server on "today".
const serverNow = new Date();
const stats = sessionStats(serverNow);

/** The published bounds of the 2026/2027 session. */
const SESSION_START = new Date(2026, 8, 28); // 28 September 2026
const SESSION_END = new Date(2027, 6, 23); // 23 July 2027

/** How far through the published session we are, as a whole percentage. */
const sessionPercent = Math.max(
  0,
  Math.min(
    100,
    Math.round(
      ((serverNow.getTime() - SESSION_START.getTime()) /
        (SESSION_END.getTime() - SESSION_START.getTime())) *
        100
    )
  )
);

export default function TimelinePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      {/* ---------- Header ---------- */}
      <section className="rise pb-8 pt-14 md:pt-20">
        <Link
          href="/"
          className="pressable mb-8 inline-flex items-center gap-1.5 rounded text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          All courses
        </Link>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-5xl">
              Academic Calendar
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              The 2026/2027 session as issued by the Office of the Registrar. Drag the
              timeline to move through it.
            </p>
          </div>

          {/* Session state. The same divided-facts treatment as the course
              header, with the session's progress shown as a proportion rather
              than a bare number, so the panel reports state. */}
          <div className="shrink-0 overflow-hidden rounded-lg border border-border-strong bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                Right now
              </span>
              <span className="tnum font-mono text-[11px] text-muted-foreground">
                {serverNow.toLocaleDateString("default", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="px-5 py-5">
              <p className="text-xl font-semibold leading-snug tracking-tight text-foreground">
                {stats.phase}
              </p>
              <p className="tnum mt-2 text-[13px] text-muted-foreground">
                Week {stats.weeksIn}
                <span className="mx-1.5 text-muted">/</span>
                Day {stats.daysInSession}
              </p>

              <div className="mt-5">
                <div className="flex items-baseline justify-between text-[11px] text-muted-foreground">
                  <span>Session elapsed</span>
                  <span className="tnum font-semibold text-foreground">
                    {sessionPercent}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-dim to-accent"
                    style={{ width: `${sessionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {stats.nextMilestone && (
              <div className="border-t border-border px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Next milestone
                </p>
                <p className="mt-2 text-[14px] font-medium leading-snug text-foreground">
                  {stats.nextMilestone.activity}
                </p>
                <p className="tnum mt-1 text-[12.5px] text-muted-foreground">
                  {stats.nextMilestone.date}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Countdown strip ---------- */}
      <section className="rise mb-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3" style={{ animationDelay: "60ms" }}>
        <div className="bg-surface p-6">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <Flag size={13} className="text-tone-exams" />
            First-semester exams
          </div>
          <p className="tnum mt-3 text-5xl font-bold leading-none tracking-tight text-foreground">
            {stats.daysUntilExams > 0 ? stats.daysUntilExams : "Passed"}
          </p>
          <p className="mt-2.5 text-[13px] text-muted-foreground">
            {stats.daysUntilExams > 0
              ? "days until exams begin on 21 February 2027"
              : "Exams have started or finished"}
          </p>
        </div>

        <div className="bg-surface p-6">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <TrendingUp size={13} className="text-accent" />
            Session ends
          </div>
          <p className="tnum mt-3 text-5xl font-bold leading-none tracking-tight text-foreground">
            {stats.daysUntilEnd > 0 ? stats.daysUntilEnd : "Done"}
          </p>
          <p className="mt-2.5 text-[13px] text-muted-foreground">
            days until the session closes on 23 July 2027
          </p>
        </div>

        <div className="bg-surface p-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Next milestone
          </div>
          {stats.nextMilestone ? (
            <>
              <p className="mt-3 text-lg font-semibold leading-snug text-foreground">
                {stats.nextMilestone.activity}
              </p>
              <p className="tnum mt-1.5 text-[13px] text-muted-foreground">
                {stats.nextMilestone.date}
              </p>
            </>
          ) : (
            <p className="mt-3 text-lg font-semibold text-foreground">Nothing scheduled</p>
          )}
        </div>
      </section>

      {/* ---------- Interactive session timeline ---------- */}
      <TimelineInteractive todayStamp={serverNow.getTime()} />

      {/* ---------- Take it with you ---------- */}
      <section className="mt-16 border-t border-border pt-10">
        <h2 className="text-xl font-semibold text-foreground">Take it with you</h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Both are generated from the same published calendar, so neither can
          drift from the page above.
        </p>
        <div className="mt-6">
          <TakeawayPills />
        </div>
      </section>
    </div>
  );
}