import Link from "next/link";
import { ArrowLeft, Flag, TrendingUp } from "lucide-react";
import { sessionStats, SESSION_ANCHORS, CATEGORY_STYLE, ACADEMIC_CALENDAR_EVENTS } from "@/lib/calendar";
import TimelineInteractive from "@/components/TimelineInteractive";

export const metadata = {
  title: "Academic Calendar · Cyber-Security 300L",
  description:
    "Unified Academic Calendar 2026/2027. Drag through the session to see where each milestone falls and how long until exams.",
};

// Session state is computed on the server at build/render time and passed
// down, so the client scrubber never disagrees with the server on "today".
const serverNow = new Date();
const stats = sessionStats(serverNow);

const DATED = ACADEMIC_CALENDAR_EVENTS.filter((e) => e.start);

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

          <div className="shrink-0 rounded-lg border border-accent/40 bg-accent/5 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
              Right now
            </p>
            <p className="mt-1.5 text-xl font-semibold text-foreground">{stats.phase}</p>
            <p className="tnum mt-1 text-[13px] text-muted-foreground">
              Week {stats.weeksIn} &middot; day {stats.daysInSession} of the session
            </p>
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

      {/* ---------- Legend ---------- */}
      <section className="rise mt-16 flex flex-wrap gap-x-6 gap-y-2.5" style={{ animationDelay: "140ms" }}>
        {Object.keys(CATEGORY_STYLE).map((cat) => (
          <span key={cat} className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className={cnDot(CATEGORY_STYLE[cat as keyof typeof CATEGORY_STYLE].dot)} />
            {cat}
          </span>
        ))}
      </section>
    </div>
  );
}

function cnDot(cls: string) {
  return `h-2.5 w-2.5 rounded-full ${cls}`;
}